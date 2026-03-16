# Database

Drizzle ORM with Postgres. Database layer lives in `src/lib/server/db/`.

```
  src/lib/server/db/
  ├── connection.ts           # DB connection pool and Drizzle instance (`db`)
  ├── schema/                 # Drizzle table definitions and relations
  │   ├── index.ts            # Re-exports all table objects
  │   ├── files.ts            # Apportionment files
  │   ├── tafs.ts             # Treasury Account Fund Symbols (child of files)
  │   ├── lines.ts            # Line items (child of tafs)
  │   ├── footnotes.ts        # Footnotes (child of lines)
  │   ├── line-types.ts       # Reference: line type definitions
  │   ├── line-descriptions.ts # Reference: line description definitions
  │   ├── collections.ts      # Curated file collections
  │   ├── users.ts            # Auth.js user tables
  │   ├── subscriptions.ts    # Email subscriptions
  │   └── searches.ts         # Saved searches
  ├── queries/                # Reusable query functions grouped by domain
  ├── migrations/             # Generated SQL migration files
  │   └── meta/               # Migration journal and snapshots (auto-managed)
  ├── test-data/              # Generated test data SQL
  └── test-data.ts            # Script to generate test data from live DB
```

Developer documentation: `docs/DATABASE.md` (maintain with DB changes).

## Connection

`src/lib/server/db/connection.ts` uses `pg.Pool` (singleton) and creates a Drizzle instance with all schemas (required for relational queries).

Import aliases:

- `$db/connection` - the `db` instance
- `$schema/files`, `$schema/tafs`, etc. - schema files
- `$server/cache` - memoization utility

## Configuration

`drizzle.config.ts` at project root. Schema: `./src/lib/server/db/schema/*.ts`, migrations: `./src/lib/server/db/migrations`.

## Schema conventions

### Tables

- Table names: **lowercase plural** (`files`, `tafs`, `subscriptions`)
- DB columns: **snake_case** (`file_id`, `fiscal_year`)
- TS columns: **camelCase** (`fileId`, `fiscalYear`)
- Primary keys: `varchar` for external/immutable IDs, `text` with `crypto.randomUUID()` for internal
- Composite primary keys for multi-dimensional data (e.g., TAFS: fileId + tafsId + iteration + fiscalYear)
- Metadata: `createdAt: timestamp('created_at').defaultNow()`, `modifiedAt: timestamp('modified_at').defaultNow()`
- Soft deletes: `removed: boolean('removed').default(false)` where applicable
- Index columns used in WHERE, foreign keys, and GROUP BY

### Relations

Defined with `relations()`, exported as `<table>Relations`. Use `many()` for one-to-many, `one()` with explicit field/reference for many-to-one.

### Types

Each schema file exports:

```typescript
export type filesSelect = typeof files.$inferSelect;
export type filesInsert = typeof files.$inferInsert;
```

Complex nested types are separate exports (e.g., `filesSelectWithTafsFootnotes`).

## Query conventions

Query functions live in `src/lib/server/db/queries/` grouped by domain.

### Structure

- Import `db` from `$db/connection`, schema from `$schema/*`
- Exported `async` `const` functions with JSDoc
- Single-record queries return the record or `null`: `found?.[0] || null`

### Two query styles

1. **Query builder** (`db.select().from().where()`) - JOINs, subqueries, aggregations, unions
2. **Relational API** (`db.query.files.findFirst()` / `.findMany()`) - nested eager loading via `with:`

### Memoization

Memoize expensive reads with `memoizeDataAsync()` from `$server/cache`. Prefix memoized export with `m`:

```typescript
export const agencies = async function () {
  /* ... */
};
export const mAgencies = memoizeDataAsync(agencies);
```

Use `m` version in route handlers (cached). Use raw version when fresh data is needed.

### Conditional WHERE clauses

```typescript
const whereClauses = [
  filters?.agencyId ? eq(tafs.budgetAgencyTitleId, filters.agencyId) : undefined,
  filters?.folderId ? eq(files.folderId, filters.folderId) : undefined
].filter((w) => w !== undefined);

const where =
  whereClauses.length === 1
    ? whereClauses[0]
    : whereClauses.length > 1
      ? and(...whereClauses)
      : undefined;
```

### Excluding large columns

```typescript
db.query.files.findFirst({
  columns: { sourceData: false }
});
```

## Migrations

Generated SQL files in `src/lib/server/db/migrations/`.

- **Generate**: `npm run dev:generate`
- **Run**: `npm run dev:migrate`
- Naming: `NNNN_descriptive_name.sql` (auto-generated)
- Safety wrappers applied: `IF NOT EXISTS`
- `migrations/meta/` is auto-managed; do not edit

### Schema change workflow

1. Modify schema in `src/lib/server/db/schema/`
2. `npm run dev:generate` to produce migration
3. Review generated SQL
4. `npm run dev:migrate` to apply locally
