---
description: Svelte 4 component patterns for the current codebase: locations, structure, reactivity, events, slots, stores, lifecycle, actions, transitions, and styling.
paths:
  - "**/*.svelte"
  - "**/*.svelte.ts"
  - "**/*.svelte.js"
  - "**/*.svelte*.jinja"
  - "**/*.svelte.ts*.jinja"
  - "**/*.svelte.js*.jinja"
---

# Svelte 4 Component Patterns

> **This project runs Svelte 4 syntax on the Svelte 5 runtime.** Write all new components using the patterns in this file. Do not use Svelte 5 rune syntax (`$state`, `$derived`, `$effect`, `$props`), snippets, or attribute-style event handlers (`onclick=`). When the project upgrades to Svelte 5 runes, see `SVELTE_BEST_PRACTICES.md`.

Applies to all `.svelte`, `.svelte.ts`, and `.svelte.js` files.

---

## MCP Server

If the Svelte MCP server is enabled, use its tools for up-to-date documentation and code analysis:

- `list-sections` -- discover available Svelte documentation topics
- `get-documentation` -- fetch current syntax and API details for specific topics
- `svelte-autofixer` -- analyze Svelte components for common issues and suggest fixes; use this when writing or reviewing Svelte code

---

## Component Locations

| Type                                 | Location                                  |
| ------------------------------------ | ----------------------------------------- |
| **Page-specific** components         | Colocate with their page in `src/routes/` |
| **Reusable** components              | `src/components/`                         |
| **Stores** for cross-component state | Colocate with their relevant components   |

---

## Component Structure

Order the `<script>` block consistently: dependencies first, then props, state, lifecycle hooks, and functions. Markup follows the script block; styles go last.

```svelte
<script lang="ts">
  /**
   * Describe the component here.
   *
   * @prop name - Describe the prop here.
   *
   * Example usage:
   *
   *   <Component name="example" />
   *
   */
  // Dependencies
  import { onMount } from 'svelte';

  // Props
  export let name: string = undefined;

  // State
  let count = 0;

  // Lifecycle hooks
  onMount(() => {
    count = 1;
  });

  // Functions
  function upCount() {
    count++;
  }
</script>

<div>
  <p class="name">{name}</p>
  <p>{count}</p>
  <button on:click={upCount}>Up Count</button>
</div>

<style>
  .name {
    font-weight: bold;
  }
</style>
```

---

## Reactivity

Svelte 4 reactivity is implicit — any `let` declaration in the script block is reactive; updating it re-renders the component. Use `$:` for derived values and reactive blocks (side effects that depend on reactive state).

### Reactive declarations (`$:`)

```svelte
<script lang="ts">
  let count = 0;

  // GOOD: Derived value — recalculated when count changes
  $: doubled = count * 2;

  // GOOD: Complex derived value
  $: summary = count === 0 ? 'none' : count > 10 ? 'many' : 'some';

  // GOOD: Reactive block — runs when count changes
  $: {
    if (count > 100) {
      console.warn('High count:', count);
    }
  }

  // BAD: Don't use $state or $derived (Svelte 5 runes)
  // let count = $state(0);
  // let doubled = $derived(count * 2);
</script>
```

### When to use each pattern

| Need                              | Svelte 4 syntax           |
| --------------------------------- | ------------------------- |
| Reactive variable                 | `let x = value`           |
| Derived value                     | `$: derived = expression` |
| Reactive side-effect              | `$: { block }`            |
| Reactive label (single statement) | `$: statement`            |

---

## Props

Declare props with `export let`. Provide a default value when the prop is optional. TypeScript annotations go on the `let` declaration.

```svelte
<script lang="ts">
  // Required prop — no default
  export let id: string;

  // Optional prop with default
  export let label: string = 'Submit';
  export let disabled: boolean = false;

  // GOOD: Props are reactive; use $: to derive from them
  $: ariaLabel = disabled ? `${label} (disabled)` : label;

  // BAD: Don't capture prop values in plain let — misses updates
  // let ariaLabel = disabled ? `${label} (disabled)` : label;
</script>
```

For forwarding all remaining props (rest props), use `$$restProps`:

```svelte
<script lang="ts">
  export let value: string;
</script>

<!-- Spreads all undeclared props onto the input -->
<input bind:value {...$$restProps} />
```

---

## Events

Use the `on:` directive for event listeners. Dispatch custom events with `createEventDispatcher`. Forward events to a parent with a bare `on:eventname` (no handler).

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    submit: { value: string };
    cancel: void;
  }>();

  let value = '';

  function handleSubmit() {
    dispatch('submit', { value });
  }
</script>

<!-- GOOD: on: directive -->
<button on:click={handleSubmit}>Submit</button>
<button on:click={() => dispatch('cancel')}>Cancel</button>

<!-- GOOD: Inline handler -->
<input on:input={(e) => (value = e.currentTarget.value)} />

<!-- GOOD: Event forwarding — pass DOM events up without a handler -->
<button on:click>Forward click to parent</button>

<!-- BAD: Don't use attribute-style events (Svelte 5 syntax) -->
<!-- <button onclick={handleSubmit}>Submit</button> -->
```

For `window` or `document` listeners, use `<svelte:window>` and `<svelte:document>` instead of `onMount`:

```svelte
<svelte:window on:keydown={handleKey} on:resize={handleResize} />
<svelte:document on:visibilitychange={handleVisibility} />
```

---

## Slots

Slots let parent components pass markup into a child. Svelte 4 uses `<slot />` for default content, named slots for multiple injection points, and fallback content for when nothing is passed.

```svelte
<!-- Card.svelte -->
<div class="card">
  <!-- Named slot -->
  <header>
    <slot name="header" />
  </header>

  <!-- Default slot with fallback -->
  <div class="body">
    <slot>
      <p>No content provided.</p>
    </slot>
  </div>

  <!-- Optional named slot — only render wrapper if content provided -->
  {#if $$slots.footer}
    <footer>
      <slot name="footer" />
    </footer>
  {/if}
</div>
```

Using a slotted component:

```svelte
<Card>
  <svelte:fragment slot="header">
    <h2>Title</h2>
  </svelte:fragment>

  <p>Main body content goes here.</p>

  <svelte:fragment slot="footer">
    <button>OK</button>
  </svelte:fragment>
</Card>
```

> When upgrading to Svelte 5, slots are replaced by snippets (`{#snippet}` / `{@render}`). See `SVELTE_BEST_PRACTICES.md`.

---

## Bindings

Use `bind:` to create two-way data flow between a variable and a DOM element or child component.

```svelte
<script lang="ts">
  let text = '';
  let checked = false;
  let selected: string[] = [];
  let inputEl: HTMLInputElement;
</script>

<!-- GOOD: Two-way value binding -->
<input bind:value={text} />
<input type="checkbox" bind:checked />

<!-- GOOD: Radio / checkbox group -->
<input type="checkbox" bind:group={selected} value="a" />
<input type="checkbox" bind:group={selected} value="b" />

<!-- GOOD: Element reference -->
<input bind:this={inputEl} />

<!-- GOOD: Read-only dimension binding -->
<div bind:clientWidth={width} bind:clientHeight={height} />

<!-- BAD: Function bindings (Svelte 5.9+ only) -->
<!-- <input bind:value={() => val, (v) => val = v.toLowerCase()} /> -->
```

---

## Stores

Svelte stores provide reactive state that can be shared across components. Import from `svelte/store` and subscribe in markup with the `$` prefix.

```svelte
<!-- stores.ts (colocate with component or in src/lib) -->
<script lang="ts">
  import { writable, readable, derived } from 'svelte/store';

  // Writable — read and write from anywhere
  export const count = writable(0);

  // Readable — externally driven, read-only
  export const time = readable(new Date(), (set) => {
    const interval = setInterval(() => set(new Date()), 1000);
    return () => clearInterval(interval);
  });

  // Derived — computed from other stores
  export const doubled = derived(count, ($count) => $count * 2);
</script>
```

Using stores in a component:

```svelte
<script lang="ts">
  import { count, doubled } from './stores';

  // Subscriptions are auto-managed when using $ prefix in markup
</script>

<!-- GOOD: $prefix auto-subscribes and unsubscribes -->
<p>Count: {$count}</p>
<p>Doubled: {$doubled}</p>
<button on:click={() => $count++}>Increment</button>
<button on:click={() => count.set(0)}>Reset</button>
```

For manual subscriptions (in script, not markup), always unsubscribe to prevent memory leaks:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { count } from './stores';

  let value: number;
  const unsubscribe = count.subscribe((v) => (value = v));

  onDestroy(unsubscribe);
</script>
```

> When upgrading to Svelte 5, stores are replaced by classes with `$state` fields. See `SVELTE_BEST_PRACTICES.md`.

---

## Lifecycle Hooks

Svelte 4 provides four lifecycle hooks. All must be called during component initialization (not inside conditionals or async callbacks).

| Hook           | When it runs                                   |
| -------------- | ---------------------------------------------- |
| `onMount`      | After the component mounts to the DOM          |
| `onDestroy`    | Just before the component is removed           |
| `beforeUpdate` | Before the DOM updates due to reactive changes |
| `afterUpdate`  | After the DOM updates                          |

```svelte
<script lang="ts">
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';

  let el: HTMLElement;

  onMount(() => {
    // Safe to access the DOM here
    el.focus();

    // Return a cleanup function (called on destroy)
    return () => {
      // cleanup if needed
    };
  });

  onDestroy(() => {
    // Tear down subscriptions, intervals, etc.
  });

  beforeUpdate(() => {
    // Called before DOM updates; avoid heavy work here
  });

  afterUpdate(() => {
    // DOM is up to date; safe to read layout properties
  });
</script>

<input bind:this={el} />
```

---

## Context

Prefer `setContext` / `getContext` over module-level state for sharing data across a component tree. Module-level state persists across all component instances and leaks between users in SSR.

```svelte
<!-- Parent.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';

  setContext('theme', { color: 'blue', size: 'lg' });
</script>
```

```svelte
<!-- Child.svelte (anywhere in the tree below Parent) -->
<script lang="ts">
  import { getContext } from 'svelte';

  const theme = getContext<{ color: string; size: string }>('theme');
</script>
```

For type safety, wrap in typed helpers:

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

## Actions (use: directive)

Actions are reusable functions that run when an element mounts. They return an optional object with `update` (called when parameters change) and `destroy` (called on unmount) callbacks.

```svelte
<script lang="ts">
  // tooltip.ts
  function tooltip(node: HTMLElement, content: string) {
    const tip = createTooltip(node, content);

    return {
      update(newContent: string) {
        tip.setContent(newContent);
      },
      destroy() {
        tip.destroy();
      }
    };
  }
</script>

<!-- GOOD: use: directive -->
<button use:tooltip={'Help text'}>Hover me</button>

<!-- BAD: Don't use {@attach} (Svelte 5.29+ only) -->
<!-- <button {@attach tooltip('Help text')}>Hover me</button> -->
```

---

## Transitions

Svelte's built-in transition directives animate elements entering or leaving the DOM. Import from `svelte/transition`.

```svelte
<script lang="ts">
  import { fade, fly, slide, scale } from 'svelte/transition';

  let visible = false;
</script>

<!-- GOOD: fade in/out -->
{#if visible}
  <div transition:fade>Fades both ways</div>
{/if}

<!-- GOOD: Different in and out transitions -->
{#if visible}
  <div in:fly={{ y: 20 }} out:fade>Flies in, fades out</div>
{/if}

<!-- GOOD: Parametrized -->
{#if visible}
  <div transition:fly={{ y: 50, duration: 300 }}>Slides up</div>
{/if}

<button on:click={() => (visible = !visible)}>Toggle</button>
```

Always respect `prefers-reduced-motion` — see `CSS_ACCESSIBILITY.md`.

---

## Component Styling

Svelte `<style>` blocks are scoped to the component by default. Use CSS custom properties for parent-to-child theming. This keeps styles encapsulated while allowing controlled customization.

```svelte
<!-- Parent.svelte: Pass a custom property as a prop -->
<Child --accent="tomato" />
```

```svelte
<!-- Child.svelte: Consume the custom property -->
<h1>Title</h1>

<style>
  h1 {
    color: var(--accent, black);
  }
</style>
```

Only use `:global` when scoped to a wrapper element (e.g., styling third-party components):

```svelte
<!-- GOOD: Scoped :global -->
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

## Each Blocks

Always use keyed each blocks so Svelte can surgically insert, move, and remove items. Never use array indices as keys — they break identity when items are reordered or removed.

```svelte
<!-- GOOD: Keyed by unique identifier -->
{#each items as item (item.id)}
  <li>{item.name}</li>
{/each}

<!-- GOOD: Destructuring with key -->
{#each items as { id, name, qty }, i (id)}
  <li>{i + 1}: {name} x {qty}</li>
{/each}

<!-- BAD: Index as key -->
{#each items as item, i (i)}
  <li>{item.name}</li>
{/each}
```

Avoid destructuring items when you need to mutate them via `bind:value={item.prop}` — destructured values lose their reactive reference.

---

## Anti-Patterns to Avoid

| Anti-Pattern                           | Preferred                             | Why                                               |
| -------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| `$state(value)`                        | `let value = ...`                     | Svelte 5 rune — not available in Svelte 4 mode    |
| `$derived(expr)`                       | `$: derived = expr`                   | Svelte 5 rune — use reactive declarations instead |
| `$effect(() => { })`                   | `$: { }` reactive block               | Svelte 5 rune — not available in Svelte 4 mode    |
| `let { x } = $props()`                 | `export let x`                        | Svelte 5 rune — use export let for props          |
| `$inspect(value)`                      | `$: console.log(value)`               | Svelte 5 rune                                     |
| `onclick={handler}`                    | `on:click={handler}`                  | Attribute-style events are Svelte 5 syntax        |
| `{#snippet name}` / `{@render name()}` | `<slot name="...">`                   | Snippets replace slots in Svelte 5                |
| `{@attach fn}`                         | `use:fn`                              | Attachments replace actions in Svelte 5.29+       |
| Module-level shared state              | `setContext` / `getContext` or stores | Module state leaks between SSR users              |
| Unscoped `:global` styles              | `:global` inside a wrapper element    | Prevents style leakage across components          |
| Array index as each block key          | Unique item identifier                | Indices break identity on reorder/removal         |
| Manual `subscribe` without `onDestroy` | `$store` auto-subscription in markup  | Memory leak if not unsubscribed                   |
| Deriving from props without `$:`       | `$: derived = propValue`              | Plain `let` captures the initial value only       |

---

## References

- [Svelte 4 Documentation](https://v4.svelte.dev/docs)
- [Svelte Store Contract](https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values)
- [Svelte Transitions](https://svelte.dev/docs/svelte-transition)
- [Svelte Actions](https://svelte.dev/docs/svelte-action)
