<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';

  export let data: PageData;
  $: ({ folders } = data);
</script>

<div class="page-container content-container">
  <h1>Folders</h1>

  <p>The complete list of all top-level folders that apportionment files are found in.</p>

  <ul>
    {#each folders as folder, fIndex}
      <li>
        <a href="/folder/{folder.folderId}">{folder.folder}</a> ({formatNumber(
          folder.fileCount
        )}{fIndex === 0 ? ' files' : ''})
      </li>
    {/each}
  </ul>
</div>
