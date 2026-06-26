# Development environment

## Core technologies

- Node JS - See `.nvmrc` for version
- Typescript - Strict mode; see `tsconfig.json` for overrides
- [Svelte 5](https://svelte.dev/docs/svelte/overview) - Not actively using Runes yet
- [SvelteKit](https://svelte.dev/docs/kit/introduction) - File-based routing, configured in `svelte.config.js`
- Vite - SvelteKit uses `vite.config.ts`; bin scripts use `vite-bin.config.ts`

## CSS and styling

- Custom CSS (no framework). See `rules/css/CSS_ORGANIZATION.md` for file structure and naming conventions, `rules/css/CSS_BEST_PRACTICES.md` for patterns, and `rules/css/CSS_ACCESSIBILITY.md` for accessibility. Global styles in `src/styles/`, component styles colocated in Svelte component `<style>` blocks.

## Database & ORM

- [Drizzle](https://orm.drizzle.team/docs/overview) with Postgres - Migrations, schema definitions, and query builders
- See `rules/DATABASE.md` for conventions

## Authentication

- [Auth.js](https://authjs.dev/) via @auth/sveltekit with email magic links

## Deployment and infrastructure

- Docker (`Dockerfile`)
- Github Actions - CI/CD and scheduled tasks (data collection, email notifications)
- [Open Tofu](https://opentofu.org/docs/) (Terraform) - Infrastructure management
- Sentry - Error tracking
- AWS - ECS, RDS, S3, CloudFront

## Formatting and linting

- Prettier - Multi-file-type formatting
- ESLint - TS/JS/Svelte linting

## Code versioning

- Git for version control
- GitHub for code hosting and collaboration

## CI/CD

- Github Actions for continuous integration and deployment
