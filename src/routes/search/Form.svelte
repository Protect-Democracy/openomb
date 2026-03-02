<script lang="ts">
  import { submitting } from './form-store';
import { getContext } from 'svelte';
import { parseUrlSearchParams } from '$lib/searches';
import { formatDate } from '$lib/formatters';

import Spinner from '$components/icons/Spinner.svelte';
import SearchSelect from '$components/inputs/SearchSelect.svelte';
import AgencyBureauSearchSelect from '$components/inputs/AgencyBureauSearchSelect.svelte';
import CheckboxButtons from '$components/inputs/CheckboxButtons.svelte';

// Types
import type { BureausResult } from '$queries/agencies';
import type {
  YearOptionsResult,
  ApproverTitleOptionsResult,
  LineNumberOptionsResult
} from '$queries/search';

// Props
export let url: URL;
export let agencyBureauOptions: BureausResult = [];
export let yearOptions: YearOptionsResult = [];
export let lineOptions: LineNumberOptionsResult = [];
export let approverTitleOptions: ApproverTitleOptionsResult = [];

// Context
// TODO: Type this
const drawerContext = getContext('drawer');

// Derived
$: parsedSearchParams = parseUrlSearchParams(url.searchParams);

// Submit handler
function submitHandler() {
  submitting.set(true);

  if (drawerContext) {
    // TODO: Need to type the drawer context
    // @ts-expect-error
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
      <input type="text" id="term" name="term" value={parsedSearchParams.term?.join(', ')} />
      <small
        >Multiple keywords are inclusive and must be separated by commas. E.g. <i
          >navy, department of defense, medical</i
        > will match all those terms.</small
      >
    </div>

    <div class="field">
      <label for="agencyBureau-input">Agency and bureau</label>

      <AgencyBureauSearchSelect
        id="agencyBureau"
        name="agencyBureau"
        bureaus={agencyBureauOptions}
        value={parsedSearchParams.agencyBureau || ''}
      />
    </div>

    <div class="field">
      <label for="tafs">Account number (Treasury Account Symbol)</label>
      <input type="text" id="tafs" name="tafs" value={parsedSearchParams.tafs} />
    </div>

    <div class="field">
      <label for="account">Account name</label>
      <input type="text" id="account" name="account" value={parsedSearchParams.account} />
    </div>

    <div class="field">
      <label for="approver">Approved by</label>

      <SearchSelect
        id="approver"
        name="approver"
        options={approverTitleOptions.map((o) => o.value || '').filter(Boolean)}
        formatOptionLabel={(v) => {
          return approverTitleOptions.find((o) => o.value === v)?.label || '(unknown)';
        }}
        value={parsedSearchParams.approver || ''}
        multi
      />
    </div>
  </div>

  <div class="field-col">
    <div class="field">
      <label for="year">Fiscal year</label>

      <CheckboxButtons
        id="year"
        name="year"
        options={yearOptions.map(String)}
        value={parsedSearchParams.year?.map(String) || []}
        multi
      />
    </div>

    <div class="field">
      <label id="approved-date-range-label" for="approved-date-range">Approved date range</label>
      <div
        id="approved-date-range"
        class="date-fields"
        role="group"
        aria-labelledby="approved-date-range-label"
      >
        <input
          id="approvedStart"
          name="approvedStart"
          type="date"
          value={formatDate(parsedSearchParams.approvedStart, 'iso-date')}
        />

        <span class="date-through">
          <span class="sr-only">Through</span>
          <span role="img" aria-label="Dash symbol" aria-hidden="true">-</span>
        </span>

        <input
          id="approvedEnd"
          name="approvedEnd"
          type="date"
          value={formatDate(parsedSearchParams.approvedEnd, 'iso-date')}
        />
      </div>
    </div>

    <div class="field">
      <label for="lineNum">Has line number</label>

      <SearchSelect
        id="lineNum"
        name="lineNum"
        options={lineOptions.map((o) => o.value || '').filter(Boolean)}
        formatOptionLabel={(v) => {
          return lineOptions.find((o) => o.value === v)?.label || '(unknown)';
        }}
        formatGroupValue={(v) => {
          return lineOptions.find((o) => o.value === v)?.groupValue || '(unknown)';
        }}
        formatGroupLabel={(v) => {
          return lineOptions.find((o) => o.value === v)?.groupLabel || '(unknown)';
        }}
        value={parsedSearchParams.lineNum || ''}
        combineGroupValue={false}
        multi
      />
    </div>

    <div class="field">
      <label for="footnoteNum">Has Footnote</label>

      <CheckboxButtons
        id="footnoteNum"
        name="footnoteNum"
        options={['A', 'B']}
        value={parsedSearchParams.footnoteNum}
        multi
      />
    </div>

    <div class="field">
      <label for="apportionmentType">Apportionment Type</label>

      <CheckboxButtons
        id="apportionmentType"
        name="apportionmentType"
        options={['spreadsheet', 'letter']}
        formatOptionLabel={(v) => {
          const formatted = { spreadsheet: 'Standard (Excel)', letter: 'Letter (PDF)' }[v];
          return formatted || '(unknown)';
        }}
        value={parsedSearchParams.apportionmentType}
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

  .field small {
    padding-top: var(--spacing-half);
    color: var(--color-text-muted);
  }

  .field {
    min-height: calc(var(--spacing) * 4.3);
  }

  .date-fields {
    display: flex;
    column-gap: var(--spacing-half);

    @media (max-width: 400px) {
      & {
        flex-wrap: wrap;
      }
    }
  }

  .date-fields input {
    min-width: 0;
  }

  .date-through {
    font-weight: bold;
    vertical-align: baseline;
    margin-top: var(--spacing-half);
  }

  input[type='text'] {
    width: 100%;
  }

  @media (max-width: 1280px) {
    .field {
      width: auto;
      min-height: auto;
    }
  }

  @media (max-width: 768px) {
    .field-col button {
      margin-bottom: 0;
    }
  }
</style>
