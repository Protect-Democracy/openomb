# Python security patterns

Language-specific security patterns for Python, covering Django, Flask, and FastAPI.

## Framework protections

### Django

- **Auto-escaping**: All template variables are HTML-escaped by default. Only `|safe` and `mark_safe()` bypass this.
- **ORM parameterization**: Queryset methods (`.filter()`, `.get()`, `.exclude()`) use parameterized queries automatically.
- **CSRF middleware**: `CsrfViewMiddleware` protects all POST/PUT/DELETE requests by default.
- **Clickjacking protection**: `XFrameOptionsMiddleware` sets `X-Frame-Options: DENY` by default.
- **Password hashing**: `make_password()` uses PBKDF2 by default, supports argon2 and bcrypt via `PASSWORD_HASHERS`.
- **SecurityMiddleware**: Handles HSTS, SSL redirect, and content type nosniff when configured.
- **Signed cookies**: `django.core.signing` uses HMAC to prevent session/cookie tampering.

### Flask

- **Jinja2 auto-escaping**: Enabled by default when using `render_template()`.
- **CSRF via Flask-WTF**: Not built-in — requires Flask-WTF extension.
- **Talisman**: Extension for security headers (CSP, HSTS, etc.).

### FastAPI

- **Pydantic validation**: Request models validate types, ranges, and patterns automatically.
- **OpenAPI schema**: Auto-generated documentation helps identify unprotected endpoints.
- **Dependency injection**: `Depends()` pattern for consistent auth/permission checks.

## Common pitfalls

### Django pitfalls

```python
# PITFALL: Bypassing auto-escaping
{{ user_input|safe }}                    # Template: renders raw HTML
mark_safe(f"<b>{user_input}</b>")        # Code: renders raw HTML

# PITFALL: Raw SQL bypassing ORM protection
User.objects.raw(f"SELECT * FROM auth_user WHERE email = '{email}'")
User.objects.extra(where=[f"name = '{name}'"])
RawSQL(f"price > {threshold}")

# PITFALL: CSRF exemption
@csrf_exempt  # Disables CSRF protection on this view
def webhook(request): ...

# PITFALL: Overly permissive config
DEBUG = True                    # Exposes settings, SQL, stack traces
ALLOWED_HOSTS = ["*"]          # Accepts requests for any domain
```

### Flask pitfalls

```python
# PITFALL: Server-side template injection
render_template_string(user_input)  # User controls the TEMPLATE, not just data

# PITFALL: Path traversal via send_file
@app.route("/download/<path:filename>")
def download(filename):
    return send_file(f"/uploads/{filename}")  # "../../../etc/passwd" works

# PITFALL: Debug mode in production (enables interactive debugger — RCE)
app.run(debug=True, host="0.0.0.0")
```

### FastAPI pitfalls

```python
# PITFALL: Raw SQL via SQLAlchemy text()
result = session.execute(text(f"SELECT * FROM users WHERE name = '{name}'"))

# PITFALL: Missing auth on endpoints
@app.get("/api/admin/users")
async def list_users():  # No Depends(get_current_user) — open to anyone
    return await User.all()

# PITFALL: Overly permissive CORS
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True)
```

## Safe/unsafe code pairs

### SQL queries

```python
# UNSAFE
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# SAFE
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
User.objects.filter(id=user_id)
```

### File operations

```python
# UNSAFE: User-controlled path
file_path = os.path.join("/uploads", user_filename)
# user_filename = "../../etc/passwd" escapes the directory

# SAFE: Validate the resolved path stays within the intended directory
import pathlib
base = pathlib.Path("/uploads").resolve()
target = (base / user_filename).resolve()
if not target.is_relative_to(base):
    raise ValueError("Path traversal detected")
```

### Subprocess calls

```python
# UNSAFE
subprocess.run(f"convert {filename} output.png", shell=True)

# SAFE
subprocess.run(["convert", filename, "output.png"], check=True)
```

### Password hashing

```python
# UNSAFE
password_hash = hashlib.md5(password.encode()).hexdigest()

# SAFE
from django.contrib.auth.hashers import make_password
password_hash = make_password(password)
```

### JWT handling

```python
# UNSAFE: No signature verification
payload = jwt.decode(token, options={"verify_signature": False})

# SAFE: Explicit algorithm and full verification
payload = jwt.decode(token, public_key, algorithms=["RS256"])
```

## Detection patterns

| Pattern                              | Risk                                            |
| ------------------------------------ | ----------------------------------------------- |
| `\.raw\(`                            | Raw SQL (check for parameterization)            |
| `\.extra\(`                          | Django extra() — deprecated, often unsafe       |
| `mark_safe\(`                        | Auto-escaping bypass                            |
| `\|safe`                             | Template auto-escaping bypass                   |
| `render_template_string\(`           | Server-side template injection                  |
| `shell\s*=\s*True`                   | Shell command injection risk                    |
| `@csrf_exempt`                       | CSRF protection disabled                        |
| `DEBUG\s*=\s*True`                   | Debug mode (check if production)                |
| `pickle\.loads?\(`                   | Deserialization RCE risk                        |
| `yaml\.load\(` (without `safe_load`) | YAML deserialization risk                       |
| `send_file\(`                        | Path traversal risk (check validation)          |
| `verify\s*=\s*False`                 | SSL verification disabled                       |
| `hashlib\.(md5\|sha1)\(`             | Weak hashing (check if security-related)        |
| `random\.(choice\|randint)\(`        | Insecure randomness (check if security-related) |
