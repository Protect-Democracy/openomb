<script lang="ts">
  import Spinner from '$components/icons/Spinner.svelte';
  import SearchIcon from '$components/icons/Search.svelte';
  import TopRightArrowIcon from '$components/icons/TopRightArrow.svelte';

  // State
  let submitting = false;
</script>

<form method="GET" action="/search" on:submit={() => (submitting = true)}>
  <div class="search-wrapper">
    <div class="search-input">
      <input type="text" id="term" name="term" placeholder="Search apportionments" />
      <div class="icon">
        <SearchIcon stroke-width="3" />
      </div>
    </div>
    <button type="submit" disabled={submitting}>
      {#if submitting}
        <span class="button-icon"><Spinner /></span>
        Loading
      {:else}
        Go
      {/if}
    </button>
  </div>

  <div class="actions">
    <a class="button compact like-link" href="/search">
      <span class="icon"><TopRightArrowIcon /></span> Or try using the advanced search.
    </a>
  </div>
</form>

<style>
  input {
    width: 100%;
    font-size: var(--font-size-large);
    padding: var(--spacing);
    text-align: center;
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
  }

  .search-input {
    position: relative;
    flex: auto 1 0;
  }

  .search-input .icon {
    position: absolute;
    top: 50%;
    left: var(--spacing);
    translate: 0 calc(-50% + 1px);
    width: calc(var(--spacing) * 1.75);
  }

  .search-wrapper button {
    padding: var(--spacing) var(--spacing-double);
    min-width: auto;
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
    margin: 0;
  }

  .search-wrapper {
    display: flex;
    margin-bottom: var(--spacing);
  }

  .actions a {
    display: flex;
    align-items: center;
    column-gap: var(--spacing-half);
    font-weight: var(--font-copy-weight-bold);
  }

  .actions .icon {
    width: var(--spacing-double);
    height: var(--spacing-double);
    color: var(--color-text-inverse);
  }

  @media (max-width: 768px) {
    .search-wrapper {
      flex-direction: column;
      row-gap: var(--spacing-half);
    }

    .search-wrapper button,
    .search-wrapper input {
      border-radius: var(--border-radius);
    }
  }
</style>
