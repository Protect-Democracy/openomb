---
description: HTML best practices for structure, semantics, forms, images, performance, and security.
paths:
  - '**/*.html'
  - '**/*.html*.jinja'
  - '**/*.svelte'
  - '**/*.svelte*.jinja'
---

# HTML Core Patterns

Comprehensive HTML best practices for vanilla HTML based on the Google HTML/CSS Style Guide, MDN, web.dev, and WCAG. These apply to all `.html` and `.html.jinja` files. For accessibility-specific guidance beyond inline basics, see `HTML_ACCESSIBILITY.md`.

Borrowed from: [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html), [MDN HTML Guide](https://developer.mozilla.org/en-US/docs/Web/HTML), [web.dev Learn HTML](https://web.dev/learn/html/)

---

## Browser Support

Check features against your project's [browserslist](https://browsersl.ist/) configuration or [caniuse.com](https://caniuse.com/) if no browserslist exists. If a feature isn't supported across your target browsers, use it only with a suitable polyfill or provide a graceful fallback.

---

## Document Structure

### Required Boilerplate

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page Title — Site Name</title>
    <meta name="description" content="Brief, accurate page summary." />
    <link rel="stylesheet" href="/css/main.css" />
  </head>
  <body>
    <!-- page content -->
    <script src="/js/main.js" defer></script>
  </body>
</html>
```

- Always declare `<!DOCTYPE html>` to prevent quirks mode.
- Set `lang` on `<html>` to the primary language of the page.
- `<meta charset="utf-8">` must be within the first 1024 bytes of the document.
- Always include the viewport meta tag for responsive design.

### Page Metadata

Every page needs a unique, descriptive `<title>` and `<meta name="description">`. The title appears in browser tabs, bookmarks, and search results — it's the single most important on-page SEO signal. The description appears as the snippet in search results and should accurately summarize the page content. Skip `<meta name="keywords">` — search engines have ignored it since the late 2000s.

```html
<!-- GOOD: Meaningful, unique title (45-65 characters) -->
<title>Election Results Dashboard — VoteShield</title>

<!-- GOOD: Accurate description (120-155 characters) -->
<meta
  name="description"
  content="Real-time election results and anomaly detection for state and county races."
/>

<!-- BAD: Generic or missing title -->
<title>Page</title>

<!-- BAD: Keywords meta — search engines ignore it -->
<meta name="keywords" content="elections, voting, results" />
```

### Social Meta Tags

Open Graph and Twitter Card meta tags control how your pages appear when shared on social media, messaging apps, and other platforms. Without these, platforms will attempt to auto-generate a preview — often with poor results. Always include `og:image:alt` for accessibility of the preview image.

```html
<!-- Open Graph -->
<meta property="og:title" content="Election Results Dashboard" />
<meta property="og:description" content="Real-time election results and anomaly detection." />
<meta property="og:image" content="https://example.com/og-image.png" />
<meta property="og:image:alt" content="Dashboard showing election results map." />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Election Results Dashboard" />
```

### Omit Default Type Attributes

HTML5 defaults to `text/javascript` and `text/css`. Omit `type` unless using a non-default value.

```html
<!-- BAD: Redundant type attributes -->
<script type="text/javascript" src="app.js"></script>
<link rel="stylesheet" type="text/css" href="style.css" />

<!-- GOOD: Clean defaults -->
<script src="app.js"></script>
<link rel="stylesheet" href="style.css" />
```

### Canonical and SEO

Use `<link rel="canonical">` to tell search engines which URL is the authoritative version of a page, preventing duplicate content penalties from query parameters, trailing slashes, or mirrored pages. Use `<meta name="robots">` to control crawler behavior when specific pages should not be indexed. For multilingual sites, `hreflang` links tell search engines which language variant to serve in each locale.

```html
<!-- Prevent duplicate content issues -->
<link rel="canonical" href="https://example.com/page" />

<!-- Control indexing when needed -->
<meta name="robots" content="noindex, nofollow" />

<!-- Multilingual sites -->
<link rel="alternate" hreflang="es" href="https://example.com/es/page" />
```

---

## Semantic Elements

### Use Elements for Their Purpose

HTML elements carry built-in semantics, keyboard behavior, and screen reader support. Using the correct element means you get accessibility, focus management, and browser features for free. A `<div>` with a click handler is not a button — it lacks keyboard activation (Enter/Space), focus ring, and assistive technology announcements.

```html
<!-- BAD: Div with click handler — no keyboard access, no screen reader semantics -->
<div class="btn" onclick="submit()">Submit</div>

<!-- GOOD: Native button with built-in accessibility -->
<button type="submit">Submit</button>

<!-- BAD: Span styled as a link -->
<span class="link" onclick="navigate('/about')">About</span>

<!-- GOOD: Anchor for navigation -->
<a href="/about">About</a>
```

### Landmark Elements

Use structural elements to define page regions. Screen readers expose these as navigation landmarks.

```html
<!-- BAD: Div soup — no semantic meaning -->
<div class="header">...</div>
<div class="sidebar">...</div>
<div class="content">...</div>
<div class="footer">...</div>

<!-- GOOD: Semantic landmarks -->
<header>...</header>
<nav aria-label="Main">...</nav>
<main>
  <article>...</article>
  <aside>...</aside>
</main>
<footer>...</footer>
```

### Lists for Grouped Items

Use `<ul>`, `<ol>`, and `<li>` for any group of related items — navigation links, feature lists, search results, etc. Screen readers announce the number of items in a list, giving users context about the group's size before they navigate into it.

```html
<!-- BAD: Divs for a list of items -->
<div class="nav-items">
  <div><a href="/">Home</a></div>
  <div><a href="/about">About</a></div>
</div>

<!-- GOOD: Semantic list — screen readers announce item count -->
<nav aria-label="Main">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

### Text Semantics

Use semantic inline elements to convey meaning, not just visual appearance. `<em>` indicates stress emphasis (screen readers change intonation), while `<strong>` marks importance. `<figure>` and `<figcaption>` associate media with a caption. `<time>` provides machine-readable dates for search engines and assistive technology. `<blockquote>` identifies quoted content with optional source attribution via `cite`.

```html
<!-- Emphasis (screen readers change intonation) -->
<p>You must <em>not</em> delete this file.</p>
<p>This is <strong>critically important</strong>.</p>

<!-- Figures with captions -->
<figure>
  <img src="chart.png" alt="Bar chart showing turnout by county." width="600" height="400" />
  <figcaption>Voter turnout by county, 2024 general election.</figcaption>
</figure>

<!-- Machine-readable dates -->
<time datetime="2024-11-05">November 5, 2024</time>

<!-- Quotations -->
<blockquote cite="https://example.com/source">
  <p>Every vote counts.</p>
</blockquote>
```

### Heading Hierarchy

Never skip heading levels. Use CSS for visual sizing, not heading elements.

```html
<!-- BAD: Skipped heading level -->
<h1>Dashboard</h1>
<h3>Recent Results</h3>

<!-- GOOD: Sequential hierarchy -->
<h1>Dashboard</h1>
<h2>Recent Results</h2>
<h3>State Races</h3>

<!-- BAD: Using headings for font size -->
<h4>Small text that isn't actually a heading</h4>

<!-- GOOD: Use CSS classes for sizing -->
<p class="text-sm">Small text.</p>
```

---

## Forms

### Labels Are Required

Every form control needs a programmatically associated label. Visual proximity is not enough.

```html
<!-- BAD: No association — screen readers can't connect them -->
<span>Email</span>
<input type="email" />

<!-- BAD: Placeholder is not a label — disappears on input -->
<input type="email" placeholder="Email" />

<!-- GOOD: Explicit label with for/id -->
<label for="email">Email</label>
<input type="email" id="email" name="email" />

<!-- GOOD: Implicit label wrapping -->
<label>
  Email
  <input type="email" name="email" />
</label>
```

### Group Related Controls

Use `<fieldset>` and `<legend>` to group related form controls — address fields, radio button sets, checkbox groups, etc. Screen readers read the `<legend>` text before each control's label within the group, providing essential context. Without grouping, a screen reader user hearing "Street" has no idea whether it's a shipping or billing address.

```html
<!-- GOOD: Fieldset with legend — screen readers read legend before each control -->
<fieldset>
  <legend>Shipping Address</legend>
  <label for="street">Street</label>
  <input type="text" id="street" name="street" autocomplete="street-address" />
  <label for="city">City</label>
  <input type="text" id="city" name="city" autocomplete="address-level2" />
</fieldset>
```

### Use Appropriate Input Types

The right `type` triggers correct mobile keyboards and enables native validation.

```html
<!-- BAD: Generic text for everything -->
<input type="text" name="email" />
<input type="text" name="phone" />

<!-- GOOD: Specific types -->
<input type="email" name="email" autocomplete="email" />
<input type="tel" name="phone" autocomplete="tel" />
<input type="url" name="website" autocomplete="url" />
<input type="number" name="quantity" min="1" max="100" />
<input type="date" name="birthdate" autocomplete="bday" />
```

### Native Validation

Use built-in validation attributes before reaching for JavaScript.

```html
<form novalidate>
  <!-- novalidate disables browser UI but keeps constraint API -->

  <label for="username">Username</label>
  <input
    type="text"
    id="username"
    name="username"
    required
    minlength="3"
    maxlength="20"
    pattern="[a-zA-Z0-9_]+"
    aria-describedby="username-hint"
  />
  <p id="username-hint">3-20 characters, letters, numbers, and underscores only.</p>

  <button type="submit">Create Account</button>
</form>
```

### Submit Buttons

Prefer `<button type="submit">` over `<input type="submit">`. The `<button>` element can contain HTML (icons, formatted text), is easier to style, and behaves consistently across browsers.

```html
<!-- BAD: Input submit — can't contain HTML, harder to style -->
<input type="submit" value="Submit" />

<!-- GOOD: Button element — flexible, can contain icons and text -->
<button type="submit">Submit</button>
```

---

## Images

### Alt Text

Every `<img>` must have an `alt` attribute. For content images, write a concise description of what the image conveys — not what it looks like. The same image may need different alt text in different contexts (a photo of a candidate on a bio page vs. a results page). For purely decorative images (dividers, background textures), use `alt=""` so screen readers skip them entirely. Never omit `alt` — without it, screen readers fall back to reading the filename.

```html
<!-- GOOD: Descriptive alt for content images -->
<img
  src="results-map.png"
  alt="Map showing county-level election results with red and blue shading."
  width="800"
  height="600"
/>

<!-- GOOD: Empty alt for decorative images — screen readers skip it -->
<img src="decorative-divider.svg" alt="" width="400" height="2" />

<!-- BAD: Missing alt — screen readers read the filename -->
<img src="IMG_4392.jpg" width="800" height="600" />

<!-- BAD: Redundant alt -->
<img src="logo.png" alt="Image of our logo" width="200" height="50" />

<!-- GOOD: Concise alt -->
<img src="logo.png" alt="VoteShield logo." width="200" height="50" />
```

### Prevent Layout Shift

Always set `width` and `height` so the browser reserves space before the image loads.

```html
<!-- BAD: No dimensions — causes layout shift -->
<img src="photo.jpg" alt="Voter registration event." />

<!-- GOOD: Dimensions set — browser reserves correct aspect ratio -->
<img src="photo.jpg" alt="Voter registration event." width="800" height="600" />
```

### Responsive Images

Serve appropriately-sized images to different devices to reduce bandwidth and improve load times. Use `srcset` with `w` descriptors and a `sizes` attribute for resolution switching — the browser picks the best size automatically. Use `<picture>` with `<source>` elements for art direction (different crops at different breakpoints) or format switching (serving AVIF/WebP with JPEG fallback). The `<img>` inside `<picture>` is required as the fallback — `<source>` elements are optional enhancements.

```html
<!-- Resolution switching with srcset and sizes -->
<img
  src="photo-800.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 800px"
  alt="Voter registration event."
  width="800"
  height="600"
/>

<!-- Art direction with picture element -->
<picture>
  <source media="(max-width: 600px)" srcset="photo-crop-mobile.jpg" />
  <source media="(min-width: 601px)" srcset="photo-wide.jpg" />
  <img src="photo-wide.jpg" alt="Voter registration event." width="800" height="600" />
</picture>

<!-- Format switching — modern formats with fallback -->
<picture>
  <source type="image/avif" srcset="photo.avif" />
  <source type="image/webp" srcset="photo.webp" />
  <img src="photo.jpg" alt="Voter registration event." width="800" height="600" />
</picture>
```

### Lazy Loading and Priority

Control when images load relative to the user's viewport. Images above the fold (visible on initial page load) should load eagerly — the hero or LCP (Largest Contentful Paint) image should use `fetchpriority="high"` to tell the browser to prioritize it. Images below the fold should use `loading="lazy"` so they load only as the user scrolls near them, saving bandwidth. Use `decoding="async"` on non-critical images to avoid blocking other rendering work.

```html
<!-- Above-the-fold / LCP image — load eagerly with high priority -->
<img src="hero.jpg" alt="Hero banner." width="1200" height="600" fetchpriority="high" />

<!-- Below-the-fold images — lazy load -->
<img src="photo.jpg" alt="Event photo." width="800" height="600" loading="lazy" decoding="async" />

<!-- BAD: Lazy loading on above-the-fold image delays LCP -->
<img src="hero.jpg" alt="Hero banner." width="1200" height="600" loading="lazy" />
```

---

## Performance

### Script Loading

Scripts in `<head>` without `defer` or `async` block HTML parsing — the browser stops rendering until the script downloads and executes. This is the single biggest cause of slow page loads from HTML alone. Use `defer` for scripts that need the DOM or depend on execution order (your app bundle). Use `async` for independent scripts that can run whenever they're ready (analytics, third-party widgets). Both download in parallel with HTML parsing.

```html
<!-- BAD: Blocking script in <head> — delays rendering -->
<head>
  <script src="app.js"></script>
</head>

<!-- GOOD: defer — downloads in parallel, executes after parsing, preserves order -->
<script src="app.js" defer></script>

<!-- GOOD: async — downloads in parallel, executes immediately, no order guarantee -->
<script src="analytics.js" async></script>
```

Use `defer` for scripts that depend on DOM or other scripts. Use `async` for independent scripts like analytics.

### Resource Hints

Resource hints tell the browser about resources it will need soon, allowing it to start work early. `preconnect` establishes TCP/TLS connections to critical third-party origins before the browser discovers them naturally — limit to 2-3 origins to avoid wasting connections. `dns-prefetch` is a lighter alternative with wider browser support. `preload` forces high-priority fetching of resources that are discovered late in the loading process (fonts referenced in CSS, images loaded via JavaScript). `prefetch` downloads resources the user is likely to need on the next navigation at low priority.

```html
<!-- Preconnect to critical third-party origins (limit to 2-3) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://api.example.com" />

<!-- DNS prefetch as fallback for wider browser support -->
<link rel="dns-prefetch" href="https://cdn.example.com" />

<!-- Preload critical late-discovered resources (fonts, above-fold images) -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />

<!-- Prefetch resources for likely next navigation -->
<link rel="prefetch" href="/next-page.html" />
```

### Replaced Elements

Always set dimensions on replaced elements to prevent layout shift.

```html
<!-- Images, video, iframe — always set width and height -->
<video src="intro.mp4" width="640" height="360"></video>
<iframe src="/embed" width="600" height="400" title="Embedded content"></iframe>
```

---

## Security

### External Links

When opening links in a new tab with `target="_blank"`, the opened page can access the opener window via `window.opener` — a technique called reverse tabnapping that allows the external page to redirect your tab to a phishing page. Adding `rel="noopener"` prevents this. `noreferrer` additionally prevents sending the referring URL. Modern browsers imply `noopener` on `target="_blank"`, but explicit is safer for legacy browser support.

```html
<!-- GOOD: Prevent reverse tabnapping on target="_blank" -->
<a href="https://external.com" target="_blank" rel="noopener noreferrer">External Site</a>

<!-- BAD: Missing rel — opener window can be manipulated -->
<a href="https://external.com" target="_blank">External Site</a>
```

### Iframe Sandboxing

The `sandbox` attribute on `<iframe>` restricts what the embedded content can do — by default, it disables scripts, form submission, popups, top-level navigation, and same-origin access. Whitelist only the specific capabilities the embedded content requires. An unsandboxed iframe gives the embedded page the same privileges as your own page, making it a vector for XSS and clickjacking.

```html
<!-- GOOD: Restrictive sandbox — whitelist only what's needed -->
<iframe
  src="https://embed.example.com/widget"
  sandbox="allow-scripts allow-same-origin"
  title="Widget"
  width="600"
  height="400"
></iframe>

<!-- BAD: No sandbox — embedded content has full privileges -->
<iframe src="https://embed.example.com/widget"></iframe>
```

### Subresource Integrity

Verify third-party resources haven't been tampered with.

```html
<!-- GOOD: Integrity hash on third-party resources -->
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
></script>

<link
  rel="stylesheet"
  href="https://cdn.example.com/style.css"
  integrity="sha384-def456..."
  crossorigin="anonymous"
/>
```

### HTTPS

Always use HTTPS for embedded resources — scripts, stylesheets, images, media, and iframes.

```html
<!-- BAD: Mixed content -->
<script src="http://cdn.example.com/lib.js"></script>

<!-- GOOD: HTTPS -->
<script src="https://cdn.example.com/lib.js"></script>
```

---

## Modern Features

Use modern HTML features when they're supported across your target browsers or when a suitable polyfill exists. Check your project's browserslist configuration or [caniuse.com](https://caniuse.com/) before using these features without a fallback.

### Dialog Element

Native modals with built-in focus trapping and backdrop.

```html
<dialog id="confirm-dialog">
  <form method="dialog">
    <h2>Confirm Action</h2>
    <p>Are you sure you want to proceed?</p>
    <button value="cancel">Cancel</button>
    <button value="confirm">Confirm</button>
  </form>
</dialog>

<button onclick="document.getElementById('confirm-dialog').showModal()">Open Dialog</button>
```

- Use `showModal()` for modal behavior (focus trap, backdrop, Escape to close).
- Use `<form method="dialog">` for closing without JavaScript.
- Do not build custom modals with `<div>` when `<dialog>` is available.

### Details and Summary

Native disclosure widget — no JavaScript needed.

```html
<details>
  <summary>How are anomalies detected?</summary>
  <p>
    We compare reported results against historical patterns and flag statistically significant
    deviations.
  </p>
</details>

<!-- Open by default -->
<details open>
  <summary>Important Notice</summary>
  <p>This data is preliminary and subject to revision.</p>
</details>
```

### Structured Data

Use JSON-LD (Google's preferred format) for structured data that helps search engines understand your content. Common schema types include Organization, Article, Product, FAQ, BreadcrumbList, and HowTo. Place the `<script type="application/ld+json">` block in `<head>` or before `</body>`. Validate with [Google's Rich Results Test](https://search.google.com/test/rich-results) to ensure correctness.

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VoteShield",
    "url": "https://voteshield.us"
  }
</script>
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                                            | Preferred Alternative                     |
| ------------------------------------------------------- | ----------------------------------------- |
| Div soup (`<div>` for everything)                       | Semantic landmark elements                |
| Inline styles                                           | External stylesheets                      |
| `<div>` or `<span>` as buttons                          | `<button>` or `<a>`                       |
| Deprecated elements (`<font>`, `<center>`, `<marquee>`) | CSS equivalents                           |
| Tables for layout                                       | CSS Grid / Flexbox                        |
| Skipping heading levels                                 | Sequential `<h1>` through `<h6>`          |
| Headings for font size                                  | CSS classes                               |
| Missing `alt` on images                                 | Always provide `alt` text                 |
| Missing `<!DOCTYPE html>`                               | Always declare doctype                    |
| Missing `width`/`height` on images                      | Always set dimensions                     |
| `placeholder` as sole label                             | Use `<label>` element                     |
| `<input type="submit">`                                 | `<button type="submit">`                  |
| Positive `tabindex` values                              | `tabindex="0"` or `-1` only               |
| `<meta http-equiv="refresh">` for redirects             | Server-side redirects                     |
| Entity references with UTF-8                            | Literal characters (except `<`, `>`, `&`) |
| `type="text/javascript"` on scripts                     | Omit — HTML5 default                      |
| `target="_blank"` without `rel`                         | `rel="noopener noreferrer"`               |
| Unclosed tags                                           | Always close tags properly                |

---

## References

- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [MDN HTML Guide](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [web.dev Learn HTML](https://web.dev/learn/html/)
- [web.dev Performance](https://web.dev/learn/performance/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [schema.org](https://schema.org/docs/gs.html)
