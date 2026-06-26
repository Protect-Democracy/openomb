---
description: Environment variable naming, security, secrets management, and 1Password injection patterns.
paths:
  - '**/*.md'
  - '**/*.py'
  - '**/*.ts'
  - '**/*.sh'
  - '**/*.jinja'
  - '.*'
---

# Environment variables

Best practices for using and defining environment variables. Environment variables are the standard mechanism for managing secrets, semi-sensitive values, and environment-specific configuration.

## Security: never expose values

- Never print, log, echo, or include raw secret values in output, commits, code comments, or error messages.
- Reference variables by name only (e.g. `$PD_GEMINI_API_KEY`, `PD_GEMINI_API_KEY`).
- Only reveal actual values if the Developer explicitly asks.
- When displaying configuration for debugging, show the variable name and whether it is set, not the value:

```python
# Good — confirms the variable is set without exposing the value
if api_key:
    click.echo("PD_GEMINI_API_KEY is configured.")

# Bad — leaks the secret
click.echo(f"API key: {api_key}")
```

## No `.env` files

`.env` files store secrets in plain text on disk. Do not create, recommend, or rely on them. Both `.env` and `.envrc` are git-ignored as a safety net, but the convention is to never use them. Secrets are injected at runtime by the appropriate mechanism for each environment (see "Secrets injection by environment" below).

## Naming conventions

All environment variables use `SCREAMING_SNAKE_CASE`.

### Prefixes

- **Org-level** (`PD_`): Variables shared across projects or managed at the organizational level, for instance for Agent skills. Examples: `PD_GEMINI_API_KEY`.
- **Project-level** (`WEB_TEST_`): Variables specific to this project. Examples: `WEB_TEST_OP_ENVIRONMENT_ID`, `WEB_TEST_DATABASE_URL`, `WEB_TEST_LOG_LEVEL`.

## What belongs in environment variables

### Secrets

Values that must never appear in source code or logs. Always injected via secrets management.

- API keys and tokens
- Passwords and database credentials
- Signing keys and encryption keys

### Semi-sensitive values

Not catastrophic if leaked, but should be kept out of source to avoid exposing internal infrastructure.

- Internal service URLs and endpoints
- Organization-specific identifiers
- Internal hostnames

### Configuration

Values that change between environments (development, staging, production) but are not sensitive.

- Model names and versions
- Feature flags
- Log levels
- Port numbers and non-sensitive service addresses

## 1Password environment ID

The `WEB_TEST_OP_ENVIRONMENT_ID` variable is required for local development. It points to the project's 1Password Environment, which holds all secrets for this project. **This is not a secret** — it is an identifier, safe to export in a shell profile.

The Developer should find the environment ID in the 1Password app under **Developer > Environments**, then export it in their shell profile (e.g. `~/.zshrc`):

```sh
export WEB_TEST_OP_ENVIRONMENT_ID="<environment-id>"
```

If the Agent encounters an error from `op` about a missing or invalid environment ID, prompt the Developer to set this variable. Guide them to **Developer > Environments** in the 1Password app to find the correct ID.

See `docs/ENVIRONMENT.md` for full local development setup instructions.

## Secrets injection by environment

The code reads environment variables the same way everywhere — only the injection mechanism changes:

| Environment       | Mechanism                     | Example                                              |
| ----------------- | ----------------------------- | ---------------------------------------------------- |
| Local development | 1Password `op run`            | `uv run poe dev-env:agent:pd-generate-media`         |
| CI/CD             | GitHub Secrets and Variables  | Configured in repository settings and workflow files |
| Production        | Cloud-native secrets managers | AWS Secrets Manager, GCP Secret Manager, etc.        |

## Reading environment variables in code

### Required variables — validate at startup

Check all required environment variables when the application starts. Fail fast with a clear error message naming the missing variable:

```python
import os
import sys

import click


def _require_env(name: str) -> str:
    """Read a required environment variable or exit with an error."""
    value = os.environ.get(name)
    if not value:
        click.echo(f"Error: {name} environment variable is required.", err=True)
        sys.exit(1)
    return value


# At startup
api_key = _require_env("PD_GEMINI_API_KEY")
database_url = _require_env("WEB_TEST_DATABASE_URL")
```

### Optional variables with defaults

```python
import os

model = os.environ.get("PD_IMAGE_GENERATION_MODEL", "gemini-3.1-flash-image-preview")
log_level = os.environ.get("WEB_TEST_LOG_LEVEL", "INFO")
```

### Resolution priority

When a value can come from multiple sources, follow this precedence (highest first):

1. CLI flags (e.g. `--model`)
2. Environment variables (e.g. `PD_IMAGE_GENERATION_MODEL`)
3. Code defaults

```python
def _resolve_model(media_type: str, cli_override: str | None) -> str:
    if cli_override:
        return cli_override
    env_var = f"PD_{media_type.upper()}_GENERATION_MODEL"
    return os.environ.get(env_var, DEFAULT_MODELS[media_type])
```

## Child process inheritance

Environment variables propagate to all child processes. This is why `op run` is preferred over `export`:

- `op run` scopes secrets to a single process tree and masks them in stdout by default.
- `export` makes secrets available to every subsequent command in the shell session and all their children.

```sh
# Good — secrets exist only for this command's process tree
uv run poe dev-env:run -- uv run poe agent:pd-generate-media

# Bad — secrets persist in the shell for all subsequent commands
export PD_GEMINI_API_KEY="sk-..."
uv run poe agent:pd-generate-media
```

## Task convention

Tasks that require secrets should have a `dev:` prefixed counterpart that wraps them with `dev-env:run` for local development. The base task remains usable in CI/CD and production where secrets are injected by other means.

```toml
# Base task — no secrets, usable anywhere
"agent:pd-generate-media" = "uv run .claude/skills/pd-generate-media/scripts/generate_media.py"

# Dev task — wraps with 1Password secret injection for local development
"dev-env:agent:pd-generate-media" = "uv run poe dev-env:run -- uv run poe agent:pd-generate-media"
```

See `TASKS.md` for the full task naming conventions.

## Anti-patterns

| Anti-pattern                                      | Why it is wrong                                       | Correct approach                                     |
| ------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Hardcoding secrets in source                      | Secrets end up in git history permanently             | Use environment variables                            |
| Hardcoding internal URLs                          | Exposes infrastructure, breaks across environments    | Use environment variables                            |
| Printing secret values in logs or output          | Secrets leak to log aggregators, CI output, terminals | Log the variable name and whether it is set          |
| Creating `.env` files                             | Plain text secrets on disk                            | Use `op run` locally, secrets managers in production |
| Using `export` for secrets                        | Secrets persist in shell session for all processes    | Use `op run` to scope to a single process tree       |
| Committing secrets to git                         | Secrets in history even after removal                 | Use pre-commit scanning tools like `git-secrets`     |
| Silently using a default when a secret is missing | Hides misconfiguration, may cause subtle failures     | Validate at startup and fail fast                    |
