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
});
