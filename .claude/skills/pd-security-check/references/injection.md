# Injection

Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query. The attacker's hostile data can trick the interpreter into executing unintended commands or accessing data without authorization.

## OWASP mapping

A03:2025 Injection

## Vulnerable patterns

### SQL injection

```python
# UNSAFE: String interpolation in SQL
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
cursor.execute("SELECT * FROM users WHERE name = '%s'" % name)

# UNSAFE: Django raw SQL with interpolation
User.objects.raw(f"SELECT * FROM auth_user WHERE email = '{email}'")
User.objects.extra(where=[f"name = '{name}'"])
```

```javascript
// UNSAFE: String interpolation in SQL
db.query(`SELECT * FROM users WHERE id = ${userId}`);
knex.raw(`SELECT * FROM users WHERE name = '${name}'`);
```

### Command injection

```python
# UNSAFE: Shell command with user input
os.system(f"convert {filename} output.png")
subprocess.call(f"grep {pattern} /var/log/app.log", shell=True)
subprocess.run(["bash", "-c", f"echo {user_input}"])
```

```javascript
// UNSAFE: Command execution with user input
const { exec } = require('child_process');
exec(`convert ${filename} output.png`);
```

### Template injection

```python
# UNSAFE: User input in template string
from jinja2 import Environment
env = Environment()
template = env.from_string(user_input)  # Server-side template injection
output = render_template_string(user_controlled_template)
```

### NoSQL injection

```python
# UNSAFE: Unvalidated query operators
db.users.find({"username": request.json["username"],
               "password": request.json["password"]})
# Attacker sends: {"password": {"$ne": ""}} to bypass auth
```

## Safe patterns

### SQL — parameterized queries

```python
# SAFE: Parameterized queries
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
User.objects.filter(email=email)  # Django ORM
User.objects.raw("SELECT * FROM auth_user WHERE email = %s", [email])

# SAFE: SQLAlchemy bound parameters
session.execute(text("SELECT * FROM users WHERE id = :id"), {"id": user_id})
```

```javascript
// SAFE: Parameterized queries
db.query('SELECT * FROM users WHERE id = $1', [userId]);
knex('users').where({ name: name }); // Query builder
prisma.user.findUnique({ where: { id: userId } }); // Prisma ORM
```

### Command — list arguments without shell

```python
# SAFE: List arguments, no shell
subprocess.run(["convert", filename, "output.png"], check=True)
subprocess.run(["grep", pattern, "/var/log/app.log"], check=True)
```

```javascript
// SAFE: execFile with argument array
const { execFile } = require('child_process');
execFile('convert', [filename, 'output.png'], callback);
```

### Template — data in context, not in template

```python
# SAFE: User data passed as context, not as template
render_template("page.html", name=user_input)
```

### NoSQL — explicit field validation

```python
# SAFE: Validate input is a string, not an operator
username = str(request.json.get("username", ""))
password = str(request.json.get("password", ""))
db.users.find_one({"username": username, "password": verify_hash(password)})
```

## Detection patterns

| Pattern                    | What it finds                       |
| -------------------------- | ----------------------------------- |
| `\.raw\(`                  | Django raw SQL queries              |
| `\.extra\(`                | Django extra() queries (deprecated) |
| `text\(`                   | SQLAlchemy raw text queries         |
| `shell\s*=\s*True`         | Subprocess with shell execution     |
| `os\.system\(`             | Direct OS command execution         |
| `os\.popen\(`              | OS command with pipe                |
| `render_template_string\(` | Jinja2 template from string         |
| `child_process.*exec\(`    | Node command execution              |
| `\.query\(.*\$\{`          | JS SQL with template literals       |

## Framework protections

- **Django ORM**: All queryset methods (`.filter()`, `.get()`, `.exclude()`) use parameterized queries automatically.
- **SQLAlchemy**: Bound parameters via `text()` with `:param` syntax are safe. Column operations are safe.
- **Prisma/Knex/Sequelize**: Query builders parameterize automatically. Only raw query methods are risky.
- **Jinja2**: `render_template()` passes data as context (safe). Only `render_template_string()` with user-controlled template is dangerous.

## False positive guidance

- ORM queryset operations (`.filter()`, `.get()`, `.exclude()`) — safe by default.
- `subprocess.run()` with a list argument and `shell=False` (the default) — safe.
- `.raw()` with a second parameter list — safe (parameterized).
- Template rendering with user data in context (not in the template string itself) — safe.
- SQL queries with only server-controlled values (hardcoded strings, config values) — safe.

## Testing checklist

1. Can user input reach the SQL query without parameterization?
2. Can user input reach a shell command with `shell=True`?
3. Can user input control the template string (not just template context)?
4. Are MongoDB queries accepting raw JSON from user input without type validation?
5. Are LDAP filters constructed with unescaped user input?
