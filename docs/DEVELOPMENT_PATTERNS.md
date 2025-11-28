# StudyHelper - Development Patterns & Best Practices

## Next.js 15+ Breaking Changes

This project uses Next.js 16. Be aware of these critical changes from Next.js 14:

### 1. Async Request APIs (Breaking Change)
The following are now **async** and must be awaited:

```javascript
// ❌ OLD (Next.js 14)
export async function GET(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
}

// ✅ NEW (Next.js 15+)
export async function GET(request, { params }) {
    const { id } = await params;  // Must await params
    const searchParams = await request.nextUrl.searchParams;
}
```

### 2. cookies() and headers() are now async

```javascript
import { cookies, headers } from 'next/headers';

// ❌ OLD (Next.js 14)
const cookieStore = cookies();
const headersList = headers();

// ✅ NEW (Next.js 15+)
const cookieStore = await cookies();
const headersList = await headers();
```

### 3. Page and Layout Props

```javascript
// ❌ OLD (Next.js 14)
export default function Page({ params, searchParams }) {
    const { id } = params;
}

// ✅ NEW (Next.js 15+)
export default async function Page({ params, searchParams }) {
    const { id } = await params;
    const query = await searchParams;
}
```

---

## Core Architecture Patterns

### 1. Utility Functions (utils/)

**Location Pattern**: `utils/[resource]/[crudAction].js`
- For CRUD operations: `utils/[resource]/create.js`, `utils/[resource]/list.js`, etc.
- For non-CRUD: `utils/[resource]/index.js` or descriptive name

**Structure**: Always export TWO versions:
1. **Raw function**: Core logic, no middleware
2. **Handler function**: Wrapped with `withApiRateLimit` for API routes

**Example**:
```javascript
import { withApiRateLimit } from '@/middleware/apiRateLimiter';
import { validateDateRange } from '../helpers/dateRanges';
import { Chat } from '@/models/Chat';

/**
 * JSDoc with full parameter documentation
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (ISO string)
 * @param {Object} context - Request context
 * @param {string} context.organizationId - Organization UUID
 * @returns {Promise<Object>} Result or error object
 */
const getAnalytics = async (
    { startDate, endDate },
    { organizationId }
) => {
    try {
        // 1. Validate inputs
        if (!organizationId) {
            return { status: 400, error: 'Invalid input' };
        }

        // 2. Parse/transform data
        const parsedDate = new Date(startDate);

        // 3. Database operations
        const results = await Chat.aggregate([...]);

        // 4. Return structured response
        return { data: results };

    } catch (error) {
        console.error('getAnalytics Error:', error?.message || error);
        return {
            status: 500,
            error: error?.message || 'Unexpected error'
        };
    }
};

// Export handler with rate limiting for API routes
export const getAnalyticsHandler = withApiRateLimit(
    getAnalytics,
    'api.v1.analytics.metrics.overview', // Dot-separated path
    'private' // or 'public'
);

// Export raw function for server functions
export const getAnalyticsRaw = getAnalytics;
```

**Key Requirements**:
- Always include JSDoc documentation
- Use validators from `validators/` directory
- Return consistent error objects with `status` and `error`
- Named imports for models: `import { Chat } from '@/models/Chat'`
---

### 2. Server Functions (components/server/)

**Location Pattern**: `components/server/[resource]/[action].js`
- Example: `components/server/analytics/metrics/overview.js`
- Example: `components/server/membership/retrieve.js`

**Structure**: Auth-protected wrapper around raw utility

**Example**:
```javascript
'use server';

import { withClientRateLimitMiddleware } from '@/middleware/clientRateLimiter';
import { retrieveUserOrganizationMembership } from '@/utils/membership/retrieve';
import { ROLE_PERMISSIONS } from '@/vars/ROLE_MANAGEMENT';
import { getAnalyticsRaw } from '@/utils/api/analytics/metrics/overview';

/**
 * JSDoc documentation
 */
const retrieveAnalytics = async (
    { organizationId, startDate, endDate },
    { authStatus }
) => {
    try {
        // 1. Validate required parameters
        if (!organizationId || typeof organizationId !== 'string') {
            return { error: 'Bad request: organizationId required' };
        }

        // 2. Check authentication
        const { authenticated, user } = authStatus || {};
        if (!authenticated || !user?.uuid) {
            return { error: 'Unauthorized: Please sign in' };
        }

        // 3. Check membership
        const membership = await retrieveUserOrganizationMembership(user.uuid, organizationId);
        if (!membership) {
            return { error: 'Forbidden: Not a member' };
        }

        if (membership.isActive === false) {
            return { error: 'Forbidden: Membership inactive' };
        }

        // 4. Check permissions
        const role = membership.role;
        const rolePermissions = ROLE_PERMISSIONS?.[role];

        if (!rolePermissions) {
            return { error: 'Forbidden: Role not recognized' };
        }

        const canViewAnalytics = rolePermissions?.analytics?.view;
        if (!canViewAnalytics) {
            return { error: 'Forbidden: No permission' };
        }

        // 5. Call the core utility
        const result = await getAnalyticsRaw(
            { startDate, endDate },
            { organizationId }
        );

        // 6. Handle errors from utility
        if (result?.error) {
            return { error: result.error };
        }

        return result;

    } catch (err) {
        console.error('retrieveAnalytics Error:', err?.message || err);
        return { error: err?.message || 'Unexpected error' };
    }
};

// Always export with rate limiting middleware
const rateLimitedRetrieveAnalytics = withClientRateLimitMiddleware(
    retrieveAnalytics,
    {
        rpm: 60,              // requests per minute (IP-based)
        userRpm: 100,         // requests per user
        resourceName: 'analytics-overview' // kebab-case
    }
);

export { rateLimitedRetrieveAnalytics as retrieveAnalytics };
```

**Key Requirements**:
- MUST start with `'use server'` directive
- ALWAYS export with `withClientRateLimitMiddleware`
- Follow 6-step pattern: validate, auth, membership, permissions, call utility, handle errors
- Use consistent error messages
- Resource name in middleware should be kebab-case

---

### 3. API Routes (app/api/)

**Location Pattern**: `app/api/v[X]/[resource]/**/[action]/route.js`
- Example: `app/api/v1/chat/create/route.js`
- Example: `app/api/v1/datasets/[datasetId]/activate/route.js`

**Structure**: Thin wrapper that calls handler from utils

**Example**:
```javascript
import { getAnalyticsHandler } from '@/utils/api/analytics/metrics/overview';

// Force dynamic rendering - prevents build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        // 1. Await params (Next.js 15+ requirement - params is now a Promise)
        const { organizationId } = await params;

        // 2. Await searchParams (Next.js 15+ requirement - searchParams is now a Promise)
        const searchParams = await request.nextUrl.searchParams;
        // Or use URL parsing: const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // 3. Call the handler (already rate-limited)
        const result = await getAnalyticsHandler(
            { startDate, endDate },
            { organizationId }
        );

        // 4. Return response
        if (result?.error) {
            return Response.json(
                { error: result.error },
                { status: result.status || 400 }
            );
        }

        return Response.json(result, { status: 200 });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

**Key Requirements**:
- **ALWAYS** add `export const dynamic = 'force-dynamic';` to prevent build-time execution
- **ALWAYS** await `params` before accessing properties (Next.js 15+ breaking change)
- **ALWAYS** await `searchParams` if using `request.nextUrl.searchParams`
- Use the Handler export (with rate limiting) from utils
- Return proper HTTP status codes
- Keep minimal logic (delegate to utils)

---

## Centralized Service Clients

### Overview

All external service clients (OpenAI, Groq, Stripe, Redis) are centralized in `utils/clients/` using lazy initialization. This prevents build-time errors and ensures consistent client management across the codebase.

### Location: `utils/clients/`

```
utils/clients/
├── openai.js       // OpenAI client singleton
├── groq.js         // Groq client singleton
├── stripe.js       // Stripe client singleton
├── redis.js        // Redis client singleton
└── index.js        // Barrel export for easy imports
```

### Usage

**Always import clients from the centralized location:**

```javascript
import { getOpenAI, getGroq, getStripe, getRedis } from '@/utils/clients';

export async function myFunction() {
    // Get client instance (created on first use)
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({...});
}
```

### Benefits

1. **Single source of truth**: One place to manage all client configurations
2. **Lazy initialization**: Clients created only when needed (runtime, not build-time)
3. **Singleton pattern**: Each client instantiated once and reused
4. **Easy to test**: Mock clients by replacing `utils/clients` exports
5. **Consistent**: All files use the same client instances

### Adding a New Client

1. Create new file in `utils/clients/` (e.g., `mongodb.js`)
2. Implement lazy initialization pattern
3. Export getter function
4. Add export to `utils/clients/index.js`

**Example: `utils/clients/mongodb.js`**
```javascript
import { MongoClient } from 'mongodb';

let instance = null;

export const getMongoDB = () => {
    if (!instance) {
        instance = new MongoClient(process.env.MONGODB_URI);
    }
    return instance;
};
```

---

## Environment Variables & Build-Time Safety

### Critical Rule: Use Centralized Clients, Never Initialize at Module Level

**The Problem**: Next.js statically analyzes modules during build time. Any code that executes at module level (outside of functions) will run during the build, even if environment variables aren't available yet.

### ❌ BAD - Module-Level Client Initialization

```javascript
import Stripe from 'stripe';
import OpenAI from 'openai';

// ❌ These execute immediately during build
const stripe = new Stripe(process.env.STRIPE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function POST(request) {
    // Uses build-time instance with placeholder env vars
    const result = await stripe.paymentIntents.create({...});
}
```

### ✅ GOOD - Use Centralized Clients

```javascript
import { getStripe, getOpenAI } from '@/utils/clients';

export async function POST(request) {
    // ✓ Client created at runtime with real env vars
    const stripe = getStripe();
    const result = await stripe.paymentIntents.create({...});
}
```

### For Non-Client Environment Variables

If you need to access environment variables that aren't service clients:

**Pattern 1: Simple Getter Functions**
```javascript
// Getter function - only executes when called
const getApiKey = () => process.env.API_KEY;

export function myFunction() {
    const apiKey = getApiKey(); // ✓ Accessed at runtime
    return apiKey;
}
```

**Pattern 2: Validation Inside Functions**
```javascript
// Move validation from module level into function
async function dbConnect() {
    const MONGODB_URI = process.env.DATABASE_URL;

    if (!MONGODB_URI) {
        throw new Error('Missing DATABASE_URL'); // ✓ Only throws at runtime
    }

    // proceed with connection...
}
```

### API Routes: Force Dynamic Rendering

Always add this export to prevent Next.js from pre-rendering API routes:

```javascript
// Top of every route.js file
export const dynamic = 'force-dynamic';
```

This tells Next.js: "Don't try to statically analyze or pre-render this route during build."

### `.env.production` Best Practice

- **Use placeholders** in `.env.production` (committed to version control)
- **Real values** come from your deployment environment (Docker, Vercel, etc.)

```bash
# .env.production (safe to commit)
DATABASE_URL=STRING_PLACEHOLDER
STRIPE_KEY=STRING_PLACEHOLDER
DATASET_VERSION=6  # Numeric values need valid numbers, not "INT_PLACEHOLDER"
```

At runtime, your deployment platform injects real values that override these placeholders.

### Summary: Environment Variable Rules

1. ✅ **DO**: Import service clients from `@/utils/clients`
2. ✅ **DO**: Access `process.env` inside functions (runtime) for non-client values
3. ✅ **DO**: Add `export const dynamic = 'force-dynamic'` to API routes
4. ✅ **DO**: Keep `.env.production` with placeholders
5. ❌ **DON'T**: Initialize service clients at module level
6. ❌ **DON'T**: Access `process.env` at module level (build-time)
7. ❌ **DON'T**: Throw errors during module initialization

---

## Organizational Best Practices

### File Organization for Complex Features

When building features with multiple resources/actions:

**Bad** (flat structure):
```
utils/api/analytics/drilldown/
├── failedSearches.js
├── successfulSearches.js
└── recentChats.js
```

**Good** (resource-based):
```
utils/api/analytics/drilldown/
├── searches/
│   ├── failed.js
│   └── successful.js
└── chats/
    └── recent.js
```

### Rate Limit Resource Naming

Should reflect the file structure:
- Utils: `api.v1.analytics.drilldown.searches.failed` (dot-separated path)
- Server: `analytics-drilldown-searches-failed` (kebab-case with hyphens)

---

## Database Patterns

### Model Imports
Always use named imports:
```javascript
import { Chat } from '@/models/Chat';  // ✓ Correct
import Chat from '@/models/Chat';      // ✗ Wrong
```

### Connection Management
Database connections are all handled through the instrumentation file. You do not need to manually connect to the database.

### Aggregation Pipelines
Use for complex queries:
```javascript
const pipeline = [
    { $match: { organizationId, createdAt: { $gte: start, $lte: end } } },
    { $unwind: '$messages' },
    { $group: { _id: null, total: { $sum: 1 } } }
];
const results = await Chat.aggregate(pipeline);
```

---

## Permission Checking

Use centralized permissions from `vars/ROLE_MANAGEMENT.js`:

```javascript
import { ROLE_PERMISSIONS } from '@/vars/ROLE_MANAGEMENT';

const rolePermissions = ROLE_PERMISSIONS?.[membership.role];
const canView = rolePermissions?.analytics?.view;
```

---

## Summary Checklist

### Creating a New Util:
- [ ] Place in `utils/[resource]/[action].js`
- [ ] Include full JSDoc documentation
- [ ] Export both Raw and Handler versions
- [ ] Use validators for input validation
- [ ] Return consistent error objects

### Creating a Server Function:
- [ ] Start with `'use server'`
- [ ] Place in `components/server/[resource]/[action].js`
- [ ] Follow 6-step auth/permission pattern
- [ ] Export with `withClientRateLimitMiddleware`
- [ ] Use consistent error messages

### Creating an API Route:
- [ ] Place in `app/api/v[X]/[resource]/[action]/route.js`
- [ ] Add `export const dynamic = 'force-dynamic';` at the top
- [ ] **Await `params`** before destructuring (Next.js 15+ requirement)
- [ ] **Await `searchParams`** if using `request.nextUrl.searchParams`
- [ ] Call Handler (not Raw) from utils
- [ ] Return proper HTTP status codes
- [ ] Keep logic minimal
- [ ] Never access `process.env` at module level

### Creating Pages/Layouts:
- [ ] Make component async if accessing `params` or `searchParams`
- [ ] **Await `params`** before destructuring
- [ ] **Await `searchParams`** before accessing query values
- [ ] **Await `cookies()`** and **`headers()`** from `next/headers`

### Working with Service Clients:
- [ ] Import service clients from `@/utils/clients`
- [ ] Never initialize clients (Stripe, OpenAI, etc.) at module level
- [ ] Call getter functions inside your functions (e.g., `const stripe = getStripe()`)

### Working with Environment Variables:
- [ ] Use centralized clients for services (OpenAI, Stripe, Redis)
- [ ] For other env vars, use getter functions inside functions
- [ ] Never access `process.env` at module level
- [ ] Keep `.env.production` with placeholder values

### Adding a New Service Client:
- [ ] Create new file in `utils/clients/[service].js`
- [ ] Implement lazy initialization pattern (see existing clients)
- [ ] Export getter function (e.g., `export const getService = () => {...}`)
- [ ] Add export to `utils/clients/index.js`
