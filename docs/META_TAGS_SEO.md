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

## JSON-LD Schema

By default, the site will provide a [`WebSite`](https://schema.org/WebSite) schema object based on the provided metadata.

We can also add a few additional values for better search result display:

```js
/** @type {import('./$types').PageLoad} */
export function load() {
  return {
    pageMeta: {
      // Specific page values
      title: 'Page name',
      description: 'Description of page'

      // Display breadcrumbs for navigation
      breadcrumbs: [
        { title: 'Category', url: '/category'},
        { title: 'Subcategory', url: '/category/sub'},
      ],
      // Display search bar for apportionments
      includeSearch: true,
    }
  };
}
```

We can also use our own custom schema. The example below shows a page that will return a [`Dataset`](https://schema.org/Dataset) schema object.

```js
/** @type {import('./$types').PageLoad} */
import { fileSchema } from '$lib/schema';

export function load() {
  return {
    pageMeta: {
      // Override our schema to be a file dataset rather than a website
      schema: fileSchema(file)
    }
  };
}
```
