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

## Code Style

- **All comments and documentation must be in English**, regardless of the conversation language
- **Prefer alignment** of values in configuration files, JSON, TypeScript configs, and other structured data for better readability
- Align colons, values, and comments vertically when listing multiple key-value pairs
- Preserve existing alignment when editing files — do not collapse or reformat aligned code

## Project Map

### Overview
Library for data models and UI interactions built on MobX. Version: 0.3.3

### Directory Structure

```
src/
├── index.ts                  # Entry point (re-exports all modules)
├── config.ts                 # Global config (page size, debounce, URL, cookies)
├── object.ts                 # Destroyable interface
├── cache.ts                  # Cache<M> - model objects cache (Map<ID, M>)
├── repository.ts             # Repository<M> - CRUD operations and queries
├── utils.ts                  # Utilities (waitIsTrue, waitIsFalse, timeout)
│
├── model/                    # Models module
│   ├── model.ts              # Abstract class Model - base class for all models
│   ├── model-decorator.ts    # @model - class decorator for model registration
│   ├── model-descriptor.ts   # ModelDescriptor, ModelFieldDescriptor - model metadata
│   └── models.ts             # Singleton Map of all registered models
│
├── fields/                   # Model fields
│   ├── field.ts              # Base field decorator
│   ├── id.ts                 # ID field (unique identifier)
│   ├── foreign.ts            # Foreign key relation
│   ├── one.ts                # One-to-one relation
│   └── many.ts               # One-to-many relation
│
├── types/                    # Field data types
│   ├── type.ts               # Base TypeDescriptor
│   ├── string.ts, number.ts, boolean.ts, date.ts, datetime.ts, array.ts, order-by.ts
│
├── queries/                  # Query system
│   ├── query.ts              # Query<M> - base query class
│   ├── query-page.ts         # QueryPage<M> - paginated query
│   ├── query-raw.ts          # QueryRaw<M> - raw query
│   ├── query-raw-page.ts     # QueryRawPage<M> - raw paginated query
│   ├── query-cache-sync.ts   # QueryCacheSync<M> - cache synchronization
│   ├── query-stream.ts       # QueryStream<M> - streaming query
│   └── query-distinct.ts     # QueryDistinct - distinct values by field
│
├── filters/                  # Query filters
│   ├── Filter.ts             # Base Filter class
│   ├── SingleFilter.ts       # Single filter
│   └── ComboFilter.ts        # Combined filter
│
├── adapters/                 # Data adapters
│   ├── adapter.ts            # Adapter<M> - base adapter interface
│   ├── read-only.ts          # ReadOnlyAdapter - read only
│   ├── local.ts              # LocalAdapter - local storage
│   └── constant.ts           # ConstantAdapter - constant data
│
├── inputs/                   # UI input/state management
│   ├── Variable.ts           # Variable - reactive variable
│   ├── ObjectInput.ts        # ObjectInput - object input
│   ├── handlers/             # State sync handlers (URL, localStorage, cookie)
│   └── auto-reset/           # Auto-reset logic
│
└── forms/                    # UI forms
    ├── Form.ts               # Form - base form
    ├── ActionForm.ts         # ActionForm - form with actions
    └── ObjectForm/           # Object forms
        ├── ObjectForm.ts
        ├── SaveObjectForm.ts
        ├── ActionObjectForm.ts
        └── DeleteObjectForm.ts
```

### Class Hierarchies

**Forms:**
```
Form
├── ActionForm
└── ObjectForm
    ├── SaveObjectForm
    ├── ActionObjectForm
    └── DeleteObjectForm
```

**Queries:**
```
Query<M>
├── QueryPage<M>
├── QueryRaw<M>
├── QueryRawPage<M>
├── QueryCacheSync<M>
├── QueryStream<M>
└── QueryDistinct
```

**Adapters:**
```
Adapter<M>
├── ReadOnlyAdapter
├── LocalAdapter
└── ConstantAdapter
```

**Filters:**
```
Filter
├── SingleFilter
└── ComboFilter
```

**Types:**
```
TypeDescriptor
├── StringType
├── NumberType
├── BooleanType
├── DateType
├── DateTimeType
├── ArrayType
└── OrderBy
```

**Fields:**
```
field (base)
├── id
├── foreign
├── one
└── many
```

### Dependencies
- **runtime:** mobx ~6.7.0
- **dev:** typescript ^5.6.3, jest ^29.7.0, rollup ^2.75.5, tslint ^6.1.3
