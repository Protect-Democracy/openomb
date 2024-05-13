<script lang="ts">
  import type { PageData } from './$types';
  import AgencyExplorer from '$components/agencies/AgencyExplorer.svelte';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';

  export let data: PageData;
</script>

<section class="page-container content-container">
  <h1>Explore Apportionments by Agency</h1>

  <p>
    Apportionments are made at the account level, but those accounts are for particular agencies and
    bureaus. The listing below allows you to start from the agency level and drill down from there
    to find the apportionment you are looking for. Also try <a href="/search"
      >searching for apportionments</a
    >
    or <a href="/folders">to explore by folders</a>.
  </p>

  <AgencyExplorer agencies={data.agencies} />

  <ScrollToTop />
</section>

<style>
  p {
    margin-bottom: var(--spacing-large);
  }
</style>
