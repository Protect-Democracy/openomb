import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { sampleSize } from 'lodash-es';
import { inArray, getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder';

import { db } from './connection';
import { allSchemas } from '../db/schema';

// Path to migrations
const _dirname = dirname(fileURLToPath(import.meta.url));
export const testDataDir = joinPath(_dirname, '..', 'db', 'test-data');

/**
 *
 * @param percentFileToKeep
 */
export async function generateTestData(
  samplePercent: number = 10,
  outputPath: string = joinPath(testDataDir, 'sample-test-data.sql')
): Promise<void> {
  // Make sure that the output directory exists
  await fs.mkdir(dirname(outputPath), { recursive: true });

  // Schemas that we want to keep all of them
  // NOTE: Line Types are in migration
  const schemasToKeep = [allSchemas.lineDescriptions];

  // Schemas that we want to sample
  // NOTE: Order matters
  const schemasToSample = [
    allSchemas.files,
    allSchemas.tafs,
    allSchemas.lines,
    allSchemas.footnotes
  ];

  // Get all the files
  const allFiles = await db?.select().from(allSchemas.files);

  // Sample the files
  const sampleFileIds = sampleSize(
    allFiles?.map((f) => f.fileId) || [],
    Math.floor((samplePercent / 100) * (allFiles?.length || 0))
  );

  // Get all the PDF files that we want to keep
  const pdfFileIds = allFiles?.filter((f) => !!f.pdfUrl).map((f) => f.fileId) || [];

  // Put together the list of fileIds to keep
  const fileIdsToKeep = Array.from(new Set([...sampleFileIds, ...pdfFileIds]));

  // Reset output file
  await fs.writeFile(outputPath, '');
  await fs.appendFile(outputPath, `-- Sample percent of file data: ${samplePercent}%\n\n`);

  // Go through all schemas that we want to keep and write an SQL insert statement for each row
  for (const schema of schemasToKeep) {
    // .where(inArray(schema.fileId, fileIdsToKeep));
    const rows = await db?.select().from(schema);
    await writeInsertStatement(outputPath, schema, rows);
  }

  // Go through all file schemas
  for (const schema of schemasToSample) {
    const rows = await db?.select().from(schema).where(inArray(schema.fileId, fileIdsToKeep));
    await writeInsertStatement(outputPath, schema, rows);
  }
}

async function writeInsertStatement(outputPath: string, schema, rows: []): Promise<void> {
  await fs.appendFile(outputPath, '-- Table: ' + getTableName(schema) + '\n');

  for (const row of rows || []) {
    const insert = db?.insert(schema).values(row);
    const sql = drizzleQueryToSQLString(insert!);

    await fs.appendFile(outputPath, `${sql};\n`);
  }

  await fs.appendFile(outputPath, '\n\n');
}

function drizzleQueryToSQLString<T>(query: TypedQueryBuilder<T, any>): string {
  const pgDialect = new PgDialect();
  const sql = query.getSQL().inlineParams(); // inlineParams() is key
  return pgDialect.sqlToQuery(sql).sql;
}
