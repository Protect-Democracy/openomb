# Engineering principles

## Architecture & Design

- Security over ease of use; simplicity over premature optimization.
- Build modularly with small, singular-purpose tools (Unix philosophy).
- Treat configuration as UI: sane defaults and clear documentation.
- Automate workflows to reduce human error.

## Code Quality & Documentation

- Write for readability over terseness.
- Comments explain the _why_, not the _what_.
- Enforce single-responsibility (DRY, Law of Demeter) across classes, methods, and modules.
- Require automated tests to prevent regressions.
- Maintain open-source standards: clean, transparent, consistently formatted code.

## Technology & Dependencies

- Vet third-party libraries strictly; favor proven, community-driven technologies.
- Prefer reliable managed services over building custom solutions.

## Data Integrity & Analysis

- Verify data accuracy and completeness before analysis.
- Automate data pipelines so all steps are perfectly repeatable.
- Document and validate all assumptions in data collection and analysis.
- Show your work: methodology must be transparent and reproducible.
