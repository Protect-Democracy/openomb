---
description: HTML accessibility patterns: ARIA, keyboard navigation, and WCAG 2.2 compliance.
paths:
  - "**/*.html"
  - "**/*.html*.jinja"
  - "**/*.svelte"
  - "**/*.svelte*.jinja"
---

# HTML Accessibility Patterns

Deeper accessibility guidance beyond the inline basics covered in `HTML_BEST_PRACTICES.md`. Based on WCAG 2.2, MDN, web.dev, and WebAIM. For foundational HTML patterns (semantic elements, form labels, alt text basics), see `HTML_BEST_PRACTICES.md`.

Borrowed from: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility), [web.dev Accessibility](https://web.dev/learn/accessibility/), [WebAIM WCAG Checklist](https://webaim.org/standards/wcag/checklist)

---

## ARIA Usage

### First Rule: Don't Use ARIA

If a native HTML element has the semantics you need, use it. "No ARIA is better than bad ARIA."

```html
<!-- BAD: Redundant ARIA — button already has button semantics -->
<button role="button">Submit</button>

<!-- GOOD: Native element, no ARIA needed -->
<button>Submit</button>

<!-- BAD: Div with ARIA to recreate a button -->
<div role="button" tabindex="0" aria-pressed="false" onclick="toggle()">Toggle</div>

<!-- GOOD: Native button handles all of this -->
<button aria-pressed="false" onclick="toggle()">Toggle</button>

<!-- BAD: ARIA label duplicates visible text -->
<button aria-label="Submit">Submit</button>

<!-- GOOD: Screen readers already read the button text -->
<button>Submit</button>
```

### Labeling with ARIA

Use `aria-labelledby` and `aria-describedby` when labels need to reference existing visible text or when additional context is needed.

```html
<!-- aria-labelledby: references visible text as the accessible name -->
<section aria-labelledby="results-heading">
  <h2 id="results-heading">Election Results</h2>
  <p>Updated every 15 minutes.</p>
</section>

<!-- aria-describedby: adds supplementary description -->
<label for="password">Password</label>
<input type="password" id="password" name="password" aria-describedby="password-requirements" />
<p id="password-requirements">Must be at least 12 characters with one number and one symbol.</p>

<!-- Multiple descriptions -->
<input type="email" id="email" name="email" aria-describedby="email-hint email-error" />
<p id="email-hint">We'll never share your email.</p>
<p id="email-error" role="alert" hidden>Please enter a valid email address.</p>
```

### Live Regions

Announce dynamic content changes to screen readers without moving focus.

```html
<!-- Status messages — polite, waits for screen reader to finish current speech -->
<div aria-live="polite" aria-atomic="true">
  <p>Results updated: 42 counties reporting.</p>
</div>

<!-- Urgent alerts — assertive, interrupts current speech -->
<div role="alert">
  <p>Connection lost. Attempting to reconnect.</p>
</div>

<!-- Loading indicators -->
<div aria-live="polite" aria-busy="true">Loading results...</div>

<!-- BAD: Too many live regions — causes screen reader overload -->
<!-- Only use live regions for content the user needs to know about immediately -->
```

### Role Attribute

Only use `role` when native semantics don't fit. Never override native semantics with a contradictory role.

```html
<!-- BAD: Contradicts native semantics -->
<button role="heading">Not a heading</button>

<!-- GOOD: role for custom widgets where no native element fits -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1">Tab 1 content</div>
<div role="tabpanel" id="panel-2" hidden>Tab 2 content</div>
```

---

## Keyboard Navigation

### All Interactive Elements Must Be Keyboard-Operable

Everything operable by mouse must also work with keyboard (Tab, Enter, Space, Escape, arrow keys as appropriate).

```html
<!-- GOOD: Native elements are keyboard-accessible by default -->
<button onclick="doAction()">Action</button>
<a href="/page">Navigate</a>
<input type="text" name="search" />
<select name="filter">
  ...
</select>

<!-- BAD: Custom interactive element with no keyboard support -->
<div class="dropdown-trigger" onclick="toggleDropdown()">Select option</div>

<!-- If you must use a non-interactive element (rare), add full keyboard support -->
<div
  role="button"
  tabindex="0"
  onclick="doAction()"
  onkeydown="if(event.key==='Enter'||event.key===' ')doAction()"
>
  Action
</div>
<!-- But prefer: <button onclick="doAction()">Action</button> -->
```

### Focus Trapping

Never trap keyboard focus — except inside modal dialogs where trapping is expected.

```html
<!-- GOOD: Native dialog traps focus correctly -->
<dialog id="modal">
  <h2>Modal Title</h2>
  <p>Content here.</p>
  <button onclick="this.closest('dialog').close()">Close</button>
</dialog>

<!-- BAD: Custom modal with no focus management -->
<div class="modal-overlay">
  <div class="modal">
    <!-- Tab key can escape to background content -->
  </div>
</div>
```

### Tabindex

The `tabindex` attribute controls whether and how an element participates in keyboard tab order. Most of the time you don't need it — native interactive elements (`<button>`, `<a>`, `<input>`) are already in the tab order. Use `tabindex="0"` only when you've built a custom interactive widget from a non-interactive element and need it to be reachable by Tab. Use `tabindex="-1"` when an element needs to receive focus programmatically (e.g., moving focus to an error summary after form submission) but shouldn't be in the normal tab sequence. Never use positive values — they override the natural DOM order, creating a confusing and unpredictable tab sequence that's nearly impossible to maintain as the page evolves.

```html
<!-- GOOD: tabindex="0" — element participates in natural tab order -->
<div role="button" tabindex="0">Custom control</div>

<!-- GOOD: tabindex="-1" — focusable via JavaScript but not in tab order -->
<div id="error-summary" tabindex="-1">
  <!-- Focus moved here programmatically after form validation -->
</div>

<!-- BAD: Positive tabindex — creates unpredictable tab order -->
<input tabindex="3" name="first" />
<input tabindex="1" name="second" />
<input tabindex="2" name="third" />

<!-- GOOD: Let DOM order determine tab order -->
<input name="first" />
<input name="second" />
<input name="third" />
```

### Visible Focus Indicators

Never remove focus outlines without providing an alternative. Focus must not be fully obscured by other elements.

```html
<!-- BAD: Removes focus indicator entirely -->
<style>
  *:focus {
    outline: none;
  }
</style>

<!-- GOOD: Custom focus style that meets contrast requirements -->
<style>
  :focus-visible {
    outline: 2px solid #005fcc;
    outline-offset: 2px;
  }
</style>
```

### Skip Navigation

Provide a skip link near the top of `<body>` so keyboard users can bypass repeated navigation.

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <nav><!-- Long navigation --></nav>
  </header>
  <main id="main-content">
    <!-- Page content -->
  </main>
</body>

<!-- CSS to visually hide until focused -->
<style>
  .skip-link {
    position: absolute;
    left: -9999px;
  }
  .skip-link:focus {
    position: static;
  }
</style>
```

---

## Heading Hierarchy

Headings define document structure for screen readers and assistive technology. Screen reader users navigate by headings — a broken hierarchy makes the page hard to understand.

```html
<!-- BAD: Skipped levels and multiple h1 -->
<h1>Site Title</h1>
<h1>Page Title</h1>
<h3>Subsection</h3>

<!-- GOOD: One h1, sequential hierarchy -->
<h1>Election Results Dashboard</h1>
<h2>State Races</h2>
<h3>Governor</h3>
<h3>Senate</h3>
<h2>County Races</h2>
<h3>Sheriff</h3>
```

- One `<h1>` per page — the primary topic.
- Never skip levels (e.g., `<h2>` to `<h4>`).
- Use CSS classes for visual sizing; heading level communicates structure, not appearance.

---

## Link and Button Patterns

### Descriptive Link Text

Screen reader users frequently navigate by pulling up a list of all links on a page, read out of context from the surrounding text. "Click here" and "Read more" are meaningless in that list. Every link's text should make sense on its own — a user should understand where the link goes or what it does without reading the paragraph around it.

```html
<!-- BAD: Ambiguous — screen readers often list all links out of context -->
<a href="/report">Click here</a>
<a href="/report">Read more</a>
<a href="/report">Learn more</a>

<!-- GOOD: Descriptive, self-contained meaning -->
<a href="/report">Read the full anomaly report</a>

<!-- BAD: URL as link text -->
<a href="https://example.com">https://example.com</a>

<!-- GOOD: Descriptive text -->
<a href="https://example.com">VoteShield documentation</a>
```

### Links vs Buttons

Links navigate. Buttons perform actions. Never interchange them.

```html
<!-- GOOD: Link for navigation -->
<a href="/results">View Results</a>

<!-- GOOD: Button for action -->
<button onclick="exportData()">Export CSV</button>

<!-- BAD: Link styled as button that performs an action -->
<a href="#" onclick="exportData(); return false;">Export CSV</a>

<!-- BAD: Button that navigates -->
<button onclick="window.location='/results'">View Results</button>
```

### Indicating External Links and File Types

Users expect links to open in the same tab and to navigate to another web page. When a link breaks those expectations — opening a new tab, downloading a file, or linking to a non-HTML resource like a PDF — make that behavior clear in the link text. Screen reader users and keyboard users are especially disoriented by unexpected new windows.

```html
<!-- GOOD: Indicate external link behavior -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  External Resource <span class="sr-only">(opens in new tab)</span>
</a>

<!-- GOOD: Indicate file type and size -->
<a href="/report.pdf">Download Report (PDF, 2.4 MB)</a>
```

---

## Tables

Tables are for tabular data. Screen readers use table structure to navigate cells and associate data with headers.

### Proper Table Markup

```html
<!-- GOOD: Accessible data table -->
<table>
  <caption>
    Voter Turnout by County, 2024
  </caption>
  <thead>
    <tr>
      <th scope="col">County</th>
      <th scope="col">Registered Voters</th>
      <th scope="col">Ballots Cast</th>
      <th scope="col">Turnout</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Wayne</th>
      <td>450,000</td>
      <td>315,000</td>
      <td>70%</td>
    </tr>
  </tbody>
</table>
```

- Use `<caption>` to describe the table's purpose.
- Use `<th>` with `scope="col"` or `scope="row"` to associate headers with data cells.
- Use `<thead>`, `<tbody>`, and `<tfoot>` to group rows.

### Anti-Pattern: Tables for Layout

```html
<!-- BAD: Table used for page layout — confuses screen readers -->
<table>
  <tr>
    <td>Navigation</td>
    <td>Main Content</td>
    <td>Sidebar</td>
  </tr>
</table>

<!-- GOOD: CSS layout -->
<nav>Navigation</nav>
<main>Main Content</main>
<aside>Sidebar</aside>
```

---

## Color and Visual

### Contrast

Sufficient contrast ensures text is readable for users with low vision, color blindness, or those viewing in bright sunlight or on low-quality displays. WCAG defines minimum contrast ratios based on text size — smaller text requires higher contrast because it's inherently harder to read. These ratios apply to text against its background, as well as to the boundaries of UI controls (buttons, inputs) and meaningful graphical elements (icons, chart lines).

- Normal text: minimum 4.5:1 contrast ratio against background.
- Large text (18px+ or 14px+ bold): minimum 3:1 contrast ratio.
- UI components and graphical objects: minimum 3:1 contrast ratio.

### Never Rely on Color Alone

Approximately 8% of men and 0.5% of women have some form of color vision deficiency. If color is the only way to distinguish required fields, error states, chart data series, or status indicators, those users lose that information entirely. Always pair color with a secondary indicator — text labels, icons, patterns, or underlines.

```html
<!-- BAD: Color is the only indicator -->
<p>Fields marked in red are required.</p>

<!-- GOOD: Color plus text/icon indicator -->
<p>Required fields are marked with an asterisk (<span aria-hidden="true">*</span>).</p>
<label for="name">
  Name <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input type="text" id="name" name="name" required />
```

### Motion and Preferences

Respect user preferences for reduced motion and color scheme.

```html
<!-- In CSS, but relevant to HTML authors choosing animations -->
<style>
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
```

---

## Language and Text

### Document Language

The `lang` attribute tells screen readers which pronunciation rules and voice to use. Without it, a screen reader set to English will attempt to pronounce French, Spanish, or other content with English phonetics, making it unintelligible. Set `lang` on `<html>` for the page's primary language, and on individual elements when the language switches mid-page.

```html
<!-- GOOD: Set primary language -->
<html lang="en">
  <!-- GOOD: Mark sections in different languages -->
  <p>The French word <span lang="fr">bonjour</span> means hello.</p>

  <!-- GOOD: Mark entire blocks -->
  <blockquote lang="es">
    <p>Cada voto cuenta.</p>
  </blockquote>
</html>
```

### Abbreviations

Abbreviations and acronyms are barriers for screen reader users and for anyone unfamiliar with domain jargon. The `<abbr>` element with a `title` attribute provides the expanded form — screen readers can announce it, and sighted users see a tooltip on hover. Expand abbreviations on first use in the visible text as well, since `title` tooltips are not discoverable on touch devices.

```html
<!-- GOOD: Explain abbreviations on first use -->
<p>
  The
  <abbr title="Cybersecurity and Infrastructure Security Agency">CISA</abbr>
  issued new guidance on election security.
</p>
```

---

## Forms (Accessibility-Specific)

Beyond the basics in `HTML_BEST_PRACTICES.md`, these patterns handle validation states, error messaging, and assistive technology concerns.

### Validation and Error Messaging

When a form field has an error, screen reader users need to know three things: which field has the error, what the error is, and that the field is currently invalid. Use `aria-invalid="true"` to mark the field's state and `aria-describedby` to associate the error message text with the input. Use `role="alert"` on dynamically-appearing error messages so screen readers announce them immediately without the user needing to navigate to them.

```html
<!-- GOOD: Error associated with input via aria-describedby -->
<label for="email">Email</label>
<input
  type="email"
  id="email"
  name="email"
  required
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" role="alert">Please enter a valid email address.</p>

<!-- GOOD: Success state -->
<input type="email" id="email" name="email" aria-invalid="false" />
```

### Error Summaries

For forms with multiple errors, provide a summary that receives focus.

```html
<div id="error-summary" role="alert" tabindex="-1">
  <h2>There are 2 errors in this form</h2>
  <ul>
    <li><a href="#email">Email is required</a></li>
    <li><a href="#password">Password must be at least 12 characters</a></li>
  </ul>
</div>
<!-- JavaScript moves focus to #error-summary on submission failure -->
```

### Help Text and Hints

Format instructions and constraints should be visible at all times, not hidden in `placeholder` text that disappears the moment the user starts typing. Placeholders are also rendered in low-contrast gray by default, fail to be announced consistently by all screen readers, and are not a substitute for a `<label>`. Place persistent hint text near the field and connect it with `aria-describedby` so screen readers announce it when the field receives focus.

```html
<!-- GOOD: Persistent visible hint, not just placeholder -->
<label for="dob">Date of Birth</label>
<input type="text" id="dob" name="dob" placeholder="MM/DD/YYYY" aria-describedby="dob-hint" />
<p id="dob-hint">Format: MM/DD/YYYY</p>

<!-- BAD: Placeholder as sole instruction — disappears on input -->
<label for="dob">Date of Birth</label>
<input type="text" id="dob" name="dob" placeholder="MM/DD/YYYY" />
```

### Autofocus

Avoid `autofocus` without careful consideration. It can disorient screen reader users and cause unexpected page scrolling.

```html
<!-- BAD: Autofocus on page load — skips all preceding content for screen readers -->
<input type="search" name="q" autofocus />

<!-- ACCEPTABLE: Autofocus inside a modal dialog where it's the expected interaction -->
<dialog id="search-dialog">
  <label for="modal-search">Search</label>
  <input type="search" id="modal-search" name="q" autofocus />
</dialog>
```

### Autocomplete

The `autocomplete` attribute helps assistive technology identify field purpose (WCAG 1.3.5) and improves autofill for all users.

```html
<input type="text" name="name" autocomplete="name" />
<input type="email" name="email" autocomplete="email" />
<input type="tel" name="phone" autocomplete="tel" />
<input type="text" name="street" autocomplete="street-address" />
<input type="text" name="city" autocomplete="address-level2" />
<input type="text" name="state" autocomplete="address-level1" />
<input type="text" name="zip" autocomplete="postal-code" />
```

---

## Screen Reader Utility Patterns

### Visually Hidden Text

Provide text for screen readers that isn't visible on screen.

```html
<!-- Common sr-only pattern — referenced throughout this guide -->
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>

<!-- Usage: Add context for screen readers -->
<button>
  <svg aria-hidden="true"><!-- icon --></svg>
  <span class="sr-only">Close dialog</span>
</button>

<!-- Usage: Additional context on a link -->
<a href="/results/wayne"> View results <span class="sr-only">for Wayne County</span> </a>
```

### Hiding Decorative Content

Use `aria-hidden="true"` to remove purely decorative or redundant content from the accessibility tree — decorative icons, visual separators, or emoji used alongside text that already conveys the meaning. This prevents screen readers from announcing noise that adds no information. Never use `aria-hidden="true"` on interactive or meaningful content, as it makes it invisible to assistive technology while remaining visible and potentially clickable on screen.

```html
<!-- GOOD: Hide decorative icons from screen readers -->
<span aria-hidden="true">★</span> 4.5 out of 5

<!-- GOOD: Hide decorative images -->
<img src="decorative-wave.svg" alt="" aria-hidden="true" />

<!-- BAD: Hiding meaningful content -->
<button aria-hidden="true">Submit</button>
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                                   | Preferred Alternative                            |
| ---------------------------------------------- | ------------------------------------------------ |
| Redundant ARIA (`role="button"` on `<button>`) | Native element semantics                         |
| ARIA label duplicating visible text            | Let screen readers read visible text             |
| Missing landmark regions                       | Use `<header>`, `<nav>`, `<main>`, `<footer>`    |
| `placeholder` as sole label/instruction        | `<label>` element + visible hint text            |
| Positive `tabindex` values                     | Natural DOM order; `tabindex="0"` or `-1`        |
| Color as sole indicator                        | Color plus text, icon, or pattern                |
| Removing focus outlines                        | Custom `:focus-visible` styles                   |
| Custom modals with `<div>`                     | `<dialog>` with `showModal()`                    |
| Tables for layout                              | CSS Grid / Flexbox                               |
| `autofocus` on page load                       | Only inside dialogs or with deliberate UX intent |
| Link text "click here" / "read more"           | Descriptive, self-contained link text            |
| Missing `lang` on `<html>`                     | Always set document language                     |
| `aria-hidden="true"` on meaningful content     | Only hide decorative/redundant content           |
| Too many `aria-live` regions                   | One or two for critical updates only             |
| Skipping heading levels                        | Sequential `<h1>` through `<h6>`                 |

---

## References

- [WCAG 2.2 Specification](https://www.w3.org/TR/WCAG22/)
- [WCAG 2 at a Glance](https://www.w3.org/WAI/standards-guidelines/wcag/glance/)
- [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [MDN ARIA Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [web.dev Learn Accessibility](https://web.dev/learn/accessibility/)
- [WebAIM WCAG 2 Checklist](https://webaim.org/standards/wcag/checklist)
- [The A11Y Project](https://www.a11yproject.com/)
