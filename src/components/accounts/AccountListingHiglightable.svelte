<script lang="ts">
  import { highlight } from '$lib/formatters';
import type { SearchPaginationParams } from '$db/queries/search';

// Props
export let headerElement = 'h3';
export let headerClasses = '';
export let account: object;
export let highlightParams: SearchPaginationParams;

// Derived
$: searchTerms = highlightParams?.term || [];
$: highlightedAccount = account
  ? {
      ...account,
      highlightedAccountTitle: highlight(account.accountTitle, [
        ...searchTerms,
        highlightParams.account
      ]),
      highlightedBudgetAgencyTitle: highlight(account.budgetAgencyTitle, searchTerms),
      highlightedBudgetBureauTitle: highlight(account.budgetBureauTitle, searchTerms)
    }
  : {};
</script>

<article class="account-listing">
  <svelte:element this={headerElement} class="main-heading {headerClasses}">
    <a
      href="/agency/{highlightedAccount.budgetAgencyTitleId}/bureau/{highlightedAccount.budgetBureauTitleId}/account/{highlightedAccount.accountTitleId}"
      class="account-link"
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html highlightedAccount.highlightedAccountTitle}
    </a>
  </svelte:element>

  <ul class="inline-list font-small">
    <li>
      <a
        class="like-text"
        title="Go to agency: {highlightedAccount.budgetAgencyTitle}"
        href="/agency/{highlightedAccount.budgetAgencyTitleId}"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html highlightedAccount.highlightedBudgetAgencyTitle ||
          highlightedAccount.budgetAgencyTitle}</a
      >
    </li>

    <li>
      <a
        class="like-text"
        title="Go to bureau: {highlightedAccount.budgetBureauTitle}"
        href="/agency/{highlightedAccount.budgetAgencyTitleId}/bureau/{highlightedAccount.budgetBureauTitleId}"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html highlightedAccount.highlightedBudgetBureauTitle ||
          highlightedAccount.budgetAgencyTitle}</a
      >
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
