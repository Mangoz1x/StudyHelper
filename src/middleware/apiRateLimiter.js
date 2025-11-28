/**
 * Rate‑limit middleware for Next .js (Edge/Node) API routes.
 *
 *  • Supports **public**, **private**, and **demo** keys.  
 *  • Enforces per‑resource **quota** (rolling 31 days) + **RPM** (requests / minute).  
 *  • Looks up entitlements from using the db quota`
 *    where `resource` is a dot‑path like `"search.text"`.
 *  • Provides rate limit headers on ALL responses via context
 *
 * Any error short‑circuits the request and returns a plain object:
 * `{ status: <HTTP status>, error: <message>, _rateLimitHeaders: <headers> }`
 *
 * Successful responses include rate limit info in the result:
 * `{ data: <your data>, _rateLimitHeaders: <headers object> }`
 *
 * Handler function will be called with the initial ...params, +  the final parameter being the entitlements for the requested resource
 * 
 *  @param {Function} handler   The actual API route handler.
 *  @param {string}   resource  Dot‑path to the entitlement object (e.g. `"api.v4.chat"`).
 *  @param {"public"|"private"} [keyType="public"]  Expected key flavour.
 *  @returns {Function}         Wrapped handler with rate‑limiting.
 */

import {
    getBearerFromHeaders,
    publicKeyAuth,
    privateKeyAuth,
} from "@/utils/api/auth";
import { headers } from "next/headers";
import { Subscription } from "@/models/Subscription";
import { decryptAPIKey } from "@/utils/cryptography";
import { Redis } from "@upstash/redis";
import { decrementActiveQuota } from "@/utils/quota/update";
import { getActiveQuota } from "@/utils/quota/retrieve";
import { retrieveQuotaTemplate } from "@/utils/quotaTemplates/retrieve";

const redis = Redis.fromEnv();

/* ---------- helpers ------------------------------------------------------ */

/** Return first public IP address from headers or `null`. */
const getClientIp = async () => {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = h.get("x-real-ip");
    return real || null;
};

/** Dot‑path getter (`"a.b.c"` → obj.a.b.c). */
const getByPath = (obj, path) => {
    return path.split(".").reduce((o, k) => o?.[k], obj);
}

/**
 * Decrypt and parse key-data JSON (part #3 of the key).
 * @param {string} apiKey - The API key (encrypted or plain, format depends on type)
 * @param {string} keyType - 'private' or 'public'
 * @returns {object} Parsed key data object
 * @throws {Error} If the key is malformed or cannot be decrypted
 */
const getKeyData = (apiKey) => {
    const parts = apiKey.split("-");
    if (parts.length < 3) throw new Error("Malformed key: missing parts");

    // Extract the data and ensure if its a private key we get filter out the iv to prevent errors
    const encryptedJson = parts[2]?.split("::")?.[0];

    let json;
    try {
        json = decryptAPIKey(encryptedJson);
    } catch (err) {
        throw new Error("Failed to decrypt key data: " + err.message);
    }

    try {
        return JSON.parse(json);
    } catch (err) {
        throw new Error("Failed to parse key data JSON: " + err.message);
    }
};

/** Fetch planId from cache or Mongo. */
const getPlanId = async (orgId) => {
    if (!orgId) throw new Error("organizationId missing from key");
    const cached = await redis.get(`planId:${orgId}`);
    if (cached) return cached;

    const sub = await Subscription.findOne({ organizationId: orgId }).lean();
    if (!sub?.stripePriceId)
        throw new Error(`No active subscription for org ${orgId}`);

    await redis.set(`planId:${orgId}`, sub.stripePriceId);
    return sub.stripePriceId;
};

/** Auth helper choosing the right validator. */
const authenticate = async (apiKey, type) => {
    if (type === "public") return publicKeyAuth(apiKey);
    if (type === "private") return privateKeyAuth(apiKey);
    throw new Error(`Invalid keyType "${type}" supplied`);
};

/** Build rate limit headers object */
const buildRateLimitHeaders = (resource, resEnt = {}, rpmUsed = 0) => {
    const headers = {
        'X-RateLimit-Resource': resource
    };

    // Quota headers
    if (Number.isFinite(resEnt.quota)) {
        headers['X-RateLimit-Quota-Limit'] = resEnt.quota.toString();
        headers['X-RateLimit-Quota-Remaining'] = Math.max(0, resEnt.quotaRemaining || 0).toString();

        // Calculate quota reset time (beginning of next month)
        headers['X-RateLimit-Quota-Reset'] = Math.floor(new Date(resEnt.quotaReset).getTime() / 1000).toString();
    } else if (resEnt.quota === Infinity) {
        headers['X-RateLimit-Quota-Limit'] = 'unlimited';
        headers['X-RateLimit-Quota-Remaining'] = 'unlimited';
    }

    // RPM headers
    if (Number.isFinite(resEnt.rpm)) {
        headers['X-RateLimit-RPM-Limit'] = resEnt.rpm.toString();
        headers['X-RateLimit-RPM-Remaining'] = Math.max(0, resEnt.rpm - rpmUsed).toString();
        headers['X-RateLimit-RPM-Reset'] = (Math.floor(Date.now() / 1000) + 60).toString();
    }

    return headers;
};

/** Add Retry-After header for rate limited responses */
const addRetryAfterHeader = (headers, seconds) => {
    return {
        ...headers,
        'Retry-After': seconds.toString()
    };
};

/* ---------- middleware --------------------------------------------------- */
export const withApiRateLimit = (
    handler,
    resource,
    keyType = "public",
    supportsDemo = true // Only available on API routes using PK for auth
) => async (...params) => {
    let rateLimitHeaders = { 'X-RateLimit-Resource': resource };

    /* —1— Sanity checks ---------------------------------------------------- */
    const ip = await getClientIp();
    if (!ip) {
        return {
            status: 400,
            error: "Cannot determine client IP for rate-limit.",
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    if (!resource || typeof resource !== "string") {
        return {
            status: 400,
            error: "Rate-limit mis-config: resource path missing/invalid.",
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    const { bearer: apiKey } = await getBearerFromHeaders();
    if (!apiKey) {
        return {
            status: 401,
            error: "API key missing.",
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    /* —2— DEMO key path (short‑circuit) ----------------------------------- */
    if (apiKey === process.env.NEXT_PUBLIC_DEMO_KEY) {
        // API routes protected by private keys should not support demos 
        if (keyType === 'private') {
            return {
                status: 400,
                error: "Demo mode is not available for private-key routes. Demos are only supported with public API keys.",
                _rateLimitHeaders: rateLimitHeaders
            };
        }

        // If this route doesn't support demos
        if (!supportsDemo) {
            return {
                status: 400,
                error: "Demo mode is not supported on this API route. Check the documentation for available demo endpoints.",
                _rateLimitHeaders: rateLimitHeaders
            };
        }

        const demoEntitlements = await retrieveQuotaTemplate('DEMO');
        if (demoEntitlements.error) {
            return {
                status: 401,
                error: demoEntitlements.error,
                _rateLimitHeaders: rateLimitHeaders
            }
        }

        const resEnt = getByPath(demoEntitlements.template, resource);

        if (!resEnt) {
            rateLimitHeaders = buildRateLimitHeaders(resource);
            return {
                status: 403,
                error: `No entitlement for "${resource}".`,
                _rateLimitHeaders: rateLimitHeaders
            };
        }

        if (!resEnt.access) {
            rateLimitHeaders = buildRateLimitHeaders(resource, resEnt);
            return {
                status: 403,
                error: `Access denied to "${resource}".`,
                _rateLimitHeaders: rateLimitHeaders
            };
        }

        const limitResult = await applyLimits({
            orgId: "DEMO",
            rpmKey: ip,
            resource,
            resEnt
        });

        rateLimitHeaders = buildRateLimitHeaders(resource, resEnt, limitResult.rpmUsed);

        if (limitResult.status) {
            // Rate limit exceeded - add retry-after
            if (limitResult.status === 429) {
                rateLimitHeaders = addRetryAfterHeader(rateLimitHeaders, limitResult.retryAfter || 60);
            }
            return {
                status: limitResult.status,
                error: limitResult.error,
                _rateLimitHeaders: rateLimitHeaders
            };
        }

        const result = await handler(
            ...params,
            {
                resourceEntitlement: resEnt,
                organizationId: process.env.DEMO_ORGANIZATION_ID
            }
        );

        return {
            ...result,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    /* —3— Authenticate public/private key --------------------------------- */
    const authRes = await authenticate(apiKey, keyType);
    if (!authRes?.authenticated) {
        return {
            status: 401,
            error: authRes?.error || "Authentication failed.",
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    /* —4— Extract key‑data & entitlements --------------------------------- */
    let keyData;
    try {
        keyData = getKeyData(apiKey);
    } catch (e) {
        return {
            status: 401,
            error: `Key decrypt failed: ${e.message}`,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    let planId;
    try {
        planId = await getPlanId(keyData.organizationId);
    } catch (e) {
        return {
            status: 403,
            error: e.message,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    /* —5— Get quota limits and resource entitlements ---------------------- */
    let quotaLimits;
    let periodEndDate;
    try {
        const activeQuota = await getActiveQuota({ organizationId: keyData.organizationId });
        quotaLimits = activeQuota.limits;
        periodEndDate = activeQuota.periodEnd;
    } catch (error) {
        return {
            status: 403,
            error: `No quota found for organization "${keyData.organizationId}".`,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    const resEnt = getByPath(quotaLimits, resource);
    if (!resEnt) {
        rateLimitHeaders = buildRateLimitHeaders(resource);
        return {
            status: 403,
            error: `No entitlement for "${resource}".`,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    // Add the quota reset date
    resEnt.quotaReset = periodEndDate;

    if (!resEnt.access) {
        rateLimitHeaders = buildRateLimitHeaders(resource, resEnt);
        return {
            status: 403,
            error: `Access denied to "${resource}".`,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    /* —6— Apply quota / RPM limits ---------------------------------------- */
    const limitResult = await applyLimits({
        orgId: keyData.organizationId,
        rpmKey: keyData.organizationId,
        resource,
        resEnt
    });

    // Build headers with current state (after potential decrements)
    rateLimitHeaders = buildRateLimitHeaders(resource, resEnt, limitResult.rpmUsed);

    if (limitResult.status) {
        // Rate limit exceeded - add retry-after
        if (limitResult.status === 429) {
            rateLimitHeaders = addRetryAfterHeader(rateLimitHeaders, limitResult.retryAfter || 60);
        }
        return {
            status: limitResult.status,
            error: limitResult.error,
            _rateLimitHeaders: rateLimitHeaders
        };
    }

    /* —7— Success → call route handler ------------------------------------ */
    try {
        const result = await handler(
            ...params,
            {
                resourceEntitlement: resEnt,
                organizationId: keyData.organizationId,
            }
        );

        return {
            ...result,
            _rateLimitHeaders: rateLimitHeaders
        };
    } catch (e) {
        console.error("Route handler threw:", e);
        return {
            status: 500,
            error: "Internal server error.",
            _rateLimitHeaders: rateLimitHeaders
        };
    }
};

/* ---------- limit enforcement ------------------------------------------- */

/**
 * Apply quota & RPM limits for a single request.
 * @param {Object} cfg
 * @param {string} cfg.orgId          Organization ID (or "DEMO").
 * @param {string} cfg.rpmKey         Redis key segment for RPM (orgId or IP).
 * @param {string} cfg.resource       Dot‑path to the entitlement slice.
 * @param {Object} cfg.resEnt         Resource entitlement object.
 * @returns {Object}  Either `{rpmUsed}` for success or `{status, error, rpmUsed, retryAfter}` for failure
 */
const applyLimits = async ({
    orgId,
    rpmKey,
    resource,
    resEnt
}) => {
    let rpmUsed = 0;

    /* quota --------------------------------------------------------------- */
    if (Number.isFinite(resEnt.quota) && resEnt.quotaRemaining <= 0) {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const retryAfter = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);

        return {
            status: 429,
            error: `Monthly quota exceeded for "${resource}" (${resEnt.quota}/${resEnt.quota} used).`,
            rpmUsed,
            retryAfter
        };
    }

    // Decrement quota if finite
    if (Number.isFinite(resEnt.quota)) {
        try {
            const newRemaining = await decrementActiveQuota(orgId, resource);
            // Update the resEnt object for header building
            resEnt.quotaRemaining = newRemaining;

            if (newRemaining < 0) {
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const retryAfter = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);

                return {
                    status: 429,
                    error: `Monthly quota exceeded for "${resource}".`,
                    rpmUsed,
                    retryAfter
                };
            }
        } catch (error) {
            return {
                status: 403,
                error: error.message,
                rpmUsed
            };
        }
    }

    /* rpm ----------------------------------------------------------------- */
    if (Number.isFinite(resEnt.rpm)) {
        const rKey = `rpm:${rpmKey}:${resource}`;
        const r = await redis.incr(rKey);
        rpmUsed = r;

        if (r === 1) await redis.expire(rKey, 60); // 60 s window

        if (r > resEnt.rpm) {
            return {
                status: 429,
                error: `RPM limit exceeded for "${resource}" (${r}/${resEnt.rpm} used).`,
                rpmUsed,
                retryAfter: 60
            };
        }
    }

    return { rpmUsed };
};

/* ---------- helper for route handlers ----------------------------------- */

/**
 * Helper function to create a Response with rate limit headers
 * Usage in your route handler:
 * 
 * const result = await rateLimitedSendMessage({ messages, chatId, brand, useAdvancedStyling });
 * return createResponseWithHeaders(result);
 */
export const createResponseWithHeaders = (result, additionalHeaders = {}) => {
    const {
        _rateLimitHeaders,
        status: providedStatus,
        error,
        ...rest
    } = result || {};

    const isError = error != null; // string/object/whatever
    const status = providedStatus ?? (isError ? 400 : 200);

    // Build payload without mutating the original
    const payload = isError ? { error, ...rest } : rest;

    // Merge headers (caller last so they can override)
    const headers = {
        'Content-Type': 'application/json',
        ...(_rateLimitHeaders || {}),
        ...(additionalHeaders || {}),
    };

    // No body for 204
    if (status === 204) {
        return new Response(null, { status, headers });
    }

    return new Response(JSON.stringify(payload), { status, headers });
};