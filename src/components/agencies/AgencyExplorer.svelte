<script lang="ts">
  import { resolve } from '$app/paths';
  import AltDirectoryTree from '$components/navigation/AltDirectoryTree.svelte';
  import AltDirectoryTreeItem from '$components/navigation/AltDirectoryTreeItem.svelte';
  import type { AgenciesWithChildrenResult } from '$queries/agencies';

  export let agencies: AgenciesWithChildrenResult = [];
</script>

<noscript>
  <p class="font-small">
    <strong>Please note:</strong> The agency listing below will not fully function without
    JavaScript enabled. Either use it directly to get to a specific agency listing page, or utilize
    the
    <a href={resolve('/search')}>search page</a> to look for specific apportionments.
  </p>
</noscript>

<div class="agency-list">
  <!-- TODO: Add expand-all and collapse-all buttons -->

  <AltDirectoryTree columns={2}>
    {#each agencies as agency (agency.budgetAgencyTitleId)}
      <AltDirectoryTreeItem level={1}>
        <svelte:fragment slot="button">
          {agency.budgetAgencyTitle}
        </svelte:fragment>

        <small slot="hover">
          {#if agency.budgetAgencyTitleId}
            <a
              title="Go to agency: {agency.budgetAgencyTitle}"
              href={resolve('/agency/[agencyId]', { agencyId: agency.budgetAgencyTitleId })}
              >Go to agency</a
            >
          {/if}
        </small>

        {#each agency.budgetBureaus as bureau, bi (`${agency.budgetAgencyTitleId}-${bi}`)}
          <AltDirectoryTreeItem level={2}>
            <svelte:fragment slot="button">
              {bureau.budgetBureauTitle}
            </svelte:fragment>

            <small slot="hover">
              {#if agency.budgetAgencyTitleId && bureau.budgetBureauTitleId}
                <a
                  title="Go to bureau: {bureau.budgetBureauTitle}"
                  href={resolve('/agency/[agencyId]/bureau/[bureauId]', {
                    agencyId: agency.budgetAgencyTitleId,
                    bureauId: bureau.budgetBureauTitleId
                  })}
                >
                  Go to bureau
                </a>
              {/if}
            </small>

            {#each bureau.accounts as account, ai (`${agency.budgetAgencyTitleId}-${bi}-${ai}`)}
              <AltDirectoryTreeItem level={3}>
                <svelte:fragment slot="title">
                  {#if agency.budgetAgencyTitleId && bureau.budgetBureauTitleId && account.accountTitleId}
                    <a
                      title="Go to account: {account.accountTitle}"
                      href={resolve('/agency/[agencyId]/bureau/[bureauId]/account/[accountId]', {
                        agencyId: agency.budgetAgencyTitleId,
                        bureauId: bureau.budgetBureauTitleId,
                        accountId: account.accountTitleId
                      })}
                    >
                      {account.accountTitle}
                    </a>
                  {:else}
                    {account.accountTitle}
                  {/if}
                </svelte:fragment>

                <small slot="hover" class="muted">Account</small>
              </AltDirectoryTreeItem>
            {/each}
          </AltDirectoryTreeItem>
        {/each}
      </AltDirectoryTreeItem>
    {/each}
  </AltDirectoryTree>
</div>

<style>
  small {
    text-wrap: nowrap;
    padding-left: var(--spacing-half);
  }
</style>
