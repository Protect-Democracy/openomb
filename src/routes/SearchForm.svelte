<script lang="ts">
  import SearchIcon from '$components/icons/Search.svelte';
</script>

<form method="GET" action="/search">
  <div class="search-wrapper">
    <input type="text" id="term" name="term" placeholder="Search apportionments" />
    <div class="icon">
      <SearchIcon stroke="var(--color-gray-medium)" stroke-width="2" />
    </div>
  </div>

  <div class="actions">
    <button type="submit">Search options</button>

    <a class="button like-link" href="/about">About our process</a>
  </div>
</form>

<style>
  input {
    width: 100%;
    font-size: var(--font-size-large);
    padding: calc(var(--spacing) * 1.25) var(--spacing);
    text-align: center;
  }

  .search-wrapper {
    position: relative;
    margin-bottom: var(--spacing);
  }

  .search-wrapper .icon {
    position: absolute;
    left: var(--spacing-half);
    top: var(--spacing-half);
  }
</style>
