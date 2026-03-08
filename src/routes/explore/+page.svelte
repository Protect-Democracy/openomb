<script lang="ts">
  import type { PageData } from './$types';
  import AgencyExplorer from '$components/agencies/AgencyExplorer.svelte';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';

  export let data: PageData;
</script>

<section class="page-container content-container">
  <h1>Explore Apportionments by Agency</h1>

  <p>
    Also try <a href="/search">searching for apportionments</a> or
    <a href="/folders">perusing our abbreviated list of agencies</a>.
  </p>

  <AgencyExplorer agencies={data.agencies} />

  <ScrollToTop />
</section>

<style>
  p {
    margin-bottom: var(--spacing-large);
  }
</style>
