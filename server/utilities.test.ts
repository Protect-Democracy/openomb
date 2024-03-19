/**
 * Tests for utilities.js.
 */

// Dependencies
import { expect, test } from 'vitest';
import { unique, parseIntegerFromString, parseTimestampFromString, md5hash } from './utilities';

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
    new Date(Date.UTC(2024, 0, 1, 0, 1, 1, 1))
  );
  expect(parseTimestampFromString('2024-01-01-00.01.01.001', false)).toEqual(
    new Date(2024, 0, 1, 0, 1, 1, 1)
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
