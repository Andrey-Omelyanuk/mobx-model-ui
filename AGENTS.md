# Project Workflow

All development must be done through Docker.

- **ONLY** run commands through `make` (e.g. `make test`, `make lint`, `make build`)
- If the needed command is missing from the Makefile, add it and show the diff to the user for approval before running
- **NEVER** run `npm`, `yarn`, `jest`, `node`, or any script directly — always wrap through `make`
- **NEVER** install packages globally or locally outside of Docker
