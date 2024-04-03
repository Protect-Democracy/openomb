<script lang="ts">
  export let searchParams = new URLSearchParams('');
  export let yearOptions = [];
  export let lineOptions = [];
</script>

<form method="get">
  <fieldset>
    <legend>Contents Search</legend>

    <div class="field">
      <label for="term">Search Term</label>
      <input type="text" id="term" name="term" value={searchParams.get('term')} />
    </div>

  </fieldset>

  <fieldset>
    <legend>Field Search</legend>

    <div class="field">
      <label for="tafs">Treasury Appropriation Fund Symbol (TAFS)</label>
      <input type="text" id="tafs" name="tafs" value={searchParams.get('tafs')} />
    </div>

    <div class="field">
      <label for="agency">Agency</label>
      <input type="text" id="agency" name="agency" value={searchParams.get('agency')} />
    </div>

    <div class="field">
      <label for="bureau">Bureau</label>
      <input type="text" id="bureau" name="bureau" value={searchParams.get('bureau')} />
    </div>

    <div class="field">
      <label for="account">Account Title</label>
      <input type="text" id="account" name="account" value={searchParams.get('account')} />
    </div>

    <div class="field">
      <label for="approver">Approved By (Title)</label>
      <input type="text" id="approver" name="approver" value={searchParams.get('approver')} />
    </div>

  </fieldset>

  <fieldset>
    <legend>Additional Filters</legend>

    <div class="field">
      <label for="year">Fiscal Year</label>
      <select id="year" name="year" value={Number(searchParams.get('year'))}>
        <option></option>
        {#each yearOptions as yearOption}
          <option value={yearOption}>{yearOption}</option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label for="lineNum">Has Line Number</label>
      <select id="lineNum" name="lineNum" value={searchParams.get('lineNum')}>
        <option></option>
        {#each lineOptions as lineOption}
          <option value={lineOption}>{lineOption}</option>
        {/each}
      </select>
    </div>

    <div class="field">
      <label for="footnoteNum">Has Footnote</label>
      <select id="footnoteNum" name="footnoteNum" value={searchParams.get('footnoteNum')}>
        <option></option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
    </div>

  </fieldset>

  <input type="submit" value="Search" />
</form>

<style>
  fieldset {
    display: flex;
    flex-wrap: wrap;
  }

  .field {
    margin: var(--spacing-half) var(--spacing);
    width: 30%;
    display: flex;
    flex-direction:column;
  }

  @media(max-width: 1280px) {
    .field {
      width: auto;
    }
  }

</style>
