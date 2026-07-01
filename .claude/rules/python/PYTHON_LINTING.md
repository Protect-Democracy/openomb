---
description: Python linting with Ruff: how to run it, respond to errors, and configure rule suppressions.
paths:
  - "**/*.py"
  - "**/*.py*.jinja"
  - "pyproject.toml"
---

# Python Linting

Linting standards and practices for Python code using Ruff.

---

## Running the linter

Use the poe tasks for linting:

1. Check for issues: `uv run poe lint`
2. Auto-fix issues: `uv run poe lint:fix`
3. Check formatting: `uv run poe format`
4. Auto-fix formatting: `uv run poe format:fix`

---

## Responding to linting errors

When a linting rule flags code, follow this hierarchy:

1. **Fix the issue.** The default response to any linting error is to fix the code so the rule passes. This is the right choice the vast majority of the time.
2. **Prompt user.** If the rule cannot be fixed easily, give the user options of what to do or ask for guidance. Some examples include:
   - **Per-file-ignores in `pyproject.toml`.** Use only when a rule categorically does not apply to a type of file — for example, `S101` (assert usage) in test files, or `S603` (subprocess calls) in conftest files. Always include a comment explaining the rationale above the ignore line.
   - **Inline `# noqa: RULE_CODE`** as a last resort. Use only for truly one-off cases that do not fit a file-level pattern. Always include the specific rule code and a comment explaining why the suppression is necessary.

Each level is a last resort relative to the one above it. Reaching for per-file-ignores when the code can be fixed, or reaching for inline `# noqa` when a per-file-ignore would cover the pattern, adds noise and hides real issues.

---

## Configuration

Ruff is configured in `pyproject.toml` under `[tool.ruff]` and `[tool.ruff.lint]`. Key sections:

- **`select`**: The enabled rule sets.
- **`ignore`**: Rules globally disabled.
- **`extend-per-file-ignores`**: Rules suppressed for specific file patterns (e.g., test files, conftest files, templates).
- **`pydocstyle`**: Docstring convention (Google style).

Refer to the [Ruff rule reference](https://docs.astral.sh/ruff/rules/) for rule documentation.
