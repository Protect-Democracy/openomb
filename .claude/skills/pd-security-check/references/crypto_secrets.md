# Cryptography and secrets management

Cryptographic failures occur when sensitive data is inadequately protected — through weak algorithms, hardcoded secrets, missing encryption, or improper key management. These flaws expose credentials, personal data, and communication channels to attackers.

## OWASP mapping

A02:2025 Cryptographic Failures

## Vulnerable patterns

### Hardcoded secrets

```python
# UNSAFE: Secrets directly in source code
API_KEY = "sk-prod-a1b2c3d4e5f6g7h8i9j0"
DATABASE_URL = "postgresql://admin:s3cretP@ss@db.example.com/prod"
JWT_SECRET = "my-super-secret-jwt-key"
```

```javascript
// UNSAFE: Secrets in source code
const API_KEY = 'sk-prod-a1b2c3d4e5f6g7h8i9j0';
const stripe = require('stripe')('sk_live_realkey123456');
```

See `deterministic/patterns.md` for automated detection patterns.

### Weak cryptographic algorithms

```python
# UNSAFE: MD5/SHA1 for security purposes (password hashing, token generation)
import hashlib
token = hashlib.md5(user_id.encode()).hexdigest()  # Predictable, fast to brute-force
signature = hashlib.sha1(data.encode()).hexdigest()  # Collision-prone

# UNSAFE: DES/RC4/ECB mode
from Crypto.Cipher import DES, AES
cipher = DES.new(key, DES.MODE_ECB)  # Weak algorithm + ECB mode
cipher = AES.new(key, AES.MODE_ECB)  # ECB mode leaks patterns
```

### Insecure randomness

```python
# UNSAFE: random module for security-sensitive values
import random
token = "".join(random.choices("abcdef0123456789", k=32))  # Predictable
session_id = random.randint(0, 999999)  # Guessable
```

### Disabled certificate validation

```python
# UNSAFE: SSL verification disabled
requests.get("https://api.example.com", verify=False)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

```javascript
// UNSAFE: TLS verification disabled globally
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

## Safe patterns

### Secrets from environment

```python
# SAFE: Secrets from environment variables or secrets manager
import os
API_KEY = os.environ["API_KEY"]
DATABASE_URL = os.environ["DATABASE_URL"]

# SAFE: Django settings pattern
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
```

```javascript
// SAFE: Environment variables
const API_KEY = process.env.API_KEY;

// SAFE: SvelteKit private env
import { API_KEY } from '$env/static/private';
```

### Strong cryptography

```python
# SAFE: SHA-256+ for signatures/integrity
import hashlib
digest = hashlib.sha256(data).hexdigest()

# SAFE: AES-GCM for encryption (authenticated encryption)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
```

### Cryptographic randomness

```python
# SAFE: secrets module for security-sensitive values
import secrets
token = secrets.token_hex(32)
api_key = secrets.token_urlsafe(32)
```

```javascript
// SAFE: crypto.randomBytes for security-sensitive values
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
```

## Detection patterns

| Pattern                               | What it finds                                     |
| ------------------------------------- | ------------------------------------------------- |
| `hashlib\.(md5\|sha1)\(`              | Weak hashing (check if used for security)         |
| `random\.(choice\|randint\|random)\(` | Insecure randomness (check if security-sensitive) |
| `verify\s*=\s*False`                  | SSL verification disabled                         |
| `NODE_TLS_REJECT_UNAUTHORIZED.*0`     | Node TLS verification disabled                    |
| `DES\|RC4\|ECB`                       | Weak crypto algorithms/modes                      |
| `-----BEGIN.*PRIVATE KEY`             | Embedded private keys                             |

## Framework protections

- **Django**: `SECRET_KEY` setting for cryptographic signing. `django.core.signing` for secure token generation. `get_random_string()` uses `secrets` module internally.
- **Node crypto**: `crypto.randomBytes()` and `crypto.randomUUID()` for secure random values.
- **SvelteKit**: `$env/static/private` prevents server-side secrets from leaking to client bundles.

## False positive guidance

- MD5/SHA1 for **non-security** purposes (file checksums, cache keys, content deduplication) — safe.
- `random` module for non-security uses (shuffling UI elements, test data generation) — safe.
- Test fixtures with obviously fake secrets (`test_key`, `dummy_token`, `xxx`) — not real secrets.
- Environment variable **references** (`os.environ["KEY"]`) — these are the safe pattern, not hardcoded.
- `verify=False` in test code connecting to local test servers — lower risk.

## Testing checklist

1. Are any secrets (API keys, passwords, tokens) hardcoded in source code?
2. Are MD5 or SHA1 used for any security purpose (password hashing, token generation, signatures)?
3. Is `random` (not `secrets`) used to generate tokens, session IDs, or other security values?
4. Is SSL certificate verification disabled in any production code path?
5. Are encryption keys stored in source code or configuration files (instead of environment/secrets manager)?
6. Is ECB mode used for any block cipher?
