<script lang="ts">
  import { slice } from 'lodash-es';
  import Accordion from '$components/accordion/Accordion.svelte';
  export let columns = 2;
  export let agencies = [];
  export let headerElement = 'h3';

  // Get the number of elements in each column (rounded up, earlier columns will have overflow)
  const perColumn = Math.ceil(agencies.length / columns);
</script>

<div class="agency-list">
  <!-- Iterate over each column, then find our current starting index -->
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#each Array(columns) as _, index (index)}
    {@const arrayStart = index * perColumn}
    <div class="agency-column">
      <!-- Get the column slice of agencies (if end index is out of range, it seems to just take the final elements) -->
      {#each slice(agencies, arrayStart, arrayStart + perColumn) as agency}
        <div class="agency-entry">
          <Accordion>
            <svelte:fragment slot="heading">
              <svelte:element this={headerElement} class="agency-heading">
                {agency.budgetAgencyTitle}
              </svelte:element>
            </svelte:fragment>

            <svelte:fragment slot="content">
              {#each agency.budgetBureaus as bureau, bIndex}
                <a
                  class="agency-bureau"
                  href={`/agency/${agency.budgetAgencyTitleId}/bureau/${bureau.budgetBureauTitleId}`}
                >
                  {bureau.budgetBureauTitle} ({bureau.fileCount}{bIndex === 0 ? ' files' : ''})
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
    column-gap: var(--spacing-double);
    justify-content: space-evenly;
  }

  .agency-entry {
    border-bottom: var(--border-weight) solid var(--color-black);
  }

  .agency-heading {
    font-size: var(--font-size-regular);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-copy);
    margin: 0;
    padding: 0;
  }

  .agency-bureau {
    color: var(--color-gray-medium);
    display: block;
  }

  .agency-bureau + .agency-bureau {
    margin-top: var(--spacing-half);
  }
</style>
