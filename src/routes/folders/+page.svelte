<script lang="ts">
  import type { PageData } from './$types';
import { formatNumber } from '$lib/formatters';

export let data: PageData;
$: ({ folders } = data);
</script>

<div class="page-container content-container">
  <h1>CFO/CIO Act Agencies</h1>

  <p>
    The list below contains folders of apportionments for CFO/CIO Act Agencies, as well as a folder
    for other independent agencies. This folder structure mirrors the structure of <acronym
      title="Office of Management and Budget">OMB</acronym
    >&apos;s apportionment website.
  </p>

  <ul>
    {#each folders as folder, fIndex (folder.folderId)}
      <li>
        <a href="/folder/{folder.folderId}">{folder.folder}</a>
        ({formatNumber(folder.fileCount || 0)}{fIndex === 0 ? ' files' : ''})
      </li>
    {/each}
  </ul>
</div>
