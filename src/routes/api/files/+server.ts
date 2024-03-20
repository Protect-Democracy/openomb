// Dependencies
import { error } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { db } from '$db/connection';
import { file } from '$schema/files';
import * as drizzleOrm from 'drizzle-orm';

/**
 * Get a set of files given parameters.
 *
 * This is a rough start and definitely an example of how not having a
 * more full featured ORM and framework leads to a lot of work if we want
 * to make an API like this very flexible.
 */
export const GET: RequestHandler = async ({ url }) => {
  const p = (p: string) => url.searchParams.get(p) || '';

  // Limit
  const limit = parseInt(p('limit')) || 100;

  // Order
  const orderField = p('orderField') || 'approvalTimestamp';
  const order = p('order') || 'desc';
  const orderFunction = order === 'asc' ? drizzleOrm.asc : drizzleOrm.desc;

  // Parsers
  const parseString = (s: string) => (s === '' ? undefined : s);
  const parseBoolean = (s: string) => (s === 'true' ? true : s === 'false' ? false : undefined);
  const parseInteger = (s: string) => (s === '' ? undefined : parseInt(s));
  const parseDate = (s: string) => (s === '' ? undefined : new Date(s));

  // Operator sets (not handling array operators like in)
  const stringOperators = ['eq', 'ne', 'like', 'ilike'];
  const booleanOperators = ['eq', 'ne'];
  const numberOperators = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte'];
  const dateOperators = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte'];

  // Where
  const searchableFields = [
    ['fileId', parseString, stringOperators],
    ['removed', parseBoolean, booleanOperators],
    ['fiscalYear', parseInteger, numberOperators],
    ['approvalTimestamp', parseDate, dateOperators]
  ];
  let where = searchableFields.map(([field, parser, operators]) => {
    // Parse value
    const value = parser(p(field));

    // Determine operator
    const operator = p(`${field}Operator`) || 'eq';
    if (!operators.includes(operator)) {
      error(400, `Invalid operator, "${operator}", for field "${field}"`);
    }

    return value === undefined ? undefined : drizzleOrm[operator](file[field], value);
  });
  where = where.filter((w) => w !== undefined);

  // Create query
  const files = await db
    .select()
    .from(file)
    .where(...where)
    .orderBy(orderFunction(file[orderField]))
    .limit(limit);

  return json(files);
};
