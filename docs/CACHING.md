# Caching

There are a few mechanisms for caching.

## Data cycle

Our current assumption is that the OMB data updates every 1-3 days or similar. That means we aim to collect data from OMB daily. This allows us to assume that we can cache a fair amount of the site between collection runs.

Configuration on when the daily data cycle should be assumed new is with the following values in `src/config/index.ts`:

```js
export const cacheHeadersHour = 5;
export const cacheHeadersMinute = 0;
export const collectionTimezone = 'America/New_York';
```

## In-memory cache

There are some functions available in `server/cache.ts` that are for in-memory caching on the server. The main goal is to use them as a way to memoize functions. The two main functions are the following:

- `memoizeAsync`: More generic memoization wrapper that defaults to an hour on cache.
- `memoizeDataAsync`: Similar to above, but sets a TTL that aligns with the data cycle.
  - TODO: This may make more sense to move to a scheme where we look at the `collections` table in the database to see if there is anything newer.

These can be used similar to the following:

```js
async function expensiveTask(param1 = 2) {
  return param1 + 10;
}
const memoizedExpensiveTask = memoizeAsync(expensiveTask, { ttl: 1000 * 10 });
```

Note that the memoize functions will do a much shorter time when not in production.

## Browser cache

To help with the caching on the client cache headers are set to the data cycle as well.

Note that the cache times are much shorter for development.

## Cloudfront

(Note currently implemented)
