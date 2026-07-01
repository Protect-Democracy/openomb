---
description: Svelte 5 component patterns — for use when the project upgrades to Svelte 5 runes.
---

# Svelte 5 Component Patterns

> **Future use only.** This project currently uses Svelte 4 syntax on the Svelte 5 runtime. The runes patterns in this file do not apply yet. See `SVELTE_4_BEST_PRACTICES.md` for current guidance. Reference this file when upgrading to Svelte 5.

Svelte 5 best practices for component architecture, reactivity with runes, templating, events, and styling. These apply to all `.svelte`, `.svelte.ts`, and `.svelte.js` files.

Borrowed from: [sveltejs/ai-tools svelte-core-bestpractices](https://github.com/sveltejs/ai-tools/tree/main/plugins/claude/svelte/skills/svelte-core-bestpractices), [Svelte 5 Documentation](https://svelte.dev/docs)

---

## MCP Server

If the Svelte MCP server is enabled, use its tools for up-to-date documentation and code analysis:

- `list-sections` -- discover available Svelte documentation topics
- `get-documentation` -- fetch current syntax and API details for specific topics
- `svelte-autofixer` -- analyze Svelte components for common issues and suggest fixes; use this when writing or reviewing Svelte code

---

## Reactivity with Runes

### `$state`

Use `$state` only for variables that need reactivity -- those read by `$effect`, `$derived`, or template expressions. Regular variables that don't trigger UI updates don't need it. Objects and arrays get deep reactivity through proxying, which adds overhead. For large objects that are only reassigned (like API responses), use `$state.raw` to skip the proxy cost.

```svelte
<script>
  // GOOD: Reactive counter that drives UI
  let count = $state(0);

  // GOOD: Large data that's only replaced, never mutated in place
  let apiData = $state.raw(null);

  // BAD: No reason for reactivity on a static config
  let config = $state({ maxRetries: 3 });
</script>
```

### `$derived` and `$derived.by`

Compute values from state using `$derived` instead of `$effect`. Derived values automatically update when their dependencies change, without side effects. Use `$derived` for simple expressions and `$derived.by` for complex logic that needs a function body.

```svelte
<script>
  let count = $state(0);

  // GOOD: Declarative derived value
  let doubled = $derived(count * 2);

  // GOOD: Complex logic uses $derived.by
  let summary = $derived.by(() => {
    if (count === 0) return 'none';
    return count > 10 ? 'many' : 'some';
  });

  // BAD: Using $effect to compute a value
  let doubled;
  $effect(() => {
    doubled = count * 2;
  });
</script>
```

### `$effect`

Effects are escape hatches -- use them only when no alternative exists. Resist updating state inside effects; this causes cascading reactivity and is hard to debug. Consider alternatives first:

- Syncing with external libraries (D3, maps): use `{@attach}` instead
- Responding to user interactions: put code in event handlers directly
- Debugging reactive values: use `$inspect`
- Observing external systems (WebSocket, MediaQuery): use `createSubscriber`

Server environments never execute effects, so never guard effect contents with `if (browser)`.

```svelte
<script>
  let canvas = $state();

  // GOOD: External library sync via attachment
  // {@attach drawChart} on the element

  // BAD: Effect for DOM manipulation
  $effect(() => {
    if (canvas) drawChart(canvas);
  });
</script>
```

### `$props`

Always assume props will change. Any value computed from props must use `$derived`, otherwise it captures the initial value and never updates.

```svelte
<script>
  let { type } = $props();

  // GOOD: Updates when type changes
  let color = $derived(type === 'danger' ? 'red' : 'green');

  // BAD: Captures initial value only
  let color = type === 'danger' ? 'red' : 'green';
</script>
```

### `$inspect` and `$inspect.trace`

`$inspect` is a dev-only reactive `console.log` that re-runs when its arguments change. Use `.with()` for custom callbacks (like `debugger`). Use `$inspect.trace()` as the first line in an `$effect` or `$derived.by` to diagnose which dependency caused re-execution. Both become no-ops in production builds.

```svelte
<script>
  let count = $state(0);

  // GOOD: Debug reactive value changes
  $inspect(count);

  // GOOD: Break into debugger on updates
  $inspect(count).with((type, value) => {
    if (type === 'update') debugger;
  });

  // GOOD: Trace which dependency triggered an effect
  $effect(() => {
    $inspect.trace('my-effect');
    doExpensiveWork();
  });
</script>
```

---

## Events

Use `onclick={handler}` attribute syntax for event listeners, not the legacy `on:click` directive. Supports attribute shorthand and spread. For `window` or `document` listeners, use `<svelte:window>` and `<svelte:document>` elements instead of `onMount` or `$effect`.

```svelte
<script>
  function onclick() {
    /* ... */
  }
</script>

<!-- GOOD: Attribute event handler -->
<button onclick={() => count++}>Increment</button>

<!-- GOOD: Shorthand when variable matches event name -->
<button {onclick}>Click me</button>

<!-- GOOD: Global listeners via special elements -->
<svelte:window onkeydown={handleKey} />
<svelte:document onvisibilitychange={handleVisibility} />

<!-- BAD: Legacy directive syntax -->
<button on:click={handler}>Click</button>
```

---

## Snippets & Rendering

Snippets define reusable markup chunks within a component, replacing the legacy slot system. Render them with `{@render}`. They can accept parameters, reference component state, and be passed as props. Use optional chaining for snippets that may be undefined.

```svelte
<!-- GOOD: Define and render a snippet -->
{#snippet greeting(name)}
  <p>Hello, {name}!</p>
{/snippet}

{@render greeting('world')}

<!-- GOOD: Optional snippet with fallback -->
{#if children}
  {@render children()}
{:else}
  <p>Default content</p>
{/if}

<!-- GOOD: Optional chaining shorthand -->
{@render children?.()}
```

For TypeScript, import the `Snippet` type from `'svelte'` for type-safe snippet props:

```typescript
import type { Snippet } from 'svelte';

interface Props {
  header: Snippet<[string]>;
  children: Snippet;
}
```

Non-snippet content inside a component implicitly becomes the `children` snippet. Top-level snippets in `<script module>` can be exported to other components.

---

## Each Blocks

Always use keyed each blocks so Svelte can surgically insert, move, and remove items instead of re-rendering the entire list. Keys must uniquely identify each item -- never use array indices, as they break identity when items are reordered or removed.

```svelte
<!-- GOOD: Keyed by unique identifier -->
{#each items as item (item.id)}
  <li>{item.name}</li>
{/each}

<!-- GOOD: Destructuring with key -->
{#each items as { id, name, qty }, i (id)}
  <li>{i + 1}: {name} x {qty}</li>
{/each}

<!-- BAD: Using index as key -->
{#each items as item, i (i)}
  <li>{item.name}</li>
{/each}
```

Avoid destructuring items when you need to mutate them via bindings like `bind:value={item.count}` -- destructured values lose their reactive reference.

---

## Attachments (`{@attach}`)

Attachments (Svelte 5.29+) are lifecycle functions that run when elements mount and re-run when reactive state changes. They replace the legacy `use:action` directive. Attachments can return a cleanup function and support factory patterns for parameterization.

```svelte
<script>
  import { fromAction } from 'svelte';

  // GOOD: Attachment with cleanup
  function tooltip(content) {
    return (element) => {
      const tip = createTooltip(element, content);
      return () => tip.destroy();
    };
  }

  // GOOD: Convert a legacy action to attachment
  const legacyAttachment = fromAction(legacyAction);
</script>

<!-- GOOD: Apply attachment -->
<div {@attach tooltip('Help text')}>Hover me</div>

<!-- BAD: Legacy action syntax -->
<div use:tooltip={'Help text'}>Hover me</div>
```

For expensive setup work, pass data inside a function and read it in a child effect to decouple initialization from state updates.

---

## Bindings

Function bindings (Svelte 5.9+) let you validate or transform bound values. Pass a getter and setter instead of a direct variable reference. Use `null` as the getter for readonly bindings like dimensions.

```svelte
<!-- GOOD: Transform input to lowercase -->
<input bind:value={() => value, (v) => (value = v.toLowerCase())} />

<!-- GOOD: Readonly dimension binding with handler -->
<div bind:clientWidth={null, handleResize}></div>
```

---

## Component Styling

Svelte `<style>` blocks are scoped to the component by default. Use CSS custom properties and the `style:` directive for parent-to-child theming. This keeps styles encapsulated while allowing controlled customization. Only use `:global` scoped to a wrapper element when custom properties aren't feasible (e.g., styling third-party library components).

```svelte
<!-- Parent.svelte: Pass custom property -->
<Child --accent="tomato" />
<div style:--columns={columns}>Grid content</div>

<!-- Child.svelte: Consume custom property -->
<h1>Title</h1>

<style>
  h1 {
    color: var(--accent, black);
  }
</style>
```

```svelte
<!-- GOOD: Scoped :global for library components -->
<div class="wrapper">
  <ThirdPartyComponent />
</div>

<style>
  .wrapper :global {
    h1 { color: red; }
  }
</style>

<!-- BAD: Unscoped :global leaks styles everywhere -->
<style>
  :global(h1) { color: red; }
</style>
```

For general CSS patterns, see `CSS_BEST_PRACTICES.md` and `CSS_ORGANIZATION.md`.

---

## Context

Prefer `setContext` / `getContext` over module-level state for sharing data between components. Module-level state persists across all component instances and leaks between users in server-rendered apps. Context is scoped to the component tree, preventing cross-user data contamination.

```svelte
<script>
  import { setContext, getContext } from 'svelte';

  // GOOD: Context is scoped to the component tree
  setContext('theme', { color: 'blue', size: 'lg' });

  // In a child component:
  const theme = getContext('theme');
</script>
```

Use a typed `createContext` wrapper when available for type safety:

```typescript
// context.ts
import { getContext, setContext } from 'svelte';

export function createThemeContext(theme: Theme) {
  return setContext('theme', theme);
}

export function getThemeContext(): Theme {
  return getContext('theme');
}
```

---

## Async Svelte (Experimental)

Svelte 5.36+ supports `await` expressions in `<script>` blocks, `$derived` declarations, and markup. This requires enabling the `experimental.async` flag (removed in Svelte 6). Multiple `await` expressions in markup run in parallel automatically. Use `<svelte:boundary>` with a `pending` snippet for loading states, and `$effect.pending()` for ongoing update indicators.

```javascript
// svelte.config.js
export default {
  compilerOptions: {
    experimental: { async: true }
  }
};
```

```svelte
<script>
  let { userId } = $props();
  let user = $derived(await fetchUser(userId));
</script>

<svelte:boundary>
  <p>{user.name}</p>

  {#snippet pending()}
    <p>Loading...</p>
  {/snippet}
</svelte:boundary>
```

Use `hydratable()` to prevent redundant data fetching during SSR hydration. It serializes server results and reuses them on the client. Library authors should prefix keys with their library name to avoid conflicts.

---

## Legacy Features to Avoid

Svelte 5 uses runes mode exclusively. Replace all legacy patterns:

| Legacy Pattern                          | Svelte 5 Replacement                                 |
| --------------------------------------- | ---------------------------------------------------- |
| Implicit reactivity (`let x = 0`)       | `$state`                                             |
| `$:` reactive statements                | `$derived` / `$effect` (effects only when necessary) |
| `export let` for props                  | `$props`                                             |
| `$$props`, `$$restProps`                | `$props` with rest: `let { a, ...rest } = $props()`  |
| `on:click={handler}`                    | `onclick={handler}`                                  |
| `<slot>`, `$$slots`                     | `{#snippet}` and `{@render}`                         |
| `<svelte:fragment>`                     | Snippets                                             |
| `<svelte:component this={X}>`           | `<DynamicComponent>` directly                        |
| `<svelte:self>`                         | Import self: `import Self from './Self.svelte'`      |
| Svelte stores for cross-component state | Classes with `$state` fields                         |
| `use:action`                            | `{@attach}`                                          |
| `class:active={isActive}`               | `class` attribute with clsx-style arrays/objects     |

---

## Anti-Patterns to Avoid

| Anti-Pattern                           | Preferred                                      | Why                                                     |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `$effect` to compute derived values    | `$derived` / `$derived.by`                     | Effects cause cascading updates and are harder to debug |
| `$state` on non-reactive variables     | Plain `let` / `const`                          | Unnecessary proxy overhead                              |
| `$state` on large API response objects | `$state.raw`                                   | Avoids deep proxying cost when only reassigning         |
| `if (browser)` inside `$effect`        | Remove the guard                               | Effects never run on the server                         |
| Array index as each block key          | Unique item identifier                         | Indices break identity on reorder/removal               |
| Destructuring each items with bindings | `bind:value={item.prop}`                       | Destructured values lose reactive reference             |
| Module-level shared state              | `setContext` / `getContext`                    | Module state leaks between SSR users                    |
| Unscoped `:global` styles              | `:global` inside a wrapper element             | Prevents style leakage across components                |
| `on:click` directive                   | `onclick` attribute                            | Legacy syntax, removed in Svelte 5 runes mode           |
| `<slot>` for child content             | `{#snippet children}` / `{@render children()}` | Slots are deprecated in Svelte 5                        |

---

## References

- [Svelte 5 Documentation](https://svelte.dev/docs)
- [sveltejs/ai-tools Best Practices](https://github.com/sveltejs/ai-tools/tree/main/plugins/claude/svelte/skills/svelte-core-bestpractices)
- [Svelte Runes RFC](https://svelte.dev/blog/runes)
