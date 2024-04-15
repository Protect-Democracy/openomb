<!--
  Wrapper for Breadcrumb Navigation
  Expects BreadcrumbItem(s) as children

  Params
    None
  Slots
    - default: navigation items
-->

<nav>
  <ul>
    <slot />
  </ul>
</nav>

<style>
  ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
  }
</style>
