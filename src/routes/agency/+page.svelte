<script lang="ts">
  import type { PageData } from './$types';
  import DirectoryTree from '$components/navigation/DirectoryTree.svelte';
  import DirectoryTreeItem from '$components/navigation/DirectoryTreeItem.svelte';

  export let data: PageData;
</script>

<section class="agency-listing">
  <h1>Agency Account Directory</h1>

  <DirectoryTree>
    {#each data.agencies as agency}
      <DirectoryTreeItem>
        <a href={`/agency/${agency.budgetAgencyTitleId}`}>
          {agency.budgetAgencyTitle}
        </a>
        <svelte:fragment slot="children">
          {#each agency.budgetBureaus as bureau}
            <DirectoryTreeItem>
              <a href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}`}>
                {bureau.budgetBureauTitle}
              </a>
              <svelte:fragment slot="children">
                {#each bureau.accounts as account}
                  <DirectoryTreeItem>
                    <a href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}/account/${account.accountTitleId}`}>
                      {account.accountTitle}
                    </a>
                  </DirectoryTreeItem>
                {/each}
              </svelte:fragment>
            </DirectoryTreeItem>
          {/each}
        </svelte:fragment>
      </DirectoryTreeItem>
    {/each}
  </DirectoryTree>
</section>

<style>

</style>
