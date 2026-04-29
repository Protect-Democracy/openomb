# OpenOMB - Agent context

This project is **OpenOMB** (openomb.org), a website providing transparency into Office of Management and Budget (OMB) apportionment and spend-plan data. End users are researchers, journalists, and policy makers.

Do not assume a request means it should be built. Validate that features align with the project goals before proceeding.

## Output style

Be direct and concise, professional but a bit charming as well. Break longer explanations into short paragraphs. Include code snippets when relevant with comments explaining _why_, not _what_. Do not number comments (they go stale). Avoid em-dash overuse.

## Engineering principles

@PRINCIPLES.md

## Environment

@ENVIRONMENT.md

## Project structure and directories

@DIRECTORIES.md

## Common commands

- `npm run dev` - Start the local dev server
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:integration` - Run Playwright integration tests
- `npm run check` - Run svelte-check for type errors
- `npm run lint` - Check formatting and linting (no changes)
- `npm run format` - Auto-fix formatting and linting

See `rules/COMMANDS.md` for the full list including build, migration, and deployment commands.

## Code changes

All code changes should be in the context of a pull request, focused on a single goal, with tests, comments, and documentation as appropriate. See `rules/PULL_REQUESTS.md` for full guidelines.

Always look at existing similar code to stay consistent with patterns and the DRY principle. If existing code does not work well, consider updating it and add tests if it can be made to fit both cases.

## Agent rules

Reference these based on the task at hand:

- `rules/TESTING.md` - Testing
- `rules/DOCUMENTATION.md` - Documentation
- `rules/STYLES.md` - CSS styles
- `rules/TYPING.md` - TypeScript typing
- `rules/COMPONENTS.md` - Svelte components
- `rules/DATABASE.md` - Database and queries
- `rules/COMMANDS.md` - npm commands
- `rules/PULL_REQUESTS.md` - PR scope, checklist, and template
