<script lang="ts">
  import { slice } from 'lodash-es';
  import Accordion from '$components/Accordion/Accordion.svelte';
  export let columns = 2;
  export let agencies = [];

  // Get the number of elements in each column (rounded up, earlier columns will have overflow)
  const perColumn = Math.ceil(agencies.length / columns);
</script>

<div class="agency-list">
  <!-- Iterate over each column, then find our current starting index -->
  {#each Array(columns) as _, index (index)}
    {@const arrayStart = index * perColumn}
    <div class="agency-column">
      <!-- Get the column slice of agencies (if end index is out of range, it seems to just take the final elements) -->
      {#each slice(agencies, arrayStart, arrayStart + perColumn) as agency}
        <div class="agency-entry">
          <Accordion>
            <a class="agency-heading" href={`/agency/${agency.budgetAgencyTitleId}`}>
              {agency.budgetAgencyTitle}
            </a>
            <svelte:fragment slot="content">
              {#each agency.budgetBureaus as bureau}
                <a class="agency-bureau" href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}`}>
                  {bureau.budgetBureauTitle} ({bureau.fileCount})
                </a>
              {/each}
            </svelte:fragment>
          </Accordion>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .agency-list {
    display: flex;
    flex-basis: 1fr;
    column-gap: var(--spacing);
    justify-content: center;
  }

  .agency-entry {
    margin-top: -1px;
    border-top: 1px solid var(--color-gray-dark);
    border-bottom: 1px solid var(--color-gray-dark);
  }

  .agency-heading {
    color: var(--color-text);
    font-weight: 500;
  }

  .agency-bureau {
    color: var(--color-gray-medium);
    display: block;
  }
  .agency-bureau + .agency-bureau {
    margin-top: var(--spacing-half);
  }
</style>
