---
name: pd-github-action-version
description: Use when updating or checking GitHub Action versions, when adding a new action to a workflow file, or when the Developer asks about action versions or SHA pins.
---

# GitHub Action version management

Look up, verify, and update GitHub Action SHA pins in workflow files. Uses `git ls-remote` for all lookups — no authentication needed for public repositories.

See `rules/github/GITHUB_ACTIONS_BEST_PRACTICES.md` for the project's SHA pinning conventions.

## When this skill activates

1. **Manual**: Developer asks to update, check, or verify a GitHub Action version.
2. **Automatic**: When writing a new `uses:` line in a workflow file for an action not already present in the project's workflows. Always pin to the latest SHA with a version comment.

## Manual workflow: single action (default)

When the Developer specifies an action (e.g., "update actions/checkout"):

### Step 1: Find current usage

Search all workflow files for the action:

```bash
grep -rn "uses: <owner>/<repo>@" .github/workflows/
```

Record each file, line number, current SHA, and version comment.

### Step 2: Look up latest version

```bash
git ls-remote --tags --sort=-version:refname https://github.com/<owner>/<repo>.git \
  | sed 's|.*refs/tags/||' \
  | grep -v '\^{}' \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
  | head -1
```

This filters to strict semver tags (`vX.Y.Z`), excluding pre-releases (`-alpha`, `-beta`, `-rc`) and major version tags (`v4`, `v7`).

### Step 3: Resolve the SHA

Handle both annotated and lightweight tags:

```bash
# Try annotated tag first (peeled ref)
sha=$(git ls-remote --tags https://github.com/<owner>/<repo>.git "<tag>^{}" | cut -f1)
# Fall back to lightweight tag
[ -z "$sha" ] && sha=$(git ls-remote --tags https://github.com/<owner>/<repo>.git "<tag>" | cut -f1)
```

Annotated tags show a `^{}` entry that gives the actual commit SHA. Always prefer it.

### Step 4: Verify

Confirm the SHA maps back to the expected tag:

```bash
git ls-remote --tags https://github.com/<owner>/<repo>.git | grep "^${sha:0:12}"
```

If the SHA does not map to any tag, stop and alert the Developer — something is wrong.

### Step 5: Report before updating

Present findings to the Developer before making changes:

- Current version and SHA in use
- Latest version and SHA available
- Whether an update is needed (or already current)
- Which files and lines will be updated

**Do not update without Developer approval.**

### Step 6: Update

Replace the SHA and version comment in all workflow files where the action appears. Maintain the existing format:

```yaml
# Before
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

# After
uses: actions/checkout@<new-sha> # <new-tag>
```

Update every occurrence across all workflow files (`.yml`, `.yaml`, `.yml.jinja`, `.yaml.jinja`).

## Manual workflow: all actions

When the Developer says "all" or "check all actions":

1. Search all workflow files for `uses:` lines. Extract distinct `<owner>/<repo>` values, ignoring local actions starting with `./`.
2. Run the single-action workflow (steps 1-4) for each distinct action.
3. Present a summary table:

```
| Action               | Current   | Latest    | Status     |
| -------------------- | --------- | --------- | ---------- |
| actions/checkout     | v4.2.2    | v4.3.0    | Update     |
| astral-sh/setup-uv   | v7.6.0    | v7.6.0    | Current    |
```

4. Ask the Developer which to update, or update all with approval.

## Automatic workflow: new action

When writing a `uses:` line for an action not already in the project's workflow files:

1. Run steps 2-4 from the manual workflow to find the latest version and SHA.
2. Write the `uses:` line pinned to the latest SHA with version comment.
3. Briefly tell the Developer what version was pinned (e.g., "Pinned actions/upload-artifact to v4.6.2 (SHA: ea165f...)").

## Edge cases

### Private repositories

`git ls-remote` fails without authentication on private repos. If a lookup fails, inform the Developer that the repository may be private and suggest they provide the version and SHA manually, or authenticate with `gh auth login`.

### Two-segment version tags

Some actions only publish tags like `v1.0` instead of `v1.0.0`. The strict semver filter will miss these. If no semver tags are found, broaden the filter to `^v[0-9]+\.[0-9]+` and note this to the Developer.

### Actions hosted outside GitHub

This skill only works with actions hosted on `github.com`. For actions from other registries, inform the Developer and ask them to provide the version and SHA manually.

## Common mistakes

- **Using the tag object SHA instead of the commit SHA**: Annotated tags have two SHAs — always use the `^{}` (peeled) one, which points to the actual commit.
- **Forgetting to update the version comment**: The SHA and the comment must both be updated together. A stale comment is misleading.
- **Updating only some occurrences**: When an action appears in multiple workflow files, update all of them. Search broadly.
- **Including pre-release tags**: Filter these out. A tag like `v5.0.0-beta.1` is not a stable release.
