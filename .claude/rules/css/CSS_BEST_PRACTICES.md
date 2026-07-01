---
description: CSS best practices for selectors, layout, typography, color, responsive design, animations, and performance.
paths:
  - '**/*.css'
  - '**/*.css*.jinja'
  - '**/*.svelte'
  - '**/*.svelte*.jinja'
---

# CSS Core Patterns

Comprehensive CSS best practices for vanilla CSS. These apply to all `.css` and `.css.jinja` files. For organization, naming, and architecture, see `CSS_ORGANIZATION.md`. For accessibility-specific guidance, see `CSS_ACCESSIBILITY.md`.

Borrowed from: [MDN CSS Guide](https://developer.mozilla.org/en-US/docs/Web/CSS), [web.dev Learn CSS](https://web.dev/learn/css/), [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html), [CSS-Tricks](https://css-tricks.com/)

---

## Framework Policy

**This project uses custom CSS only.** Do not write Tailwind or Bootstrap-style utility classes (`.text-red`, `.mt-4`, `.flex`, `.p-4`). These classes embed presentational logic in HTML, conflict with the semantic naming conventions used here, and are not used anywhere in the codebase.

---

## Browser Support & Progressive Enhancement

Check features against your project's [browserslist](https://browsersl.ist/) configuration or [caniuse.com](https://caniuse.com/). PostCSS with `postcss-preset-env` transpiles modern syntax for older browsers and `autoprefixer` adds vendor prefixes — do not add prefixes manually. For features that PostCSS cannot polyfill, use `@supports` to provide a fallback.

```css
/* GOOD: Progressive enhancement with @supports */
.card {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

@supports (display: grid) {
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-md);
  }
}

/* GOOD: Feature gating for newer features */
@supports (container-type: inline-size) {
  .card-wrapper {
    container-type: inline-size;
  }
}
```

### PostCSS Plugins

These PostCSS plugins make modern CSS available across your browserslist targets:

| Plugin                 | Purpose                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `postcss-preset-env`   | Transpiles modern CSS (nesting, custom media queries, `:is()`, logical properties, etc.) based on browserslist |
| `autoprefixer`         | Adds vendor prefixes based on browserslist — never add prefixes manually                                       |
| `postcss-custom-media` | Enables `@custom-media` for reusable breakpoint definitions                                                    |

---

## Selectors

Use the simplest selector that targets the right elements. Prefer element selectors scoped to a component class for semantic HTML; use standalone class selectors when the element type isn't predictable. See `CSS_ORGANIZATION.md` for naming conventions.

```css
/* GOOD: Element selectors scoped to component */
.card h2 {
  font-size: var(--font-size-lg);
}

.nav a {
  text-decoration: none;
}

/* GOOD: Class selector when element type varies */
.media__body {
  flex: 1;
}

/* GOOD: Element-qualified to enforce semantic usage */
ul.inline-list {
  list-style: none;
}
a.button {
  /* ensures .button is only applied to anchors */
}

/* BAD: Over-qualified with generic container — no semantic constraint */
div.card {
  padding: var(--space-md);
}

/* BAD: Deep descendant chain */
.page .content .sidebar .widget h3 {
  font-size: var(--font-size-sm);
}
```

### `:is()`, `:where()`, and `:has()`

These pseudo-classes reduce repetition and enable patterns that previously required JavaScript. `:is()` groups selectors and takes the highest specificity from its list. `:where()` does the same but with zero specificity — use it for base/default styles that should be trivially overridable. `:has()` selects a parent based on its children, enabling content-aware styling.

```css
/* GOOD: :is() to reduce repetition */
:is(h1, h2, h3) {
  line-height: 1.2;
}

/* GOOD: :where() for overridable defaults */
:where(ul, ol) {
  padding-inline-start: var(--space-lg);
}

/* GOOD: :has() for parent-aware styling */
.card:has(img) {
  padding-block-start: 0;
}

.form-group:has(:invalid) {
  border-color: var(--color-error);
}
```

### Nesting

Native CSS nesting is supported in all modern browsers (Baseline 2023). Use it for scoping related styles, but limit depth to 2–3 levels — deep nesting creates readability and specificity problems. PostCSS via `postcss-preset-env` transpiles nesting for older browsers.

```css
/* GOOD: Shallow nesting for scoped styles */
.card {
  padding: var(--space-md);
  border-radius: var(--radius-md);

  & h2 {
    font-size: var(--font-size-lg);
  }

  & p {
    color: var(--color-text-muted);
  }

  &:hover {
    box-shadow: var(--shadow-md);
  }
}

/* BAD: Deep nesting — hard to read, high specificity */
.page {
  .content {
    .sidebar {
      .widget {
        & h3 {
          font-size: var(--font-size-sm);
        }
      }
    }
  }
}
```

---

## Layout

Use CSS Grid for two-dimensional layouts (rows and columns together) and Flexbox for one-dimensional layouts (a single row or column). They complement each other — a grid item can be a flex container and vice versa. Never use floats for layout; floats are for wrapping text around images only.

### Grid vs. Flexbox Decision

| Use Grid when...                                | Use Flexbox when...                               |
| ----------------------------------------------- | ------------------------------------------------- |
| You need rows _and_ columns aligned             | You're distributing items along one axis          |
| The layout defines the structure (layout-first) | The content defines the structure (content-first) |
| Card grids, page layouts, data tables           | Nav bars, button groups, centering, spacing items |
| You need `minmax()`, `auto-fill`, `auto-fit`    | You need `margin-auto` to push items apart        |
| Siblings need to align across both axes         | Items only need to align along one axis           |

```css
/* GOOD: Grid for 2D card layout */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

/* GOOD: Flexbox for navigation */
.nav {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.nav .spacer {
  margin-inline-start: auto;
}

/* GOOD: Subgrid for aligned content across siblings */
.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3; /* header, body, footer */
}

/* BAD: Flexbox pretending to be a grid */
.card-grid {
  display: flex;
  flex-wrap: wrap;
}

.card-grid > * {
  width: 33.333%; /* Fragile — use Grid instead */
}
```

---

## Typography & Sizing

Use `rem` for font sizes and spacing that should scale with user preferences. Use `em` for values that should scale relative to the element's own font size (like padding within a button). Use `px` only for borders, shadows, and values that should not scale. Always use unitless `line-height`.

### Units

| Unit       | Use for                                | Why                                                   |
| ---------- | -------------------------------------- | ----------------------------------------------------- |
| `rem`      | Font size, margins, padding, widths    | Scales with root font size, respects user preferences |
| `em`       | Component-internal padding/margin      | Scales with the element's font size                   |
| `px`       | Borders, box-shadows, outlines         | Thin decorative lines shouldn't scale                 |
| `%` / `fr` | Grid tracks, widths relative to parent | Responsive proportional sizing                        |

```css
/* GOOD: rem for sizing, unitless line-height */
body {
  font-size: var(--font-size-body);
  line-height: 1.5;
}

h1 {
  font-size: var(--font-size-3xl);
  line-height: 1.2;
}

/* GOOD: em for component-relative padding */
.button {
  padding: 0.5em 1em;
  font-size: var(--font-size-base);
}

.button--large {
  font-size: var(--font-size-lg);
  /* padding scales automatically via em */
}

/* BAD: px for font size — ignores user preferences */
body {
  font-size: 16px;
  line-height: 24px; /* inherits badly */
}
```

### Fluid Typography

Use `clamp()` for font sizes that scale fluidly between a minimum and maximum. Always use `rem` for the min/max bounds so user font-size preferences are respected. Test at 200% zoom to ensure text remains resizable (WCAG 1.4.4).

```css
/* GOOD: Fluid heading that scales with viewport */
h1 {
  font-size: clamp(1.5rem, 1rem + 2vw, 3rem);
}

/* GOOD: Fluid body text with subtle scaling */
body {
  font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
}

/* BAD: vw-only — cannot be resized by user */
h1 {
  font-size: 5vw;
}
```

### Font Loading

Control how custom fonts load to avoid invisible text (FOIT) or jarring layout shifts (FOUT). `font-display: swap` shows the fallback font immediately and swaps when the custom font loads — best for body text. `font-display: optional` downloads in the background but won't swap mid-visit — best for non-critical decorative fonts.

```css
@font-face {
  font-family: 'Brand';
  src: url('/fonts/brand.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Always include system font fallbacks */
body {
  font-family:
    'Brand',
    system-ui,
    -apple-system,
    sans-serif;
}
```

---

## Color

Define colors using CSS custom properties with the two-tier token system from `CSS_ORGANIZATION.md`. For color manipulation (lightening, darkening, mixing), use `color-mix()` which has broad browser support (Baseline 2023). More advanced features like `oklch()` and relative color syntax provide perceptually uniform results — use them with `postcss-preset-env` for transpilation or `@supports` for progressive enhancement.

```css
/* GOOD: color-mix() for derived colors — broad support */
:root {
  --color-blue: #2563eb;
  --color-primary: var(--color-blue);
  --color-primary-light: color-mix(in oklch, var(--color-primary) 70%, white);
  --color-primary-dark: color-mix(in oklch, var(--color-primary) 70%, black);
}

/* GOOD: oklch for perceptually uniform palette — with fallback */
:root {
  --color-blue: #2563eb;
}

@supports (color: oklch(0 0 0)) {
  :root {
    --color-blue: oklch(0.55 0.25 260);
  }
}

/* BAD: Hardcoded hex values scattered throughout */
.button {
  background-color: #2563eb;
}

.link {
  color: #2563eb;
}

.error {
  color: #dc2626;
}
```

---

## Responsive Design

Use a mobile-first approach with `min-width` media queries for page-level layout changes. Use container queries for component-level responsiveness — components should respond to their container's size, not the viewport, so they work correctly regardless of where they're placed.

### Common Breakpoints

Define a consistent set of breakpoints as custom media queries. These provide a shared vocabulary while still allowing content-driven breakpoints where the design actually breaks. Use `postcss-custom-media` to make `@custom-media` available to all browserslist targets.

```css
/* breakpoints.css — shared breakpoint definitions */
@custom-media --bp-sm (min-width: 480px); /* Large phones, landscape */
@custom-media --bp-md (min-width: 768px); /* Tablets */
@custom-media --bp-lg (min-width: 1024px); /* Small desktops, landscape tablets */
@custom-media --bp-xl (min-width: 1280px); /* Desktops */
@custom-media --bp-2xl (min-width: 1536px); /* Large desktops */
```

```css
/* GOOD: Mobile-first with min-width */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (--bp-md) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (--bp-lg) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* BAD: Desktop-first with max-width — overriding downward */
.grid {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 1023px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

### Container Queries

Use container queries for components that need to adapt to their container's width, not the viewport. This makes components truly reusable — a card component adapts whether it's in a sidebar, a main content area, or a full-width section.

```css
/* Define containment on the wrapper */
.card-wrapper {
  container-type: inline-size;
}

/* Component responds to its container */
.card {
  display: flex;
  flex-direction: column;
}

@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}

@container (min-width: 600px) {
  .card {
    grid-template-columns: 1fr 2fr;
    display: grid;
  }
}
```

### Content-Driven Breakpoints

Use the common breakpoints above for consistency where appropriate (page layout, navigation changes). But also add content-driven breakpoints where the design actually breaks — don't force content into a predefined grid if it naturally breaks at a different width.

```css
/* Content-driven: this table wraps poorly below 520px */
@media (max-width: 520px) {
  .results-table {
    display: block;
  }

  .results-table thead {
    display: none;
  }

  .results-table td {
    display: flex;
    justify-content: space-between;
  }

  .results-table td::before {
    content: attr(data-label);
    font-weight: 700;
  }
}
```

---

## Animations & Transitions

Only animate `transform` and `opacity` — these are the only properties composited on the GPU without triggering layout or paint. Animating layout properties (`width`, `height`, `margin`, `top`, `left`) causes reflow on every frame and produces janky results.

### The Rendering Pipeline

| Property type                                     | Triggers                     | Performance                     |
| ------------------------------------------------- | ---------------------------- | ------------------------------- |
| Layout (`width`, `margin`, `top`)                 | Reflow + repaint + composite | Expensive — avoid animating     |
| Paint (`background-color`, `color`, `box-shadow`) | Repaint + composite          | Moderate — use sparingly        |
| Composite (`transform`, `opacity`)                | Composite only               | Cheap — preferred for animation |

```css
/* GOOD: Animate transform and opacity */
.card {
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}

.card:hover {
  transform: translateY(-2px);
  opacity: 0.95;
}

/* GOOD: Use scale instead of width for grow effects */
.button:active {
  transform: scale(0.97);
}

/* BAD: Animating layout properties */
.card:hover {
  margin-top: -2px; /* triggers reflow every frame */
  width: 102%; /* triggers reflow every frame */
}

/* BAD: Animating box-shadow directly */
.card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15); /* triggers repaint */
}

/* GOOD: Animate opacity of a pseudo-element shadow instead */
.card {
  position: relative;
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  opacity: 0;
  transition: opacity 200ms ease;
  border-radius: inherit;
  pointer-events: none;
}

.card:hover::after {
  opacity: 1;
}
```

### `will-change`

`will-change` is a last resort for jank, not a premature optimization. Each `will-change: transform` element creates a new GPU compositor layer, consuming memory. Only apply it just before an animation starts, and remove it after.

```css
/* BAD: Permanent will-change on many elements */
.card {
  will-change: transform;
}

/* GOOD: Apply only during interaction */
.card:hover {
  will-change: transform;
}
```

### Entry Animations

`@starting-style` enables transition animations for elements entering the DOM or moving from `display: none`. PostCSS via `postcss-preset-env` can provide fallback support.

```css
.modal {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}

@starting-style {
  .modal {
    opacity: 0;
    transform: translateY(1rem);
  }
}
```

---

## Modern CSS Features

Use modern CSS features with progressive enhancement. PostCSS with `postcss-preset-env` transpiles many of these for older browsers. For features without PostCSS support, use `@supports` to provide fallbacks.

### Logical Properties

Use logical properties (`margin-inline`, `padding-block`, `inset-inline`) instead of physical properties (`margin-left`, `padding-top`). They adapt automatically to writing direction (LTR/RTL) and writing mode, and `postcss-preset-env` transpiles them for older browsers.

```css
/* GOOD: Logical properties — works in any writing direction */
.card {
  margin-block: var(--space-md);
  padding-inline: var(--space-lg);
  border-inline-start: 3px solid var(--color-primary);
}

/* BAD: Physical properties — breaks in RTL */
.card {
  margin-top: var(--space-md);
  margin-bottom: var(--space-md);
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
  border-left: 3px solid var(--color-primary);
}
```

### `aspect-ratio`

Use `aspect-ratio` instead of the old padding-top hack for maintaining proportions on images, videos, and containers.

```css
/* GOOD: aspect-ratio */
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.avatar {
  aspect-ratio: 1;
  border-radius: var(--radius-full);
  object-fit: cover;
}

/* BAD: Padding hack */
.video-wrapper {
  position: relative;
  padding-top: 56.25%;
}
```

### Scroll Snap

Native scroll snapping for carousels and scrollable sections without JavaScript.

```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: var(--space-md);
}

.carousel > * {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

---

## Performance

### `content-visibility`

`content-visibility: auto` defers rendering of off-screen content, significantly improving initial load performance. Pair it with `contain-intrinsic-size` to prevent scroll bar jank. Content remains in the DOM and accessibility tree — no negative impact on screen readers.

```css
/* GOOD: Defer rendering of off-screen sections */
.results-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

### `contain`

The `contain` property tells the browser that changes inside an element don't affect elements outside it, allowing rendering optimizations. Use `contain: content` (shorthand for `layout paint`) on independent sections.

```css
/* GOOD: Isolate component rendering */
.card {
  contain: content;
}

/* BAD: contain: size without explicit dimensions — collapses to 0x0 */
.card {
  contain: strict;
}
```

### Selector Efficiency

Browsers read selectors right-to-left. A broad rightmost selector (tag name, `*`) forces checking every element. In large DOMs (10,000+ elements), this matters. Prefer class selectors as the rightmost key.

```css
/* GOOD: Specific key selector */
.nav a {
}
.card h2 {
}

/* BAD: Broad key selector in large DOMs */
.page * {
}
.sidebar div {
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                                 | Preferred Alternative                       |
| -------------------------------------------- | ------------------------------------------- |
| Manual vendor prefixes                       | PostCSS with `autoprefixer`                 |
| `px` for font sizes                          | `rem` (or `em` for component-relative)      |
| `line-height` with units (`px`, `em`)        | Unitless `line-height` (e.g., `1.5`)        |
| Floats for layout                            | CSS Grid or Flexbox                         |
| Animating `width`, `height`, `margin`, `top` | Animate `transform` and `opacity`           |
| `will-change` on many elements permanently   | Apply only during interaction, remove after |
| Desktop-first with `max-width` queries       | Mobile-first with `min-width` queries       |
| `vw`-only font sizes (can't be user-resized) | `clamp()` with `rem` min/max bounds         |
| Hardcoded hex colors scattered throughout    | CSS custom properties with semantic tokens  |
| Padding-top hack for aspect ratio            | `aspect-ratio` property                     |
| Physical properties (`margin-left`)          | Logical properties (`margin-inline-start`)  |
| Deep descendant selectors (5+ levels)        | Flat class or scoped element selectors      |
| Missing `font-display` in `@font-face`       | `font-display: swap` or `optional`          |
| `@import` without `layer()` for vendor CSS   | `@import url(...) layer(reset)`             |
| Setting `color` without `background-color`   | Always set both foreground and background   |
| Repeated values not in the token system      | Add to `variables.css` and keep CSS DRY     |

---

## References

- [MDN CSS Guide](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [web.dev Learn CSS](https://web.dev/learn/css/)
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [CSS-Tricks](https://css-tricks.com/)
- [Smashing Magazine CSS](https://www.smashingmagazine.com/category/css/)
- [MDN Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)
- [web.dev Responsive Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [web.dev CSS Animations Performance](https://web.dev/articles/animations-guide)
- [MDN content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)
- [postcss-preset-env](https://preset-env.cssdb.org/)
