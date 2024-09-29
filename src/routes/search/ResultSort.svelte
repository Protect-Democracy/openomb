<script lang="ts">
  import { submitting } from './form-store';

  // Props
  export let url: URL;
  export let id: string;
  export let sortOptions: { key: string; label: string }[] = [];
  export let defaultValue: string;

  // State
  let sortFormEl: HTMLFormElement;

  // The regular form doesn't seem to change the page in a way that
  // does submitting so we have to do it manually.
  function updateSort() {
    submitting.set(true);
    sortFormEl.submit();
  }
</script>

<div class="result-sort">
  <form action={`${url.pathname}#${id}`} method="get" bind:this={sortFormEl}>
    <label for={id}>Sort results</label>

    <select name={id} {id} value={url.searchParams.get(id) || defaultValue} on:change={updateSort}>
      {#each sortOptions as option (option.key)}
        <option value={option.key}>{option.label}</option>
      {/each}
    </select>

    {#each url.searchParams.keys() as param, pi (`${param}-${pi}`)}
      {#each url.searchParams.getAll(param) as value}
        {#if param !== 'sort'}
          <input type="hidden" name={param} {value} />
        {/if}
      {/each}
    {/each}

    <noscript>
      <div class="no-js-only-block">
        <button type="submit" class="small compact">Sort</button>
      </div>
    </noscript>
  </form>
</div>

<style>
  form {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  label {
    margin-right: var(--spacing);
  }

  button {
    margin-left: var(--spacing);
  }
</style>
