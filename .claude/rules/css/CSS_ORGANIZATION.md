---
description: CSS architecture: file organization, cascade layers, custom properties, and naming conventions.
paths:
  - "**/*.css"
  - "**/*.css*.jinja"
  - "**/*.svelte"
  - "**/*.svelte*.jinja"
---

# CSS Organization & Architecture

How to structure, layer, and name CSS for maintainability and predictability. The goal is a codebase where someone can write plain, semantic HTML and have it styled correctly — classes enhance beyond defaults rather than providing them.

Borrowed from: [ITCSS](https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture), [MaintainableCSS](https://maintainablecss.com/), [MDN CSS Organization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Organizing), [CSS Cascade Layers (CSS-Tricks)](https://css-tricks.com/css-cascade-layers/)

---

## Browser Support

Check features against your project's [browserslist](https://browsersl.ist/) configuration or [caniuse.com](https://caniuse.com/) if no browserslist exists. PostCSS with `postcss-preset-env` and `autoprefixer` handles vendor prefixes and syntax transpilation — do not add vendor prefixes manually. If a feature isn't supported across your target browsers, use it only with a suitable PostCSS plugin or polyfill, or provide a graceful fallback with `@supports`.

---

## Project File Structure

Global styles live in `src/styles/`. Each file has a specific role in the cascade:

| File              | Purpose                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `index.css`       | Main entry point; imports all other files in cascade order                   |
| `index-email.css` | Email entry point; includes `email.css`                                      |
| `fonts.css`       | Font declarations (actual imports happen via npm in `layout.svelte`)         |
| `variables.css`   | All CSS custom properties                                                    |
| `elements.css`    | Base element styles (no classes or IDs)                                      |
| `components.css`  | Reusable classes common across the application                               |
| `utilities.css`   | Override utilities (`!important`); accessibility and progressive enhancement |
| `email.css`       | Email-specific layout overrides                                              |

**Cascade order**: `modern-normalize → fonts → variables → elements → components → utilities`

Component-specific styles live in the Svelte component's `<style>` block — not in `src/styles/`. This keeps global CSS focused on shared patterns.

### Email Styles

Email styles go in `src/styles/email.css`. Write for email client compatibility: avoid modern CSS features, keep it simple. The email rendering pipeline (`src/lib/server/email/`) inlines styles, but compatibility-first authoring is still best practice.

---

## File Organization

Organize CSS files from broadest reach and lowest specificity to narrowest reach and highest specificity. This follows the ITCSS (Inverted Triangle CSS) principle — the cascade works _for_ you when styles are ordered from general to specific. Each layer should be in its own file or directory, imported in order.

### Layer Order

```css
/* main.css — import everything in cascade order */
@layer reset, base, components, utilities;

@import 'variables.css' layer(base);
@import 'reset.css' layer(reset);
@import 'elements.css' layer(base);
@import 'components/index.css' layer(components);
@import 'utilities.css' layer(utilities);
```

| Layer             | Purpose                                                                                                                                                              | Example                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Variables**     | CSS custom properties in `:root`. No selectors, no output beyond custom properties.                                                                                  | `--color-primary`, `--space-md`, `--font-size-base`  |
| **Reset**         | Normalize browser defaults. Remove margins, set `box-sizing: border-box`, establish consistent baselines.                                                            | `*, *::before, *::after { box-sizing: border-box; }` |
| **Base elements** | Default styles for bare HTML elements — no class names. A page with plain semantic HTML should look correct after this layer.                                        | `h1`, `p`, `a`, `ul`, `table`, `button`, `input`     |
| **Components**    | Reusable, cross-application component styles using class selectors. Component-specific styles for Svelte or similar frameworks live in the component file, not here. | `.card`, `.nav`, `.modal`, `.alert`                  |
| **Utilities**     | Single-purpose helper classes, prefixed with `.u-`. Used sparingly for overrides that don't belong to a component.                                                   | `.u-visually-hidden`, `.u-text-center`, `.u-nowrap`  |

### Base Elements — Semantic HTML Should Just Work

The base elements layer is critical. It styles bare HTML elements (`h1`–`h6`, `p`, `a`, `ul`, `ol`, `blockquote`, `table`, `form`, `input`, `button`) so that well-structured semantic HTML produces a usable, readable page with zero classes. Classes then _enhance_ beyond these defaults rather than _providing_ them.

```css
/* BAD: No base styles — every element needs a class to look right */
h1 {
  /* nothing here, all heading styles require .heading-xl */
}

/* GOOD: Base styles make semantic HTML usable out of the box */
h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1.2;
  margin-block: var(--space-lg) var(--space-md);
}

a {
  color: var(--color-link);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.15em;
}

a:hover {
  color: var(--color-link-hover);
}
```

### Element Classes in the Base Layer

Occasionally the most semantic HTML element doesn't match the visual treatment needed — for example, a `<span>` that should look like a heading, or an `<a>` that should look like a button. For these cases, define element classes alongside their base element styles. Use this sparingly — the semantic element should always be preferred when available.

```css
/* Base element styles with matching classes */
h1,
.h1 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: 1.2;
}

h2,
.h2 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1.25;
}

button,
.button {
  display: inline-flex;
  align-items: center;
  padding: 0.5em 1em;
  font-size: var(--font-size-base);
  cursor: pointer;
}
```

### Component-Specific Styles

Global component styles live in the components layer. These should only be classes for patterns that don't map to a specific semantic HTML element — for example, `.card`, `.alert`, `.modal`. If a semantic element exists (`nav`, `header`, `table`, `button`), style it in the base elements layer instead of creating a class. However, _variants_ of semantic elements belong in the components layer using a semantically-named class on the element — for example, `table.responsive` for a table that stacks on mobile, or `nav.inline` for a horizontal inline navigation. The base layer defines the default; the components layer defines the variations.

```css
/* Base layer — default table and nav styles */
table {
  /* ... */
}
nav {
  /* ... */
}

/* Components layer — semantic variants */
table.responsive {
  /* stacking behavior for narrow viewports */
}

nav.inline {
  display: flex;
  gap: var(--space-sm);
}
```

Styles specific to a single Svelte (or similar framework) component live in that component's `<style>` block — not in the global stylesheet. This keeps global CSS focused on shared patterns.

---

## CSS Custom Properties (Variables)

Use a two-tier token system: **primitive** variables define raw values, **semantic** variables map those values to purposes. This separation means theming (dark mode, rebrand) only requires redefining semantic tokens — components are untouched.

### Tier 1 — Primitive Variables

Direct value assignments. These name the value itself. Use category prefixes: `--color-*`, `--space-*`, `--font-*`, `--radius-*`, `--shadow-*`.

```css
:root {
  /* Colors — direct values */
  --color-red-500: #dc2626;
  --color-blue-600: #2563eb;
  --color-gray-100: #f3f4f6;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  --color-white: #ffffff;

  /* Spacing scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Font families — include full stacks with system fallbacks */
  --font-medalo: 'Medalo', system-ui, -apple-system, sans-serif;
  --font-wingdings: 'Wingdings', Georgia, serif;
  --font-mono: 'Fira Code', ui-monospace, monospace;

  /* Font sizes */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;
}
```

### Tier 2 — Semantic Variables

Map primitives to purposes. These name the _intent_, not the value. When theming, redefine only these.

```css
:root {
  /* Color semantics */
  --color-primary: var(--color-blue-600);
  --color-text: var(--color-gray-900);
  --color-text-muted: var(--color-gray-700);
  --color-link: var(--color-blue-600);
  --color-link-hover: var(--color-blue-600);
  --color-background: var(--color-white);
  --color-surface: var(--color-gray-100);
  --color-error: var(--color-red-500);
  --color-border: var(--color-gray-100);

  /* Spacing semantics */
  --space-section: var(--space-2xl);
  --space-component: var(--space-lg);
  --space-element: var(--space-md);

  /* Font family semantics */
  --font-copy: var(--font-medalo);
  --font-heading: var(--font-wingdings);
  --font-code: var(--font-mono);

  /* Font size semantics */
  --font-size-body: var(--font-size-base);
  --font-size-heading: var(--font-size-2xl);
}
```

### Theming with Semantic Variables

Dark mode or alternate themes redefine semantic variables. Components reference semantic variables and adapt automatically.

```css
/* Dark theme — only semantic tokens change */
[data-theme='dark'] {
  --color-text: var(--color-gray-100);
  --color-text-muted: var(--color-gray-100);
  --color-background: var(--color-gray-900);
  --color-surface: var(--color-gray-700);
  --color-border: var(--color-gray-700);
}

/* Respect OS preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-text: var(--color-gray-100);
    --color-background: var(--color-gray-900);
    /* ... same overrides as [data-theme="dark"] */
  }
}
```

### Scoping Variables

| Scope              | Use case                  | Example                                          |
| ------------------ | ------------------------- | ------------------------------------------------ |
| `:root`            | Global system-wide tokens | Brand colors, type scale, spacing                |
| Theme selector     | Mode-specific overrides   | `[data-theme="dark"]` redefining semantic tokens |
| Component selector | Localized values          | `.card { --card-padding: var(--space-md); }`     |

---

## Cascade Layers

CSS `@layer` declarations control cascade priority independently of specificity. Later layers override earlier layers regardless of selector specificity within those layers. This makes specificity conflicts structurally impossible across layers.

Declare all layers upfront in a single statement to establish priority:

```css
@layer reset, base, components, utilities;
```

### Why Layers Help

Without layers, a high-specificity selector in your reset can inadvertently override a component style, leading to `!important` escalation. With layers, the component layer always beats the reset layer — even if the reset uses `#id` selectors and the component uses a single class.

### Importing Third-Party CSS

Import vendor stylesheets into a low-priority layer so your styles always take precedence:

```css
@import url('normalize.css') layer(reset);
@import url('vendor-widget.css') layer(reset);
```

### The `!important` Reversal

`!important` inverts layer priority. For layers `reset, base, components, utilities`:

- Normal: utilities > components > base > reset
- `!important`: reset > base > components > utilities

This is intentional — it lets foundational layers enforce essential declarations (like `box-sizing: border-box` in the reset).

---

## Naming Conventions

Name classes semantically — describe _what_ the element is, not how it looks. This allows visual changes without HTML updates and produces code that is self-documenting.

### Semantic Element Selectors Over Excessive Classes

Prefer element selectors scoped to a component class when the HTML structure is semantic and predictable. This reduces class noise and reinforces the use of correct semantic HTML. Reserve class-based element notation (BEM `__element`) for cases where the element type isn't semantically fixed.

```css
/* GOOD: Semantic element selectors scoped to component */
.card h2 {
  font-size: var(--font-size-lg);
  margin-block-end: var(--space-sm);
}

.card p {
  color: var(--color-text-muted);
}

.nav a {
  text-decoration: none;
  padding: var(--space-xs) var(--space-sm);
}

/* GOOD: article.card for more specificity when needed */
article.card h2 {
  font-size: var(--font-size-xl);
}

/* BAD: Over-classed — adds noise without benefit */
.card__title {
  font-size: var(--font-size-lg);
}

.card__description {
  color: var(--color-text-muted);
}

.nav__link {
  text-decoration: none;
}
```

### Element-Qualified Class Selectors to Enforce Semantics

Prefer an element-qualified selector like `ul.inline-list` over a bare `.inline-list` when the class is only meaningful on a specific semantic element. The qualifier narrows valid usage and enforces correct HTML — `<div class="inline-list">` simply won't match. This is distinct from over-qualifying with a generic container like `div.card`, where the `div` adds no semantic constraint and only inflates specificity.

```css
/* GOOD: qualifier enforces the class is only used on the right element */
ul.inline-list {
  list-style: none;
}

fieldset.checkboxes {
  border: none;
}

a.button {
  /* ensures .button is on an anchor, not a div */
}

/* BAD: generic container adds no semantic constraint */
div.card {
  padding: var(--space-md);
}
```

### BEM-Like Modifiers (Self-Contained)

Use a **BEM-like** naming convention for variants: `{block}--{modifier}` (`.button--primary`, `.card--featured`), and `{block}__{element}` only when the child's element type isn't semantically predictable (e.g. a slot that could be any element).

Unlike strict BEM, modifier classes should be **self-contained** — applying `.button--primary` alone should fully style the element without also requiring the base `.button` class. Achieve this by including modifier classes in the base rule's selector list so they inherit the shared base styles, then add only the modifier-specific overrides in the modifier's own rule.

```css
/* Base styles apply to the block and every modifier — no need to combine classes */
.button,
.button--primary,
.button--secondary {
  display: inline-flex;
  padding: 0.5em 1em;
  border-radius: var(--radius-sm);
}

/* Modifier-specific overrides */
.button--primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.button--secondary {
  background-color: transparent;
  border: 1px solid var(--color-border);
}

/* BEM element — justified when element type varies */
.media__body {
  flex: 1;
}
```

`<button class="button--primary">` renders correctly on its own; developers never need to combine `.button` and `.button--primary`.

### Avoid Presentational Class Names

Class names should describe purpose, not appearance. If the visual design changes, presentational names become misleading.

```css
/* BAD: Presentational — what happens when the color changes? */
.text-red {
  color: red;
}
.mt-4 {
  margin-top: 1rem;
}
.float-left {
  float: left;
}

/* GOOD: Semantic — describes purpose */
.error-message {
  color: var(--color-error);
}
.section {
  margin-block-start: var(--space-section);
}
```

### Utility Class Prefix

Utilities are the exception to semantic naming. Prefix them with `.u-` to clearly signal their role and distinguish them from component classes.

Reserve the `.u-` prefix for utilities that use `!important` to override other styles — the prefix communicates "this wins." A helper that does not (and should not) use `!important` — for example, a visibility toggle driven by runtime state that never competes with other rules — does not belong under `.u-`. Drop the prefix and leave it in the utilities layer, or move it to the components layer if that fits better.

```css
/* GOOD: u- prefix paired with !important — this overrides */
.u-visually-hidden {
  clip-path: inset(100%) !important;
  clip: rect(1px, 1px, 1px, 1px) !important;
  height: 1px !important;
  overflow: hidden !important;
  position: absolute !important;
  white-space: nowrap !important;
  width: 1px !important;
}

.u-text-center {
  text-align: center !important;
}

/* GOOD: non-overriding helper — no u- prefix, no !important */
.no-js-only-block {
  display: block;
}

.has-js .no-js-only-block {
  display: none;
}
```

---

## Specificity Management

Specificity should trend upward as you move through the stylesheet — from reset (lowest) to utilities (highest). Within a layer, keep specificity as flat and low as possible.

### Rules

- **Never use IDs for styling.** IDs have specificity of `1,0,0` — a single ID outweighs 10 classes. Reserve IDs for JavaScript hooks and fragment links.
- **Prefer single-class selectors.** Flat specificity of `0,1,0` is predictable and easy to override.
- **Use `:where()` for zero-specificity defaults** that should be trivially overridable.
- **Use `:is()` for grouping** — but be aware it takes the specificity of its most-specific argument.
- **Avoid `!important`** except in utility classes and foundational layer declarations where it's intentional.
- **Limit nesting depth** to 2–3 levels. Deep nesting inflates specificity and reduces readability.

```css
/* GOOD: Low, flat specificity */
.card {
  /* 0,1,0 */
}
.card h2 {
  /* 0,1,1 */
}
.card--featured {
  /* 0,1,0 */
}

/* GOOD: Zero-specificity defaults with :where() */
:where(h1, h2, h3) {
  line-height: 1.2;
}

/* BAD: Specificity arms race */
#main .content .card .card-header h2 {
  /* 1,3,1 — nightmare to override */
}
div.card {
  /* 0,1,1 — unnecessarily qualified */
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                                                  | Preferred Alternative                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| No file organization (one giant stylesheet)                   | Layered file structure: variables → reset → base → components → utilities                |
| Hardcoded values throughout (`#3498db`, `16px`)               | CSS custom properties with two-tier tokens                                               |
| Presentational class names (`.text-red`, `.mt-4`)             | Semantic names describing purpose (`.error-message`, `.section`)                         |
| Tailwind-style utility-first approach                         | Semantic classes with minimal `.u-` prefixed utilities                                   |
| Styling with IDs                                              | Class selectors only                                                                     |
| `!important` to win specificity battles                       | Fix the cascade — lower specificity or use layers                                        |
| Deep nesting (4+ levels)                                      | Flat selectors, max 2–3 levels                                                           |
| BEM element classes for semantic HTML (`.card__title`)        | Scoped element selectors (`.card h2`)                                                    |
| Over-qualified with generic container (`div.card`)            | Bare class, or element-qualified for semantic enforcement (`ul.inline-list`, `a.button`) |
| Modifier requires base class (`.button` + `.button--primary`) | Self-contained modifier via shared base selector (`.button, .button--primary { … }`)     |
| `u-` prefix on helpers that don't use `!important`            | Reserve `u-` for `!important` overrides; drop prefix otherwise                           |
| Mixing themes/modes with scattered `!important`               | Semantic variables redefined per theme                                                   |
| Manual vendor prefixes                                        | PostCSS with `autoprefixer`                                                              |
| One-off values not in the token system                        | Add to primitive variables or use existing tokens                                        |

---

## References

- [ITCSS: Scalable and Maintainable CSS Architecture](https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture)
- [How I Structure My CSS — Matthias Ott](https://matthiasott.com/notes/how-i-structure-my-css)
- [MaintainableCSS](https://maintainablecss.com/)
- [CSS Cascade Layers Guide — CSS-Tricks](https://css-tricks.com/css-cascade-layers/)
- [Getting Started With CSS Cascade Layers — Smashing Magazine](https://www.smashingmagazine.com/2022/01/introduction-css-cascade-layers/)
- [MDN: CSS Cascade and Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)
- [BEM Naming Convention](https://getbem.com/naming/)
- [Class-Less CSS FTW! — The Spicy Web](https://www.spicyweb.dev/css-nouveau/1-vanilla-has-never-tasted-so-hot/5-class-less-css-ftw!/)
