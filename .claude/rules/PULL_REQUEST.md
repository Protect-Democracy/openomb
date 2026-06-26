---
description: Pull request scope, checklist, and template guidelines.
paths:
  - '**/*.md'
  - '**/*.py'
  - '**/*.ts'
  - '**/*.svelte'
  - '**/*.jinja'
  - '.*'
---

# Pull requests

Changes should be focused, reviewable, and complete. If a task is large enough to result in a sprawling PR, suggest breaking it into smaller, sequential PRs.

## Scope

A PR should try to do one thing or a group of very related things. Avoid unrelated cleanup or refactoring unless explicitly requested.

## Checklist

Address these as part of the work, not as an afterthought:

- **Tests**: New/changed functionality needs tests. See `rules/TESTING.md`. Note why if not feasible.
- **Comments**: Explain the _why_ behind non-obvious logic. Don't restate what the code does.
- **Documentation**: If the change affects developer workflows (new patterns, config, commands), update `docs/`. See `rules/DOCUMENTATION.md`.
- **Types**: Ensure proper typing. See `rules/PYTHON_TYPING.md`.

## Pull request template

Template: `.github/pull_request_template.md`. Fill it out when work is ready:

- **Addresses issue(s)**: Use `Resolves #XXXX` format. Prompt for this if not known.
- **What this does**: Clear summary of change and motivation
- **Side effects**: Secondary changes not the main focus
- **Questions**: Open decisions needing reviewer input
- **How to test**: Manual testing steps beyond automated tests
- **Checklist**: Check completed items; explain unchecked ones
- **Other context**: Dependency changes, cross-repo PRs
