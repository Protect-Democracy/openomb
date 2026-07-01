# Security detection patterns

Regex patterns for deterministic security checks. Organized by category. Each pattern includes the regex, what it detects, and the expected false-positive rate.

These patterns are designed to be extractable into a standalone pre-commit hook in the future.

## Secrets

High-confidence patterns for hardcoded secrets. Use case-insensitive matching where noted.

| Pattern                                                                         | Detects                                      | False positive rate | Notes                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------- | ------------------- | --------------------------------------------------- |
| `(?i)(api[_-]?key\|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]`                | Hardcoded API keys                           | Medium              | Exclude test files with fake keys                   |
| `(?i)(secret\|password\|passwd\|pwd)\s*[:=]\s*['"][^'"]{8,}['"]`                | Hardcoded passwords/secrets                  | Medium              | Exclude empty strings, placeholders like `changeme` |
| `(?i)(access[_-]?token\|auth[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}['"]` | Hardcoded access tokens                      | Low                 |                                                     |
| `-----BEGIN (RSA\|EC\|DSA\|OPENSSH)? ?PRIVATE KEY-----`                         | Embedded private keys                        | Very low            | Almost always a real issue                          |
| `(?i)(aws[_-]?access[_-]?key[_-]?id)\s*[:=]\s*['"]?AKIA[A-Z0-9]{16}['"]?`       | AWS access key IDs                           | Very low            | AKIA prefix is definitive                           |
| `(?i)(aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?` | AWS secret keys                              | Low                 |                                                     |
| `ghp_[A-Za-z0-9_]{36}`                                                          | GitHub personal access tokens                | Very low            | Prefix is definitive                                |
| `gho_[A-Za-z0-9_]{36}`                                                          | GitHub OAuth tokens                          | Very low            | Prefix is definitive                                |
| `(?i)postgres(ql)?://[^:]+:[^@]+@`                                              | Database connection strings with credentials | Low                 |                                                     |
| `(?i)mysql://[^:]+:[^@]+@`                                                      | MySQL connection strings with credentials    | Low                 |                                                     |
| `(?i)mongodb(\+srv)?://[^:]+:[^@]+@`                                            | MongoDB connection strings with credentials  | Low                 |                                                     |

## Dangerous functions

Patterns for function calls that are frequently associated with vulnerabilities.

| Pattern                                                   | Language   | Risk                     | Notes                                             |
| --------------------------------------------------------- | ---------- | ------------------------ | ------------------------------------------------- |
| `\beval\s*\(`                                             | Python, JS | Code injection           | Safe if input is not user-controlled              |
| `\bexec\s*\(`                                             | Python     | Code injection           | Check if string is user-controlled                |
| `\bpickle\.(loads?\|Unpickler)\s*\(`                      | Python     | Deserialization RCE      | Almost always dangerous with untrusted input      |
| `\byaml\.(unsafe_)?load\s*\(`                             | Python     | Deserialization          | Safe only with `yaml.safe_load()`                 |
| `\bsubprocess\.(call\|run\|Popen)\s*\(.*shell\s*=\s*True` | Python     | Command injection        | Check if args include user input                  |
| `\bos\.system\s*\(`                                       | Python     | Command injection        | Prefer `subprocess` with `shell=False`            |
| `\bos\.popen\s*\(`                                        | Python     | Command injection        | Prefer `subprocess` with `shell=False`            |
| `\b__import__\s*\(`                                       | Python     | Dynamic import injection | Check if module name is user-controlled           |
| `\bcompile\s*\(.*\bexec\b`                                | Python     | Code injection           | Dynamic code compilation                          |
| `dangerouslySetInnerHTML`                                 | React/JS   | XSS                      | Check if content is sanitized                     |
| `\.innerHTML\s*=`                                         | JS         | XSS                      | Check if content is sanitized                     |
| `\.outerHTML\s*=`                                         | JS         | XSS                      | Check if content is sanitized                     |
| `document\.write\s*\(`                                    | JS         | XSS                      | Check if content is sanitized                     |
| `\bnew\s+Function\s*\(`                                   | JS         | Code injection           | Dynamic function creation                         |
| `\bchild_process\b.*\bexec\b`                             | Node.js    | Command injection        | Check if args include user input                  |
| `\b(marked\|markdown)\s*\(`                               | JS         | XSS                      | Check if output is sanitized or CSP is set        |
| `\{@html\b`                                               | Svelte     | XSS                      | Raw HTML rendering, check if content is sanitized |

## Insecure defaults

Patterns for configuration values that indicate insecure defaults.

| Pattern                                               | Detects                        | Notes                                       |
| ----------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| `(?i)DEBUG\s*[:=]\s*(True\|1\|"true"\|'true')`        | Debug mode enabled             | Only flag in non-test, non-dev config files |
| `(?i)ALLOWED_HOSTS\s*[:=]\s*\[?\s*['"]?\*['"]?\s*\]?` | Wildcard allowed hosts         | Django-specific                             |
| `(?i)Access-Control-Allow-Origin['":\s]+\*`           | Wildcard CORS                  | Check if the endpoint serves sensitive data |
| `(?i)SECURE_SSL_REDIRECT\s*[:=]\s*(False\|0)`         | SSL redirect disabled          | Django-specific                             |
| `(?i)SESSION_COOKIE_SECURE\s*[:=]\s*(False\|0)`       | Insecure session cookies       | Django-specific                             |
| `(?i)CSRF_COOKIE_SECURE\s*[:=]\s*(False\|0)`          | Insecure CSRF cookies          | Django-specific                             |
| `(?i)verify\s*[:=]\s*(False\|0)`                      | SSL verification disabled      | In requests/HTTP client calls               |
| `(?i)NODE_TLS_REJECT_UNAUTHORIZED\s*[:=]\s*['"]?0`    | Node TLS verification disabled |                                             |
| `(?i)helmet\(\s*\)`                                   | Default Helmet config          | May need customization for security headers |
