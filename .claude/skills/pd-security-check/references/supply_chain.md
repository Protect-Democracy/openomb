# Supply chain security

Supply chain attacks target the dependencies, build tools, and distribution channels your application relies on. A single compromised package can introduce backdoors, credential theft, or cryptomining into your application — and every downstream project that depends on it.

## OWASP mapping

A06:2025 Vulnerable and Outdated Components

## Vulnerable patterns

### Missing lockfiles

```toml
# UNSAFE: pyproject.toml without a committed uv.lock
# Floating versions resolve differently each install
[project]
dependencies = [
    "django>=4.0",
    "requests",
]
```

```json
// UNSAFE: package.json without committed lockfile
{
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "~4.17.0"
  }
}
```

### No dependency auditing

```yaml
# UNSAFE: CI pipeline without dependency audit step
# Vulnerabilities in dependencies go undetected
jobs:
  test:
    steps:
      - run: uv sync
      - run: uv run pytest
      # Missing: uv audit
```

### Unpinned GitHub Actions

```yaml
# UNSAFE: Actions pinned to mutable tags
- uses: actions/checkout@v4 # Tag can be moved to point to different code
- uses: actions/setup-python@latest # Always changes
```

## Safe patterns

### Locked and audited dependencies

```toml
# SAFE: pyproject.toml with committed uv.lock
# uv.lock pins exact versions with hashes
[project]
dependencies = [
    "django>=4.2,<5.0",
    "requests>=2.31.0",
]
```

```yaml
# SAFE: CI with dependency auditing
jobs:
  test:
    steps:
      - run: uv sync
      - run: uv audit # Check for known CVEs
      - run: uv run pytest
```

```yaml
# SAFE: GitHub Actions pinned to SHA with version comment
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

See the `pd-github-action-version` skill for managing GitHub Action SHA pins.

### Dependency review practices

- Review new dependencies before adding: check maintainer reputation, download counts, last update date.
- Prefer well-established packages with active maintenance over new or unmaintained alternatives.
- Don't add packages for trivial functionality that can be implemented in a few lines.

## Detection patterns

| Pattern                                      | What it finds                  |
| -------------------------------------------- | ------------------------------ |
| `\^[0-9]\|~[0-9]` in package.json            | Floating version ranges        |
| `>=.*` without upper bound in pyproject.toml | Unbounded version ranges       |
| `uses:.*@v[0-9]` in workflow files           | Actions pinned to mutable tags |
| `uses:.*@latest` in workflow files           | Actions pinned to "latest"     |
| `uses:.*@main\|@master` in workflow files    | Actions pinned to branch       |

## Framework protections

- **uv**: `uv.lock` pins exact versions with content hashes. `uv audit` checks against the Python Advisory Database.
- **npm**: `package-lock.json` pins exact versions with integrity hashes. `npm audit` checks against the npm security advisory database.
- **GitHub**: Dependabot creates PRs for vulnerable dependencies. Code scanning with CodeQL finds security issues.

## False positive guidance

- Development-only dependencies with looser version ranges — acceptable (they don't ship to production).
- Pre-release versions in development branches — acceptable for testing.
- Floating versions in `pyproject.toml` alongside a committed lockfile — the lockfile provides the actual pinning.
- GitHub Actions using `actions/` official actions with tag pins — lower risk than third-party actions, but SHA pinning is still recommended.

## Testing checklist

1. Is a lockfile (`uv.lock`, `package-lock.json`) present and committed?
2. Does CI run `uv audit` or `npm audit` to catch known vulnerabilities?
3. Are GitHub Actions pinned to SHA with version comments (not mutable tags)?
4. Are new dependencies reviewed for necessity, maintenance status, and security reputation?
5. Are there any packages that could be replaced with a few lines of code?
