---
description: SvelteKit framework patterns: routing, data loading, form actions, hooks, SSR, security, and configuration.
paths:
  - "**/*.svelte"
  - "**/*.svelte.ts"
  - "**/*.svelte.js"
  - "**/svelte.config.*"
  - "**/+page*.ts"
  - "**/+page*.svelte"
  - "**/+layout*.ts"
  - "**/+layout*.svelte"
  - "**/+server.ts"
  - "**/+error.svelte"
  - "**/hooks.server.ts"
  - "**/hooks.client.ts"
  - "**/hooks.ts"
  - "**/*.svelte*.jinja"
  - "**/*.svelte.ts*.jinja"
  - "**/*.svelte.js*.jinja"
---

# SvelteKit Framework Patterns

SvelteKit best practices for routing, data loading, form actions, hooks, SSR, security, and configuration. For component-level Svelte patterns (runes, reactivity, events, styling), see `SVELTE_BEST_PRACTICES.md`.

Borrowed from: [SvelteKit Documentation](https://svelte.dev/docs/kit), [Svelte MCP Server](https://mcp.svelte.dev)

---

## MCP Server

If the Svelte MCP server is enabled, use it for up-to-date SvelteKit documentation and code validation:

- `list-sections` -- discover available SvelteKit documentation topics (routing, hooks, adapters, etc.)
- `get-documentation` -- fetch current API details for specific SvelteKit topics
- `svelte-autofixer` -- analyze components and SvelteKit files for common issues

---

## Routing

SvelteKit uses file-based routing where the filesystem structure under `src/routes/` defines URL paths. Each route is a directory containing special `+` prefixed files that control what renders and what data loads. Route parameters use bracket syntax, and route groups organize layouts without affecting URLs.

```
src/routes/
  +page.svelte              # /
  +layout.svelte            # Shared layout for all routes
  about/
    +page.svelte            # /about
  blog/
    +page.svelte            # /blog
    +page.server.ts         # Server-side data loading for /blog
    [slug]/
      +page.svelte          # /blog/:slug
      +page.server.ts       # Server-side data for individual post
  (auth)/
    login/+page.svelte      # /login (grouped layout, no URL segment)
    signup/+page.svelte     # /signup
    +layout.svelte          # Shared layout for login/signup only
  api/
    health/+server.ts       # /api/health (API-only route)
```

| File                               | Purpose                                             |
| ---------------------------------- | --------------------------------------------------- |
| `+page.svelte`                     | Page component (the UI)                             |
| `+page.ts`                         | Universal load function (runs on server and client) |
| `+page.server.ts`                  | Server-only load function and form actions          |
| `+layout.svelte`                   | Layout component wrapping child pages               |
| `+layout.ts` / `+layout.server.ts` | Layout data loading                                 |
| `+error.svelte`                    | Error boundary for the route segment                |
| `+server.ts`                       | API endpoint (GET, POST, etc.)                      |

Route parameter types:

- `[param]` -- required parameter
- `[...rest]` -- catch-all (matches remaining path segments)
- `[[optional]]` -- optional parameter

---

## Data Loading

Load functions fetch data for pages and layouts before rendering. Use `+page.server.ts` for server-only concerns (database access, secrets, authentication). Use `+page.ts` for universal loads that also run on the client (public API calls, client-side data). Return plain objects with serializable data.

```typescript
// +page.server.ts -- GOOD: Server-only load for DB access
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/database';

export const load: PageServerLoad = async ({ params }) => {
  const post = await db.getPost(params.slug);
  return { post };
};
```

```typescript
// +page.ts -- GOOD: Universal load for public data
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/public-data');
  return { items: await res.json() };
};
```

Use `depends()` to declare custom dependency keys and `invalidate()` to trigger reloads. Access parent layout data with `await parent()`, but call it only when needed since it creates a waterfall.

```typescript
// +page.ts
export const load: PageLoad = async ({ depends, fetch }) => {
  depends('app:posts');
  const res = await fetch('/api/posts');
  return { posts: await res.json() };
};
```

```svelte
<script>
  import { invalidate } from '$app/navigation';

  // Trigger reload of all loads depending on 'app:posts'
  function refresh() {
    invalidate('app:posts');
  }
</script>
```

---

## Form Actions

Define form handlers in `+page.server.ts` using the `actions` export. This keeps form logic server-side and works without JavaScript. Use `fail()` to return validation errors with appropriate status codes. Add `use:enhance` on forms for progressive enhancement (SvelteKit intercepts the submission and updates the page without a full reload).

```typescript
// +page.server.ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  // Default action (form without action attribute)
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString();

    if (!email) {
      return fail(400, { email, missing: true });
    }

    await saveSubscriber(email);
    return { success: true };
  },

  // Named action (form action="?/delete")
  delete: async ({ request }) => {
    const data = await request.formData();
    await deleteItem(data.get('id'));
  }
};
```

```svelte
<script>
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<!-- GOOD: Progressive enhancement with use:enhance -->
<form method="POST" use:enhance>
  <input name="email" value={form?.email ?? ''} />
  {#if form?.missing}<p>Email is required</p>{/if}
  <button>Subscribe</button>
</form>

<!-- GOOD: Named action -->
<form method="POST" action="?/delete" use:enhance>
  <input type="hidden" name="id" value={item.id} />
  <button>Delete</button>
</form>
```

Prefer form actions over API routes (`+server.ts`) for form submissions. Form actions integrate with SvelteKit's progressive enhancement and provide automatic CSRF protection.

---

## API Routes

Use `+server.ts` for non-HTML endpoints: webhooks, JSON APIs, file downloads, and third-party integrations. Export functions named after HTTP methods. Return responses using the `json()` helper or `new Response()`.

```typescript
// src/routes/api/items/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 20);
  const items = await db.getItems(limit);
  return json(items);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  if (!body.name) throw error(400, 'Name required');
  const item = await db.createItem(body);
  return json(item, { status: 201 });
};
```

For form submissions from your own app, prefer form actions over API routes -- they handle progressive enhancement, CSRF, and error states automatically.

---

## Hooks

Hooks intercept requests and responses at the framework level. Use `hooks.server.ts` for server-side middleware (authentication, logging, security headers). Use `hooks.client.ts` for client-side error handling. Use `hooks.ts` for shared logic like URL rerouting.

```typescript
// hooks.server.ts
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Authentication middleware
const auth: Handle = async ({ event, resolve }) => {
  const session = await getSession(event.cookies);
  event.locals.user = session?.user ?? null;
  return resolve(event);
};

// Security headers
const headers: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
};

// GOOD: Compose multiple handlers with sequence
export const handle = sequence(auth, headers);

// Log unexpected errors (e.g., to Sentry)
export const handleError: HandleServerError = async ({ error, event }) => {
  console.error('Unexpected error:', error);
  return { message: 'Internal server error' };
};
```

```typescript
// hooks.client.ts
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error }) => {
  console.error('Client error:', error);
  return { message: 'Something went wrong' };
};
```

The `handle` hook runs for every server request and can modify the request, set `event.locals`, redirect, or modify the response. Chain multiple handlers with `sequence`.

---

## Page Options

Control rendering behavior per page or layout by exporting options from `+page.ts` or `+layout.ts`. SSR is on by default. Prerender static content for best performance. Disable CSR for pages that work without JavaScript.

```typescript
// +page.ts -- Static content, prerender at build time
export const prerender = true;

// +page.ts -- Disable SSR for client-only pages (e.g., dashboard with auth)
export const ssr = false;

// +page.ts -- No-JS page, skip client-side hydration
export const csr = false;

// +layout.ts -- Apply trailing slash rule to all child routes
export const trailingSlash = 'never';
```

Options set in `+layout.ts` apply to all child pages unless overridden. Use `prerender = true` at the layout level for entire static sections.

---

## Environment Variables

SvelteKit provides four `$env` modules for accessing environment variables safely. Static imports are tree-shakeable and replaced at build time. Dynamic imports read values at runtime. The `PUBLIC_` prefix explicitly marks variables safe for client exposure. Never import private modules in client-side code -- SvelteKit will throw a build error.

```typescript
// GOOD: Server-only secrets (never exposed to client)
import { DATABASE_URL, API_SECRET } from '$env/static/private';

// GOOD: Build-time public values (tree-shakeable)
import { PUBLIC_API_URL } from '$env/static/public';

// GOOD: Runtime values that may change per deployment
import { env } from '$env/dynamic/private';
const dbUrl = env.DATABASE_URL;

// BAD: Importing private env in a +page.svelte (client-side) -- build error
import { API_SECRET } from '$env/static/private';
```

| Module                 | Availability    | Timing     | Use For                            |
| ---------------------- | --------------- | ---------- | ---------------------------------- |
| `$env/static/private`  | Server only     | Build-time | Secrets, DB URLs, API keys         |
| `$env/static/public`   | Server + Client | Build-time | Public API URLs, feature flags     |
| `$env/dynamic/private` | Server only     | Runtime    | Values that vary per deployment    |
| `$env/dynamic/public`  | Server + Client | Runtime    | Runtime-configurable public values |

See `rules/ENVIRONMENT_VARIABLES.md` for general environment variable naming and security conventions.

---

## $app Modules

SvelteKit provides built-in modules under `$app/` for navigation, page state, paths, and environment detection. Use these instead of manual `window.location` or `document` manipulation.

### Navigation

```typescript
import {
  goto, // Navigate programmatically
  invalidate, // Rerun load functions matching a dependency
  invalidateAll, // Rerun all load functions
  beforeNavigate, // Run callback before navigation (can cancel)
  afterNavigate, // Run callback after navigation completes
  onNavigate // Run callback during navigation (for view transitions)
} from '$app/navigation';

// GOOD: Programmatic navigation after an action
await saveItem(item);
goto('/items');

// GOOD: Revalidate specific data
invalidate('app:items');
```

### Stores and State

```typescript
import { page, navigating, updated } from '$app/stores';

// page -- current URL, params, route, status, errors, form data
// navigating -- non-null during navigation (from/to/type)
// updated -- true when a new app version is deployed (for update prompts)
```

### Paths and Environment

```typescript
import { base, assets } from '$app/paths';
import { browser, dev, building } from '$app/environment';

// GOOD: Use base for non-root deployments
<a href="{base}/about">About</a>

// GOOD: Guard browser-only code
if (browser) {
  localStorage.setItem('key', value);
}
```

---

## Error Handling

Use `error()` to throw expected errors (404, 403) that display the `+error.svelte` page. Use the `handleError` hook in `hooks.server.ts` for unexpected errors (logging, Sentry). Error pages are nested -- a `+error.svelte` in a route directory catches errors for that segment and its children.

```typescript
// +page.server.ts
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  const post = await db.getPost(params.slug);
  if (!post) throw error(404, 'Post not found');
  return { post };
};
```

```svelte
<!-- +error.svelte -->
<script>
  import { page } from '$app/stores';
</script>

<h1>{$page.status}</h1><p>{$page.error?.message}</p>
```

For unexpected errors, `handleError` in hooks prevents raw stack traces from reaching the client:

```typescript
// hooks.server.ts
export const handleError = async ({ error, event }) => {
  // Log to Sentry, Datadog, etc.
  captureException(error, { url: event.url.pathname });
  return { message: 'Something went wrong' };
};
```

---

## Static Assets

Prefer serving assets through SvelteKit routes or `$app/paths`'s `assets` path over the `static/` directory. Files in `static/` are served directly by the web server, making it difficult to set proper response headers for caching, security, and CSP. Assets served through SvelteKit routes benefit from the `handle` hook where you can set headers consistently.

```typescript
// GOOD: Serve a file through a route with proper headers
// src/routes/downloads/[file]/+server.ts
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const file = await getFile(params.file);
  return new Response(file.data, {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'"
    }
  });
};
```

```svelte
<script>
  import { assets } from '$app/paths';
</script>

<!-- GOOD: Reference built/processed assets -->
<img src="{assets}/logo.svg" alt="Logo" />
```

When `static/` is necessary (e.g., `favicon.ico`, `robots.txt`), keep its contents minimal and be aware that headers depend on the deployment platform's web server configuration.

---

## Content Security Policy (CSP)

Always configure CSP headers for SvelteKit apps. CSP prevents XSS and other injection attacks by controlling which resources the browser is allowed to load. SvelteKit has built-in CSP support via `svelte.config.js` that automatically generates nonces for inline scripts and styles.

```javascript
// svelte.config.js
export default {
  kit: {
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:'],
        'connect-src': ['self'],
        'font-src': ['self'],
        'object-src': ['none'],
        'frame-ancestors': ['none']
      }
    }
  }
};
```

Use `mode: 'auto'` to let SvelteKit generate nonces for inline scripts and styles automatically. During development, use `reportOnly` to catch violations without breaking the app:

```javascript
// svelte.config.js (development)
export default {
  kit: {
    csp: {
      mode: 'auto',
      reportOnly: {
        'default-src': ['self'],
        'script-src': ['self'],
        'report-uri': ['/api/csp-report']
      }
    }
  }
};
```

Complement CSP with additional security headers in the `handle` hook:

```typescript
// hooks.server.ts
const security: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};
```

---

## Configuration

SvelteKit is configured through `svelte.config.js`. The `kit` property controls framework behavior (adapters, paths, CSP). The `compilerOptions` property controls the Svelte compiler. Choose an adapter matching your deployment target.

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter(),
    paths: {
      base: '/app' // For non-root deployments
    },
    csp: {
      /* ... */
    }
  },
  compilerOptions: {
    runes: true // Enforce runes mode
  }
};
```

| Adapter              | Use For                                                        |
| -------------------- | -------------------------------------------------------------- |
| `adapter-auto`       | Auto-detects deployment platform (Vercel, Netlify, Cloudflare) |
| `adapter-node`       | Self-hosted Node.js servers                                    |
| `adapter-static`     | Fully static/prerendered sites                                 |
| `adapter-vercel`     | Vercel-specific features (edge functions, ISR)                 |
| `adapter-cloudflare` | Cloudflare Workers/Pages                                       |

---

## Anti-Patterns to Avoid

| Anti-Pattern                                   | Preferred                                                 | Why                                                                     |
| ---------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| API route for form submission                  | Form actions with `use:enhance`                           | Actions provide CSRF protection and progressive enhancement             |
| Importing `$env/static/private` in client code | Use `$env/static/public` with `PUBLIC_` prefix            | Private env must never reach the client                                 |
| `window.location.href` for navigation          | `goto()` from `$app/navigation`                           | Maintains SvelteKit client-side routing and state                       |
| `fetch()` with absolute URLs in load functions | Use the `fetch` provided by `load` context                | SvelteKit's fetch handles cookies, relative URLs, and server-side calls |
| Heavy logic in `+page.svelte` `<script>`       | Move to `load` function in `+page.ts` / `+page.server.ts` | Load runs before render, prevents flash of empty state                  |
| Serving sensitive assets from `static/`        | Serve through SvelteKit routes with proper headers        | `static/` bypasses the `handle` hook; no header control                 |
| No CSP headers                                 | Configure `kit.csp` in `svelte.config.js`                 | CSP prevents XSS and injection attacks                                  |
| Catching errors with try/catch in load         | Use `error()` from `@sveltejs/kit`                        | Integrates with SvelteKit error pages and status codes                  |
| `onMount` for data fetching                    | `load` functions                                          | Load runs on server and client, enables SSR and streaming               |
| Layout data in page load                       | `+layout.server.ts` / `+layout.ts`                        | Shared data should load once in the layout, not per page                |

---

## References

- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [SvelteKit Routing](https://svelte.dev/docs/kit/routing)
- [SvelteKit Hooks](https://svelte.dev/docs/kit/hooks)
- [SvelteKit Configuration](https://svelte.dev/docs/kit/configuration)
- [SvelteKit CSP](https://svelte.dev/docs/kit/configuration#csp)
