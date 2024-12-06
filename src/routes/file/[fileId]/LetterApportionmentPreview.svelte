<script lang="ts">
  import { formatFileTitle } from '$lib/formatters';

  // Props
  export let file;
</script>

<div class="letter-apportionment-preview">
  <p>
    The following is a preview of the apportionment letter. Note that this preview is a copy and not
    directly from the <a href={file.pdfUrl} target="_blank" rel="noopener noreferrer"
      >primary source</a
    >.
  </p>

  <div class="scroll-space-wrapper">
    <iframe
      src={`/api/v1/letter-apportionment-preview?url=${encodeURIComponent(file.pdfUrl || '')}`}
      title="Apportionment letter preview for {formatFileTitle(file)}"
    ></iframe>
  </div>
</div>

<style>
  .scroll-space-wrapper {
    width: 100%;
    padding-right: calc(var(--spacing) * 3);
  }

  iframe {
    width: 100%;
    height: 50rem;
    max-height: 80vh;
    border: var(--border-weight-thin) solid var(--color-gray-medium);
  }
</style>
