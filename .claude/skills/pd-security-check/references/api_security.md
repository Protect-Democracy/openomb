# API security

APIs are the primary attack surface for modern applications. Flaws in authentication, authorization, input validation, and data filtering allow attackers to access unauthorized data, abuse business logic, and overwhelm services.

## OWASP mapping

- A01:2025 Broken Access Control
- A03:2025 Injection

## Vulnerable patterns

### Missing authentication on endpoints

```python
# UNSAFE: No authentication on sensitive endpoint
@app.route("/api/users", methods=["GET"])
def list_users():
    return jsonify([u.to_dict() for u in User.objects.all()])
```

```javascript
// UNSAFE: Express route without auth middleware
app.get('/api/admin/settings', (req, res) => {
  res.json(getSettings());
});
```

### Mass assignment

```python
# UNSAFE: Accepting all fields from request — user can set is_admin, is_staff, etc.
@app.route("/api/profile", methods=["PUT"])
@login_required
def update_profile():
    user = request.user
    for key, value in request.json.items():
        setattr(user, key, value)  # Sets ANY field including is_admin
    user.save()
```

```javascript
// UNSAFE: Spreading user input directly into update
app.put('/api/profile', auth, async (req, res) => {
  await User.update({ ...req.body }, { where: { id: req.user.id } });
});
```

### GraphQL over-fetching and abuse

```graphql
# UNSAFE: No query depth limiting — enables DoS via nested queries
query {
  user(id: 1) {
    friends {
      friends {
        friends {
          friends {
            friends {
              name
            }
          }
        }
      }
    }
  }
}
```

### Missing rate limiting

```python
# UNSAFE: Login endpoint without rate limiting — enables brute force
@app.route("/api/login", methods=["POST"])
def login():
    user = authenticate(request.json["username"], request.json["password"])
```

## Safe patterns

### Authenticated and authorized endpoints

```python
# SAFE: Django REST Framework with permissions
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer
```

```javascript
// SAFE: Express with auth middleware chain
app.get('/api/admin/settings', authenticate, requireAdmin, (req, res) => {
  res.json(getSettings());
});
```

### Explicit field allowlists

```python
# SAFE: DRF serializer with explicit fields
class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email"]  # Only these can be updated
```

```javascript
// SAFE: Destructure only allowed fields
app.put('/api/profile', auth, async (req, res) => {
  const { firstName, lastName, email } = req.body;
  await User.update({ firstName, lastName, email }, { where: { id: req.user.id } });
});
```

### GraphQL protections

```javascript
// SAFE: Query depth and complexity limiting
const depthLimit = require('graphql-depth-limit');
const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(5)],
  introspection: process.env.NODE_ENV !== 'production'
});
```

## Detection patterns

| Pattern                                      | What it finds                       |
| -------------------------------------------- | ----------------------------------- |
| `setattr.*request`                           | Mass assignment via setattr         |
| `\.update\(.*req\.body\|request\.json`       | Mass assignment via spread/update   |
| `ModelSerializer` without explicit `fields`  | Unrestricted serializer fields      |
| `introspection.*true\|introspection` missing | GraphQL introspection in production |
| Route without auth decorator/middleware      | Missing authentication              |

## Framework protections

- **Django REST Framework**: Serializers enforce field allowlists. `permission_classes` on viewsets. Throttling classes for rate limiting.
- **FastAPI**: `Depends()` for auth injection. Pydantic models for input validation. `response_model` for output filtering.
- **Express**: Middleware chains for auth. `express-rate-limit` for throttling. Input validation via Zod, Joi, or express-validator.

## False positive guidance

- Public read-only endpoints (e.g., health check, public content) — auth may not be needed.
- Internal admin APIs behind VPN or IP allowlist — different threat model.
- GraphQL in development mode with introspection enabled — acceptable for dev.
- Rate limiting handled at infrastructure level (reverse proxy, CDN) — may not appear in application code.

## Testing checklist

1. Do all endpoints that access user data require authentication?
2. Do endpoints that modify data use explicit field allowlists (not spread/setattr)?
3. Is GraphQL query depth limited and introspection disabled in production?
4. Are login/auth endpoints rate-limited to prevent brute force?
5. Do API responses filter sensitive fields (use serializers or response models)?
