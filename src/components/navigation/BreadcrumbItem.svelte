<!--
  Breadcrumb Navigation Item

  Params
    None
  Slots
    - default : link or text
-->

<li class="breadcrumb-item">
  <slot />
</li>

<style>
  /* @todo If possible, find a better way to do this without using global in final styles */
  :global(li.breadcrumb-item + li.breadcrumb-item)::before {
    content: ' > ';
    margin-left: calc(var(--spacing) / 3);
  }
</style>
