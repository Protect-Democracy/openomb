# Meta-tags and SEO

## Common meta-tags

To define meta-tags for a route, define them in the `+page.server.ts` or `+page.ts` file like so:

```js
/** @type {import('./$types').PageLoad} */
export function load() {
  return {
    // Other data props could go here
    pageMeta: {
      title: 'Page name',
      description: 'Description of page'
    }
  };
}
```

For supported values, see `src/routes/+layout.ts`

## Special meta-tags

For specific tags for a page that are not supported by the layout, use the normal method similar to the following:

```svelte
<svelte:head>
  <meta name="custom" content="Example" />
</svelte:head>
```
