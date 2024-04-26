<script lang="ts">
  import type { PageData } from './$types';
  import AgencyExplorer from '$components/agencies/AgencyExplorer.svelte';
  export let data: PageData;
</script>

<section class="page-container content-container">
  <h1>Explore apportionments</h1>

  <p>
    Apportionments are organized by Folder, Agency, and Bureau, and each apportionment file can have
    a number of accounts and TAFS in them. The listing below allows you to start from the Agency
    level and drill down to get to the group of apportionments you are looking for. Also try <a
      href="/search">searching for apportionments</a
    >
    or <a href="/folders">to explore by folders</a>.
  </p>

  <AgencyExplorer agencies={data.agencies} />
</section>

<style>
  p {
    margin-bottom: var(--spacing-large);
  }
</style>
