# Deterministic security checks

Automated checks that produce objective PASS/FAIL results. Run these before analytical review. Report results in the "Deterministic Check Results" section of the output.

These checks are designed to be extractable into a standalone pre-commit hook in the future.

## Check 1: Secret pattern scan

Scan changed files for hardcoded secrets using the patterns in `deterministic/patterns.md`.

1. Read `deterministic/patterns.md` and collect all patterns from the **Secrets** section.
2. For each changed file (from the scope determined in Step 1 of the main process), run `Grep` with each pattern.
3. Exclude matches inside comments, test fixtures with obviously fake values (e.g., `test_key`, `xxx`, `dummy`, `example`), and documentation files.
4. **PASS** if no matches found. **FAIL** if any real secrets detected — list each file, line number, and the pattern that matched.

## Check 2: Sensitive file coverage in .gitignore

Verify that `.gitignore` includes patterns for sensitive files.

1. Read the project's `.gitignore` file (and any nested `.gitignore` files in changed directories).
2. Confirm these patterns are present (or equivalent):
   - `.env` / `.env.*` — environment variable files
   - `*.pem`, `*.key` — private keys
   - `*.p12`, `*.pfx` — certificate bundles
   - `credentials.json`, `service-account*.json` — cloud credentials
   - `*.sqlite`, `*.db` — local databases (if applicable)
3. **PASS** if all critical patterns are covered. **FAIL** if any are missing — list the missing patterns.

## Check 3: Dependency audit

Run dependency vulnerability scanners if dependency files changed.

1. If `pyproject.toml`, `uv.lock`, or `requirements*.txt` changed:
   - Run: `uv audit` (if `uv` is available in the project)
   - If `uv` is not available, note that the check was skipped and why.
2. If `package.json` or lockfiles changed:
   - Run: `npm audit --json` (if `npm` is available)
   - If `npm` is not available, note that the check was skipped and why.
3. If no dependency files changed, report: `[PASS] Dependency audit (no dependency files changed)`.
4. **PASS** if no vulnerabilities found or no dependency files changed. **FAIL** if vulnerabilities found — summarize by severity (critical/high/medium/low count).

## Check 4: Dangerous function usage scan

Scan changed files for dangerous function calls using the patterns in `deterministic/patterns.md`.

1. Read `deterministic/patterns.md` and collect all patterns from the **Dangerous functions** section.
2. For each changed file, run `Grep` with each pattern.
3. Exclude matches in:
   - Test files that are intentionally testing dangerous behavior.
   - Comments explaining why the usage is safe.
   - Wrapper functions that add safety checks (e.g., a `safe_eval()` that validates input).
4. **PASS** if no unmitigated dangerous function usage found. **FAIL** if any detected — list each file, line number, the function, and the risk.

Note: A FAIL on dangerous function usage does not automatically mean there is a vulnerability. It means the analytical review (Step 4 of the main process) should pay special attention to these locations.
