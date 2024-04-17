<script lang="ts">
  import SearchIcon from '$components/icons/Search.svelte'
</script>

<form method="GET" action="/search">
  <div class="search-wrapper">
    <input type="text" id="term" name="term" placeholder="Search apportionments" />
    <div class="icon">
      <SearchIcon stroke="var(--color-gray-medium)" stroke-width="2" />
    </div>
  </div>
</form>

<style>
  input {
    padding-left: calc(var(--spacing) * 2);
    width: 100%;
  }

  .search-wrapper {
    position: relative;
  }

  .search-wrapper .icon {
    position: absolute;
    left: var(--spacing-half);
    top: var(--spacing-half);
  }
</style>
