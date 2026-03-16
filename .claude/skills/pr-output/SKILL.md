---
name: pr-output
description: Use when preparing pull request output - filling out PR templates, linking to relevant issues, summarizing changes, noting side effects, flagging open questions, providing testing instructions, and checking off completed items
---

# Pull Request output

When the Developer indicates that work is ready for a pull request, output a filled-out version of the PR template located at `.github/pull_request_template.md`. Follow the guidelines in `rules/PULL_REQUESTS.md` for how to fill out the template, including linking to relevant issues, summarizing the change, noting side effects, flagging open questions, providing testing instructions, and checking off completed items.

To get the set of actual changes, use the following:

- `git diff main...` to get the diff of all changes since branching off main.

## Formatting

This is important:

- Use the `.github/pull_request_template.md` template.
- Keep the checkbox bracket formatting.
- Keep the heading hashtags formatting.
- Output in raw Markdown format for easy copy and paste by the Developer.

## Output

Output to the Developer for a review, but also write the output to a `.pr-summary-<branch-name>.md` file in the project root for easier copy and paste.

## Issues

Things to look out for:

- Use `git diff` to see if there are uncommitted changes. If there are, ask the Developer to commit them before making the PR output.
- Don't just go on your context or memory, as those changes may not fully know what is in the pull request.
