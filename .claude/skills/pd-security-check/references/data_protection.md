# Data protection

Data protection failures expose sensitive information through logs, error messages, API responses, or inadequate handling. Even when data is securely stored and transmitted, careless code can leak PII, credentials, and internal details to unintended recipients.

## OWASP mapping

- A02:2025 Cryptographic Failures (data exposure)
- A09:2025 Security Logging and Monitoring Failures

## Vulnerable patterns

### PII in logs

```python
# UNSAFE: Logging sensitive data
logger.info(f"User login: email={email}, password={password}")
logger.debug(f"Payment processed: card={card_number}, cvv={cvv}")
logger.error(f"Auth failed for token: {api_token}")
```

```javascript
// UNSAFE: Console logging sensitive data
console.log('User created:', { email, password, ssn });
console.log(`API response: ${JSON.stringify(fullUserObject)}`);
```

### Sensitive data in error messages

```python
# UNSAFE: Detailed errors exposed to users
@app.errorhandler(500)
def handle_error(e):
    return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

# UNSAFE: Database errors exposed
try:
    cursor.execute(query)
except Exception as e:
    return HttpResponse(f"Database error: {e}")  # Leaks DB structure, query, credentials
```

### API response over-fetching

```python
# UNSAFE: Returning full model object (includes password hash, internal fields)
@app.route("/api/users/<int:user_id>")
def get_user(user_id):
    user = User.objects.get(id=user_id)
    return jsonify(user.__dict__)  # Includes password_hash, is_superuser, internal IDs
```

```javascript
// UNSAFE: Returning full database row
app.get('/api/users/:id', async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(user.rows[0]); // Includes password_hash, internal fields
});
```

### Sensitive data in URLs

```python
# UNSAFE: Tokens and PII in query parameters (logged by proxies, browsers, analytics)
redirect(f"/reset-password?token={reset_token}")
url = f"/api/search?ssn={ssn}&name={name}"
```

## Safe patterns

### Scrubbed logging

```python
# SAFE: Log only non-sensitive identifiers
logger.info(f"User login: user_id={user.id}")
logger.info(f"Payment processed: last_four={card_number[-4:]}")

# SAFE: Django's sensitive_variables decorator
from django.views.decorators.debug import sensitive_variables

@sensitive_variables("password", "token")
def process_login(request, password, token):
    pass  # password and token are hidden in error reports
```

```javascript
// SAFE: Structured logging with field filtering
logger.info('User created', { userId: user.id, email: maskEmail(user.email) });
```

### Safe error handling

```python
# SAFE: Generic error message to users, detailed logs server-side
@app.errorhandler(500)
def handle_error(e):
    logger.exception("Internal server error")  # Full details in server logs
    return jsonify({"error": "An internal error occurred"}), 500
```

### Response filtering

```python
# SAFE: Django REST Framework serializer with explicit fields
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]  # Only expose these fields

# SAFE: FastAPI response model
class UserResponse(BaseModel):
    id: int
    username: str
    email: str

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    return db.get_user(user_id)  # Extra fields stripped by response_model
```

### Sensitive data in headers/body instead of URLs

```python
# SAFE: Token in header, not URL
# Authorization: Bearer <token>
# POST body for sensitive search params
```

## Detection patterns

| Pattern                                   | What it finds                    |
| ----------------------------------------- | -------------------------------- |
| `log.*password\|log.*token\|log.*secret`  | Sensitive data in log statements |
| `traceback\.format_exc\(\)` in response   | Stack traces exposed to users    |
| `__dict__\|model_to_dict` in API response | Full model serialization         |
| `SELECT \*` in API endpoints              | Potential over-fetching          |
| `jsonify.*str\(e\)`                       | Error details exposed to users   |

## Framework protections

- **Django**: `sensitive_variables` and `sensitive_post_parameters` decorators hide values in error reports. `DEBUG = False` disables detailed error pages.
- **Django REST Framework**: Serializers with explicit `fields` control exactly what is returned.
- **FastAPI**: `response_model` parameter strips extra fields from responses automatically.
- **Structured logging libraries** (structlog, python-json-logger): Support field filtering and redaction.

## False positive guidance

- Logging non-sensitive metadata (user IDs, timestamps, request paths) — safe.
- Detailed error messages in development mode only (`DEBUG = True`) — lower risk but verify it's not in production config.
- Anonymized or hashed PII in logs (e.g., hashed email for correlation) — safe.
- `SELECT *` in internal admin tools or management commands — lower risk.
- Error details in server-side logs (not exposed to users) — appropriate.

## Testing checklist

1. Are passwords, tokens, API keys, or PII included in any log statements?
2. Do error responses include stack traces, SQL queries, or internal paths?
3. Do API endpoints return full database objects or use explicit field selection?
4. Are sensitive values (tokens, PII) passed in URL query parameters?
5. Is `DEBUG = True` (or equivalent) possible in production configuration?
6. Are `sensitive_variables` or equivalent decorators used on functions handling credentials?
