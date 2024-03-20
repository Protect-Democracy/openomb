<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1>File: {data.file.fileId}</h1>

<p>Folder: {data.file.folder}</p>
