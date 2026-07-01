---
description: CSS accessibility patterns: focus styles, contrast, motion, screen reader patterns, and high contrast mode.
paths:
  - "**/*.css"
  - "**/*.css*.jinja"
  - "**/*.svelte"
  - "**/*.svelte*.jinja"
---

# CSS Accessibility Patterns

CSS-specific accessibility guidance that complements `HTML_ACCESSIBILITY.md`. Covers focus styles, contrast, motion, screen reader patterns, and high contrast mode. For general CSS best practices, see `CSS_BEST_PRACTICES.md`.

Borrowed from: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility), [WebAIM](https://webaim.org/), [web.dev Accessibility](https://web.dev/learn/accessibility/), [A11Y Project](https://www.a11yproject.com/)

---

## Focus Styles

Sighted keyboard users cannot operate a page without a visible focus indicator — it's the equivalent of hiding the mouse cursor. Every interactive element must show a clear focus ring when navigated to via keyboard. Use `:focus-visible` rather than `:focus` so the indicator appears for keyboard navigation but not for mouse clicks.

### Two-Color Focus Indicator

Use both `outline` and `box-shadow` to create a two-color indicator that meets 3:1 contrast against any background. Add `outline: 2px solid transparent` when using `box-shadow` alone — `box-shadow` is stripped in forced-colors mode, but `outline` is preserved.

```css
/* GOOD: Two-color focus indicator */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-background);
}

/* GOOD: Fallback for older browsers */
@supports not selector(:focus-visible) {
  :focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

/* BAD: Removing focus with no replacement */
*:focus {
  outline: none;
}

/* BAD: box-shadow only — invisible in forced-colors mode */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary);
}
```

### WCAG Focus Requirements

- **SC 2.4.7 (AA):** Focus indicator must be visible.
- **SC 2.4.13 (AAA, new in 2.2):** Focus indicator must be at least 2px thick with 3:1 contrast between focused and unfocused states.
- **SC 2.4.11 (AA, new in 2.2):** Focused element must not be entirely hidden by other content (sticky headers, modals).
- **SC 1.4.11 (AA):** Focus indicator needs 3:1 contrast ratio against adjacent colors.

---

## Color Contrast

Contrast ratios ensure text remains readable for people with low vision, color deficiencies, or in challenging lighting conditions. About 1 in 12 men and 1 in 200 women have some form of color vision deficiency.

### Minimum Ratios

| Content type                                | AA minimum               | AAA target |
| ------------------------------------------- | ------------------------ | ---------- |
| Normal text (<18pt / <24px)                 | 4.5:1                    | 7:1        |
| Large text (≥18pt / ≥24px, or ≥14pt bold)   | 3:1                      | 4.5:1      |
| UI components and graphical objects         | 3:1                      | —          |
| Links distinguished from text by color only | 3:1 vs. surrounding text | —          |

### Rules

- Always set both `color` and `background-color` together. Without both, inherited or user-agent styles may create unreadable combinations.
- Do not round up contrast ratios — 4.47:1 does not meet 4.5:1.
- Place text over images only with a contrast-ensuring overlay or text shadow.

```css
/* GOOD: Both foreground and background set */
.alert {
  color: var(--color-text);
  background-color: var(--color-surface);
}

/* GOOD: Overlay for text on images */
.hero-text {
  position: relative;
  color: var(--color-white);
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.6);
}

/* BAD: Only foreground — background could be anything */
.alert {
  color: var(--color-error);
}
```

---

## Color Independence

Never use color as the only means of conveying information. Approximately 8% of men have color vision deficiency, and monochrome displays and print render color-only information invisible. Always supplement with text, icons, patterns, or border changes.

```css
/* GOOD: Error state uses color + icon + border */
.form-group:has(:invalid) {
  border-inline-start: 3px solid var(--color-error);
}

.form-group:has(:invalid)::before {
  content: '⚠ ';
}

/* GOOD: Links have underline, not just color */
a {
  color: var(--color-link);
  text-decoration: underline;
}

/* BAD: Required fields indicated only by color */
.required {
  color: red;
}
```

Review designs in grayscale as a quick check — if information disappears, you're relying on color alone.

---

## Motion & Animation

Over 35% of adults over 40 experience vestibular dysfunction. Animations can trigger dizziness, nausea, and migraines. Default to reduced motion and add animation as progressive enhancement for users who haven't indicated a preference.

### Approach: Reduced Motion First

```css
/* GOOD: Turn off all animation for the page for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* GOOD: No animation by default, enhance for users who prefer motion */
.card {
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  .card {
    transition:
      transform 200ms ease,
      opacity 200ms ease;
  }
}
```

### Duration vs. `none`

Use near-zero duration (`0.01ms`) rather than `animation: none` or `transition: none`. This preserves JavaScript `animationend` and `transitionend` event listeners that may depend on the transition completing.

```css
/* GOOD: Near-zero duration preserves JS event listeners */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* BAD: Breaks animationend/transitionend events */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### WCAG Motion Requirements

- **SC 2.3.1 (A):** No content flashes more than 3 times per second.
- **SC 2.2.2 (A):** Auto-playing animations must have pause, stop, or hide controls.
- **SC 2.3.3 (AAA):** Motion triggered by interaction can be disabled.

---

## Screen Reader Patterns

### Visually Hidden Content

The `.u-visually-hidden` pattern hides content visually while keeping it accessible to screen readers. Use it for labels, descriptions, and context that sighted users get from visual design but screen readers need explicitly.

```css
/* Standard visually-hidden pattern */
.u-visually-hidden {
  clip-path: inset(100%);
  clip: rect(1px, 1px, 1px, 1px);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

### Hiding Behavior by CSS Property

Different CSS properties have different effects on screen reader exposure. Choosing the wrong one either hides content from users who need it or clutters the experience with decorative noise.

| CSS Property                 | Visible | Announced by screen readers          |
| ---------------------------- | ------- | ------------------------------------ |
| `.u-visually-hidden` pattern | No      | Yes                                  |
| `display: none`              | No      | No (removed from accessibility tree) |
| `visibility: hidden`         | No      | No (removed from accessibility tree) |
| `opacity: 0`                 | No      | Yes (still in accessibility tree)    |
| `aria-hidden="true"` (HTML)  | Yes     | No                                   |

**Exception:** Elements referenced by `aria-describedby` or `aria-labelledby` are still exposed to screen readers even with `display: none`.

```css
/* GOOD: Hide decorative icon from screen readers */
.icon[aria-hidden='true'] {
  /* visible but not announced */
}

/* BAD: Hiding meaningful content with display: none */
.mobile-only-label {
  display: none; /* Screen readers can't see this either */
}

/* GOOD: Use visually-hidden instead */
.mobile-only-label {
  clip-path: inset(100%);
  clip: rect(1px, 1px, 1px, 1px);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

---

## Responsive Text

People with mild visual impairments need to enlarge text without assistive technology. Text must remain readable when the user zooms to 200% or overrides spacing.

### Requirements

- **SC 1.4.4 (AA):** Text resizable to 200% without loss of content or functionality.
- **SC 1.4.10 (AA):** Content usable at 320px viewport width / 400% zoom without horizontal scrolling.
- **SC 1.4.12 (AA):** Content must tolerate user-overridden text spacing (line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em).

```css
/* GOOD: rem units that scale with user preferences */
body {
  font-size: 1rem;
  line-height: 1.5;
}

/* GOOD: max-width for readable line length */
.content {
  max-width: 70ch;
}

/* BAD: Fixed height clips enlarged text */
.card {
  height: 200px;
  overflow: hidden;
}

/* GOOD: min-height allows content to grow */
.card {
  min-height: 200px;
}

/* BAD: !important on spacing prevents user overrides */
p {
  line-height: 1.2 !important;
  letter-spacing: 0 !important;
}
```

### Never Disable Zoom

The viewport meta tag `user-scalable=no` and `maximum-scale=1` prevent pinch-to-zoom. This is an HTML attribute, but CSS authors should be aware — never request these in markup.

---

## Touch Targets

Users with motor impairments, hand tremors, or limited dexterity have difficulty activating small targets. A finger is larger and less precise than a mouse pointer.

### Minimum Sizes

- **SC 2.5.8 (AA, new in 2.2):** 24×24 CSS pixels minimum, or sufficient spacing so a 24px circle centered on the target doesn't overlap adjacent targets.
- **SC 2.5.5 (AAA):** 44×44 CSS pixels minimum. Aim for this even at AA.

Use `padding` to expand the interactive area of small visual elements without increasing visible size.

```css
/* GOOD: Minimum touch target size */
button,
a,
[role='button'] {
  min-height: 44px;
  min-width: 44px;
}

/* GOOD: Expand small icon button hit area with padding */
.icon-button {
  padding: var(--space-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* GOOD: Adequate spacing between adjacent targets */
.nav a {
  padding: var(--space-xs) var(--space-sm);
}

.nav a + a {
  margin-inline-start: var(--space-xs);
}
```

---

## High Contrast Mode

Windows High Contrast mode (forced-colors) is used by people with low vision, light sensitivity, and migraines. The browser replaces most colors with the user's chosen palette. CSS must respect this — hardcoding colors inside forced-colors blocks defeats the purpose.

### Detecting and Adapting

```css
/* GOOD: Use system colors and add visible borders */
@media (forced-colors: active) {
  .card {
    border: 1px solid ButtonText;
  }

  /* box-shadow is stripped — replace with border */
  .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}

/* BAD: Hardcoded colors in forced-colors — defeats the purpose */
@media (forced-colors: active) {
  .button {
    color: #ffffff;
    background-color: #0000ff;
  }
}

/* BAD: Broadly disabling forced colors */
* {
  forced-color-adjust: none;
}
```

### Properties Affected by Forced Colors

These properties are overridden or stripped in forced-colors mode — don't rely on them as the sole visual indicator:

| Affected                                    | Behavior                          |
| ------------------------------------------- | --------------------------------- |
| `color`, `background-color`, `border-color` | Replaced with system colors       |
| `box-shadow`, `text-shadow`                 | Forced to `none`                  |
| `background-image` (gradients)              | Forced to `none` (except `url()`) |
| `outline-color`                             | Replaced with system color        |

Use `forced-color-adjust: none` sparingly — only on elements where forced colors genuinely breaks functionality (syntax highlighting, data visualizations).

### System Color Keywords

Use these instead of hardcoded values inside `@media (forced-colors: active)`: `Canvas`, `CanvasText`, `LinkText`, `ButtonText`, `ButtonFace`, `Highlight`, `HighlightText`, `Field`, `FieldText`.

---

## Print Styles

Users with low vision may print content to read at larger sizes or custom contrast. Print styles should remove interactive UI, expand link URLs, and ensure content reads linearly.

```css
@media print {
  /* Hide interactive and navigation elements */
  nav,
  .sidebar,
  .toolbar,
  button:not([type='submit']),
  .no-print {
    display: none;
  }

  /* Show link URLs inline */
  a[href]::after {
    content: ' (' attr(href) ')';
    font-size: 0.85em;
    color: inherit;
  }

  /* Don't expand internal/anchor links */
  a[href^='#']::after,
  a[href^='javascript:']::after {
    content: '';
  }

  /* Prevent page breaks inside content blocks */
  figure,
  table,
  pre,
  blockquote {
    break-inside: avoid;
  }

  /* Section headings on new pages */
  h1,
  h2 {
    break-before: page;
    break-after: avoid;
  }

  /* Ensure dark text on light background */
  body {
    color: #000;
    background: #fff;
  }
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                                        | Preferred Alternative                                    |
| --------------------------------------------------- | -------------------------------------------------------- |
| `*:focus { outline: none }` without replacement     | `:focus-visible` with visible two-color indicator        |
| `box-shadow`-only focus indicator                   | `outline` (visible in forced-colors mode) + `box-shadow` |
| Setting `color` without `background-color`          | Always set both together                                 |
| Color as the only indicator (errors, status, links) | Color + text, icon, pattern, or border                   |
| `animation: none` in reduced-motion                 | `animation-duration: 0.01ms` (preserves JS events)       |
| `display: none` on content meant for screen readers | `.u-visually-hidden` pattern                             |
| `left: -9999px` for off-screen hiding               | `.u-visually-hidden` with `clip-path`                    |
| Fixed-height containers with `overflow: hidden`     | `min-height` that allows content to grow                 |
| `px` for font sizes                                 | `rem` for scalable text                                  |
| `!important` on `line-height` or `letter-spacing`   | Allow user spacing overrides                             |
| `user-scalable=no` or `maximum-scale=1`             | Let users zoom                                           |
| Hardcoded colors inside `forced-colors`             | System color keywords (`CanvasText`, etc.)               |
| `forced-color-adjust: none` applied broadly         | Apply only to specific elements that need it             |
| Small touch targets (< 24px)                        | `min-height: 44px; min-width: 44px`                      |
| Ignoring `prefers-reduced-motion` entirely          | Reduced motion first, enhance with `no-preference`       |

---

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM: CSS Techniques](https://webaim.org/techniques/css/)
- [WebAIM: Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [web.dev Accessibility](https://web.dev/learn/accessibility/)
- [A11Y Project](https://www.a11yproject.com/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors)
- [W3C: Understanding SC 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [W3C: Understanding SC 2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
