import { headers } from "next/headers";
import { Redis } from "@upstash/redis";
import { authStatus } from "@/components/server/auth/get/status";

const redis = Redis.fromEnv();

/**
 * Extracts the client IP from common reverse‑proxy headers.
 * Falls back gracefully if infra doesn't forward IPs.
 *
 *
 * @returns {Promise<string|null>} The client IP, or null if it can't be determined.
 */
const getClientIp = async () => {
    const headerList = await headers();
    const xForwardedFor = headerList.get("x-forwarded-for");
    if (xForwardedFor) {
        const first = xForwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) return (realIp || "").trim() || null;

    // If we get here, infra likely isn't forwarding IPs (or it's a server-to-server call).
    return null;
};

/**
 * Atomically increments a rate-limit counter and evaluates if the limit is exceeded.
 *
 * @param {Object} args
 * @param {string} args.key            Redis key for the bucket.
 * @param {number} args.max            Max requests per window.
 * @param {number} args.windowSeconds  Window length in seconds.
 * @returns {Promise<{exceeded:boolean, used:number, limit:number, retryAfter:number}>}
 */
async function incrementAndCheckLimit({ key, max, windowSeconds }) {
    const used = await redis.incr(key);
    if (used === 1) {
        // First hit in the window -> set expiry
        await redis.expire(key, windowSeconds);
    }

    if (used > max) {
        // Advise client how long to wait before retrying
        const ttl = await redis.ttl(key);
        return {
            exceeded: true,
            used,
            limit: max,
            retryAfter: typeof ttl === "number" && ttl > 0 ? ttl : windowSeconds,
        };
    }

    return {
        exceeded: false,
        used,
        limit: max,
        retryAfter: 0,
    };
}

/**
 * Rate limiting middleware for Next.js route handlers (no TypeScript).
 *
 * Buckets (any that are enabled may block):
 *  - IP    (default on, via `rpm`, scoped to resource)
 *  - User  (enable with `userRpm`, scoped to resource)
 *  - Org   (enable with `orgRpm` + provide `getOrganizationId`, scoped to resource)
 *
 * Status codes & payloads:
 *  - 401: { status: 401, error: "You must be signed in to access this endpoint." }
 *  - 429: {
 *      status: 429,
 *      error: "Rate limit exceeded for bucket 'ip'|'user'|'org'.",
 *      bucket, used, limit, retryAfter, windowSeconds
 *    }
 *  - 500: { status: 500, error: "Internal server error." }
 *
 * @param {Function} handler  Your route handler.
 * @param {number|Object} [options]  Legacy number = rpm, or an options object.
 * @param {number}   [options.rpm=60]            Per‑IP RPM (per resource).
 * @param {number}   [options.userRpm=null]      Per‑user RPM (per resource, requires auth).
 * @param {number}   [options.orgRpm=null]       Per‑org RPM (per resource, requires org extractor).
 * @param {number}   [options.windowSeconds=60]  Window size in seconds.
 * @param {boolean}  [options.requireAuth=true]  If true, reject unauthenticated callers with 401.
 * @param {string}   [options.resourceName]      Resource identifier (defaults to handler function name).
 * @param {Function} [options.getOrganizationId] Receives (...params) and returns orgId (string) or null.
 */
export function withClientRateLimitMiddleware(handler, options) {
    // Back-compat: allow passing a bare number for rpm
    const normalized = typeof options === "number" ? { rpm: options } : { ...(options || {}) };

    const rpm = Number.isFinite(normalized.rpm) ? normalized.rpm : 60;
    const userRpm = Number.isFinite(normalized.userRpm) ? normalized.userRpm : null;
    const orgRpm = Number.isFinite(normalized.orgRpm) ? normalized.orgRpm : null;
    const windowSeconds = Number.isFinite(normalized.windowSeconds) ? normalized.windowSeconds : 60;
    const requireAuth = normalized.requireAuth !== false; // default true
    const getOrganizationId = typeof normalized.getOrganizationId === "function" ? normalized.getOrganizationId : null;
    
    // Resource name: use provided name, or fall back to handler function name, or "unknown"
    const resourceName = normalized.resourceName || handler.name || "unknown";
    
    return async (...params) => {
        try {
            // --- Auth gate (optional) ---
            const auth = await authStatus();
            if (auth && auth.error) {
                return {
                    status: 401,
                    error: typeof auth.error === "string" ? auth.error : "Authentication failed. Please sign in and try again.",
                };
            }

            if (requireAuth && !(auth && auth.authenticated)) {
                return {
                    status: 401,
                    error: "You must be signed in to access this endpoint.",
                };
            }

            // --- Build buckets (now scoped to resource) ---
            const clientIp = await getClientIp();
            const ipKey = clientIp ? `rate:ip:${resourceName}:${clientIp}` : null;

            const userUuid = auth && auth.user && auth.user.uuid;
            const userKey = userRpm && auth && auth.authenticated && userUuid ? `rate:user:${resourceName}:${userUuid}` : null;

            let organizationId = null;
            if (getOrganizationId) {
                try {
                    organizationId = await getOrganizationId(...params);
                } catch {
                    organizationId = null; // don't fail the request for extractor errors
                }
            }
            const orgKey = orgRpm && organizationId ? `rate:org:${resourceName}:${organizationId}` : null;

            // --- Enforce buckets in order: IP → User → Org ---
            if (ipKey) {
                const res = await incrementAndCheckLimit({ key: ipKey, max: rpm, windowSeconds });
                if (res.exceeded) {
                    return {
                        status: 429,
                        error: "Rate limit exceeded for bucket 'ip'.",
                        bucket: "ip",
                        resource: resourceName,
                        used: res.used,
                        limit: res.limit,
                        retryAfter: res.retryAfter,
                        windowSeconds,
                    };
                }
            }

            if (userKey) {
                const res = await incrementAndCheckLimit({ key: userKey, max: userRpm, windowSeconds });
                if (res.exceeded) {
                    return {
                        status: 429,
                        error: "Rate limit exceeded for bucket 'user'.",
                        bucket: "user",
                        resource: resourceName,
                        used: res.used,
                        limit: res.limit,
                        retryAfter: res.retryAfter,
                        windowSeconds,
                    };
                }
            }

            if (orgKey) {
                const res = await incrementAndCheckLimit({ key: orgKey, max: orgRpm, windowSeconds });
                if (res.exceeded) {
                    return {
                        status: 429,
                        error: "Rate limit exceeded for bucket 'org'.",
                        bucket: "org",
                        resource: resourceName,
                        used: res.used,
                        limit: res.limit,
                        retryAfter: res.retryAfter,
                        windowSeconds,
                    };
                }
            }

            // --- Proceed to handler ---
            return await handler(...params, { authStatus: auth });
        } catch (error) {
            console.error("Rate limiting middleware error:", error);
            return {
                status: 500,
                error: "Internal server error.",
            };
        }
    };
}

/* ------------------------------------------
   Usage examples:

// 1) Legacy (unchanged): only per-IP @ 60 rpm, uses handler function name as resource
export const GET = withClientRateLimitMiddleware(async function getUsers() {
  // Handler implementation
  // Rate limited at: rate:ip:getUsers:{ip}
}, 60);

// 2) Explicit resource name for the upload endpoint
export const POST = withClientRateLimitMiddleware(handler, {
  rpm: 60,
  resourceName: "upload",
});
// Rate limited at: rate:ip:upload:{ip}

// 3) Multiple buckets with custom resource name
export const POST = withClientRateLimitMiddleware(handler, {
  rpm: 100,
  userRpm: 120,
  resourceName: "api-create-project",
});
// Rate limited at:
//   - rate:ip:api-create-project:{ip}
//   - rate:user:api-create-project:{userUuid}

// 4) Per-org limiting with resource scoping
export const POST = withClientRateLimitMiddleware(handler, {
  rpm: 80,
  userRpm: 120,
  orgRpm: 240,
  resourceName: "api-process-data",
  getOrganizationId: (req) => {
    try {
      const url = new URL(req.url);
      return url.searchParams.get("organizationId");
    } catch {
      return null;
    }
  },
});
// Rate limited at:
//   - rate:ip:api-process-data:{ip}
//   - rate:user:api-process-data:{userUuid}
//   - rate:org:api-process-data:{orgId}
------------------------------------------- */