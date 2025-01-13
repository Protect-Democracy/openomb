/**
 * Tests for utilities.ts
 */

// Dependencies
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as unzipper from 'unzipper';
import { expect, test, describe } from 'vitest';
import {
  unique,
  parseIntegerFromString,
  parseTimestampFromString,
  md5hash,
  zipFiles,
  parseBoolean,
  cleanString,
  dbId
} from './utilities';

test('unique()', () => {
  // Basics
  expect(unique()).toEqual([]);
  expect(unique([1, 1, 1, 1, 1, 1])).toEqual([1]);
  expect(unique(['a', 2, 1.0, true, true, false, 2])).toEqual(['a', 2, 1.0, true, false]);
});

test('parseIntegerFromString()', () => {
  // Basics
  expect(parseIntegerFromString('')).toEqual(null);
  expect(parseIntegerFromString('abc')).toEqual(null);
  expect(parseIntegerFromString('0')).toEqual(0);
  expect(parseIntegerFromString('1')).toEqual(1);
  expect(parseIntegerFromString('123')).toEqual(123);
  expect(parseIntegerFromString('123.456')).toEqual(123);
  expect(parseIntegerFromString('123,456')).toEqual(123456);
  expect(parseIntegerFromString('$123,456')).toEqual(123456);
});

test('parseTimestampFromString()', () => {
  // Basics
  expect(parseTimestampFromString('')).toEqual(null);
  expect(parseTimestampFromString('abc')).toEqual(null);
  expect(parseTimestampFromString('2024-01-01-00.01.01.001')).toEqual(
    new Date(Date.UTC(2024, 0, 1, 0, 1, 1))
  );
  expect(parseTimestampFromString('2024-01-01-00.01.01.001', false)).toEqual(
    new Date(2024, 0, 1, 0, 1, 1)
  );
  expect(parseTimestampFromString('2024-02-14-09.53.46.372578', false)).toEqual(
    new Date(2024, 1, 14, 9, 53, 46)
  );
  expect(parseTimestampFromString('2024-02-14-09.53.46', false)).toEqual(
    new Date(2024, 1, 14, 9, 53, 46)
  );
  expect(parseTimestampFromString('2024-01-01-00.01.01.000001', false)).toEqual(
    new Date(2024, 0, 1, 0, 1, 1)
  );
  expect(parseTimestampFromString('33-38', false)).toEqual(null);
});

test('md5hash()', () => {
  expect(md5hash('')).toEqual('d41d8cd98f00b204e9800998ecf8427e');
  expect(md5hash('abc')).toEqual('900150983cd24fb0d6963f7d28e17f72');
  expect(md5hash('123')).toEqual('202cb962ac59075b964b07152d234b70');
  expect(md5hash('123')).toEqual('202cb962ac59075b964b07152d234b70');
  expect(md5hash('123')).toEqual('202cb962ac59075b964b07152d234b70');
  expect(md5hash('123456')).toEqual('e10adc3949ba59abbe56e057f20f883e');
  expect(md5hash('1234567890')).toEqual('e807f1fcf82d132f9bb018ca6738a19f');
  expect(md5hash('abcdefghijklmnopqrstuvwxyz')).toEqual('c3fcd3d76192e4007dfb496cca67e13b');
  expect(md5hash('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')).toEqual(
    'd174ab98d277d9f5a5611c2c9f419d9f'
  );
});

test('parseBoolean()', () => {
  expect(parseBoolean('')).toEqual(null);
  expect(parseBoolean('true')).toEqual(true);
  expect(parseBoolean('false')).toEqual(false);
  expect(parseBoolean('1')).toEqual(true);
  expect(parseBoolean('0')).toEqual(false);
  expect(parseBoolean('on')).toEqual(true);
  expect(parseBoolean('off')).toEqual(false);
  expect(parseBoolean('yes')).toEqual(true);
  expect(parseBoolean('no')).toEqual(false);
  expect(parseBoolean('    no   ')).toEqual(false);
  expect(parseBoolean('sa;dlkf')).toEqual(null);
  expect(parseBoolean('5')).toEqual(null);
});

test('cleanString()', () => {
  expect(cleanString('')).toEqual(null);
  expect(cleanString('     ')).toEqual(null);
  expect(cleanString('  fdssdf sdfdf   ')).toEqual('fdssdf sdfdf');
});

test('dbId()', () => {
  expect(dbId('Account Title')).toEqual('account-title');
  expect(dbId('    Account    Title   ')).toEqual('account-title');
  expect(dbId('??+@#*%($)#    Account   ?????? Title   ')).toEqual('account-title');
  expect(dbId('----Account-----Title - - - -- - ')).toEqual('account-title');
  expect(dbId('Account-----Title 0004')).toEqual('account-title-0004');
  expect(dbId('Account Title 0004')).toEqual('account-title-0004');
  expect(dbId(undefined)).toEqual(null);
  expect(dbId(null)).toEqual(null);
  expect(dbId('')).toEqual(null);
  expect(dbId('    ')).toEqual(null);
  expect(dbId('----')).toEqual(null);
  expect(dbId('??????')).toEqual(null);
});

describe('zipFiles()', () => {
  interface TmpDirFixture {
    tmpdir: string;
  }

  interface ZipFileListItem {
    path: string;
    type: string;
    vars: object;
  }
  // Setup temp directory using os.tmpdir for each test
  async function createTempDir() {
    const tDir = os.tmpdir();
    const tmpDir = path.join(tDir, `test-${Math.round(Math.random() * 1000000)}`);
    return await fs.mkdtemp(tmpDir);
  }

  const writeFile = async (filename: string, content: string) => {
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, content);
  };

  // Function to get list of files in a zip archive
  const zipFileList = async (zipFile: string): Promise<ZipFileListItem[]> => {
    const zip = createReadStream(zipFile).pipe(unzipper.Parse({ forceStream: true }));
    const fileList: ZipFileListItem[] = [];
    for await (const entry of zip) {
      fileList.push({
        path: entry.path,
        type: entry.type,
        vars: entry.vars
      });
      entry.autodrain();
    }

    return fileList;
  };

  const tmpdirTest = test.extend<TmpDirFixture>({
    // eslint-disable-next-line no-empty-pattern
    tmpdir: async ({}, use) => {
      const directory = await createTempDir();
      await use(directory);
      await fs.rm(directory, { recursive: true });
    }
  });

  tmpdirTest('should zip files', async ({ tmpdir }) => {
    const file1 = path.join(tmpdir, 'file1.txt');
    const file2 = path.join(tmpdir, 'file2.txt');
    const zipFile = path.join(tmpdir, 'test.zip');
    await writeFile(file1, 'file1');
    await writeFile(file2, 'file2');
    await zipFiles([file1, file2], zipFile);

    // Make sure files are there
    const filesList = await fs.readdir(tmpdir);
    expect(filesList).toContain('test.zip');
    expect(filesList).toContain('file1.txt');
    expect(filesList).toContain('file2.txt');

    // Cursory check of files in zip
    const zip = await fs.readFile(zipFile);
    expect(zip).toString().match(/file1/);
    expect(zip).toString().match(/file2/);

    // Check list of files
    const zippedFiles = await zipFileList(zipFile);
    expect(zippedFiles).toHaveLength(2);
    expect(zippedFiles[0].path).toEqual('file1.txt');
    expect(zippedFiles[1].path).toEqual('file2.txt');
  });

  tmpdirTest('should zip directories recursively', async ({ tmpdir }) => {
    const file1 = path.join(tmpdir, 'path1', 'file2.txt');
    const file2 = path.join(tmpdir, 'path1', 'path1-sub1', 'file2.txt');
    const file3 = path.join(tmpdir, 'path1', 'path1-sub1', 'path1-sub2', 'file3.txt');
    const file4 = path.join(tmpdir, 'path2', 'path2-sub1', 'file4.txt');
    const file5 = path.join(tmpdir, 'file5.txt');
    const zipFile = path.join(tmpdir, 'test.zip');
    await writeFile(file1, 'file1');
    await writeFile(file2, 'file2');
    await writeFile(file3, 'file3');
    await writeFile(file4, 'file4');
    await writeFile(file5, 'file4');
    await zipFiles(
      [path.join(tmpdir, 'path1'), path.join(tmpdir, 'path2', 'path2-sub1'), file5],
      zipFile
    );

    // Check list of files
    const zippedFiles = await zipFileList(zipFile);
    const zippedFilePaths = zippedFiles.map((f) => f.path);
    const expected = [
      'file5.txt',
      'path1/file2.txt',
      'path1/path1-sub1/',
      'path1/path1-sub1/file2.txt',
      'path1/path1-sub1/path1-sub2/',
      'path1/path1-sub1/path1-sub2/file3.txt',
      'path2-sub1/file4.txt'
    ];
    expect(zippedFiles).toHaveLength(expected.length);
    expect(zippedFilePaths.sort()).toEqual(expected.sort());
  });
});
