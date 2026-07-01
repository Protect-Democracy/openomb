---
name: pd-maintain-claude
description: Audits and fixes the `.claude/` directory to ensure internal consistency, correct references, and adherence to project conventions.
---

# Maintain Claude configuration

Audit and fix the `.claude/` directory to ensure internal consistency, correct references, and adherence to project conventions. Run this skill proactively when making changes to `.claude/` files, or when the Developer asks to lint or maintain the agent configuration.

## Steps

Work through each check below. Collect all findings first, then present a summary to the Developer before making fixes.

### 1. Validate `CLAUDE.md` references

`CLAUDE.md` uses two kinds of references:

- **`@FILENAME` includes**: These are functional — the Agent automatically loads the referenced file's content. Confirm each target file exists relative to `.claude/`.
- **Path references in rules and skills lists**: These are informational paths that point to rules and skills files. Confirm each referenced file exists relative to `.claude/`.

Also check for:

- References to files that don't exist.
- Files in `.claude/` that exist but are not referenced in `CLAUDE.md` where they should be (rules in the rules list, skills in the skills list, `@`-included docs).

### 2. Validate internal cross-references

Scan all `.claude/**/*.md` files for paths that reference other files (e.g. `rules/TESTING.md`, `docs/CONTRIBUTING.md`, `.github/pull_request_template.md`). These are informational references for readability, not functional includes, but they should still point to real files.

- For paths starting with `rules/` or `skills/`, resolve relative to `.claude/`.
- For paths starting with `docs/`, `.github/`, or other project directories, resolve relative to the project root.
- Flag any broken references.

### 3. Validate rules frontmatter

Every file in `rules/**/*.md` must have YAML frontmatter with a `paths` field. This field is functional — the Agent uses it to determine when to automatically apply the rule.

```yaml
---
paths:
  - 'glob/pattern'
---
```

- Flag any rules file missing frontmatter entirely.
- Flag any rules file missing the `paths` key.
- Verify each glob pattern is reasonable for the rule's content (e.g. Python rules should include `"**/*.py"`).

### 4. Validate skills structure

Every skill directory in `skills/` must contain a `SKILL.md` file.

- Flag any skill directory missing `SKILL.md`.
- Flag any `SKILL.md` that is empty or has no meaningful content.
- Skills should have frontmatter with `name` and `description` fields. Flag any missing these fields or with empty values.

### 5. Check naming consistency

- Rule files should use `UPPER_SNAKE_CASE.md` naming.
- Skill directories should use `lower_snake_case` naming.
- Skill files should be named `SKILL.md` (not `SKILL.MD` or other variants).
- Flag inconsistencies.

### 6. Check terminology consistency

All `.claude/` files should use consistent terminology for the three roles:

- **Agent**: The AI/LLM assistant (e.g. Claude Code). Not "AI", "assistant", "bot", "LLM", or "Claude" when referring to the role generically.
- **Developer**: The human using the Agent to write code. Not "user", "you", "engineer", or "programmer".
- **End User**: The person who uses the software the Developer builds. Not "user" when it could be confused with the Developer.

Flag any inconsistent usage and suggest replacements.

### 7. Check language and formatting consistency

Following the conventions in `rules/MARKDOWN.md`:

- Headings should use `#` syntax, not underline syntax.
- Bullet points and numbered lists should be used for clarity.
- Code references should use backticks.
- There should be a blank line after headings, paragraphs, and lists.
- Files should have a top-level `#` heading describing their purpose.

### 8. Check docs/ references

Scan `docs/**/*.md` files for internal links and path references to other docs or project files. Confirm targets exist.

## Output

Present findings as a checklist grouped by category. For each issue, note:

- The file containing the problem
- What the problem is
- A suggested fix

Ask the Developer which fixes to apply before making changes.
