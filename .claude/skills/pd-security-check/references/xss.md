# Cross-site scripting (XSS)

XSS attacks inject malicious scripts into web pages viewed by other users. The attacker's script executes in the victim's browser with full access to cookies, session tokens, and the DOM — enabling session hijacking, credential theft, and defacement.

## OWASP mapping

A03:2025 Injection (XSS is classified under injection in OWASP 2025)

## Vulnerable patterns

### Reflected XSS

```python
# UNSAFE: User input rendered without escaping in Django
from django.utils.safestring import mark_safe
def search(request):
    query = request.GET.get("q", "")
    return HttpResponse(mark_safe(f"<p>Results for: {query}</p>"))
```

### Stored XSS

```python
# UNSAFE: Database content rendered without escaping in Django template
# template.html: {{ comment.body|safe }}
# If comment.body contains <script>alert('xss')</script>, it executes
```

### DOM-based XSS

```javascript
// UNSAFE: User input inserted into DOM
document.getElementById('output').innerHTML = location.hash.slice(1);
document.write(decodeURIComponent(window.location.search));

// UNSAFE: React with dangerouslySetInnerHTML
function Comment({ body }) {
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
```

```svelte
<!-- UNSAFE: Svelte raw HTML rendering -->
{@html userProvidedContent}
```

## Safe patterns

### Escaped output (default in most frameworks)

```python
# SAFE: Django auto-escaping (default behavior)
# template.html: {{ comment.body }}
# <script> tags are escaped to &lt;script&gt;
```

```javascript
// SAFE: React auto-escaping (default behavior)
function Comment({ body }) {
  return <div>{body}</div>; // Escaped automatically
}

// SAFE: textContent instead of innerHTML
document.getElementById('output').textContent = userInput;
```

```svelte
<!-- SAFE: Svelte auto-escaping (default behavior) -->
{userProvidedContent}
```

### Sanitized HTML (when rich content is needed)

```python
# SAFE: Sanitize before marking safe
import bleach
clean_html = bleach.clean(user_html, tags=["b", "i", "a"], attributes={"a": ["href"]})
return mark_safe(clean_html)
```

```javascript
// SAFE: DOMPurify sanitization
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userHtml);

// SAFE: React with sanitization
function Comment({ body }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }} />;
}
```

### Content Security Policy

```python
# Django CSP header via middleware or SecurityMiddleware
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)  # No 'unsafe-inline' or 'unsafe-eval'
```

## Detection patterns

| Pattern                   | What it finds                               |
| ------------------------- | ------------------------------------------- |
| `\|safe`                  | Django safe filter (bypasses auto-escaping) |
| `mark_safe\(`             | Django mark_safe (bypasses auto-escaping)   |
| `dangerouslySetInnerHTML` | React raw HTML rendering                    |
| `\{@html\b`               | Svelte raw HTML rendering                   |
| `\.innerHTML\s*=`         | Direct DOM HTML insertion                   |
| `\.outerHTML\s*=`         | Direct DOM HTML replacement                 |
| `document\.write\(`       | Document write (legacy XSS vector)          |
| `href.*javascript:`       | JavaScript protocol in links                |

## Framework protections

- **Django**: Auto-escapes all template variables by default. Only `|safe` filter and `mark_safe()` bypass this.
- **React**: JSX auto-escapes all interpolated values. Only `dangerouslySetInnerHTML` bypasses this.
- **Svelte**: Auto-escapes all `{expression}` values. Only `{@html expression}` bypasses this.
- **Vue**: Auto-escapes `{{ }}` interpolation. Only `v-html` directive bypasses this.

## False positive guidance

- `|safe` or `mark_safe()` on static strings or pre-sanitized content (e.g., after bleach.clean) — safe.
- `dangerouslySetInnerHTML` with DOMPurify-sanitized content — safe.
- `{@html}` with trusted, server-generated static HTML — likely safe but verify.
- `innerHTML` assignment from a hardcoded string constant — safe.
- Template variables from server configuration (not user input) — safe.

## Testing checklist

1. Can user input reach a `|safe`, `mark_safe()`, or `dangerouslySetInnerHTML` without sanitization?
2. Is `{@html}` used with any content that originates from user input or a database?
3. Are URL parameters, form inputs, or database values rendered in HTML without framework auto-escaping?
4. Is a Content Security Policy configured to block inline scripts?
5. Are `javascript:` protocol URLs possible in user-controlled `href` attributes?
