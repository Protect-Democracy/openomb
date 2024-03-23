<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Apportionments</title>
</svelte:head>

<h1>Apportionments</h1>

<h2>Search</h2>

<p>
  A big search here. Do we want to have a more advanced search (not just a text box) here? Or we can
  have a specific advanced search page? Given the focus of the site, seems like having as much
  search functionality here makes sense.
</p>

<h2>Examples</h2>

<ul>
  <li><a href="/file/11221129">11221129 - Most schedule items</a></li>
  <li><a href="/file/11297405">11297405 - 2nd Most schedule items</a></li>
  <li><a href="/file/11297388">11297388 - ~400 schedule items</a></li>
  <li><a href="/file/11316019">11316019 - ~100 schedule items</a></li>
</ul>

<h2>Recent files</h2>
<ul>
  {#each data.recentFiles as file}
    <li>
      <a href="/file/{file.fileId}">{file.folder} - {file.fileId} - {file.approvalTimestamp}</a>
    </li>
  {/each}
</ul>

<h2>Recently removed</h2>

<p>(if there is any)</p>

<ul>
  {#each data.recentRemoved as file}
    <li>
      <a href="/file/{file.fileId}">{file.folder} - {file.fileId} - {file.approvalTimestamp}</a>
    </li>
  {/each}
</ul>

<h2>Folders</h2>

<p>
  Is there a better name than folder? Maybe we make landing pages for each Folder to help with
  exploration and SEO?
</p>

<ul>
  {#each data.folders as folder}
    <li>{folder.folder} ({folder.count})</li>
  {/each}
</ul>

<h2>Approvers</h2>

<p>Each approver.</p>

<ul>
  {#each data.approvers as approver}
    <li>{approver.approver || 'null'} ({approver.count})</li>
  {/each}
</ul>

<h2>Folder, Agency, Bureau</h2>

<p>A breakdown by Folder, Agency, and Bureau with a file count next to each one.</p>

<ul>
  {#each data.departmentAgencyBureau as folder}
    <li>
      {folder.folder}
      {#if folder.rows.length}
        <ul>
          {#each folder.rows as agency}
            <li>
              {agency.agency}
              {#if agency.rows.length}
                <ul>
                  {#each agency.rows as bureau}
                    <li>
                      {bureau.bureau} ({bureau.fileCount})
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </li>
  {/each}
</ul>

<h2>Styles</h2>
<a href="/styles">Page with many elements to help with global style development</a>
