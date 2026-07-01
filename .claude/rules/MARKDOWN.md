---
description: Markdown formatting conventions, including headings, lists, code blocks, and instruction-list patterns.
paths:
  - '**/*.md'
  - '**/*.md*.jinja'
---

Instructions, conventions, and preferences for how to write and maintain Markdown files.

# Formatting

- Use headings to organize content and make it scannable.
- Use bullet points and numbered lists for clarity.
- Use code blocks for commands, examples, and file paths and commands.
  - For inline code, use single backticks (e.g. `code`).
  - For blocks of code, specify the language for syntax highlighting (e.g. ```python).
- Have a blank line after headings, paragraphs, and lists for readability.

# Instructions

Use clear ordered lists when writing instructions or steps to follow. For example:

````markdown
1. Do this first. Run this: `uv run poe some:command`.
   - Some extra context or details about step 1.
2. Then do this.
   - Detailed code block:
     ```python
     def example():
         print("This is an example.")
     ```
3. Finally, do this.
````

Do NOT do something like this:

```markdown
## 1. Do this step

Description of step 1.

## 2. Do this step

Description of step 2.

## 3. Do this step

Description of step 3.
```
