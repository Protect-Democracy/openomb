<script lang="ts">
  import AltDirectoryTree from '$components/navigation/AltDirectoryTree.svelte';
  import AltDirectoryTreeItem from '$components/navigation/AltDirectoryTreeItem.svelte';
  export let agencies = [];
</script>

<noscript>
  <p class="font-small">
    <strong>Please note:</strong> The agency listing below will not fully function without
    JavaScript enabled. Either use it directly to get to a specific agency listing page, or utilize
    the
    <a href="/search">search page</a> to look for specific apportionments.
  </p>
</noscript>

<div class="agency-list">
  <!-- TODO: Add expand-all and collapse-all buttons -->

  <AltDirectoryTree columns={2}>
    {#each agencies as agency}
      <AltDirectoryTreeItem level={1}>
        <svelte:fragment slot="button">
          {agency.budgetAgencyTitle}
        </svelte:fragment>

        <small slot="hover">
          <a
            title="Go to agency: {agency.budgetAgencyTitle}"
            href={`/agency/${agency.budgetAgencyTitleId}`}>Go to agency</a
          >
        </small>

        {#each agency.budgetBureaus as bureau}
          <AltDirectoryTreeItem level={2}>
            <svelte:fragment slot="button">
              {bureau.budgetBureauTitle}
            </svelte:fragment>

            <small slot="hover">
              <a
                title="Go to bureau: {bureau.budgetBureauTitle}"
                href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}`}
              >
                Go to bureau
              </a></small
            >

            {#each bureau.accounts as account}
              <AltDirectoryTreeItem level={3}>
                <a
                  slot="title"
                  title="Go to account: {account.accountTitle}"
                  href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}/account/${account.accountTitleId}`}
                >
                  {account.accountTitle}
                </a>

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
