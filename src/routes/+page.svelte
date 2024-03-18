<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1>Apportionments</h1>

<h2>Recent files</h2>
<ul>
  {#each data.recentFiles as file}
    <li>
      <a href="/file/{file.fileId}">{file.folder} - {file.fileId} - {file.approvalTimestamp}</a>
    </li>
  {/each}
</ul>
