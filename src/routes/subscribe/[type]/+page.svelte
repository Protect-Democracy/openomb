<script lang="ts">
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import SearchSubscribe from '$components/subscriptions/SearchSubscribe.svelte';

  export let data: PageData;
  $: ({ type, user } = data);

  // Stores
  const url = derived(page, ($page) => $page.url);
</script>

<div class="page-container content-container">
  {#if !user}
    <SearchSubscribe {url} />
  {:else}
    <h2>There was an error subscribing to the {type}</h2>
  {/if}
</div>
