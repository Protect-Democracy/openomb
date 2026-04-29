# CSS Styles

This project does not use any CSS framework. Do NOT write Tailwind or Bootstrap type styles.

## Global styles

Global styles are in `src/styles/`:

```
  src/styles/
  ├── index.css          # Main entry point; imports all other files in correct cascade order
  ├── index-email.css    # Email entry point; includes email.css
  ├── fonts.css          # Font declarations (actual imports happen via npm in layout.svelte)
  ├── variables.css      # All CSS custom properties
  ├── elements.css       # Base element styles (no classes/IDs)
  ├── components.css     # Reusable classes common across the application
  ├── utilities.css      # Override utilities (often uses !important); accessibility & progressive enhancement
  └── email.css          # Email-specific layout overrides (plain, simple CSS)
```

Cascade order (defined by index.css): modern-normalize > fonts > variables > elements > components > utilities

### Variables

Use CSS custom properties whenever a value has use outside the specific class. See `src/styles/variables.css` for available variables (colors, spacing, breakpoints, font sizes).

## Component styles

Colocated with their Svelte component in the `<style>` tag.

## Techniques

- Mobile-first design; use media queries to adapt to larger screens
- Use `rem` units for font sizes and spacing
- Avoid `!important` unless it is a utility class for that specific property
- Use nesting, but no more than 3 levels deep
- Use CSS custom properties (variables) for colors, spacing, etc.
- Use Flexbox or Grid; avoid rigid pixel-based layouts
- Keep it DRY

## Email styles

Email styles go in `src/styles/email.css`. Write for email client compatibility: avoid modern CSS features, keep it simple. The email rendering pipeline (`src/lib/server/email/`) inlines styles, but compatibility-first authoring is still best practice.
