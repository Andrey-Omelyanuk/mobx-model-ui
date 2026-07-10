# MobX-Model-UI

## Overview

MobX-based front-end ORM library for declarative data model definition, relation management, query organization, filtering, forms, and state synchronization with URL/localStorage/cookie.

## Boundaries

**What it does:**
- Model definition via classes with decorators (`@model`, `@id`, `@field`, `@foreign`, `@one`, `@many`)
- Reactive relation management (many-to-one, one-to-one, one-to-many) via MobX
- CRUD through Repository + Adapter with caching in Cache
- Query objects with filtering, pagination, stream loading (cursor-based), distinct values, raw data (without model)
- Type system for validation and serialization/deserialization (STRING, NUMBER, BOOLEAN, DATE, DATETIME, ARRAY, ORDER_BY, ENUM, UUID)
- Forms (save, delete, action) with error mapping and submit lifecycle
- Observable inputs (Variable / Input) with URL, localStorage, cookie synchronization
- Adapter decorators: `@local()`, `@constant()`

**What it does NOT do:**
- HTTP requests — no built-in REST/GraphQL adapter (only Local, ReadOnly, Constant)
- UI components — does not provide React/Vue/other components, only state
- Routing — does not manage navigation (only search params sync)

## Tech Stack

- TypeScript (es2022 target, es2022 modules, `"moduleResolution": "bundler"`, `"useDefineForClassFields": true`, `"experimentalDecorators": true`)
- MobX ~6.7.0 (makeObservable, reaction, observe, extendObservable, runInAction, computed, intercept)
- No external dependencies besides MobX (lodash removed, DEBOUNCE implemented in config.ts)
- Jest ^30.4.2 + jsdom (tests, ts-jest ^29.4.11)
- Rollup ^4.61.1 (build: UMD + ESM + d.ts via `rollup-plugin-typescript2` + `rollup-plugin-dts`)
- ESLint ^9.39.0 with `typescript-eslint` (flat config, `eslint.config.js`)

## Architecture

```
src/
├── index.ts                    # Entry point, re-exports all modules
├── config.ts                   # Global config (page size, debounce, URL, cookie, FORM_NON_FIELD_ERRORS_KEY, DEBOUNCE)
├── utils.ts                    # waitIsTrue, waitIsFalse, timeout
├── cache.ts                    # Cache<M> — @observable Map<ID, M> with @action inject/eject/clear
├── object.ts                   # Destroyable interface { destroy(): void }
│
├── model/
│   ├── index.ts                # Re-exports Model, model, ModelDescriptor, ModelFieldDescriptor, models, clearModels
│   ├── model.ts                # Model — abstract base class (ID, rawData, rawObj, is_changed, only_changed_raw_data, cancelLocalChanges, updateFromRaw, destroy, helper instance/static methods)
│   ├── model-decorator.ts      # @model — class decorator (constructor replacement, makeObservable, field/relation decorator application)
│   ├── model-descriptor.ts     # ModelDescriptor — model metadata (id, fields, relations, cache, getID, updateCachedObject); ModelFieldDescriptor — field description (decorator, disposers, type, settings)
│   └── models.ts               # Map of all registered models; clearModels() — cleanup
│
├── fields/
│   ├── index.ts                # Re-exports @id, @field, @foreign, @one, @many
│   ├── id.ts                   # @id — model identifier (creates ModelDescriptor, intercept/observe for cache.eject/inject)
│   ├── field.ts                # @field — scalar field (TypeDescriptor, observable)
│   ├── foreign.ts              # @foreign — many-to-one relation (reaction on foreign_id → cache.get)
│   ├── one.ts                  # @one — one-to-one inverse (observe remote cache, reaction on remote_foreign_id)
│   └── many.ts                 # @many — one-to-many inverse (observe remote cache, reaction on remote_foreign_id)
│
├── repository.ts               # Repository<M> — CRUD + action/modelAction + query factories (getQuery, getQueryPage, getQueryRaw, getQueryRawPage, getQueryCacheSync, getQueryStream, getQueryDistinct); RequestConfig (AbortController, onUploadProgress)
│
├── adapters/
│   ├── index.ts                # Re-exports Adapter, ReadOnlyAdapter, LocalAdapter, ConstantAdapter, local, constant
│   ├── adapter.ts              # Adapter<M> — abstract interface (create, update, delete, get, find, load, action, modelAction, getTotalCount, getDistinct, getURLSearchParams, delay); RequestConfig
│   ├── local.ts                # LocalAdapter — in-memory with filtering/sort/offset-pagination/cursor-pagination; @local(store_name?) decorator
│   ├── read-only.ts            # ReadOnlyAdapter — forbids create/update/delete
│   └── constant.ts             # ConstantAdapter — fixed data (only load/getTotalCount); @constant(data) decorator
│
├── queries/
│   ├── index.ts                # Re-exports Query, QueryPage, QueryCacheSync, QueryStream, QueryRaw, QueryRawPage, QueryDistinct
│   ├── query.ts                # Query<M> — base observable query (filter, orderBy, offset, limit, relations, fields, omit; isLoading, isReady, isNeedToUpdate, error, timestamp, total; load, shadowLoad, autoupdate get/set via reaction with delay)
│   ├── query-page.ts           # QueryPage — offset/limit pagination (currentPage, totalPages, isFirstPage, isLastPage, goToNextPage, goToPrevPage; __load with getTotalCount)
│   ├── query-stream.ts         # QueryStream — infinite scroll (cursor-based offset = last item ID; isEndReached, restart, loadMore)
│   ├── query-cache-sync.ts     # QueryCacheSync — real-time cache sync (watch cache store + per-object reaction; items getter with orderBy sorting)
│   ├── query-raw.ts            # QueryRaw — raw data (no models, via adapter.load directly)
│   ├── query-raw-page.ts       # QueryRawPage — raw + pagination (adapter.load + getTotalCount)
│   └── query-distinct.ts       # QueryDistinct — distinct values for a field (getDistinct)
│
├── filters/
│   ├── index.ts                # Re-exports Filter, SingleFilter, ComboFilter, AND, EQ, EQV, NOT_EQ, GT, GTE, LT, LTE, LIKE, ILIKE, IN
│   ├── Filter.ts               # Filter — abstract base class (URLSearchParams, isMatch, isReady)
│   ├── SingleFilter.ts         # SingleFilter — filter by one field (field + Variable + operator); match() with __ for nested fields; factory: EQ, EQV, NOT_EQ, GT, GTE, LT, LTE, LIKE, ILIKE, IN
│   └── ComboFilter.ts          # ComboFilter / AND_Filter — AND combination of filters; AND(...filters)
│
├── inputs/
│   ├── index.ts                # Re-exports Variable, Input, ObjectInput, autoResetId, syncURLHandler, syncLocalStorageHandler, syncCookieHandler
│   ├── Variable.ts             # Variable<T> — observable value (value, isDisabled, isDebouncing, isNeedToUpdate, errors, debounce, syncURL/syncLocalStorage/syncCookie; set, validate, setFromString, toString, isReady); Input<T> marked as DEPRECATED (extends Variable)
│   ├── ObjectInput.ts          # ObjectInput<M> — model selection by ID (options: Query<M>, obj getter, autoReset callback)
│   ├── auto-reset/
│   │   ├── index.ts            # Re-exports autoResetId
│   │   └── autoResetId.ts      # autoResetId — reset ObjectInput when ID disappears from options
│   └── handlers/
│       ├── index.ts            # Re-exports syncURLHandler, syncLocalStorageHandler, syncCookieHandler
│       ├── syncURL.ts          # syncURLHandler — URL search params (initialization + bidirectional sync via WATCH_URL_CHANGES / UPDATE_SEARCH_PARAMS)
│       ├── syncLocalStorage.ts # syncLocalStorageHandler — localStorage (initialization + reaction to changes)
│       └── syncCookie.ts       # syncCookieHandler — cookie (initialization + reaction to changes)
│
├── forms/
│   ├── index.ts                # Re-exports Form, ActionForm, ObjectForm, SaveObjectForm, ActionObjectForm, DeleteObjectForm (+ class hierarchy comment)
│   ├── Form.ts                 # Form — abstract form (inputs, isLoading, errors, isReady, isError; submit, cancel, errorHandler, apply, getKeyValueInputs)
│   ├── ActionForm.ts           # ActionForm — calls repository.modelAction (for forms without a specific object)
│   └── ObjectForm/
│       ├── ObjectForm.ts       # ObjectForm<M> — abstract form for an object (obj, repository)
│       ├── SaveObjectForm.ts   # SaveObjectForm — save (inputs values → obj with foreign relation handling → save)
│       ├── ActionObjectForm.ts # ActionObjectForm — action on object (action + kwargs)
│       └── DeleteObjectForm.ts # DeleteObjectForm — delete object
│
├── types/
│   ├── index.ts                # ID = string | number
│   ├── type.ts                 # TypeDescriptor<T> — abstract base type (required, null, toString, fromString, validate, default)
│   ├── string.ts               # STRING(props?) — string type (minLength, maxLength)
│   ├── number.ts               # NUMBER(props?) — numeric type (min, max; fromString via parseInt)
│   ├── boolean.ts              # BOOLEAN(props?) — boolean type
│   ├── date.ts                 # DATE(props?) — date type (Date; min, max)
│   ├── datetime.ts             # DATETIME(props?) — date-time type (extends DateDescriptor, ISO string)
│   ├── array.ts                # ARRAY(type, props?) — array type (minItems, maxItems; serialization via join/split)
│   ├── order-by.ts             # ORDER_BY() — sorting ([string, boolean] tuple; ASC=true, DESC=false)
│   ├── enum.ts                 # ENUM(props) — enumeration (options: T[] | Record<string, T>; values, labels, getOptions)
│   └── uuid.ts                 # UUID(props?) — UUID string (validation: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx format; default '00000000-0000-0000-0000-000000000000')
│
└── test.utils.ts               # TestCache, TestAdapter (extends LocalAdapter), TestRepository — test mocks (each method wrapped in jest.fn())
```

## Patterns

- **Class Decorators**: models register via `@model`, fields via `@field`, `@id`, relations via `@foreign`, `@one`, `@many`. Decorators mutate the prototype and add metadata to ModelDescriptor.
- **Repository Pattern**: each model has a Repository that delegates persistence to an Adapter. CRUD methods return adapter results but work through the cache. Repository supports `RequestConfig` (AbortController, onUploadProgress).
- **Adapter Pattern**: abstract Adapter defines the contract (create/update/delete/get/find/load/action/modelAction/getTotalCount/getDistinct/getURLSearchParams/delay). Concrete implementations are switched via decorators (`@local()`, `@constant()`).
- **Query Objects**: each query is an observable object with its own state (`isLoading`, `isReady`, `isNeedToUpdate`, `timestamp`, `error`, `items`). Query parameters are Variable instances. Supports `load()` (shows spinner) and `shadowLoad()` (no spinner).
- **Variable Pattern**: any observable value (filter, query parameter, form field) is a Variable<T>. Supports debounce, disabled, isNeedToUpdate, errors, validation, synchronization (localStorage → cookie → URL in initialization priority order).
- **Form Lifecycle**: `submit()` → validation (`isReady`) → `apply()` → `onSuccess()` || `errorHandler()` maps errors (`err.response.data` separating field errors / `non_field_errors` / unknown). `cancel()` calls an external callback.
- **Error Handling**: `errorHandler()` in Form distinguishes field errors (`{fieldName: ["message"]}`) from non-field errors by the `FORM_NON_FIELD_ERRORS_KEY` config key. Unknown errors map to `FORM_UNKNOWN_ERROR_MESSAGE`.
- **Model Helper Methods**: Model provides instance methods (`action`, `create`, `update`, `save`, `delete`, `refresh`) and static methods (`getQuery`, `getQueryPage`, `getQueryRaw`, `getQueryRawPage`, `getQueryCacheSync`, `getQueryStream`, `getQueryDistinct`, `get`, `findById`, `find`), which delegate to defaultRepository.
- **SingleFilter Operators**: factory functions `EQ`, `EQV`, `NOT_EQ`, `GT`, `GTE`, `LT`, `LTE`, `LIKE`, `ILIKE`, `IN` create SingleFilter with different comparison operators and getURIField.
- **Naming**:
  - Files: kebab-case (`query-page.ts`, `auto-reset/`, `syncURL.ts`)
  - Classes: PascalCase
  - Methods/functions: camelCase
  - Test file: `<module>.spec.ts`, co-located with source
  - CamelCase and snake_case aliases for compatibility: `isFirstPage` / `is_first_page`

## Non-Obvious Rules

- **useDefineForClassFields: true** — required. Field decorators cannot rely on `[[Set]]` and use `extendObservable` to set descriptors. Without this flag, MobX makeObservable may not recognize fields.
- **Model constructor** always executes: `updateFromRaw(raw)` → `refreshInitData()` in strict order. `updateFromRaw` sets all fields from the raw object (including relation objects via `updateCachedObject`), `refreshInitData` snapshots the initial state for change tracking (`is_changed`, `only_changed_raw_data`).
- **@model decorator** replaces the constructor in 3 phases: 1) creates a proxy-class with `makeObservable`, 2) applies field decorators (id → fields → relations) via `descriptor.decorator(obj, fieldName)`, 3) calls `updateFromRaw(args[0])` and `refreshInitData()`. The prototype is copied via `f.prototype = constructor.prototype` to preserve instanceof.
- **disposers — Map, not array**: `Model.disposers = new Map()`. Keys are string identifiers (e.g. `'foreign field_name'`, `'before changes'`, `'after changes'`). `destroy()` clears the Map via `this.disposers.forEach((disposer, key) => { disposer(); this.disposers.delete(key) })`.
- **Cache via @observable Map**: `Cache.store` — `@observable readonly store = new Map<ID, M>()`. `inject()` checks for duplicates (throws if different objects have the same ID). `eject()` removes from Map. `clear()` calls `destroy()` on every object. Cache intercept/observe lives in the `@id` decorator, not in Cache itself.
- **@id decorator** uses `intercept` on the id field (forbids changing existing ID, ejects on setting undefined), `observe` on the id field (injects when ID appears). It is the intercept/observe that connect the model to the Cache, not Cache by itself.
- **Relation reactions — manual cleanup**: @foreign, @one, @many create MobX reactions via `obj.disposers.set(key, reaction(...))`. @one and @many also create observe on `remoteModelDescriptor.cache.store` to track add/delete of remote objects. All disposers (both per-object and global) are removed in `destroy()` or `clearModels()`. Leaking reactions is a common mistake.
- **Query.autoupdate** uses MobX `reaction()` with `delay: config.AUTO_UPDATE_DELAY` (100ms), not `when()`. The reaction watches `isNeedToUpdate && dependenciesAreReady`. On change, it triggers `load()` on the next tick via `setTimeout`. autoupdate is a get/set property managing `disposerObjects[DISPOSER_AUTOUPDATE]`.
- **Query Load Lifecycle**: `load()` sets `isLoading=true` → `shadowLoad()` (resets isNeedToUpdate, error, timestamp, abort controller) → `__load()` (calls repository). `shadowLoad()` can be called directly to avoid showing a spinner. AbortError (DOMException or 'canceled') is not treated as an error.
- **SingleFilter `__` (double underscore)** — separator for nested fields. Example: `user__name` filters by the `name` field of the related `user` model. Implemented in the recursive `match()` function: for one-to-one relations it recurses deeper, for one-to-many it iterates through the array.
- **Config — mutable singleton**. The global config object can be changed at runtime (e.g., `config.UPDATE_SEARCH_PARAMS = myFn` for React Router). `config.DEBOUNCE` is a custom debounce implementation (not lodash).
- **SaveObjectForm** maps foreign relation fields: if the input name matches a relation (not a field), the value is written to `foreign_id`, not to the relation field itself. Determined via `modelDescriptor.relations[fieldName].settings.foreign_id`.
- **Form.errorHandler** expects errors in `err.response.data` format (API-style). Non-field errors by `FORM_NON_FIELD_ERRORS_KEY` key. Unknown fields → `FORM_UNKNOWN_ERROR_MESSAGE`.
- **Variable sync order**: initialization in order `syncLocalStorage` → `syncCookie` → `syncURL`. Later handlers may overwrite values set by earlier ones.
- **E2E tests import from dist/** (built bundle), unit tests import sources directly. E2E verify that the public API works through the built package.
- **TestUtils** (src/test.utils.ts): TestCache (extends Cache), TestAdapter (extends LocalAdapter, not Adapter — to have real behavior), TestRepository (extends Repository). Each method is wrapped in `jest.fn()`, `mockClear()` is supported. TestAdapter does not include `getURLSearchParams` in mocks. TestRepository includes `modelAction` in mocks.
- **LocalAdapter.constructor** creates an empty `local_store[store_name] = {}`. `init_local_data(data)` initializes the store from an array. `delay` is used in all methods to simulate latency.
- **QueryStream** uses cursor-based pagination: offset = last item's ID. `isEndReached` = true when the server returns an empty array.

## Development Environment

All development runs inside **Docker**. Build the image with `make build` (uses `dockerfile`).

Every command is run via **`make`** — see `makefile` for available targets. If something needs to be run frequently, add it to `makefile`. Never run `npm` or `npx` commands directly outside Docker.

## Verification

- **Unit tests** (Jest, jsdom): `*.spec.ts` files co-located with sources. Cover each module in isolation. Run: `jest --selectProjects unit` or `npx jest --testMatch='**/src/**/*.spec.ts'`.
- **E2E tests** (Jest): files in `e2e/`. Import the built bundle from `dist/`. Test usage scenarios through the public API. Run: `jest --selectProjects e2e` or `npm run e2e`.
- **Mocks**: TestCache, TestAdapter, TestRepository from `src/test.utils.ts` for module isolation.
- **Linter**: ESLint ^9.39.0 with `typescript-eslint` flat config. Rules: 4-space indent, single quotes, no semicolons, unix linebreaks. Run: `npm run lint`.
- **CI**: GitHub Actions — build → lint → unit tests → e2e tests on every push to main and every PR.
- **Readiness criterion**: a test is considered covering a module if it verifies the public contract (not internal methods) and passes in isolation.
