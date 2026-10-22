<script lang="ts">
  import { resolve } from '$app/paths';
  import { highlight } from '$lib/formatters';
  import type { SearchPaginationParams } from '$db/queries/search';

  // Props
  export let headerElement = 'h3';
  export let headerClasses = '';
  export let account: object;
  export let highlightParams: SearchPaginationParams;

  // Derived
  $: searchTerms = highlightParams?.term;
  $: highlightedAccount = account
    ? {
        ...account,
        highlightedAccountTitle: highlight(account.accountTitle, [
          ...(searchTerms || []),
          highlightParams.account || ''
        ]),
        highlightedBudgetAgencyTitle: highlight(account.budgetAgencyTitle, searchTerms),
        highlightedBudgetBureauTitle: highlight(account.budgetBureauTitle, searchTerms)
      }
    : {};
</script>

<article class="account-listing">
  <svelte:element this={headerElement} class="main-heading {headerClasses}">
    {#if highlightedAccount.budgetAgencyTitleId && highlightedAccount.budgetBureauTitleId && highlightedAccount.accountTitleId}
      <a
        href={resolve('/agency/[agencyId]/bureau/[bureauId]/account/[accountId]', {
          agencyId: highlightedAccount.budgetAgencyTitleId,
          bureauId: highlightedAccount.budgetBureauTitleId,
          accountId: highlightedAccount.accountTitleId
        })}
        class="account-link"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html highlightedAccount.highlightedAccountTitle}
      </a>
    {:else}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html highlightedAccount.highlightedAccountTitle}
    {/if}
  </svelte:element>

  <ul class="inline-list font-small">
    <li>
      {#if highlightedAccount.budgetAgencyTitleId}
        <a
          class="like-text"
          title="Go to agency: {highlightedAccount.budgetAgencyTitle}"
          href={resolve('/agency/[agencyId]', { agencyId: highlightedAccount.budgetAgencyTitleId })}
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html highlightedAccount.highlightedBudgetAgencyTitle ||
            highlightedAccount.budgetAgencyTitle}</a
        >
      {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html highlightedAccount.highlightedBudgetAgencyTitle ||
          highlightedAccount.budgetAgencyTitle}
      {/if}
    </li>

    <li>
      {#if highlightedAccount.budgetAgencyTitleId && highlightedAccount.budgetBureauTitleId}
        <a
          class="like-text"
          title="Go to bureau: {highlightedAccount.budgetBureauTitle}"
          href={resolve('/agency/[agencyId]/bureau/[bureauId]', {
            agencyId: highlightedAccount.budgetAgencyTitleId,
            bureauId: highlightedAccount.budgetBureauTitleId
          })}
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html highlightedAccount.highlightedBudgetBureauTitle ||
            highlightedAccount.budgetAgencyTitle}</a
        >
      {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html highlightedAccount.highlightedBudgetBureauTitle ||
          highlightedAccount.budgetAgencyTitle}
      {/if}
    </li>
  </ul>
</article>

<style>
  .main-heading {
    margin-top: 0;
    padding-top: 0;
    margin-bottom: 0;
  }
</style>
