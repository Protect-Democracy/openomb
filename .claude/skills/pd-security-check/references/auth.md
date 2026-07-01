# Authentication and authorization

Authentication verifies who a user is; authorization determines what they can do. Flaws in either allow attackers to access other users' accounts, escalate privileges, or bypass access controls entirely.

## OWASP mapping

- A01:2025 Broken Access Control
- A07:2025 Identification and Authentication Failures

## Vulnerable patterns

### Weak password storage

```python
# UNSAFE: Plaintext or weak hashing
password_hash = hashlib.md5(password.encode()).hexdigest()
password_hash = hashlib.sha1(password.encode()).hexdigest()
db.execute("INSERT INTO users (password) VALUES (%s)", (password,))  # Plaintext
```

### IDOR (Insecure Direct Object Reference)

```python
# UNSAFE: No ownership check — any authenticated user can access any record
@app.route("/api/documents/<int:doc_id>")
@login_required
def get_document(doc_id):
    return Document.objects.get(id=doc_id)  # Missing: .filter(owner=request.user)
```

```javascript
// UNSAFE: Direct access without authorization check
app.get("/api/invoices/:id", authenticate, (req, res) => {
  const invoice = await Invoice.findById(req.params.id);  // No ownership check
  res.json(invoice);
});
```

### JWT vulnerabilities

```python
# UNSAFE: No algorithm verification
payload = jwt.decode(token, options={"verify_signature": False})

# UNSAFE: Accepting "none" algorithm
payload = jwt.decode(token, key, algorithms=["HS256", "none"])
```

### Missing access control

```python
# UNSAFE: Admin endpoint without permission check
@app.route("/admin/delete-user/<int:user_id>", methods=["POST"])
@login_required  # Only checks authentication, not authorization
def delete_user(user_id):
    User.objects.get(id=user_id).delete()
```

## Safe patterns

### Strong password hashing

```python
# SAFE: Django's built-in password hashing (PBKDF2 by default, supports argon2)
from django.contrib.auth.hashers import make_password, check_password
hashed = make_password(raw_password)
is_valid = check_password(raw_password, hashed)

# SAFE: bcrypt directly
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
```

```javascript
// SAFE: bcrypt in Node
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
```

### Authorization checks

```python
# SAFE: Ownership check on every access
@app.route("/api/documents/<int:doc_id>")
@login_required
def get_document(doc_id):
    doc = Document.objects.get(id=doc_id, owner=request.user)  # Ownership filter
    return doc

# SAFE: Django REST Framework permissions
class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwner]
    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)
```

### Secure JWT handling

```python
# SAFE: Explicit algorithm, full verification
payload = jwt.decode(token, public_key, algorithms=["RS256"],
                     audience="my-app", issuer="auth.example.com")
```

## Detection patterns

| Pattern                                          | What it finds                       |
| ------------------------------------------------ | ----------------------------------- |
| `hashlib\.(md5\|sha1)\(`                         | Weak password hashing               |
| `verify_signature.*False`                        | JWT signature verification disabled |
| `algorithms.*none`                               | JWT accepting "none" algorithm      |
| `@csrf_exempt`                                   | CSRF protection disabled            |
| `\.get\(id=.*\)` without owner filter            | Potential IDOR (needs context)      |
| `@login_required` without `@permission_required` | Auth without authorization          |

## Framework protections

- **Django**: `contrib.auth` handles password hashing, session management, and CSRF. `@permission_required` and `@user_passes_test` decorators for authorization.
- **Django REST Framework**: `permission_classes` on viewsets, `IsAuthenticated`, `IsAdminUser`, custom permission classes.
- **Express/Passport.js**: Authentication strategies (local, OAuth, JWT). Authorization via middleware chains.
- **FastAPI**: `Depends()` for dependency injection of auth checks on every endpoint.

## False positive guidance

- Internal admin tools behind VPN or IP allowlist — lower risk but still review.
- Machine-to-machine authentication with API keys — valid pattern, different threat model.
- Test user creation in test files — not a vulnerability.
- `@login_required` on endpoints that genuinely don't need authorization (e.g., user's own profile).
- Session configuration in development settings — only flag in production config.

## Testing checklist

1. Are passwords stored with bcrypt, argon2, or scrypt (not MD5/SHA1/plaintext)?
2. Do all data-access endpoints verify the requesting user owns or has permission to access the resource?
3. Are JWT tokens verified with an explicit algorithm list (no "none")?
4. Is there authorization (not just authentication) on sensitive endpoints?
5. Are sessions regenerated after login to prevent session fixation?
6. Is MFA verification enforced as a required step (not bypassable by skipping to the next endpoint)?
