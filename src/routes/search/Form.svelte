<script lang="ts">
  import SearchSelect from '$components/inputs/SearchSelect.svelte';

  export let url;
  export let agencyBureauOptions = [];
  export let yearOptions = [];
  export let lineOptions = [];
</script>

<form method="get">
  <div class="field-col">
    <div class="field">
      <label for="term">Keyword</label>
      <input type="text" id="term" name="term" value={url.searchParams.get('term')} />
    </div>
    <div class="field">
      <label for="agencyBureau">Agency and Bureau</label>
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
      <label for="tafs">TAFS</label>
      <input type="text" id="tafs" name="tafs" value={url.searchParams.get('tafs')} />
    </div>
    <div class="field">
      <label for="account">Account</label>
      <input type="text" id="account" name="account" value={url.searchParams.get('account')} />
    </div>
    <div class="field">
      <label for="approver">Approved By</label>
      <input type="text" id="approver" name="approver" value={url.searchParams.get('approver')} />
    </div>
  </div>

  <div class="field-col">
    <div class="field">
      <label for="year">Fiscal Year</label>
      <select id="year" name="year" value={Number(url.searchParams.get('year'))}>
        <option></option>
        {#each yearOptions as yearOption}
          <option value={yearOption}>{yearOption}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="approvedDateRange">Approved Date Range</label>
      <div class="date-fields">
        <input
          id="approvedDateRange"
          name="approvedStart"
          type="date"
          value={url.searchParams.get('approvedStart')}
        />
        -
        <input
          id="approvedDateRange"
          name="approvedEnd"
          type="date"
          value={url.searchParams.get('approvedEnd')}
        />
      </div>
    </div>
    <div class="field">
      <label for="lineNum">Has Line Number</label>
      <SearchSelect
        id="lineNum"
        name="lineNum"
        options={lineOptions}
        value={url.searchParams.get('lineNum') ? JSON.parse(url.searchParams.get('lineNum')) : []}
        multi
      />
    </div>
    <div class="field">
      <label for="footnoteNum">Has Footnote</label>
      <select id="footnoteNum" name="footnoteNum" value={url.searchParams.get('footnoteNum')}>
        <option></option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
    </div>
  </div>

  <div class="field-col">
    <button type="submit">Search</button>
  </div>
  <div class="field-col">
    <button type="reset" class="secondary">Reset</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-wrap: wrap;
  }

  .field-col {
    flex: 0 0 50%;
    padding: var(--spacing);
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
</style>
