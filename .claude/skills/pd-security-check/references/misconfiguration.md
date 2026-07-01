# Security misconfiguration

Security misconfiguration is the most common vulnerability category — it includes missing security headers, debug mode in production, default credentials, overly permissive CORS, and information disclosure through verbose errors or exposed internal endpoints.

## OWASP mapping

A05:2025 Security Misconfiguration

## Vulnerable patterns

### Missing or weak security headers

```python
# UNSAFE: No security headers configured
# Django without SecurityMiddleware, or with it disabled
MIDDLEWARE = [
    # 'django.middleware.security.SecurityMiddleware',  # Commented out
    'django.middleware.common.CommonMiddleware',
]
```

```javascript
// UNSAFE: Express without security headers
const app = express();
// No helmet() — missing CSP, HSTS, X-Content-Type-Options, etc.
```

### CORS misconfiguration

```python
# UNSAFE: Wildcard CORS with credentials
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True  # Wildcard + credentials = browsers block, but misconfigured

# UNSAFE: Reflecting Origin header without validation
CORS_ALLOWED_ORIGIN_REGEXES = [r".*"]  # Matches any origin
```

```javascript
// UNSAFE: Wildcard CORS
app.use(cors({ origin: '*', credentials: true }));

// UNSAFE: Reflecting request origin
app.use(cors({ origin: true })); // Reflects any origin
```

### Debug mode in production

```python
# UNSAFE: Django debug mode exposes settings, SQL queries, stack traces
DEBUG = True
ALLOWED_HOSTS = ["*"]

# UNSAFE: Flask debug mode enables interactive debugger (RCE)
app.run(debug=True, host="0.0.0.0")
```

```javascript
// UNSAFE: Node in development mode in production
// NODE_ENV=development — enables verbose errors, stack traces
```

### Default credentials and secrets

```python
# UNSAFE: Django's default secret key (from startproject template)
SECRET_KEY = "django-insecure-change-me-to-a-real-secret-key"

# UNSAFE: Default database credentials
DATABASES = {
    "default": {
        "PASSWORD": "postgres",  # Default password
    }
}
```

### Information disclosure

```python
# UNSAFE: Server version headers exposed
# Default Apache/Nginx configs expose version numbers
# Django DEBUG=True exposes full settings page at error URLs
```

## Safe patterns

### Proper security headers

```python
# SAFE: Django SecurityMiddleware configuration
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
```

```javascript
// SAFE: Express with Helmet (customized)
const helmet = require('helmet');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"] // Only if needed
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
  })
);
```

```typescript
// SAFE: SvelteKit security headers via hooks
// src/hooks.server.ts
export async function handle({ event, resolve }) {
  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}
```

### Proper CORS configuration

```python
# SAFE: Explicit origin allowlist
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
    "https://admin.example.com",
]
CORS_ALLOW_CREDENTIALS = True  # OK with explicit origins
```

```javascript
// SAFE: Explicit origin allowlist
app.use(
  cors({
    origin: ['https://app.example.com', 'https://admin.example.com'],
    credentials: true
  })
);
```

### Environment-based configuration

```python
# SAFE: Debug off in production, configured via environment
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]  # Required, no default
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
```

## Detection patterns

| Pattern                              | What it finds                      |
| ------------------------------------ | ---------------------------------- |
| `DEBUG\s*=\s*True`                   | Debug mode enabled                 |
| `CORS_ALLOW_ALL_ORIGINS\s*=\s*True`  | Wildcard CORS                      |
| `ALLOWED_HOSTS.*\*`                  | Django wildcard allowed hosts      |
| `origin:\s*(true\|"\*")`             | Express wildcard CORS              |
| `django-insecure\|change-me`         | Default/placeholder secret key     |
| `SecurityMiddleware` commented out   | Security middleware disabled       |
| `debug\s*=\s*True.*host.*0\.0\.0\.0` | Flask debug mode on all interfaces |

## Framework protections

- **Django SecurityMiddleware**: Handles HSTS, SSL redirect, content type sniffing protection when configured.
- **Express Helmet**: Sets secure defaults for 11+ HTTP headers in one middleware call.
- **SvelteKit**: Server hooks (`hooks.server.ts`) allow setting response headers on all routes.
- **Django `check --deploy`**: Runs deployment checks that flag common misconfigurations.

## False positive guidance

- `DEBUG = True` in development-specific config files (not production) — expected.
- CORS wildcard on genuinely public, read-only APIs with no credentials — acceptable.
- Test/development settings with relaxed security — only flag if there's risk of these reaching production.
- `helmet()` with default config — the defaults are good, customization is optional.
- Missing HSTS on development/staging domains — only required for production.

## Testing checklist

1. Is `DEBUG = False` (or equivalent) enforced in production configuration?
2. Is CORS configured with an explicit origin allowlist (not wildcard)?
3. Are security headers set (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)?
4. Is the `SECRET_KEY` (or equivalent) a strong, unique value (not the default)?
5. Are default passwords changed for all services (databases, admin interfaces)?
6. Does `django-admin check --deploy` (or equivalent) pass?
7. Are server version headers hidden in production?
