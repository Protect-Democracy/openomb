<script lang="ts">
  import { capitalize } from 'lodash-es';
  import type { subscriptionSelect } from '$db/schema/subscriptions';
  import CheckboxButtons from '$components/inputs/CheckboxButtons.svelte';

  export let title: string;
  export let subs: Array<subscriptionSelect>;
</script>

{#if subs && subs.length}
  <tr class="sub-category">
    <td colspan={3}>{title}</td>
  </tr>
  {#each subs as subscription}
    <tr>
      <td class="sub-link">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <a href={subscription.itemLink}>{@html subscription.description}</a>
      </td>

      <td class="sub-frequency">
        <label class="sr-only" for={`frequency-${subscription.id}`}
          >Set Email Frequency for {subscription.description}</label
        >
        <CheckboxButtons
          id={`frequency-${subscription.id}`}
          name={`frequency-${subscription.id}`}
          buttonClass="subscribe"
          options={['daily', 'weekly']}
          formatOptionLabel={capitalize}
          value={subscription.frequency}
        />
      </td>

      <td class="sub-remove">
        <label class="sr-only" for={`remove-${subscription.id}`}
          >Remove Subscription to {subscription.description}</label
        >
        <input
          type="checkbox"
          id={`remove-${subscription.id}`}
          name="remove"
          value={subscription.id}
        />
      </td>
    </tr>
  {/each}
{/if}

<style>
  .sub-category {
    font-size: var(--font-size-small);
    font-weight: var(--font-copy-weight-bold);
    background-color: var(--color-gray-lightest);
    color: var(--color-text-alt);
  }

  .sub-remove,
  .sub-frequency {
    text-align: center;
  }
</style>
