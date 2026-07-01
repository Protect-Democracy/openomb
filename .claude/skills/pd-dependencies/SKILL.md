---
name: pd-dependencies
description: Manages project dependencies, ensuring all required packages are installed and up to date.
---

# Dependency management

This skill is responsible for managing the dependencies of the project. It ensures that all required packages are installed and up to date, and it can also handle the installation of new dependencies as needed.

## Python

- Avoid manually editing `pyproject.toml` or `poetry.lock` unless necessary, as this can lead to inconsistencies.

### Adding Python dependencies

When adding or maintaining Python dependencies, follow these guidelines:

1. Check for any major issues on Socket.dev with a url like `https://socket.dev/pypi/package/<package-name>` before adding a new dependency. This will help you identify any potential problems with the package, such as security vulnerabilities or compatibility issues.
1. Tell the Developer about your assessment of the dependency based on your research, and if you have any concerns, ask them if they still want to add it.
1. Use `uv add package-name` to add a new dependency. This will ensure that the dependency is added to `pyproject.toml` and `poetry.lock` correctly.

### Updating Python dependencies

When updating dependencies, follow these guidelines:

1. Use `uv update package-name` to ensure that the lock file is updated properly.

### Remove Python dependencies

1. If you need to remove a dependency, use `uv remove package-name` to ensure that the dependency is removed from both `pyproject.toml` and `poetry.lock` correctly.
