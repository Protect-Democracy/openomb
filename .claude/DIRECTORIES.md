# Files and directories

The following lays out notable directories.

```
  ├── .github/                       # Github-specific configuration and templates
  │   ├── ISSUE_TEMPLATE/            # GitHub issue templates
  │   └── workflows/                 # CI/CD GitHub Actions workflows
  ├── .husky/                        # Git hooks (pre-commit, etc.)
  ├── bin/                           # Executable scripts (data collection, DB tasks); run via `npm run`
  ├── build-*/                       # Build output dirs; should not be written to directly.
  ├── data/
  │   └── fixes/                     # Manual data corrections for bad source data
  ├── docs/                          # Developer documentation
  ├── src/
  │   ├── assets/                    # Hashed static assets (favicon, logos, social images)
  │   ├── components/                # Reusable Svelte components
  │   │   ├── accordion/
  │   │   ├── accounts/
  │   │   ├── agencies/
  │   │   ├── charts/
  │   │   ├── drawer/
  │   │   ├── files/
  │   │   ├── icons/
  │   │   ├── inputs/
  │   │   ├── links/
  │   │   ├── navigation/
  │   │   ├── pagination/
  │   │   ├── subscriptions/
  │   │   ├── tabs/
  │   │   └── tafs/
  │   ├── config/                    # App configuration
  │   ├── lib/                       # Shared utilities and helpers
  │   │   └── server/                # Server-only code
  │   │       ├── db/
  │   │       │   ├── migrations/    # Drizzle DB migrations
  │   │       │   ├── queries/       # Reusable DB query functions
  │   │       │   ├── schema/        # Drizzle schema definitions
  │   │       │   └── test-data/     # DB test fixtures
  │   │       ├── email/
  │   │       │   ├── components/    # Email Svelte components
  │   │       │   ├── templates/     # Email templates (auth, notifications, subscriptions)
  │   │       │   └── test-data/     # Email test fixtures
  │   │       └── test-data/         # General server test fixtures
  │   ├── routes/                    # SvelteKit routes (pages + API)
  │   │   ├── .well-known/           # security.txt
  │   │   ├── about/
  │   │   ├── agency/[agencyId]/     # Agency detail pages
  │   │   │   └── bureau/[bureauId]/ # Bureau detail pages
  │   │   │       └── account/[accountId]/  # Account detail pages
  │   │   ├── api/v1/               # REST API endpoints
  │   │   │   ├── collections/
  │   │   │   ├── files/            # File endpoints (search, recent, [fileId])
  │   │   │   ├── folders/
  │   │   │   ├── health/
  │   │   │   ├── info/
  │   │   │   ├── letter-apportionment-preview/
  │   │   │   ├── url-checker/
  │   │   │   └── user/subscription/ # User subscription management
  │   │   ├── approver/[approverId]/ # Approver view
  │   │   ├── developers/            # Developer/API docs page
  │   │   ├── examples/              # Example pages for various features and use cases; does not show to user or search engines
  │   │   ├── explore/               # Agency exploration page
  │   │   ├── faq/                   # Frequently Asked Questions
  │   │   ├── file/[fileId]/         # Individual Apportionment file view
  │   │   ├── folder/[folderId]/     # Folder view
  │   │   ├── folders/               # Folders listing
  │   │   ├── search/                # Search page
  │   │   ├── sitemaps/              # Dynamic sitemap generation (agencies, bureaus, accounts, files, folders)
  │   │   ├── styles/                # Style Guide
  │   │   ├── subscribe/             # Email subscription flow (verify, deactivated, error, [type]/[itemId])
  │   │   ├── privacy-policy/
  │   │   └── terms/
  │   └── styles/                    # Global stylesheets
  ├── static/
  │   └── static-assets/email/       # Static email assets (prefer src/assets/ for hashed files)
  ├── tests/
  │   ├── helpers/                   # Test utilities
  │   └── integration/               # Playwright E2E tests
  └── tofu/                          # OpenTofu/Terraform infrastructure (AWS ECS, RDS, S3, CloudFront)
```
