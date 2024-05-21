<script lang="ts">
  import Spinner from '$components/icons/Spinner.svelte';
  import SearchIcon from '$components/icons/Search.svelte';

  // State
  let submitting = false;
</script>

<form method="GET" action="/search" on:submit={() => (submitting = true)}>
  <div class="search-wrapper">
    <input type="text" id="term" name="term" placeholder="Search apportionments" />
    <div class="icon">
      <SearchIcon stroke-width="3" />
    </div>
  </div>

  <div class="actions">
    <button type="submit" disabled={submitting}>
      {#if submitting}
        <span class="button-icon"><Spinner /></span>
        Loading
      {:else}
        Search options
      {/if}
    </button>

    <a class="button like-link" href="/about">About our process</a>
  </div>
</form>

<style>
  input {
    width: 100%;
    font-size: var(--font-size-large);
    padding: var(--spacing);
    text-align: center;
    border-width: var(--border-weight);
  }

  .search-wrapper {
    position: relative;
    margin-bottom: var(--spacing);
  }

  .search-wrapper .icon {
    position: absolute;
    top: 50%;
    left: var(--spacing);
    translate: 0 calc(-50% + 1px);
    width: calc(var(--spacing) * 1.75);
  }
</style>
