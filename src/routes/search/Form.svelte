<script lang="ts">
  import Spinner from '$components/icons/Spinner.svelte';
  import SearchSelect from '$components/inputs/SearchSelect.svelte';
  import CheckboxButtons from '$components/inputs/CheckboxButtons.svelte';
  import { submitting } from './form-store';
  import { getContext } from 'svelte';

  // Props
  export let url;
  export let agencyBureauOptions = [];
  export let yearOptions = [];
  export let lineOptions = [];

  // Context
  const drawerContext = getContext('drawer');

  // Submit handler
  function submitHandler() {
    submitting.set(true);

    if (drawerContext) {
      drawerContext.close();
    }
  }

  // Derived
  $: submittingProxy = typeof $submitting !== 'undefined' ? $submitting : false;

  // TODO: It would be good to align this markup with the global styles,
  // specifically the use of .form-item.  The global styles could be
  // updated to reflect this, as they are not agreed upon yet.
</script>

<form method="get" on:submit={submitHandler}>
  <div class="field-col">
    <div class="field">
      <label for="term">Keyword</label>
      <input type="text" id="term" name="term" value={url.searchParams.get('term')} />
    </div>

    <div class="field">
      <label for="agencyBureau-input">Agency and bureau</label>

      <SearchSelect
        id="agencyBureau"
        name="agencyBureau"
        options={agencyBureauOptions}
        formatGroupLabel={(o) => o.budgetAgencyTitle}
        formatGroupValue={(o) => o.budgetAgencyTitleId}
        formatOptionLabel={(o) => o.budgetBureauTitle}
        formatOptionValue={(o) => o.budgetBureauTitleId}
        value={url.searchParams.get('agencyBureau') || ''}
      />
    </div>

    <div class="field">
      <label for="tafs"
        >Account number (<acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym> or
        <acronym title="Treasury Account Symbol">TAS</acronym>)</label
      >
      <input type="text" id="tafs" name="tafs" value={url.searchParams.get('tafs')} />
    </div>

    <div class="field">
      <label for="account">Account name</label>
      <input type="text" id="account" name="account" value={url.searchParams.get('account')} />
    </div>

    <div class="field">
      <label for="approver">Approved by</label>
      <input type="text" id="approver" name="approver" value={url.searchParams.get('approver')} />
    </div>
  </div>

  <div class="field-col">
    <div class="field">
      <label for="year">Fiscal year</label>

      <CheckboxButtons
        id="year"
        name="year"
        options={yearOptions}
        value={url.searchParams.getAll('year')}
        multi
      />
    </div>

    <div class="field">
      <label for="approvedDateRange">Approved date range</label>
      <div class="date-fields">
        <input
          id="approvedDateRange"
          name="approvedStart"
          type="date"
          value={url.searchParams.get('approvedStart')}
        />
        <span class="date-through">
          <span class="sr-only">Through</span>
          <span role="img" aria-label="Dash symbol" aria-hidden="true">-</span>
        </span>

        <input
          id="approvedDateRange"
          name="approvedEnd"
          type="date"
          value={url.searchParams.get('approvedEnd')}
        />
      </div>
    </div>

    <div class="field">
      <label for="lineNum">Has line number</label>

      <SearchSelect
        id="lineNum"
        name="lineNum"
        options={lineOptions}
        value={url.searchParams.getAll('lineNum')}
        multi
      />
    </div>

    <div class="field">
      <label for="footnoteNum">Has Footnote</label>

      <CheckboxButtons
        id="footnoteNum"
        name="footnoteNum"
        options={['A', 'B']}
        value={url.searchParams.getAll('footnoteNum')}
        multi
      />
    </div>
  </div>

  <div class="field-col">
    <button type="submit" disabled={submittingProxy}>
      {#if submittingProxy}
        <span class="button-icon"><Spinner /></span>
        Loading
      {:else}
        Search
      {/if}
    </button>
  </div>

  <div class="field-col">
    <button type="reset" class="secondary">Reset</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-wrap: wrap;
    column-gap: var(--spacing);
  }

  .field-col {
    flex: 0 0 calc(50% - var(--spacing) / 2);
    margin-bottom: var(--spacing);
  }

  .field-col .field,
  .field-col button {
    width: calc(100% - var(--spacing));
    margin-bottom: var(--spacing);
  }

  .date-fields {
    display: flex;
    column-gap: var(--spacing-half);
  }

  .date-fields input {
    min-width: 0;
  }

  .date-through {
    font-weight: bold;
    vertical-align: baseline;
    margin-top: var(--spacing-half);
  }

  label {
    font-weight: 700;
    font-size: var(--font-size-small);
    margin-bottom: var(--spacing-small);
  }

  input[type='text'] {
    width: 100%;
  }

  @media (max-width: 1280px) {
    .field {
      width: auto;
    }
  }

  @media (max-width: 768px) {
    .field-col button {
      margin-bottom: 0;
    }
  }
</style>
