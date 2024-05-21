<script lang="ts">
  import { formatFileTitle, formatDate } from '$lib/formatters';

  export let files = [];
</script>

<ul>
  {#each files as file}
    <li>
      <span class="approval-file">
        <span class="folder">{file.folder}</span>
        <a href="/file/{file.fileId}">{formatFileTitle(file)}</a>
      </span>
      <span class="approval-date">Approved {formatDate(file.approvalTimestamp, 'long')}</span>
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: var(--spacing-half);
    border-top: 2px solid var(--color-text);
    border-bottom: 2px solid var(--color-text);
    margin-bottom: -2px;
    padding: var(--spacing) 0;
  }

  .approval-file {
    position: relative;
    flex-grow: 1;
    padding-top: calc(var(--spacing) * 1.25);
    padding-left: var(--spacing-half);
  }

  .folder {
    font-size: var(--font-size-small);
    text-transform: uppercase;
    font-weight: var(--font-copy-weight-bold);
    color: var(--color-text-muted);
    position: absolute;
    left: 0;
    top: 0;
  }

  @media (max-width: 768px) {
    li {
      flex-direction: column;
      align-items: flex-start;
      row-gap: var(--spacing-half);
    }

    .approval-file {
      width: 100%;
    }

    .approval-date {
      width: 100%;
      text-align: right;
    }
  }
</style>
