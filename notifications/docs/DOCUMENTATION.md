# Documentation

Documentation of the project and how it is used and integrated into other systems is very important.

## Conventions

### Main README.md

This is the main entry-point into the project and probably the most important document to maintain. It should focus on being welcoming, helpful, and point people to the resources they need.

### In-project documentation

The `docs/` folder is used to store in-project documentation. The files in here are assumed to be in Markdown format unless your project has a specific documentation system. Note that for certain files in the `docs/` folder or root folder Github will recognize and enhance the Github UI project with, such as `docs/CONTRIBUTING.md`.

- `docs/CONTRIBUTING.md`: This should outline how to contribute to this project including, but not limited to, things like code, documentation, issue management, etc.
- `docs/CODE_OF_CONDUCT.md`: This should be a standard code of conduct document that outlines acceptable behavior when contributing to this project.

### Larger and more complex documentation needs

If and when this project needs a larger system for documentation due to complexities, amount of files, etc, look to the **Github Wiki** as a place to create a new documentation system. In this situation, a good guideline to think about the role each system should fill is as follows:

- In-project documentation
  - How does a person contribute to this project
- Wiki
  - How does a person use this project
  - How does a person deploy this project
  - How does this project fit into other systems
  - What background information does a person need to understand the project and what it does
  - Why does this project exist
