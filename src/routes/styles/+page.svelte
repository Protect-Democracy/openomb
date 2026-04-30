<script lang="ts">
  import Spinner from '$components/icons/Spinner.svelte';
  import placeholderImage from '$assets/other/placeholder-600.png';

  const paletteColors = [
    'color-white',
    'color-black',
    'color-gray-lightest',
    'color-gray-lighter',
    'color-gray-light',
    'color-gray-medium',
    'color-gray-dark',
    'color-gray-darker',
    'color-off-white',
    'color-green',
    'color-green-light',
    'color-green-dark',
    'color-green-darker',
    'color-blue-lighter',
    'color-blue-lightest'
  ];

  const potentialColors = [
    'color-yellow',
    'color-yellow-light',
    'color-yellow-dark',
    'color-yellow-darker',
    'color-orange',
    'color-orange-light',
    'color-orange-dark',
    'color-orange-darker',
    'color-blue',
    'color-blue-light',
    'color-blue-dark',
    'color-blue-darker'
  ];

  const semanticColorGroups = [
    {
      name: 'Base',
      colors: [
        'color-background',
        'color-text',
        'color-text-muted',
        'color-background-inverse',
        'color-text-inverse',
        'color-background-alt',
        'color-text-alt'
      ]
    },
    {
      name: 'Primary',
      colors: [
        'color-primary',
        'color-primary-text',
        'color-primary-hover',
        'color-primary-hover-text'
      ]
    },
    {
      name: 'Secondary',
      colors: [
        'color-secondary',
        'color-secondary-text',
        'color-secondary-border',
        'color-secondary-hover',
        'color-secondary-hover-text',
        'color-secondary-hover-border'
      ]
    },
    {
      name: 'Previous',
      colors: [
        'color-previous',
        'color-previous-text',
        'color-previous-hover',
        'color-previous-hover-text',
        'color-previous-checked',
        'color-previous-unchecked'
      ]
    },
    {
      name: 'Subscribe / Auth',
      colors: [
        'color-subscribe-background',
        'color-subscribe',
        'color-subscribe-text',
        'color-subscribe-border',
        'color-subscribe-hover',
        'color-subscribe-hover-text',
        'color-subscribe-hover-border'
      ]
    },
    {
      name: 'Alt',
      colors: ['color-alt', 'color-alt-text', 'color-alt-hover', 'color-alt-hover-text']
    },
    {
      name: 'Toggle',
      colors: [
        'color-toggle-on',
        'color-toggle-on-text',
        'color-toggle-off',
        'color-toggle-off-text',
        'color-toggle-hover',
        'color-toggle-hover-text'
      ]
    },
    {
      name: 'State',
      colors: [
        'color-highlight',
        'color-error',
        'color-disabled',
        'color-link',
        'color-link-inverse'
      ]
    }
  ];

  let toggles = {
    toggle: true,
    switchDefault: true,
    switchAlt: false,
    switchDefaultSmall: true,
    switchAltSmall: false,
    switchPreviousSmall: false
  };
</script>

<svelte:head>
  <meta name="robots" content="noindex,follow" />
</svelte:head>

<div class="page-container content-container">
  <h1>Style guide</h1>

  <p>This is a very rough style guide to help see and describe global styles for this site.</p>

  <h2 class="style-section">Typography</h2>

  <p>Main content (i.e. copy) typography is defined with <code>var(--font-family-copy)</code></p>

  <h3>Heading typography</h3>

  <p>Heading font is defined with <code>var(--font-family-heading)</code></p>

  <h2 class="style-section">Colors</h2>

  <h3>Palette</h3>

  <p>
    The following are the primary palette colors. Avoid using these directly in CSS, instead try to
    use the Semantic colors (see below).
  </p>

  <div class="color-strip">
    {#each paletteColors as colorVariable (colorVariable)}
      <div class="color-swatch" style="background-color: var(--{colorVariable})">
        <span class="color-swatch-label">--{colorVariable}</span>
      </div>
    {/each}
  </div>

  <h3>Potential palette colors</h3>

  <p>Some potential, but unconfirmed palette colors</p>

  <div class="color-strip">
    {#each potentialColors as colorVariable (colorVariable)}
      <div class="color-swatch" style="background-color: var(--{colorVariable})">
        <span class="color-swatch-label">--{colorVariable}</span>
      </div>
    {/each}
  </div>

  <h3>Semantic colors</h3>

  {#each semanticColorGroups as group (group.name)}
    <h4>{group.name}</h4>
    <div class="color-strip">
      {#each group.colors as colorVariable (colorVariable)}
        <div class="color-swatch" style="background-color: var(--{colorVariable})">
          <span class="color-swatch-label">--{colorVariable}</span>
        </div>
      {/each}
    </div>
  {/each}

  <h2 class="style-section">Variables</h2>

  <p>
    Key CSS custom properties defined in <code>src/styles/variables.css</code>. Use these rather
    than hardcoded values in component styles.
  </p>

  <h3>Spacing</h3>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        <th>Value</th>
        <th>Visual</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>--spacing-tiny</code></td>
        <td>≈ 0.17rem (spacing / 6)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-tiny);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-thin</code></td>
        <td>0.125rem (spacing × 2/16; used for borders)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-thin);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-small</code></td>
        <td>0.25rem (spacing / 4)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-small);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-half</code></td>
        <td>0.5rem (spacing / 2)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-half);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-smallish</code></td>
        <td>≈ 0.67rem (spacing × ⅔)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-smallish);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing</code></td>
        <td>1rem (base unit)</td>
        <td><div class="spacing-bar" style="width: var(--spacing);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-line-height</code></td>
        <td>1.5rem (1rem × line-height)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-line-height);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-double</code></td>
        <td>2rem (spacing × 2)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-double);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-triple</code></td>
        <td>3rem (spacing × 3)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-triple);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-large</code></td>
        <td>4rem (2rem on mobile)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-large);"></div></td>
      </tr>
      <tr>
        <td><code>--spacing-xlarge</code></td>
        <td>5rem (3rem on mobile)</td>
        <td><div class="spacing-bar" style="width: var(--spacing-xlarge);"></div></td>
      </tr>
    </tbody>
  </table>

  <h3>Font sizes</h3>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        <th>Value</th>
        <th>Example</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>--font-size-tiny</code></td>
        <td>0.5rem</td>
        <td><span style="font-size: var(--font-size-tiny)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-small</code></td>
        <td>0.8rem</td>
        <td><span style="font-size: var(--font-size-small)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-regular</code></td>
        <td>1rem</td>
        <td><span style="font-size: var(--font-size-regular)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-slight</code></td>
        <td>1.15rem</td>
        <td><span style="font-size: var(--font-size-slight)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-medium</code></td>
        <td>1.25rem</td>
        <td><span style="font-size: var(--font-size-medium)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-large</code></td>
        <td>1.5rem</td>
        <td><span style="font-size: var(--font-size-large)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-xlarge</code></td>
        <td>2rem</td>
        <td><span style="font-size: var(--font-size-xlarge)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-size-xxlarge</code></td>
        <td>2.875rem</td>
        <td><span style="font-size: var(--font-size-xxlarge)">Sample text</span></td>
      </tr>
    </tbody>
  </table>

  <h3>Font weights</h3>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        <th>Value</th>
        <th>Example</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>--font-copy-weight-normal</code></td>
        <td>400</td>
        <td><span style="font-weight: var(--font-copy-weight-normal)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-copy-weight-bold</code></td>
        <td>600</td>
        <td><span style="font-weight: var(--font-copy-weight-bold)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-copy-weight-bolder</code></td>
        <td>700</td>
        <td><span style="font-weight: var(--font-copy-weight-bolder)">Sample text</span></td>
      </tr>
      <tr>
        <td><code>--font-heading-weight-normal</code></td>
        <td>normal</td>
        <td
          ><span
            style="font-weight: var(--font-heading-weight-normal); font-family: var(--font-family-heading)"
            >Sample heading</span
          ></td
        >
      </tr>
      <tr>
        <td><code>--font-heading-weight-bold</code></td>
        <td>600</td>
        <td
          ><span
            style="font-weight: var(--font-heading-weight-bold); font-family: var(--font-family-heading)"
            >Sample heading</span
          ></td
        >
      </tr>
    </tbody>
  </table>

  <h3>Borders &amp; radius</h3>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        <th>Value</th>
        <th>Example</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>--border-radius-small</code></td>
        <td>≈ 0.33rem (spacing × ⅓)</td>
        <td>
          <div class="radius-swatch" style="border-radius: var(--border-radius-small);"></div>
        </td>
      </tr>
      <tr>
        <td><code>--border-radius</code></td>
        <td>≈ 0.67rem (spacing × ⅔)</td>
        <td>
          <div class="radius-swatch" style="border-radius: var(--border-radius);"></div>
        </td>
      </tr>
      <tr>
        <td><code>--border-radius-full</code></td>
        <td>9999px (fully rounded)</td>
        <td>
          <div class="radius-swatch" style="border-radius: var(--border-radius-full);"></div>
        </td>
      </tr>
      <tr>
        <td><code>--border-weight-thin</code></td>
        <td>≈ 0.0625rem (spacing-thin / 2)</td>
        <td>
          <div class="border-swatch" style="border-width: var(--border-weight-thin);"></div>
        </td>
      </tr>
      <tr>
        <td><code>--border-weight</code></td>
        <td>0.125rem (= spacing-thin)</td>
        <td>
          <div class="border-swatch" style="border-width: var(--border-weight);"></div>
        </td>
      </tr>
      <tr>
        <td><code>--drop-shadow</code></td>
        <td><code>0 6px 12px var(--color-gray-medium)</code></td>
        <td>
          <div class="border-swatch" style="box-shadow: var(--drop-shadow); border: none;"></div>
        </td>
      </tr>
    </tbody>
  </table>

  <h3>Transitions</h3>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>--transition</code></td><td>0.3s</td></tr>
      <tr><td><code>--transition-fast</code></td><td>0.1s</td></tr>
    </tbody>
  </table>

  <h3>Layout</h3>

  <table>
    <thead>
      <tr>
        <th>Variable</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>--line-height</code></td><td>1.5</td></tr>
      <tr><td><code>--line-height-small</code></td><td>1.2</td></tr>
      <tr><td><code>--base-font-size</code></td><td>16px (14px on mobile)</td></tr>
      <tr
        ><td><code>--copy-width-limit</code></td><td>50em (max-width for paragraph/copy text)</td
        ></tr
      >
      <tr><td><code>--page-width</code></td><td>75rem (standard page container max-width)</td></tr>
      <tr
        ><td><code>--page-width-small</code></td><td>62rem (narrower page container max-width)</td
        ></tr
      >
      <tr><td><code>--icon-size-inline</code></td><td>1.1em (used for inline icon sizing)</td></tr>
    </tbody>
  </table>

  <h2 class="style-section">Containers</h2>

  <ul>
    <li>
      Use <code>.page-container</code> for a container that will constrain the width while keeping some
      padding for small screens. This makes sense to use multiple times on the page if you have elements
      that might need to go across the whole page even on large screens.
    </li>
    <li>
      Use <code>.page-container-small</code> for a similar container but with a smaller maximum width.
    </li>
    <li>
      Use <code>.content-container</code> for the main content on the page; it provides some standard
      top and bottom spacing. This is likely only necessary once on a page.
    </li>
    <li>
      Use <code>.page-section</code> for <code>&lt;section&gt;</code> elements to add some standard bottom
      spacing.
    </li>
    <li>
      Use <code>.text-container</code> for a container that constrains the width based on the text size.
    </li>
    <li>Use <code>.center-container</code> to center a container horizontally.</li>
    <li>
      Use <code>.full-container</code> for a full-width container with consistent horizontal padding but
      no max-width constraint.
    </li>
    <li>
      Use <code>.page-message-container</code> for a full-page centered layout with a prominent
      message box — used for auth flows and confirmation pages. It fills most of the viewport height
      and centers a <code>.message-box</code> child element.
    </li>
  </ul>

  <h2 class="style-section">Headings</h2>

  <h1>Heading 1</h1>
  <h1><small>A small element in a</small> Heading 1</h1>
  <h2>Heading 2</h2>
  <h2 class="h2-alt">Heading 2 (alt)</h2>
  <h3>Heading 3</h3>
  <h2 class="h3-alt">Heading 3 (alt)</h2>
  <h4>Heading 4</h4>
  <h5>Heading 5</h5>
  <h6>Heading 6</h6>

  <p>
    Note that the use of <code>h5</code> or <code>h6</code> should be avoided and usually mean that content
    should be outlined differently.
  </p>

  <p>
    Also note that the semantic heading should be used, and if it is important to have it look,
    utilize the appropriate classes like <code>.h2</code>.
  </p>

  <h2 class="style-section">Paragraphs</h2>

  <p>
    A paragraph (from the Greek paragraphos, “to write beside” or “written beside”) is a
    self-contained unit of a discourse in writing dealing with a particular point or idea. A
    paragraph consists of one or more sentences. Though not required by the syntax of any language,
    paragraphs are usually an expected part of formal writing, used to organize longer prose.
  </p>

  <h2 class="style-section">Blockquotes</h2>
  <blockquote>
    <p>
      A block quotation (also known as a long quotation or extract) is a quotation in a written
      document, that is set off from the main text as a paragraph, or block of text.
    </p>

    <p>
      It is typically distinguished visually using indentation and a different typeface or smaller
      size quotation. It may or may not include a citation, usually placed at the bottom.
    </p>
    <cite><a href="#!">Said no one, ever.</a></cite>
  </blockquote>

  <h2 class="style-section">Lists</h2>
  <h3>Definition list</h3>

  <dl>
    <dt>Definition List Title</dt>
    <dd>This is a definition list division.</dd>
  </dl>

  <h3>Ordered List</h3>

  <ol>
    <li>List Item 1</li>
    <li>List Item 2</li>
    <li>List Item 3</li>
  </ol>

  <h3>Unordered List</h3>

  <ul>
    <li>List Item 1</li>
    <li>List Item 2</li>
    <li>List Item 3</li>
  </ul>

  <h3>Inline list</h3>

  <p>A simple inline unordered list with <code>ul.inline-list</code>.</p>

  <ul class="inline-list">
    <li>List Item 1</li>
    <li>List Item 2</li>
    <li>List Item 3</li>
  </ul>

  <h3>No list</h3>

  <p>
    Inline list with no separator, using <code>ul.no-list</code>. Items are inline-block with no
    padding, margin, or list styling.
  </p>

  <ul class="no-list">
    <li>List Item 1</li>
    <li>List Item 2</li>
    <li>List Item 3</li>
  </ul>

  <h2 class="style-section">Horizontal rules</h2>

  <p>
    lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum
    dolor sit amet vlorem ipsum dolor sit amet
  </p>

  <hr />

  <p>
    lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum
    dolor sit amet vlorem ipsum dolor sit amet
  </p>

  <h2 class="style-section">Tabular data</h2>

  <table>
    <caption>Table Caption</caption>
    <thead>
      <tr>
        <th>Table Heading 1</th>
        <th>Table Heading 2</th>
        <th>Table Heading 3</th>
        <th>Table Heading 4</th>
        <th>Table Heading 5</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <th>Table Footer 1</th>
        <th>Table Footer 2</th>
        <th>Table Footer 3</th>
        <th>Table Footer 4</th>
        <th>Table Footer 5</th>
      </tr>
    </tfoot>
    <tbody>
      <tr>
        <td>Table Cell 1</td>
        <td>Table Cell 2</td>
        <td>Table Cell 3</td>
        <td>Table Cell 4</td>
        <td>Table Cell 5</td>
      </tr>
      <tr>
        <td>Table Cell 1</td>
        <td>Table Cell 2</td>
        <td>Table Cell 3</td>
        <td>Table Cell 4</td>
        <td>Table Cell 5</td>
      </tr>
      <tr>
        <td>Table Cell 1</td>
        <td>Table Cell 2</td>
        <td>Table Cell 3</td>
        <td>Table Cell 4</td>
        <td>Table Cell 5</td>
      </tr>
      <tr>
        <td>Table Cell 1</td>
        <td>Table Cell 2</td>
        <td>Table Cell 3</td>
        <td>Table Cell 4</td>
        <td>Table Cell 5</td>
      </tr>
    </tbody>
  </table>

  <h3>Responsive table</h3>

  <p>
    Wrap a table in <code>.responsive-table</code> to allow horizontal scrolling on small screens.
  </p>

  <div class="responsive-table">
    <table>
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
          <th>Column 3</th>
          <th>Column 4</th>
          <th>Column 5</th>
          <th>Column 6</th>
          <th>Column 7</th>
          <th>Column 8</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
          <td>Cell 3</td>
          <td>Cell 4</td>
          <td>Cell 5</td>
          <td>Cell 6</td>
          <td>Cell 7</td>
          <td>Cell 8</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2 class="style-section">Buttons</h2>

  <h3>Button elements</h3>

  <button>Button</button>
  <button class="secondary">Secondary</button>
  <button class="alt">Alt</button>
  <button disabled>Disabled</button>
  <div role="button">role="button"</div>

  <h3>Contextual styles</h3>

  <p>
    Use <code>.subscribe</code> and <code>.auth</code> for subscription and authentication actions. They
    share the same blue visual style.
  </p>

  <button class="subscribe">Subscribe</button>
  <button class="auth">Sign in</button>

  <h3>Toggles</h3>

  <p>
    For accessible toggles, utilize <code>aria-pressed="true"</code> or
    <code>aria-pressed="false"</code>.
  </p>

  <button aria-pressed={toggles.toggle} on:click={() => (toggles.toggle = !toggles.toggle)}>
    {toggles.toggle ? 'On' : 'Off'}
  </button>

  <h3>Switch</h3>

  <p>
    For accessible toggles, utilize <code>aria-checked="true"</code> or
    <code>aria-checked="false"</code> and <code>role="switch"</code>.
  </p>

  <button
    class="button-switch"
    role="switch"
    aria-checked={toggles.switchDefault}
    on:click={() => (toggles.switchDefault = !toggles.switchDefault)}
  >
    <span class="button-switch-slider"></span>
    <span class="sr-only">{toggles.switchDefault ? 'On' : 'Off'}</span>
  </button>

  <button
    class="button-switch alt"
    role="switch"
    aria-checked={toggles.switchAlt}
    on:click={() => (toggles.switchAlt = !toggles.switchAlt)}
  >
    <span class="button-switch-slider"></span>
    <span class="sr-only">{toggles.switchAlt ? 'On' : 'Off'}</span>
  </button>

  <br />

  <button
    class="button-switch small"
    role="switch"
    aria-checked={toggles.switchDefaultSmall}
    on:click={() => (toggles.switchDefaultSmall = !toggles.switchDefaultSmall)}
  >
    <span class="button-switch-slider"></span>
    <span class="sr-only">{toggles.switchDefaultSmall ? 'On' : 'Off'}</span>
  </button>

  <button
    class="button-switch alt small"
    role="switch"
    aria-checked={toggles.switchAltSmall}
    on:click={() => (toggles.switchAltSmall = !toggles.switchAltSmall)}
  >
    <span class="button-switch-slider"></span>
    <span class="sr-only">{toggles.switchAltSmall ? 'On' : 'Off'}</span>
  </button>

  <button
    class="button-switch previous small"
    role="switch"
    aria-checked={toggles.switchPreviousSmall}
    on:click={() => (toggles.switchPreviousSmall = !toggles.switchPreviousSmall)}
  >
    <span class="button-switch-slider"></span>
    <span class="sr-only">{toggles.switchPreviousSmall ? 'On' : 'Off'}</span>
  </button>

  <h3>Icons</h3>

  <button disabled>
    <span class="button-icon"><Spinner /></span>
    Loading
  </button> <br />

  <button class="compact" disabled>
    <span class="button-icon"><Spinner /></span>
    Compact
  </button> <br />

  <button class="compact" disabled>
    <span class="button-icon"><Spinner /></span>
    <span class="sr-only">Compact with icon in it</span>
  </button> <br />

  <button class="compact small" disabled>
    <span class="button-icon"><Spinner /></span>
    Compact
  </button> <br />

  <button class="compact small alt" disabled>
    <span class="button-icon"><Spinner /></span>
    <span class="sr-only">Compact with icon in it</span>
  </button>

  <h3>Variants</h3>

  <p>Use these consistently when appropriate</p>

  <button class="compact">.compact</button><br />
  <button class="small">.small</button><br />
  <button class="medium">.medium</button><br />
  <button class="compact small">.compact.small</button><br />

  <h3>Modifiers</h3>

  <p>
    Generally, only use these modifiers if they really make sense and are consistent with semantics
    and the visual system.
  </p>

  <button class="like-link">.like-link</button><br />
  <button class="like-text">.like-text</button><br />

  <h3>Link elements</h3>

  <p>
    Generally links should not be styled like buttons as button and link have different sematic
    meaning and should be visually distinct from each other. But using <code
      >a.button.like-link</code
    > will look like a link but give spacing like button which can be helpful.
  </p>

  <a class="button" href="#buttons">a.button</a>
  <a class="button like-link" href="#buttons">a.button.like-link</a>

  <h2 class="style-section">Tags</h2>

  <p>
    Note that tags are mostly a visual indication and not really meant to be interactive and better
    to use buttons for that.
  </p>

  <span class="tag">Default</span>
  <span class="tag alt">Default</span>

  <h2 class="style-section">Code</h2>

  <p><strong>Keyboard input:</strong> <kbd>Cmd</kbd></p>
  <p><strong>Inline code:</strong> <code>&lt;div&gt;code&lt;/div&gt;</code></p>
  <p>
    <strong>Sample output:</strong> <samp>This is sample output from a computer program.</samp>
  </p>
  <p>
    <strong>Code alt:</strong> <code class="code-alt">inline code</code> — the
    <code>.code-alt</code> modifier removes the background and border, using an underline instead. Useful
    for code references within dense prose where the full code block styling is too heavy.
  </p>

  <h3>Pre-formatted text</h3>

  <pre>P R E F O R M A T T E D T E X T
! " # $ % &amp; ' ( ) * + , - . /
0 1 2 3 4 5 6 7 8 9 : ; &lt; = &gt; ?
@ A B C D E F G H I J K L M N O</pre>

  <h2 class="style-section">Inline elements</h2>

  <p><a href="#!">This is a text link</a>.</p>
  <p><strong>Strong is used to indicate strong importance.</strong></p>
  <p><em>This text has added emphasis.</em></p>
  <p>
    The <b>b element</b> is stylistically different text from normal text, without any special importance.
  </p>
  <p>The <i>i element</i> is text that is offset from the normal text.</p>
  <p>
    The <u>u element</u> is text with an unarticulated, though explicitly rendered, non-textual annotation.
  </p>
  <p><del>This text is deleted</del> and <ins>This text is inserted</ins>.</p>
  <p><s>This text has a strikethrough</s>.</p>
  <p>Superscript<sup>®</sup>.</p>
  <p>Subscript for things like H<sub>2</sub>O.</p>
  <p><small>This small text is small for for fine print, etc.</small></p>
  <p>Abbreviation: <abbr title="HyperText Markup Language">HTML</abbr></p>
  <p>
    <q cite="https://developer.mozilla.org/en-US/docs/HTML/Element/q"
      >This text is a short inline quotation.</q
    >
  </p>
  <p><cite>This is a citation.</cite></p>
  <p>The <dfn>dfn element</dfn> indicates a definition.</p>
  <p>The <mark>mark element</mark> indicates a highlight.</p>
  <p>The <var>variable element</var>, such as <var>x</var> = <var>y</var>.</p>
  <p>The time element: <time datetime="2013-04-06T12:32+00:00">2 weeks ago</time></p>

  <h3>Text modifiers</h3>

  <p>
    <code>a.like-link</code>: <a class="like-text" href="#!">This is text that looks like a link</a>
    and should be used mostly when there are a lot of links in a section, as links should be consistent
    and visually distinct from text overall.
  </p>

  <p>
    <code>.font-small</code>:
    <span class="font-small"
      >It is generally better to use the semantic <code>&lt;small&gt;</code>, but this can be useful
      for larger sections of text that should be smaller</span
    >.
  </p>

  <p>
    <code>.muted</code>:
    <span class="muted">muted content</span>.
  </p>

  <h2 class="style-section">Icons</h2>

  <p>
    Use <code>.inline-icon</code> or <code>.inline-icon-square</code> to place an SVG icon inline
    with text. Both set <code>width: var(--icon-size-inline)</code> (1.1em) and align vertically to
    middle. Use <code>.inline-icon-square</code> when the icon also needs an explicit height (e.g. square
    viewBox icons that don't self-size vertically).
  </p>

  <p>
    <span class="inline-icon"><Spinner /></span>Text following an <code>.inline-icon</code>
  </p>

  <p>
    <span class="inline-icon-square"><Spinner /></span>Text following an
    <code>.inline-icon-square</code>
  </p>

  <h2 class="style-section">Images</h2>

  <h3>No <code>&lt;figure&gt;</code> element</h3>
  <p><img src={placeholderImage} alt="Some alt text" /></p>

  <h3>Wrapped in a <code>&lt;figure&gt;</code> element, no <code>&lt;figcaption&gt;</code></h3>
  <figure><img src={placeholderImage} alt="Some alt text" /></figure>

  <h3>
    Wrapped in a <code>&lt;figure&gt;</code> element, with a <code>&lt;figcaption&gt;</code>
  </h3>

  <figure>
    <img src={placeholderImage} alt="Some alt text" />
    <figcaption>Here is a caption for this image.</figcaption>
  </figure>

  <h2 class="style-section">Meters and progress</h2>

  <div><meter value="2" min="0" max="10">2 out of 10</meter></div>

  <h3>Progress</h3>

  <div><progress>progress</progress></div>

  <h2 class="style-section">Form elements</h2>

  <form>
    <fieldset>
      <legend>Inputs</legend>
      <div class="form-item">
        <label for="input__text">Text Input</label>
        <p id="input__text-help" class="input-help">Some help text here</p>
        <input
          id="input__text"
          aria-describedby="input__text-help"
          type="text"
          placeholder="Text Input"
        />
      </div>

      <div class="form-item">
        <label for="input__password">Password</label>
        <p id="input__password-help" class="input-help">
          Some longer help here. Some longer help here. Some longer help here. Some longer help here
        </p>
        <input id="input__password" type="password" placeholder="Type your Password" />
      </div>

      <div class="form-item">
        <label for="input__webaddress">Web Address</label>
        <input id="input__webaddress" type="url" placeholder="http://yoursite.com" />
      </div>

      <div class="form-item">
        <label for="input__emailaddress">Email Address</label>
        <input id="input__emailaddress" type="email" placeholder="name@email.com" />
      </div>

      <div class="form-item">
        <label for="input__text2">Number Input</label>
        <input id="input__text2" type="number" placeholder="Enter a Number" />
      </div>

      <div class="form-item">
        <label for="input__text3" class="error">Error</label>
        <input id="input__text3" aria-invalid="true" type="text" placeholder="Text Input" />
      </div>

      <div class="form-item">
        <label for="input__text4" class="valid">Valid</label>
        <input id="input__text4" class="is-valid" type="text" placeholder="Text Input" />
      </div>

      <div class="form-item">
        <label for="input__text4">Disabled</label>
        <input id="input__text4" type="text" placeholder="Text Input" disabled />
      </div>

      <div class="form-item">
        <label for="ic">Color input</label>
        <input type="color" id="ic" value="#000000" />
      </div>

      <div class="form-item">
        <label for="in">Number input</label>
        <input type="number" id="in" min="0" max="10" value="5" />
      </div>

      <div class="form-item">
        <label for="ir">Range input</label>
        <input type="range" id="ir" value="10" />
      </div>

      <div class="form-item">
        <label for="idd">Date input</label>
        <input type="date" id="idd" value="1970-01-01" />
      </div>

      <div class="form-item">
        <label for="idm">Month input</label>
        <input type="month" id="idm" value="1970-01" />
      </div>

      <div class="form-item">
        <label for="idw">Week input</label>
        <input type="week" id="idw" value="1970-W01" />
      </div>

      <div class="form-item">
        <label for="idt">Datetime input</label>
        <input type="datetime" id="idt" value="1970-01-01T00:00:00Z" />
      </div>

      <div class="form-item">
        <label for="idtl">Datetime-local input</label>
        <input type="datetime-local" id="idtl" value="1970-01-01T00:00" />
      </div>
    </fieldset>

    <fieldset>
      <legend>Inline form items</legend>

      <div class="form-item-inline">
        <label for="input__phone">Phone Number</label>
        <input id="input__phone" type="tel" placeholder="(999) 999-9999" />
      </div>

      <div class="form-item-inline">
        <label for="input__search">Search</label>
        <input id="input__search" type="search" placeholder="Enter Search Term" />
      </div>
    </fieldset>

    <fieldset>
      <legend>Select menus</legend>

      <div class="form-item">
        <label for="select">Select</label>
        <select id="select">
          <optgroup label="Option Group">
            <option>Option One</option>
            <option>Option Two</option>
            <option>Option Three</option>
          </optgroup>
        </select>
      </div>

      <div class="form-item">
        <label for="select">Disabled</label>
        <select id="select" disabled>
          <optgroup label="Option Group">
            <option>Option One</option>
            <option>Option Two</option>
            <option>Option Three</option>
          </optgroup>
        </select>
      </div>
    </fieldset>

    <fieldset id="forms__checkbox">
      <legend>Checkboxes</legend>

      <fieldset class="checkboxes">
        <legend>Choose any</legend>

        <div class="checkbox">
          <input id="checkbox1" name="checkbox" type="checkbox" checked />
          <label for="checkbox1"> Choice A</label>
        </div>

        <div class="checkbox">
          <input id="checkbox2" name="checkbox" type="checkbox" />
          <label for="checkbox2"> Choice B</label>
        </div>

        <div class="checkbox">
          <input id="checkbox3" name="checkbox" type="checkbox" />
          <label for="checkbox3"> Choice C</label>
        </div>

        <div class="checkbox">
          <input id="checkbox4" name="checkbox" type="checkbox" disabled />
          <label for="checkbox4"> Disabled</label>
        </div>
      </fieldset>

      <div id="checkboxes-inline-example" class="checkboxes-inline" role="group">
        <label for="checkboxes-inline-example">Choose any inline</label>

        <div class="checkbox">
          <input id="checkbox-inline1" name="checkbox" type="checkbox" checked />
          <label for="checkbox-inline1"> Choice A</label>
        </div>

        <div class="checkbox">
          <input id="checkbox-inline2" name="checkbox" type="checkbox" />
          <label for="checkbox-inline2">Choice B</label>
        </div>

        <div class="checkbox">
          <input id="checkbox-inline3" name="checkbox" type="checkbox" />
          <label for="checkbox-inline3"> Choice C</label>
        </div>

        <div class="checkbox">
          <input id="checkbox-inline4" name="checkbox" type="checkbox" disabled />
          <label for="checkbox-inline4"> Disabled</label>
        </div>
      </div>
    </fieldset>

    <fieldset id="forms__radio">
      <legend>Radio buttons</legend>

      <fieldset class="radios">
        <legend>Choose one</legend>

        <div class="radio">
          <input id="radio1" name="radio" type="radio" class="radio" checked />
          <label for="radio1"> Option 1</label>
        </div>

        <div class="radio">
          <input id="radio2" name="radio" type="radio" class="radio" />
          <label for="radio2"> Option 2</label>
        </div>

        <div class="radio">
          <input id="radio3" name="radio" type="radio" class="radio" />
          <label for="radio3"> Option 3</label>
        </div>
      </fieldset>

      <div id="radio-inline-example" role="group" class="radios-inline">
        <label for="radio-inline-example">Choose one inline</label>

        <div class="radio">
          <input id="radio-inline1" name="radio" type="radio" class="radio" checked />
          <label for="radio-inline1"> Option 1</label>
        </div>

        <div class="radio">
          <input id="radio2-inline" name="radio" type="radio" class="radio" />
          <label for="radio-inline2"> Option 2</label>
        </div>

        <div class="radio">
          <input id="radio-inline3" name="radio" type="radio" class="radio" />
          <label for="radio-inline3"> Option 3</label>
        </div>
      </div>
    </fieldset>

    <fieldset id="forms__textareas">
      <legend>Textareas</legend>

      <div class="form-item">
        <label for="textarea">Textarea</label>
        <textarea id="textarea" rows="8" cols="48" placeholder="Enter your message here"></textarea>
      </div>

      <div class="form-item">
        <label for="textarea">Disabled</label>
        <textarea id="textarea" rows="8" cols="48" placeholder="Enter your message here" disabled
        ></textarea>
      </div>
    </fieldset>

    <fieldset id="forms__action">
      <legend>Action buttons</legend>

      <input type="submit" value="Input submit" />
      <input type="button" value="Input button" />
      <input type="reset" value="Input reset" />
      <input type="submit" value="Input disabled" disabled />
    </fieldset>
  </form>

  <h2 class="style-section">Utilities</h2>

  <p>Utility classes defined in <code>src/styles/utilities.css</code>.</p>

  <h3>Accessibility</h3>

  <ul>
    <li>
      <code>.sr-only</code> — visually hides an element while keeping it accessible to screen
      readers. Uses <code>position: absolute</code>, so it does not affect page flow.
    </li>
    <li>
      <code>.visually-hidden</code> — similar to <code>.sr-only</code> but the element still participates
      in normal document flow (collapses to 1×1px).
    </li>
    <li>
      <code>.visually-hidden-focusable</code> — like <code>.visually-hidden</code> but becomes visible
      when focused. Useful for skip-to-content links.
    </li>
  </ul>

  <h3>Font family overrides</h3>

  <p>
    <code>.font-copy</code>:
    <span class="font-copy">Forces the copy/body font family (IBM Plex Sans).</span>
  </p>
  <p>
    <code>.font-heading</code>:
    <span class="font-heading">Forces the heading font family (Domine).</span>
  </p>

  <h3>Progressive enhancement</h3>

  <p>
    Classes toggled on <code>&lt;html&gt;</code> by JavaScript to show or hide content depending on
    JS availability. The parent state is either <code>.has-js</code> or <code>.no-js</code>.
  </p>

  <ul>
    <li>
      <code>.no-js-only-block</code> / <code>.has-js-only-block</code> — toggles
      <code>display: block</code>
    </li>
    <li>
      <code>.no-js-only-inline</code> / <code>.has-js-only-inline</code> — toggles
      <code>display: inline-block</code>
    </li>
    <li>
      <code>.no-js-only-table-row</code> / <code>.has-js-only-table-row</code> — toggles
      <code>display: table-row</code>
    </li>
  </ul>
</div>

<style>
  /** Making headings more distinct given how long this page is */
  h2.style-section {
    padding-top: 4rem;
    border-bottom: 3px solid var(--color-gray-dark);
  }

  .color-strip {
    display: flex;
    height: 4rem;
    margin-bottom: var(--spacing);
  }

  .color-swatch {
    flex: 1;
    position: relative;
    overflow: hidden;
    transition: flex var(--transition);
    cursor: default;
    min-width: 0;
  }

  .color-swatch:hover {
    flex: 5;
  }

  .color-swatch-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-tiny) var(--spacing-small);
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: var(--font-size-small);
    white-space: nowrap;
    opacity: 0;
    transition: opacity var(--transition);
  }

  .color-swatch:hover .color-swatch-label {
    opacity: 1;
  }

  .spacing-bar {
    background-color: var(--color-primary);
    height: var(--spacing);
    min-width: 1px;
  }

  .radius-swatch {
    width: 3rem;
    height: 3rem;
    background-color: var(--color-gray-lighter);
    border: var(--border-weight) solid var(--color-text);
  }

  .border-swatch {
    width: 5rem;
    height: 2rem;
    border-style: solid;
    border-color: var(--color-text);
  }
</style>
