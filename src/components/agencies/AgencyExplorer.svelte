<script lang="ts">
  import AltDirectoryTree from '$components/navigation/AltDirectoryTree.svelte';
  import AltDirectoryTreeItem from '$components/navigation/AltDirectoryTreeItem.svelte';
  export let agencies = [];
</script>

<div class="agency-list">
  <!-- TODO: Add expand-all and collapse-all buttons -->

  <AltDirectoryTree columns={2}>
    {#each agencies as agency}
      <AltDirectoryTreeItem level={1}>
        <svelte:fragment slot="button">
          {agency.budgetAgencyTitle}
        </svelte:fragment>

        <a
          slot="title"
          title="Go to agency: {agency.budgetAgencyTitle}"
          href={`/agency/${agency.budgetAgencyTitleId}`}>Go</a
        >

        <small slot="hover" class="muted">Agency</small>

        {#each agency.budgetBureaus as bureau}
          <AltDirectoryTreeItem level={2}>
            <svelte:fragment slot="button">
              {bureau.budgetBureauTitle}
            </svelte:fragment>

            <a
              slot="title"
              title="Go to bureau: {bureau.budgetBureauTitle}"
              href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}`}
            >
              Go
            </a>

            <small slot="hover" class="muted">Bureau</small>

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
</style>
