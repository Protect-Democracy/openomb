# Coding style and linting

Having consistent coding style ensures easier readability and collaboration, and linting also helps catch bugs early.

## EditorConfig

[EditorConfig](https://editorconfig.org/) is a low-level code style tool that affects things like spacing and line endings. EditorConfig is most helpful when you install the [relevant plugin](https://editorconfig.org/#pre-installed) for the IDE that you are using.

## Prettier

## ESLint

Note that using Prettier and ESLint can be nuanced as there is overlap. The way this project is organized, we are running ESLint through Prettier; i.e. we run Prettier which runs ESLint as a plugin.

## VS Code

Suggested VS Code plugins and config:

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Suggested VS Code configuration:

```json
{
  "...": "...",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },
  "svelte.enable-ts-plugin": true,
  "...": "..."
}
```
