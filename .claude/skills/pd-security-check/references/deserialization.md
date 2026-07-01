# Insecure deserialization

Insecure deserialization occurs when applications deserialize data from untrusted sources using formats that can represent arbitrary objects. Attackers craft malicious serialized data that, when deserialized, executes arbitrary code, manipulates application logic, or causes denial of service.

## OWASP mapping

A08:2025 Software and Data Integrity Failures

## Vulnerable patterns

### Python pickle

```python
# UNSAFE: Deserializing untrusted pickle data — leads to RCE
import pickle
data = pickle.loads(request.body)  # Attacker controls request body
data = pickle.load(uploaded_file)  # Attacker controls uploaded file

# How the attack works — __reduce__ enables arbitrary code execution:
class Exploit:
    def __reduce__(self):
        return (os.system, ("rm -rf /",))
# pickle.dumps(Exploit()) creates payload that executes os.system on load
```

### Python YAML

```python
# UNSAFE: yaml.load() without SafeLoader
import yaml
config = yaml.load(user_input)  # Allows !!python/object constructor
config = yaml.load(uploaded_file.read())

# Attack payload:
# !!python/object/apply:os.system ["rm -rf /"]
```

### JSON with custom deserializers

```python
# UNSAFE: Custom object_hook that instantiates classes from user input
import json

def custom_hook(obj):
    if "__class__" in obj:
        cls = globals()[obj["__class__"]]  # Arbitrary class instantiation
        return cls(**obj["data"])
    return obj

data = json.loads(user_input, object_hook=custom_hook)
```

```javascript
// UNSAFE: JSON reviver that evaluates code
const data = JSON.parse(userInput, (key, value) => {
  if (key === 'fn') return eval(value); // Code execution from JSON
  return value;
});
```

## Safe patterns

### Use safe deserialization

```python
# SAFE: yaml.safe_load() — only allows basic types
import yaml
config = yaml.safe_load(config_string)

# SAFE: JSON without custom hooks — safe by default
import json
data = json.loads(user_input)  # Only produces dicts, lists, strings, numbers

# SAFE: If pickle is needed, use hmac to verify integrity
import hmac, hashlib, pickle

def safe_pickle_load(data, signature, secret_key):
    expected_sig = hmac.new(secret_key, data, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        raise ValueError("Invalid signature — data may be tampered")
    return pickle.loads(data)
```

### Alternative serialization formats

```python
# SAFE: Use JSON or MessagePack for data exchange
import json
data = json.loads(request.body)  # No code execution possible

import msgpack
data = msgpack.unpackb(request.body, raw=False)  # No code execution possible
```

## Detection patterns

| Pattern               | What it finds                                     |
| --------------------- | ------------------------------------------------- |
| `pickle\.loads?\(`    | Python pickle deserialization                     |
| `pickle\.Unpickler\(` | Python pickle Unpickler                           |
| `yaml\.load\(`        | YAML load (unsafe unless SafeLoader specified)    |
| `yaml\.unsafe_load\(` | YAML explicit unsafe load                         |
| `shelve\.open\(`      | Python shelve (uses pickle internally)            |
| `object_hook\s*=`     | JSON custom deserializer                          |
| `jsonpickle`          | jsonpickle library (combines JSON + pickle risks) |

## Framework protections

- **Django**: Signed cookies use `django.core.signing` which uses HMAC to prevent tampering. Session data is signed. The serializer defaults to JSON (not pickle) since Django 1.6.
- **JSON**: Standard `json.loads()` without custom hooks is safe — it only produces basic Python types.
- **Flask**: Session cookies are signed with `itsdangerous`, preventing deserialization attacks on session data.

## False positive guidance

- `pickle.loads()` with data from trusted internal sources (e.g., cached ML models from your own pipeline, inter-process communication on the same machine) — lower risk but document the trust assumption.
- `yaml.safe_load()` — safe, this is the correct usage.
- `yaml.load(data, Loader=yaml.SafeLoader)` — safe, explicit SafeLoader.
- `json.loads()` without `object_hook` — safe by default.
- Django session deserialization — safe (signed and uses JSON serializer by default).

## Testing checklist

1. Is `pickle.loads()` or `pickle.load()` called on data that originates from an external source (network, file upload, user input)?
2. Is `yaml.load()` called without explicitly specifying `Loader=yaml.SafeLoader`?
3. Does `json.loads()` use a custom `object_hook` that instantiates classes or calls functions based on the input?
4. Are any serialization libraries used that support arbitrary object types (jsonpickle, shelve, marshal)?
5. If pickle is used with trusted data, is the data source actually trusted? Is there HMAC verification?
