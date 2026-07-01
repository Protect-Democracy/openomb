# JavaScript and TypeScript security patterns

Language-specific security patterns for JavaScript/TypeScript, covering React, Svelte, SvelteKit, Express, and Node.js.

## Framework protections

### React

- **JSX auto-escaping**: All interpolated values in JSX (`{variable}`) are escaped automatically. Script tags and HTML entities are rendered as text.
- **No `dangerouslySetInnerHTML` by default**: Raw HTML insertion requires explicit, intentionally-named prop.
- **Synthetic events**: React's event system prevents some DOM-based attack vectors.

### Svelte

- **Auto-escaping**: All `{expression}` values in templates are HTML-escaped by default.
- **Compiled output**: Svelte compiles to vanilla JS, reducing runtime attack surface.
- **Only `{@html}` bypasses escaping**: Explicit, easy-to-grep opt-out.

### SvelteKit

- **CSRF protection**: Form actions are protected against CSRF by default.
- **Server/client separation**: `+page.server.ts` code never reaches the client. `$env/static/private` prevents server secrets from leaking to client bundles.
- **Hooks**: `hooks.server.ts` for request-level security (headers, auth checks, rate limiting).

### Express/Node

- **Helmet**: Sets 11+ security headers in one middleware call (CSP, HSTS, X-Content-Type-Options, etc.).
- **express-rate-limit**: Rate limiting middleware for brute force protection.
- **Parameterized queries**: Prisma, Knex, and Sequelize parameterize queries automatically.
- **cors middleware**: Configurable CORS with origin allowlists.

## Common pitfalls

### React pitfalls

```javascript
// PITFALL: Raw HTML from user input
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// PITFALL: JavaScript protocol in user-controlled URLs
<a href={userProvidedUrl}>Click here</a>
// userProvidedUrl = "javascript:alert(document.cookie)"

// PITFALL: eval or Function with user data
const result = eval(userExpression);
const fn = new Function("return " + userInput);
```

### Svelte pitfalls

```svelte
<!-- PITFALL: Client-side-only validation (bypassed by direct API call) -->
<script>
  let amount = $state(0);
  function submit() {
    if (amount > 0) {
      // Only checked client-side
      fetch('/api/transfer', { method: 'POST', body: JSON.stringify({ amount }) });
    }
  }
</script>

<!-- PITFALL: Raw HTML from user/database content -->
{@html commentFromDatabase}
```

### SvelteKit pitfalls

```typescript
// PITFALL: Secrets in +page.ts (runs on client, visible in browser)
// src/routes/+page.ts
import { API_SECRET } from '$env/static/private'; // ERROR — won't build, but similar mistakes happen

// PITFALL: Missing validation in form actions
// src/routes/+page.server.ts
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    await db.insert(Object.fromEntries(data)); // Mass assignment — accepts any field
  }
};

// PITFALL: Open redirect
import { redirect } from '@sveltejs/kit';
export function load({ url }) {
  const next = url.searchParams.get('redirect');
  throw redirect(302, next); // Attacker: ?redirect=https://evil.com
}
```

### Node/Express pitfalls

```javascript
// PITFALL: Command injection via exec
const { exec } = require('child_process');
exec(`ffmpeg -i ${userFilename} output.mp4`);

// PITFALL: Prototype pollution
const config = Object.assign({}, userInput);
// userInput = { "__proto__": { "isAdmin": true } }

// PITFALL: Path traversal via sendFile
app.get('/files/:name', (req, res) => {
  res.sendFile(`/uploads/${req.params.name}`); // ../../../etc/passwd
});

// PITFALL: ReDoS with user-supplied patterns
const regex = new RegExp(userInput); // "(a+)+" with "aaaaaaaaaaaa!" = DoS
```

## Safe/unsafe code pairs

### DOM manipulation

```javascript
// UNSAFE: Raw HTML insertion
element.innerHTML = userInput;

// SAFE: Text content (auto-escaped)
element.textContent = userInput;

// SAFE: Sanitized HTML when rich content is needed
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### URL handling

```javascript
// UNSAFE: Open redirect from user input
res.redirect(req.query.next);

// SAFE: Allowlist validation
const ALLOWED_REDIRECTS = ['/dashboard', '/profile', '/settings'];
const next = req.query.next;
if (ALLOWED_REDIRECTS.includes(next)) {
  res.redirect(next);
} else {
  res.redirect('/dashboard');
}
```

### Subprocess execution

```javascript
// UNSAFE: exec with string interpolation
const { exec } = require('child_process');
exec(`convert ${filename} output.png`);

// SAFE: execFile with argument array
const { execFile } = require('child_process');
execFile('convert', [filename, 'output.png'], callback);
```

### Input validation

```svelte
<!-- UNSAFE: Client-side only -->
<script>
  function submit() {
    if (isValid(input)) fetch('/api/data', { body: input });
  }
</script>
```

```typescript
// SAFE: Server-side validation (SvelteKit form action)
import { z } from 'zod';
const schema = z.object({ amount: z.number().positive().max(10000) });

export const actions = {
  default: async ({ request }) => {
    const data = schema.parse(Object.fromEntries(await request.formData()));
    await processTransfer(data);
  }
};
```

### Cookie settings

```javascript
// UNSAFE: Insecure cookies
res.cookie('session', token);

// SAFE: Secure cookie settings
res.cookie('session', token, {
  httpOnly: true, // Not accessible via JavaScript
  secure: true, // HTTPS only
  sameSite: 'lax', // CSRF protection
  maxAge: 3600000 // 1 hour expiry
});
```

### Authentication middleware

```javascript
// UNSAFE: No auth on sensitive route
app.get("/api/admin/users", (req, res) => { ... });

// SAFE: Auth middleware chain
app.get("/api/admin/users", authenticate, requireAdmin, (req, res) => { ... });
```

## Detection patterns

| Pattern                              | Risk                                   |
| ------------------------------------ | -------------------------------------- |
| `dangerouslySetInnerHTML`            | React XSS bypass                       |
| `\{@html\b`                          | Svelte XSS bypass                      |
| `\.innerHTML\s*=`                    | DOM XSS                                |
| `document\.write\(`                  | Legacy XSS vector                      |
| `eval\(`                             | Code injection                         |
| `new Function\(`                     | Dynamic code execution                 |
| `child_process.*exec\(`              | Command injection (check for execFile) |
| `Object\.assign\(.*req\|\.\.\.req`   | Prototype pollution risk               |
| `res\.sendFile\(`                    | Path traversal (check validation)      |
| `window\.location\s*=`               | Open redirect from user input          |
| `\$env/static/private` in `+page.ts` | Server secrets in client code          |
| `new RegExp\(.*user\|input\|param`   | ReDoS risk                             |
