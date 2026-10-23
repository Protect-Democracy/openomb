import { vi } from 'vitest';
import pg from 'pg';

/**
 * Get the SQL text from the first argument of a pg `query()` call, which is
 * either the SQL string or a query config object with a `text` property.
 */
function sqlText(queryArg: unknown): string {
  if (typeof queryArg === 'string') {
    return queryArg;
  }
  if (
    queryArg &&
    typeof queryArg === 'object' &&
    'text' in queryArg &&
    typeof queryArg.text === 'string'
  ) {
    return queryArg.text;
  }

  return '';
}

/**
 * Spy on the underlying pg Pool so we can inspect the raw SQL text Drizzle
 * sends to Postgres, for query functions that execute directly rather than
 * returning a builder we could call `.toSQL()` on.
 */
export function spyOnExecutedSql() {
  const querySpy = vi.spyOn(pg.Pool.prototype, 'query');
  return {
    querySpy,
    executedSql: (): string[] => querySpy.mock.calls.map((call) => sqlText(call[0])).filter(Boolean)
  };
}
