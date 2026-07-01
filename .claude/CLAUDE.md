# Project agent context

@PROJECT.md

## Roles

@ROLES.md

## Engineering principles

@PRINCIPLES.md

## Environment

@ENVIRONMENT.md

## Task commands

@TASKS.md

## Project structure and directories

@DIRECTORIES.md

## Doing work and code changes

- All non-trivial changes should be in the context of a pull request, focused on a single goal, with tests, comments, and documentation as appropriate. See `rules/PULL_REQUEST.md` for full guidelines.
- Always look at existing similar code to stay consistent with patterns and the DRY principle.
- If existing code does not work well, consider updating it and add tests if it can be made to fit both cases.
- Do NOT make commits without express permission from the Developer. All commits must be made by the Developer to ensure proper attribution and accountability.
- Always output what bash/shell commands are doing in plain language and why.
- Avoid running arbitrary code via the command line, such as `python -c "..."`. If this is the best way to accomplish a task, make sure to explain it.
- Even if you have permission to do something, always output short, concise message on what actions you are taking. This is to help the Developer understand what you are doing and why, and to provide a clear log of your actions.

## Agent rules

These rules live in `.claude/rules/` and are auto-loaded into your context. Files without `paths` frontmatter are always loaded; files with `paths` load only when you read files matching those globs. Use the list below to stay aware of which rules exist — reference them based on the task at hand, even when a rule's `paths` glob hasn't triggered:

- `rules/CLAUDE_FILES.md` - Conventions for files in the `.claude/` configuration directory.
- `rules/DOCUMENTATION.md` - Documentation conventions and when to update docs.
- `rules/ENVIRONMENT_VARIABLES.md.jinja` - Environment variable naming, security, and secrets management.
- `rules/MARKDOWN.md` - Markdown formatting conventions and instruction-list patterns.
- `rules/PULL_REQUEST.md` - PR scope, checklist, and template guidelines.
- `rules/DATABASE.md` - Drizzle ORM conventions: schema patterns, query styles, memoization, migrations, and import aliases.
- Python rules:
  - `rules/python/PYTHON_BEST_PRACTICES.md` - Python best practices when writing, editing, or reviewing Python, .py code. Includes type annotation standards and ty usage.
  - `rules/python/PYTHON_TESTING.md` - Testing standards and practices for Python, .py files.
  - `rules/python/PYTHON_LINTING.md` - Linting standards, running the linter, and when to suppress rules.
- JavaScript/TypeScript rules:
  - `rules/javascript/JAVASCRIPT_BEST_PRACTICES.md` - JavaScript best practices for all JS/TS code (naming, functions, async, error handling, JSDoc).
  - `rules/javascript/TYPESCRIPT_BEST_PRACTICES.md` - TypeScript-specific best practices (types, generics, discriminated unions, modern TS features).
- HTML rules:
  - `rules/html/HTML_BEST_PRACTICES.md` - HTML best practices for structure, semantics, forms, images, performance, and security.
  - `rules/html/HTML_ACCESSIBILITY.md` - HTML accessibility patterns (ARIA, keyboard navigation, WCAG compliance).
- CSS rules:
  - `rules/css/CSS_ORGANIZATION.md` - CSS architecture, file organization, cascade layers, custom properties, and naming conventions.
  - `rules/css/CSS_BEST_PRACTICES.md` - CSS best practices for selectors, layout, typography, color, responsive design, animations, and performance.
  - `rules/css/CSS_ACCESSIBILITY.md` - CSS accessibility patterns (focus styles, contrast, motion, screen readers, high contrast mode).
- Svelte rules:
  - `rules/svelte/SVELTE_4_BEST_PRACTICES.md` - **Current** Svelte 4 component patterns (locations, structure, reactivity, events, slots, stores, lifecycle, actions, transitions). Use this now.
  - `rules/svelte/SVELTE_BEST_PRACTICES.md` - Svelte 5 rune patterns (runes, snippets, attachments). **Future use only — for when the project upgrades to Svelte 5.**
  - `rules/svelte/SVELTEKIT_BEST_PRACTICES.md` - SvelteKit framework patterns (routing, data loading, form actions, hooks, SSR, configuration).
- Node rules:
  - `rules/node/NODE_WORKSPACES.md` - npm workspaces structure and conventions.
- GitHub rules:
  - `rules/github/GITHUB_ACTIONS_BEST_PRACTICES.md` - GitHub Actions best practices for workflows, security, organization, and CI/CD patterns.

## Skills

- `skills/pd-dependencies/SKILL.md` - Managing project dependencies.
- `skills/pd-summarize-pr/SKILL.md` - For generating PR summaries.
- `skills/pd-generate-media/SKILL.md` - Generating images, videos, and audio with Google Gemini.
- `skills/pd-github-action-version/SKILL.md` - Look up, verify, and update GitHub Action SHA pins in workflow files.
- `skills/pd-maintain-claude/SKILL.md` - Audits and fixes the `.claude/` directory for internal consistency and adherence to conventions.
- `skills/pd-security-check/SKILL.md` - On-demand security review of code changes. Diff-aware, covers OWASP Top 10, supply chain, infrastructure, and agentic AI security.
- `skills/openomb-spend-plan-fix/SKILL.md` - Fixes parsing issues with Spend Plan files as they are not consistent.
- `skills/openomb-tofu/SKILL.md` - For working with Terraform / OpenTofu files in `tofu/` for infrastructure work.

## MCP servers

MCP servers provide additional context and tools to the Agent.

- [Sentry](https://mcp.sentry.dev/mcp) - Error tracking, issue lookup, and performance data. If Sentry is used in this project, the developer must authenticate for this server to function (see `docs/OBSERVABILITY.md` if it exists).
- [Svelte](https://mcp.svelte.dev/mcp) - For Svelte and Sveltekit codebases, provides access to Svelte-specific context, tools, and best practices. Includes `list-sections` to discover documentation, `get-documentation` to get specific docs, and `svelte-autofixer` as a way to analyze and fix Svelte code and should be used when writing Svelte code.

## Developer specific context

Context that is specific to this specific Developer and their environment and preferences. If these are in conflict with other context, prompt Developer about it.

@DEVELOPER_CONTEXT.md
