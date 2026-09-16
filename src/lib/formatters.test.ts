import { expect, test, describe } from 'vitest';
import { highlight } from './formatters';

describe('highlight()', () => {
  test('no trim', () => {
    expect(highlight('hello world', ['hello'])).toEqual('<mark>hello</mark> world');
    expect(highlight('hello hello world', ['hello'])).toEqual(
      '<mark>hello</mark> <mark>hello</mark> world'
    );
    expect(highlight('hello world', ['hello', 'worl'])).toEqual(
      '<mark>hello</mark> <mark>worl</mark>d'
    );
    expect(highlight('hello world', ['not'])).toEqual('hello world');
    expect(highlight('hello world')).toEqual('hello world');
    expect(highlight('', ['search'])).toEqual('');
    expect(highlight('hello world hello', ['hello'])).toEqual(
      '<mark>hello</mark> world <mark>hello</mark>'
    );
  });

  test('escapes regex special characters in terms', () => {
    // A term containing an unmatched '[' previously threw
    // `SyntaxError: Invalid regular expression ... Unterminated character class`
    // when passed straight into `new RegExp()` (see PD-APPORTIONMENTS-BROWSER-H9/-HA).
    expect(() => highlight('please review [rationale needed]', ['[rationale'])).not.toThrow();
    expect(highlight('please review [rationale needed]', ['[rationale'])).toEqual(
      'please review <mark>[rationale</mark> needed]'
    );
    expect(() => highlight('a (b) c', ['(b)'])).not.toThrow();
    expect(highlight('a (b) c', ['(b)'])).toEqual('a <mark>(b)</mark> c');
  });

  test('trim', () => {
    expect(highlight('hello world world', ['hello'], 5)).toEqual('<mark>hello</mark> world...');
    expect(highlight('hello world world world world world', ['hello'], 5)).toEqual(
      '<mark>hello</mark> world...'
    );
    expect(
      highlight('start start start start and hello world world world world world', ['hello'], 5)
    ).toEqual('...and <mark>hello</mark> world...');
    expect(
      highlight('start start start start and hello world world world world world', ['hello'], 12)
    ).toEqual('...start and <mark>hello</mark> world world...');
    expect(
      highlight(
        'start start start start and hello hello world world world world world',
        ['hello'],
        12
      )
    ).toEqual('...start and <mark>hello</mark> hello world...');
    expect(highlight('hello worldworldworldworldworldworld', ['hello'], 5)).toEqual(
      '<mark>hello</mark> worldworldworldworldworldworld...'
    );
  });

  test('escapes regex special characters in terms with trim', () => {
    expect(() =>
      highlight('please review [rationale needed] for context', ['[rationale'], 10)
    ).not.toThrow();
  });
});
