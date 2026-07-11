# Changelog

## 0.4.0 (2026-07-11)

### ⚠️ Breaking Changes

- **TypeScript strict mode enabled** — full `strict: true` in tsconfig, including `strictNullChecks`, `strictPropertyInitialization`, `noImplicitAny`, and `useUnknownInCatchVariables`. Consumers may need to update their own tsconfig.
- **`@constant()` adapter `action()` now throws** instead of warning and returning `{}`. This aligns with the adapter contract — constant data is read-only.
- **Removed deprecated `Input` class** — use `Variable` instead.
- **`LocalAdapter.create()` behavior corrected** — no longer mutates the input object; handles non-numeric IDs properly.
- **`Form.submit()` now rejects when the form is not ready** — previously it would proceed with invalid data.

### 🚀 Features

- **Form dirty state tracking** — `isDirty`, `markClean()`, `reset()` on both `Form` and `Variable`. After a successful submit, `markClean()` is called automatically.
- **Cross-field validation** — `Form.validator` and `Form.validate()` / `Form.clearErrors()` for multi-field validation rules.
- **New types: `ENUM` and `UUID`** — `ENUM` supports enum validation with labels/values; `UUID` validates UUID format with a default zero-UUID.
- **Architecture docs (`AGENTS.md`)** — comprehensive library overview in English, covering all modules, patterns, and non-obvious rules.
- **AI skill (`SKILL.md`)** — shipped as a Claude Code plugin for AI-assisted development.

### 🐛 Bug Fixes

- **`model.destroy()` infinite loop** — fixed recursion when clearing caches in `clearModels()`.
- **Cookie sync** — synced cookie is actually deleted when value becomes `undefined`.
- **`QueryStream` cursor type** — properly typed as `ID (string | number)` instead of just `number`.
- **LIKE/ILIKE on non-string values** — no longer crashes; returns `false` instead.
- **Variable debounce state** — settled properly before form validation.
- **Form field validation** — validated against model descriptor types.
- **Debounced validation** — renamed and fixed; `DateDescriptor.defaultDate` added.
- **`Query.ready()`** — now correctly waits for `isReady === true` (was checking `=== false`).
- **Strict comparisons** — uses `===`/`!==` everywhere; `Object.getPrototypeOf` instead of `__proto__`.
- **Type annotations improved** — Q3–Q15 related fixes.
- **Boolean type fixed** — unused imports removed, `timeout()` test added.

### 🔧 Refactoring

- **Unified disposers** — all query disposers consolidated into a single `Map<string, () => void>` (instead of separate arrays).
- **`@model` proxy class** — created once at decoration time, not per instance (performance improvement).
- **Removed lodash** — no external dependencies beyond MobX.
- **Separate tsconfigs** — `tsconfig.build.json`, `tsconfig.spec.json`, `tsconfig.e2e.json` for different environments.
- **Build process** — fixed and streamlined with Rollup.

### 🧪 Testing

- **Regression tests** — added for bugs found during code review.
- **Date specs** — made timezone-independent.
- **Testing gaps resolved** — added missing tests for `UUID`, `ENUM`, `@id(STRING)`, `@id(UUID)`, constant adapter, and models.
- **Local adapter tests** — cover `@local()` with string IDs and edge cases.

### 🏗 Infrastructure

- **Docker support** — `dockerfile` with baked `yarn install`; `devcontainer.json` for VSCode Dev Containers.
- **ESLint migration** — moved from `tslint.json` to flat `eslint.config.js` with `typescript-eslint` v8.
- **Upgraded dev dependencies** — TypeScript ^6.0.3, Rollup ^4.61.1, Jest ^30.4.2.
- **Remaining lodash references** — eliminated `lodash` from dependencies.

### 📝 Documentation

- `AGENTS.md` — full library architecture, patterns, non-obvious rules.
- `SKILL.md` — AI coding assistant skill for Claude Code.
- Development Environment section added to `AGENTS.md`.
- README updated.
