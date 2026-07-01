---
name: pd-security-check
description: On-demand security review of code changes. Use when asked to "security check", "security review", "find vulnerabilities", "check for security issues", "audit security", or "OWASP review". Diff-aware, covers OWASP Top 10, supply chain, infrastructure, and agentic AI security with confidence-based reporting.
---

# Security check

On-demand security review of code changes. Combines diff-aware scoping, deterministic automated checks, and analytical review guided by modular reference material. Covers OWASP Top 10:2025, supply chain, infrastructure/config, and agentic AI security.

Informed by the methodologies of Anthropic's `/security-review`, Sentry's `security-review` skill, and the `claude-code-owasp` OWASP reference.

## When this skill activates

Manual only. The Developer invokes `pd-security-check` explicitly, or asks for a "security check", "security review", "vulnerability scan", or "audit".

## Process overview

1. **Determine scope** — what code to review (branch diff, staged changes, specific files).
2. **Classify changes and load references** — inspect the diff to decide which reference files and language guides are relevant.
3. **Run deterministic checks** — automated pattern scans that produce objective PASS/FAIL results.
4. **Analytical review** — for each relevant category, trace data flows, verify exploitability, assess confidence.
5. **Generate report** — structured output with findings, verification items, and summary.

## Step 1: Determine scope

Parse any arguments the Developer provided. Default to branch diff against `origin/main`.

| Argument                 | Git command                             |
| ------------------------ | --------------------------------------- |
| (none)                   | `git diff origin/main...HEAD`           |
| A file or directory path | `git diff origin/main...HEAD -- <path>` |
| `--staged`               | `git diff --cached`                     |
| `--last-commit`          | `git diff HEAD~1..HEAD`                 |
| `--commits=N`            | `git diff HEAD~N..HEAD`                 |

Run two commands:

1. `git diff <scope> --name-only` — get the list of changed files.
2. `git diff <scope>` — get the full diff content.

If no changes are found, inform the Developer and stop.

## Step 2: Classify changes and load references

Inspect the changed file list and diff content to determine which reference files to load from `references/` and `languages/`.

### Reference loading rules

| Changed files match                                             | Load these references                      | Language guide      |
| --------------------------------------------------------------- | ------------------------------------------ | ------------------- |
| `.py` files importing `django`, `flask`, `fastapi`, `starlette` | injection, xss, auth, api_security         | python.md           |
| `.py` files (any)                                               | injection, deserialization, crypto_secrets | python.md           |
| `.js`, `.ts`, `.svelte`, `.jsx`, `.tsx` files                   | xss, injection, auth, api_security         | javascript.md       |
| `pyproject.toml`, `uv.lock`, `requirements*.txt`                | supply_chain                               | (none)              |
| `package.json`, `package-lock.json`, `pnpm-lock.yaml`           | supply_chain                               | (none)              |
| `.github/workflows/**`, `.gitlab-ci.yml`, `Jenkinsfile`         | infrastructure                             | (none)              |
| `Dockerfile*`, `docker-compose*`, `compose.yml`                 | infrastructure, misconfiguration           | (none)              |
| `.env*`, `config.*`, `settings.*` (not `.py`)                   | crypto_secrets, misconfiguration           | (none)              |
| Files with auth-related imports/patterns in diff                | auth, crypto_secrets                       | (language-specific) |
| Files with AI/LLM-related imports in diff                       | agentic_ai                                 | (language-specific) |

**Always load** `data_protection` and `crypto_secrets` regardless of what changed. Secrets and PII exposure can appear anywhere.

**Lean towards over-covering.** If uncertain whether a reference is relevant, load it. The cost of reviewing an extra category is low; the cost of missing a vulnerability is high.

### How to load references

Use the `Read` tool to read each relevant file from the `references/` and `languages/` subdirectories relative to this skill's directory. For example, if injection and python are relevant:

- Read `references/injection.md`
- Read `languages/python.md`

## Step 3: Run deterministic checks

Before analytical review, run the automated checks defined in `deterministic/checks.md`. Read that file and follow its instructions exactly.

These checks produce objective PASS/FAIL results and are reported in the "Deterministic Check Results" section of the output.

## Step 4: Analytical review

For each loaded reference category, review the diff using this process:

### 4a. Research before flagging

For each potential issue spotted in the diff, investigate before reporting:

- Use `Read`, `Grep`, and `Glob` to trace data flow from user input to the potentially vulnerable operation.
- Check if the input is validated or sanitized upstream.
- Check if the framework provides built-in protection for this pattern.
- Check if the code path is reachable from an external entry point.

### 4b. Verify exploitability

Confirm the input is attacker-controlled. These are NOT attacker-controlled and should not be flagged as vulnerable inputs:

- Server configuration (Django `settings.*`, Flask `app.config[]`)
- Environment variables (`os.environ`, `process.env`)
- Config files read at startup
- Hardcoded constants and literals
- Values from authenticated internal services (unless reviewing auth itself)

Check for framework mitigations that neutralize the issue:

- Django auto-escaping in templates (unless `|safe` or `mark_safe()` is used)
- React JSX escaping (unless `dangerouslySetInnerHTML` is used)
- ORM parameterized queries (unless raw SQL is used)
- CSRF middleware (unless explicitly disabled)

### 4c. Assess confidence

- **HIGH**: Clear vulnerable pattern with attacker-controlled input and no upstream mitigation found. Report as a **finding**.
- **MEDIUM**: Potentially vulnerable but exploitability couldn't be fully confirmed from the codebase. Report in **Needs Verification** section.
- **LOW**: Theoretical concern with no clear exploit path. **Skip entirely.**

### Do not flag

- Test files (unless they contain hardcoded real secrets)
- Dead code or commented-out code
- Constants and configuration values
- Code behind authentication when auth itself isn't being reviewed
- Patterns the loaded language guide identifies as framework-mitigated

## Step 5: Generate report

Use this exact output format:

````markdown
# Security Check: [scope description]

**Scope**: [e.g., "Branch `feature/auth-rework` vs `origin/main` — 12 files changed"]
**Date**: [YYYY-MM-DD]
**Risk Level**: Critical / High / Medium / Low / Clean

## Deterministic Check Results

Automated checks that ran before analysis:

- [PASS/FAIL] Secret pattern scan (X files checked)
- [PASS/FAIL] .gitignore coverage for sensitive files
- [PASS/FAIL] Dependency audit (uv audit / npm audit)
- [PASS/FAIL] Dangerous function usage scan

[Details for any FAIL items, including file and line]

## Findings

### [SEC-001] [Vulnerability Type] — [Severity: Critical/High/Medium/Low]

- **File**: `path/to/file.py:42`
- **Confidence**: High
- **Category**: [e.g., SQL Injection — OWASP A03:2025]

**What's wrong**: [1-2 sentences describing the specific issue in this code]

**Why this matters**: [2-3 sentences explaining the risk in plain language.
What could an attacker do? What data is at risk? Write so a junior engineer
understands the real-world impact, not just the category name.]

**Evidence**:

```[language]
# The vulnerable code
```

**Recommendation**:

```[language]
# The fixed code
```

---

[Repeat for each finding, ordered by severity: Critical > High > Medium > Low]

## Needs Verification

Items where confidence is medium. The Agent could not fully confirm
exploitability from the codebase alone.

### [VERIFY-001] [Potential Issue]

- **File**: `path/to/file.py:87`
- **Question**: [What needs to be checked and why. For example: "Is
  `request.args.get('redirect_url')` validated against an allowlist before
  the redirect? The Agent found no validation in the call chain but the
  URL may be constrained by middleware not visible in the diff."]

## Summary

- **Findings**: X (Y Critical, Z High, ...)
- **Needs Verification**: X items
- **Deterministic Checks**: X passed, Y failed
- **Categories Reviewed**: [list of loaded reference categories]
- **Not Reviewed**: [categories skipped and why]
````

If there are no findings and all deterministic checks pass, use this short format:

```markdown
# Security Check: [scope description]

**Scope**: [description]
**Date**: [YYYY-MM-DD]
**Risk Level**: Clean

## Deterministic Check Results

All checks passed.

- [PASS] Secret pattern scan (X files checked)
- [PASS] .gitignore coverage for sensitive files
- [PASS] Dependency audit
- [PASS] Dangerous function usage scan

## Findings

No security issues found.

## Summary

- **Findings**: 0
- **Needs Verification**: 0
- **Deterministic Checks**: 4 passed, 0 failed
- **Categories Reviewed**: [list]
- **Not Reviewed**: [list]
```
