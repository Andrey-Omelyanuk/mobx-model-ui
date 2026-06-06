# Project Workflow

All development must be done through Docker.

- **ONLY** run commands through `make` (e.g. `make test`, `make lint`, `make build`)
- If the needed command is missing from the Makefile, add it and show the diff to the user for approval before running
- **NEVER** run `npm`, `yarn`, `jest`, `node`, or any script directly — always wrap through `make`
- **NEVER** install packages globally or locally outside of Docker

## Planning Mode

When working in planning mode, the output must be written to `PLAN.md` with the following structure:

- Organize items into sections by class
- Each item must have a unique code using the class abbreviation + number (e.g., `Q1` for Query, `QR1` for QueryRaw)
- Include a detailed description of the problem
- Include a brief (concise) proposed solution

## Testing

- After implementing **each** item from `PLAN.md`, run `make test` to verify all tests pass before proceeding to the next item
