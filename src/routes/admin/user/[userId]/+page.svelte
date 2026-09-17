<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate } from '$lib/formatters';

  export let data: PageData;
  $: ({ viewedUser, subscriptions, searches } = data);
</script>

<div class="page-container content-container">
  <p><a href="/admin">&laquo; Back to users</a></p>

  <h1>{viewedUser.email}</h1>

  <dl class="user-summary">
    <dt>Created</dt>
    <dd>{formatDate(viewedUser.createdAt, 'medium')}</dd>

    <dt>Email Verified</dt>
    <dd>{viewedUser.emailVerified ? formatDate(viewedUser.emailVerified, 'medium') : 'No'}</dd>
  </dl>

  <section>
    <h2 class="h2-alt">Subscriptions</h2>

    {#if !subscriptions || subscriptions.length === 0}
      <p>No subscriptions.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <td>Subscription</td>
            <td>Frequency</td>
          </tr>
        </thead>
        <tbody>
          {#each subscriptions as subscription (subscription.id)}
            <tr>
              <td>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <a href={subscription.itemLink}>{@html subscription.description}</a>
              </td>
              <td>{subscription.frequency}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <section>
    <h2 class="h2-alt">Saved Searches</h2>

    {#if !searches || searches.length === 0}
      <p>No saved searches.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <td>Search</td>
            <td>Created</td>
          </tr>
        </thead>
        <tbody>
          {#each searches as search (search.id)}
            <tr>
              <td><a href={search.itemLink}>{search.description}</a></td>
              <td>{formatDate(search.createdAt, 'medium')}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>

<style>
  .user-summary {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--spacing-half) var(--spacing);
    margin-bottom: var(--spacing-double);

    dt {
      font-weight: var(--font-copy-weight-bold);
    }

    dd {
      margin: 0;
    }
  }
</style>
