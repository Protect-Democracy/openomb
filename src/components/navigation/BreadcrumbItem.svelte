<!--
  Breadcrumb Navigation Item

  Params
    None
  Slots
    - default : link or text
-->

<li>
  <slot />
</li>

<style>
  :global(li + li)::before {
    content: ' > ';
    margin-left: calc(var(--spacing) / 3);
  }
</style>
