<script lang="ts">
  import type { filesSelect } from '$schema/files';
  import type { SearchPaginationParams } from '$db/queries/search';
  import type { RecentlyAddedOrApprovedWithTafsResult } from '$queries/files';
  import { filterTypeSpreadsheet, filterTypeLetter, filterTypeSpendPlan } from '$config/files';
  import { Tab, Tabs } from '$components/tabs';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';

  // Props
  export let files: filesSelect[] | RecentlyAddedOrApprovedWithTafsResult | undefined = undefined;
  export let highlightParams: SearchPaginationParams | undefined = undefined;
  export let headerElement: string | undefined = 'h3';
  export let headerClasses: string | undefined = '';

  // Derived
  $: hasFiles = files && files.length > 0 ? true : false;
  $: spreadsheetFiles = files?.filter(filterTypeSpreadsheet);
  $: letterFiles = files?.filter(filterTypeLetter);
  $: spendPlanFiles = files?.filter(filterTypeSpendPlan);
  $: defaultTabId =
    spreadsheetFiles && spreadsheetFiles.length
      ? 'spreadsheets'
      : letterFiles && letterFiles.length
        ? 'letters'
        : spendPlanFiles && spendPlanFiles.length
          ? 'spend-plans'
          : '';
</script>

<div class="tabbed-file-listing">
  {#if hasFiles}
    <Tabs {defaultTabId}>
      {#if spreadsheetFiles && spreadsheetFiles.length}
        <Tab id="spreadsheets" label="Spreadsheets">
          {#each spreadsheetFiles as file (file.fileId)}
            <FileListingHighlightable {file} {highlightParams} {headerElement} {headerClasses} />
          {/each}
        </Tab>
      {/if}

      {#if letterFiles && letterFiles.length}
        <Tab id="letters" label="Letters">
          {#each letterFiles as file (file.fileId)}
            <FileListingHighlightable {file} {highlightParams} {headerElement} {headerClasses} />
          {/each}
        </Tab>
      {/if}

      {#if spendPlanFiles && spendPlanFiles.length}
        <Tab id="spend-plans" label="Spend Plans">
          {#each spendPlanFiles as file (file.fileId)}
            <FileListingHighlightable {file} {highlightParams} {headerElement} {headerClasses} />
          {/each}
        </Tab>
      {/if}
    </Tabs>
  {:else}
    <p>No files found.</p>
  {/if}
</div>
