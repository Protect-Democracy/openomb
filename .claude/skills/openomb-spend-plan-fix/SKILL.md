---
name: openomb-spend-plan-fix
description: Diagnose and fix a spend plan PDF that isn't parsing correctly. Takes a filename or URL and optional free-form agency/bureau hint, then diagnoses what's failing, explains the proposed fix, and applies it across load-file.ts, spend-plan-agency-match.ts, and the test file.
---

# OpenOMB: Fix a spend plan parsing failure

The args will be free-form text containing: a filename or URL for a failing spend plan PDF, and optionally any agency or bureau name/acronym hints. Parse these out before starting.

---

## Step 1: Extract the filename

- If the args contain a URL (starts with `http`), decode it with `decodeURIComponent`, take the last path segment after `/`, and strip trailing `.pdf`. That is the **filename**.
- Otherwise, treat the non-URL portion of the args as the filename (strip `.pdf` if present).
- Any remaining text after removing the URL/filename is treated as an **agency/bureau hint** from the user.

---

## Step 2: Read the relevant files

Read all four files before drawing any conclusions:

1. `src/lib/server/load-file.ts` — read the `YEAR_EXTRACTORS` array inside `parseSpendPlanFilename()` to understand the current extraction strategies
2. `data/fixes/spend-plan-agency-match.ts` — check whether a pattern already exists that would match this filename
3. `data/agency-reference.ts` — the `agencies` and `bureaus` arrays; each entry has `short_name` (one or more `/`-separated acronyms), `budgetAgencyTitle`, `budgetAgencyTitleId`, `budgetBureauTitle`, `budgetBureauTitleId`

---

## Step 3: Write the failing test first

Before diagnosing anything, write the test that describes the desired behavior. This acts as the specification and gives a concrete red/green signal throughout.

Edit `src/lib/server/load-file.test.ts`. Inside `describe('parseSpendPlanFilename()')`, add the new case:

```ts
// <full original URL>
// <one-line note on why this filename is tricky — fill in after diagnosis if unclear now>
expect(parseSpendPlanFilename('<filename without .pdf>')).toMatchObject({
  fiscalYear: '<YYYY>',
  agency: '<budgetAgencyTitle>',
  bureau: '<budgetBureauTitle>' // omit if no bureau
});
```

**Filling in the expected values:** Use what's already known from the URL/filename and any agency/bureau hint. The fiscal year is often inferable even if the current code can't parse it (e.g., `MAY25` → `'2025'`). If the agency or bureau is not clear from the hint or the filename itself, use AskUserQuestion to ask the user before writing the test — don't leave placeholder values.

Place the test near other entries covering the same failure class (near other month-year entries, near other ACF patterns, etc.), following the surrounding comment and assertion style.

**Run just this test file to confirm it fails:**

```
npm run test:unit -- --reporter=verbose src/lib/server/load-file.test.ts
```

The new assertion should fail. If it unexpectedly passes, the parsing is already working and no fix is needed — report that to the user and stop.

---

## Step 4: Diagnose the fiscal year

Walk each extractor in `YEAR_EXTRACTORS` against the filename in order, exactly as the code does (first match wins). Note which strategy fires and what `rawYear` it would capture.

**If a year is found:** record the extracted year and move on.

**If no year is found:** look at the filename and ask — does it contain a year-like value that has a **recognizable general structure** a new regex could handle, such as:

- A month abbreviation immediately followed by digits (`MAY25`, `JAN2026`)
- A standalone 2-digit year after a consistent separator that the current extractors miss

If yes, **plan a new `YEAR_EXTRACTORS` entry** that would handle this class of filename. If no — the year is completely absent or genuinely ambiguous — **ask the user to confirm the fiscal year** before continuing. It will go into `spend-plan-agency-match.ts`.

---

## Step 5: Diagnose the agency and bureau

Extract all consecutive uppercase runs of 2–6 letters from the filename (regex `[A-Z]{2,6}`). For each acronym:

1. Search `agency-reference.ts` agencies: does any entry's `short_name` (split on `/`) match the acronym? → that's the agency.
2. Search `agency-reference.ts` bureaus: does any entry's `short_name` match, **and** does its `budgetAgencyTitle` equal the agency found above? → that's the bureau.

Also check `data/fixes/spend-plan-agency-match.ts` — a pattern may already exist that would match, resolving the agency even if acronym matching fails.

**If the user provided an agency/bureau hint:** search `agency-reference.ts` by `name`, `budgetAgencyTitle`, and `short_name`. Report the **exact** `budgetAgencyTitle` / `budgetBureauTitle` that must be used — case, spacing, and articles ("the", "U.S.") matter. If the name isn't found in `agency-reference.ts`, run a grep over `src/lib/server/db/` and `src/lib/server/db/test-data/` to find how the agency appears in existing data. If still not found, note the discrepancy and ask the user to verify the exact name in the database.

**If no agency can be determined and the user provided no hint:** ask the user to identify the agency (suggest they check the PDF content or the OMB page). Do not guess.

---

## Step 6: Report the diagnosis and proposed fix

Before making any changes, output a clear summary:

```
Filename:     <decoded filename>
Fiscal year:  <year found, OR "NOT FOUND — [reason]">
Agency:       <resolved budgetAgencyTitle, OR "NOT FOUND — [reason]">
Bureau:       <resolved budgetBureauTitle, OR "none / NOT FOUND">

Proposed fix:
  [A] Update YEAR_EXTRACTORS in load-file.ts — new extractor for <pattern>
  [B] Add entry to spend-plan-agency-match.ts — pattern: /<regex>/, fiscalYear: '<YYYY>', agency: '<...>', bureau: '<...>'
  [C] Both A and B
```

If any required information is still missing (fiscal year, agency name), use AskUserQuestion to collect it before proceeding.

---

## Step 7: Apply the fix

### A. New YEAR_EXTRACTOR (if a general regex fix applies)

Edit `src/lib/server/load-file.ts`. Add the new entry to the `YEAR_EXTRACTORS` array at the correct position — more specific before less specific, consistent with the surrounding code style. Each entry is an arrow function: `(name) => { const m = name.match(...); return m ? { rawYear: m[1], rest: name } : null; }`. Add a brief comment above it describing the pattern and a concrete example filename.

For 4-digit years, guard against implausible matches with `m[1][0] === '2'` or `m[1].length < 4`. Follow the same guard logic already present in the file.

### B. New entry in spend-plan-agency-match.ts (if a fix entry is needed)

Edit `data/fixes/spend-plan-agency-match.ts`. Add the new entry with:

- `pattern` — prefer an anchored exact match (`/^...\$$/`) for one-off filenames; use a general pattern only when this clearly represents a family of similar files
- `fiscalYear` — only if the year was not (and cannot be) extracted by `YEAR_EXTRACTORS`
- `agency` — the exact `budgetAgencyTitle` from `agency-reference.ts`
- `bureau` — the exact `budgetBureauTitle`, if applicable

**Ordering matters:** more specific patterns must appear above less specific ones. Place the new entry above any existing catch-all that would also match this filename. Add a comment with the full original URL above the entry, following the existing convention.

Do not invent agency or bureau names. Only use values found in `agency-reference.ts` or confirmed via database lookup.

### Both A and B

If both a regex update and a fix entry are needed, apply A first (it may resolve the year, leaving only agency to be fixed by B).

---

## Step 8: Verify

Run just the load-file test file to confirm the new test now passes:

```
npm run test:unit -- --reporter=verbose src/lib/server/load-file.test.ts
```

If the test still fails, diagnose the root cause and fix it before reporting success. Once it's green, confirm nothing else broke by running the full suite:

```
npm run test:unit
```

---

## Notes

- The fixes fallback in `parseSpendPlanFilename()` only runs when **either** fiscal year **or** agency is still missing after the extractors and acronym scan. If a new extractor fires and supplies the year, acronym matching still runs before the fixes file is consulted.
- `rawYear` values of 2–3 digits are padded to 4 digits by `rawYear.padStart(4, '20')`. A 4-digit raw year is used as-is.
- Bureau matching requires the bureau's `budgetAgencyTitle` to equal the resolved agency — hierarchy alignment is enforced in the code.
- If a pattern already exists in `spend-plan-agency-match.ts` that matches this filename but is missing `fiscalYear`, adding a **more specific** entry above it is preferable to modifying the existing one (to avoid unintended side effects on other files that match the same pattern).
