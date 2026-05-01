<script lang="ts">
  import { resolve } from '$app/paths';
  import RemoveAction from '$components/subscriptions/RemoveAction.svelte';
  import FrequencyAction from '$components/subscriptions/FrequencyAction.svelte';
  import type { subscriptionSelect } from '$schema/subscriptions';

  export let title: string;
  export let subs: Array<subscriptionSelect>;
</script>

{#if subs && subs.length}
  <tr class="sub-category">
    <th colspan={3}>{title}</th>
  </tr>
  {#each subs as subscription (subscription.id)}
    <tr>
      <td class="sub-link">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <a href={resolve(subscription.itemLink)}>{@html subscription.description}</a>
      </td>

      <td class="sub-frequency">
        <div
          class="button-group"
          role="group"
          aria-label={`Update subscription frequency for ${subscription.description}`}
        >
          <FrequencyAction
            frequency="daily"
            enabled={subscription.frequency === 'daily'}
            subId={subscription.id}
            title="Daily"
            subDescription={subscription.description}
            buttonProps={{ class: 'subscribe outline small' }}
          />
          <FrequencyAction
            frequency="weekly"
            enabled={subscription.frequency === 'weekly'}
            subId={subscription.id}
            title="Weekly"
            subDescription={subscription.description}
            buttonProps={{ class: 'subscribe outline small' }}
          />
        </div>
      </td>

      <td class="sub-remove">
        <RemoveAction
          subId={subscription.id}
          subDescription={subscription.description}
          buttonProps={{ class: 'like-link like-text alt small' }}
        />
      </td>
    </tr>
  {/each}
{/if}

<style>
  td,
  th {
    vertical-align: top;
    padding: var(--spacing);
  }

  .sub-category {
    font-weight: var(--font-copy-weight-bold);
    background-color: var(--color-gray-lightest);
    color: var(--color-text-alt);
  }

  .sub-frequency {
    min-width: calc(var(--spacing) * 12);
  }

  .sub-remove {
    text-align: right;
  }

  .button-group {
    margin-bottom: 0;
  }
</style>
