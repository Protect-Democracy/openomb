<script lang="ts">
  import type { PageData } from './$types';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';

  export let data: PageData;
  $: ({ type, itemId, user } = data);
</script>

<div class="page-container content-container">
  {#if !user}
    <SubscribeLink subType={type} subItemId={itemId} />
  {:else}
    <h2>There was an error subscribing to the {type}</h2>
  {/if}
</div>
