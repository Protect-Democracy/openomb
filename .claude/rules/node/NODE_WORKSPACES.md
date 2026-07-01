---
description: npm workspaces structure and conventions for managing Node packages across the project.
paths:
  - '**/package.json'
  - '**/*.js'
  - '**/*.ts'
  - '**/*.svelte'
  - '**/*.html'
---

# npm Workspaces

This project uses npm workspaces with a root `package.json` to manage Node packages.

## Structure

- The root `package.json` defines the workspace configuration and proxy scripts.
- Each workspace lives in its own directory with its own `package.json`.
- The root `package.json` must stay minimal: `private: true`, `workspaces` array, and namespaced proxy scripts only.

## Running scripts

Run workspace scripts from the project root using namespaced commands:

```bash
npm run frontend:dev      # Start frontend dev server
npm run frontend:build    # Build frontend
npm run frontend:test     # Run frontend tests
```

Or target a workspace directly with the `-w` flag:

```bash
npm run dev -w <workspace_directory>
```

## Installing packages

Always install packages into the specific workspace, not the root:

```bash
npm install <package> -w <workspace_directory>
```

## Adding a new workspace

1. Add the workspace directory to the root `workspaces` array in `package.json`.
2. Add corresponding `<prefix>:<script>` proxy entries to the root `scripts`.
3. Run `npm install` from the root to link the new workspace.
