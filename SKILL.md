---
name: mobx-model-ui
description: >-
  Build data models, queries, filters, forms and adapters with the
  mobx-model-ui library. Use in any project that depends on mobx-model-ui
  when defining @model classes, wiring @id/@field/@foreign/@one/@many
  relations, setting up Repository/Adapter, building Query lists with
  filtering, sorting, pagination or infinite scroll, syncing state to
  URL/localStorage/cookies, or building forms with validation and
  server-side errors.
license: MIT
---

# MobX-Model-UI

A library for data management and UI interactions built on MobX. Provides reactive model management, caching, queries, filters, and forms.

## When to Use

- Working with data models (CRUD operations)
- Building lists with filtering, sorting, and pagination
- Infinite scroll
- Live data synchronization without refetch
- Forms with validation and server-side errors
- State synchronization with URL/localStorage/cookies

---

## Quick Start

```typescript
import { Model, model, id, field, foreign, many, local, Repository } from 'mobx-model-ui'
import { NUMBER, STRING } from 'mobx-model-ui'

// 1. Define a model
@local()  // or another adapter
@model 
class User extends Model {
    @id(NUMBER())      id: number
    @field(STRING())   name: string
    @field(STRING())   email: string
}

// 2. Create an object (automatically added to cache)
const user = new User({ id: 1, name: 'John', email: 'john@example.com' })

// 3. Get an object from cache by ID
const cachedUser = User.get(1)

// 4. CRUD via model
await user.save()           // create or update
await user.delete()         // delete
await user.refresh()        // refresh from server

// 5. CRUD via Repository
const repo = User.defaultRepository as Repository<User>
await repo.create(user)
await repo.update(user)
await repo.save(user)       // create or update
await repo.delete(user)
await repo.get(1)           // get by ID
await repo.load(query)      // get list
```

---

## Recipes

### 1. Model with Fields and Types

```typescript
import { Model, model, id, field, foreign, one, many, local } from 'mobx-model-ui'
import { NUMBER, STRING, BOOLEAN, DATE, DATETIME, ARRAY, UUID } from 'mobx-model-ui'

@local()
@model
class Post extends Model {
    @id(NUMBER())                    id: number
    @field(STRING({ required: true })) title: string
    @field(STRING({ maxLength: 500 })) body: string
    @field(NUMBER({ min: 0 }))       views: number
    @field(BOOLEAN())                published: boolean
    @field(DATE())                   created_at: Date
    @field(DATETIME())               updated_at: Date
    @field(ARRAY(STRING()))          tags: string[]
}
```

### 2. Model with Relations (foreign, one, many)

```typescript
@local()
@model
class Author extends Model {
    @id(NUMBER())       id: number
    @field(NUMBER())    user_id: number
    @field(NUMBER())    book_id: number
    
    // foreign - relation by foreign_id (automatically resolved from cache)
    @foreign(User)      user: User        // uses user_id
    @foreign(Book)      book: Book        // uses book_id
}

@local()
@model
class User extends Model {
    @id(NUMBER())       id: number
    @field(STRING())    name: string
    
    // one - reverse one-to-one relation
    @one(Author)        author: Author    // finds Author where author.user_id == this.id
    
    // many - reverse one-to-many relation
    @many(Post)         posts: Post[]     // finds Post where post.user_id == this.id
}

// many through intermediate table (many-to-many)
@local()
@model
class Book extends Model {
    @id(NUMBER())       id: number
    @field(STRING())    title: string
    authorship: Author[]
}

// Explicit many relation declaration
many(Author)(User, 'authorship')
many(Author)(Book, 'authorship')
```

### 3. Custom Adapter for API

```typescript
import { Adapter, Model, Query, Filter, ID, RequestConfig } from 'mobx-model-ui'

class ApiAdapter<M extends Model> extends Adapter<M> {
    constructor(private baseUrl: string) { super() }

    async create(raw_data: any, config?: RequestConfig): Promise<any> {
        const res = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(raw_data),
            signal: config?.controller?.signal
        })
        return res.json()
    }

    async update(id: ID, only_changed_raw_data: any, config?: RequestConfig): Promise<any> {
        const res = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(only_changed_raw_data),
            signal: config?.controller?.signal
        })
        return res.json()
    }

    async delete(id: ID, config?: RequestConfig): Promise<void> {
        await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            signal: config?.controller?.signal
        })
    }

    async get(id: ID, config?: RequestConfig): Promise<any> {
        const res = await fetch(`${this.baseUrl}/${id}`, { signal: config?.controller?.signal })
        return res.json()
    }

    async find(query: Query<M>, config?: RequestConfig): Promise<any> {
        const params = this.getURLSearchParams(query)
        const res = await fetch(`${this.baseUrl}?${params}&limit=1`, { signal: config?.controller?.signal })
        const data = await res.json()
        return data[0]
    }

    async load(query: Query<M>, config?: RequestConfig): Promise<any[]> {
        const params = this.getURLSearchParams(query)
        const res = await fetch(`${this.baseUrl}?${params}`, { signal: config?.controller?.signal })
        return res.json()
    }

    async action(id: ID, name: string, kwargs: Object, config?: RequestConfig): Promise<any> {
        const res = await fetch(`${this.baseUrl}/${id}/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(kwargs),
            signal: config?.controller?.signal
        })
        return res.json()
    }

    async modelAction(name: string, kwargs: Object, config?: RequestConfig): Promise<any> {
        const res = await fetch(`${this.baseUrl}/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(kwargs),
            signal: config?.controller?.signal
        })
        return res.json()
    }

    async getTotalCount(filter: Filter, config?: RequestConfig): Promise<number> {
        const params = filter?.URLSearchParams || new URLSearchParams()
        const res = await fetch(`${this.baseUrl}?${params}&count_only=true`, { signal: config?.controller?.signal })
        const data = await res.json()
        return data.count
    }

    async getDistinct(filter: Filter, field: string, config?: RequestConfig): Promise<any[]> {
        const params = filter?.URLSearchParams || new URLSearchParams()
        params.set('distinct', field)
        const res = await fetch(`${this.baseUrl}?${params}`, { signal: config?.controller?.signal })
        return res.json()
    }

    getURLSearchParams(query: Query<M>): URLSearchParams {
        const params = new URLSearchParams()
        if (query.filter) {
            query.filter.URLSearchParams.forEach((v, k) => params.set(k, v))
        }
        if (query.orderBy.value?.length) {
            params.set('ordering', query.orderBy.value.map(([f, d]) => d ? `-${f}` : f).join(','))
        }
        if (query.offset.value !== undefined) params.set('offset', String(query.offset.value))
        if (query.limit.value !== undefined) params.set('limit', String(query.limit.value))
        if (query.fields.value?.length) params.set('fields', query.fields.value.join(','))
        if (query.omit.value?.length) params.set('omit', query.omit.value.join(','))
        if (query.relations.value?.length) params.set('relations', query.relations.value.join(','))
        return params
    }
}

// Usage
@model
class User extends Model {
    @id(NUMBER()) id: number
}

User.defaultRepository.adapter = new ApiAdapter<User>('/api/users')
```

### 4. Query — Basic List Query

```typescript
import { Query, Variable, STRING, EQ, ILIKE, AND, ORDER_BY, ARRAY } from 'mobx-model-ui'

// Simple query
const query = User.getQuery({})
await query.load()
console.log(query.items)  // User[]

// Query with filter
const nameFilter = EQ('name', new Variable(STRING(), { value: 'John' }))
const query = User.getQuery({ filter: nameFilter })
await query.load()

// Query with search (ILIKE)
const searchFilter = ILIKE('name', new Variable(STRING(), { value: 'john' }))

// Query with sorting
const orderBy = new Variable(ARRAY(ORDER_BY()), { value: [['name', true]] })  // ASC
const query = User.getQuery({ orderBy })

// Query with multiple filters (AND)
const filter = AND(
    EQ('status', new Variable(STRING(), { value: 'active' })),
    ILIKE('name', new Variable(STRING(), { value: 'john' }))
)
const query = User.getQuery({ filter })

// Disable autoupdate (load only manually)
const query = User.getQuery({ autoupdate: false })
await query.load()
```

### 5. QueryPage — Pagination

```typescript
import { QueryPage, Variable, NUMBER } from 'mobx-model-ui'

const query = User.getQueryPage({})

// Or with settings
const limit = new Variable(NUMBER(), { value: 20 })
const query = User.getQueryPage({ limit })

await query.load()

// Navigation
query.goToFirstPage()
query.goToPrevPage()
query.goToNextPage()
query.goToLastPage()
query.setPage(5)
query.setPageSize(50)

// Properties
console.log(query.items)         // current page
console.log(query.total)         // total records
console.log(query.current_page)  // current page (1-based)
console.log(query.total_pages)   // total pages
console.log(query.is_first_page)
console.log(query.is_last_page)
```

### 6. QueryStream — Infinite Scroll

```typescript
import { QueryStream } from 'mobx-model-ui'

const query = User.getQueryStream({})

// Initial load
await query.load()
console.log(query.items)  // first batch

// Load more
await query.loadMore()
console.log(query.items)  // items appended to the end

// Restart from beginning
query.restart()

// Properties
console.log(query.isEndReached)  // true if no more data
```

### 7. QueryCacheSync — Live Synchronization

```typescript
import { QueryCacheSync } from 'mobx-model-ui'

// Query that automatically updates when cache changes
const query = User.getQueryCacheSync({
    filter: EQ('status', new Variable(STRING(), { value: 'active' }))
})

// Initial load
await query.load()

// Now items automatically update when:
// - New User objects are created
// - Existing objects change (removed if they no longer match the filter)
// - Objects are deleted

// No refetch needed on changes!
new User({ id: 10, status: 'active' })  // will automatically appear in query.items
```

### 8. QueryRaw — Raw Data Without Models

```typescript
import { QueryRaw } from 'mobx-model-ui'

// Returns raw objects without creating model instances
const query = User.getQueryRaw({})
await query.load()
console.log(query.items)  // plain objects, not User instances
```

### 9. QueryDistinct — Unique Values

```typescript
import { QueryDistinct } from 'mobx-model-ui'

const query = User.getQueryDistinct('status', {})
await query.load()
console.log(query.items)  // ['active', 'inactive', 'pending']
```

### 10. Filters

```typescript
import { Variable, STRING, NUMBER, ARRAY, EQ, NOT_EQ, GT, GTE, LT, LTE, LIKE, ILIKE, IN, AND } from 'mobx-model-ui'

// Single filters
EQ('status', new Variable(STRING(), { value: 'active' }))        // field = value
NOT_EQ('status', new Variable(STRING(), { value: 'deleted' }))   // field != value
GT('age', new Variable(NUMBER(), { value: 18 }))                 // field > value
GTE('age', new Variable(NUMBER(), { value: 18 }))                // field >= value
LT('age', new Variable(NUMBER(), { value: 65 }))                 // field < value
LTE('age', new Variable(NUMBER(), { value: 65 }))                // field <= value
LIKE('name', new Variable(STRING(), { value: 'John' }))          // field contains value (case sensitive)
ILIKE('name', new Variable(STRING(), { value: 'john' }))         // field contains value (case insensitive)
IN('status', new Variable(ARRAY(STRING()), { value: ['active', 'pending'] }))  // field IN (values)

// Combined filters
const filter = AND(
    EQ('status', new Variable(STRING(), { value: 'active' })),
    GT('age', new Variable(NUMBER(), { value: 18 })),
    ILIKE('name', new Variable(STRING(), { value: 'john' }))
)

// Filter by relations (using __)
EQ('author__name', new Variable(STRING(), { value: 'John' }))
```

### 11. Variable — Reactive Variables

```typescript
import { Variable, STRING, NUMBER, BOOLEAN, ARRAY } from 'mobx-model-ui'

// Basic variable
const name = new Variable(STRING(), { value: 'John' })
name.set('Jane')
console.log(name.value)  // 'Jane'

// Validation
const age = new Variable(NUMBER({ min: 0, max: 150 }), { value: 25 })
age.set(200)  // errors: ['Number should be less than or equal to 150']
console.log(age.isReady)  // false

// Debounce
const search = new Variable(STRING(), { debounce: 300 })
search.set('query')  // validation after 300ms

// URL synchronization
const page = new Variable(NUMBER(), { syncURL: 'page' })
// value is read from URL ?page=X and written back

// localStorage synchronization
const theme = new Variable(STRING(), { syncLocalStorage: 'theme' })

// Cookie synchronization
const token = new Variable(STRING(), { syncCookie: 'auth_token' })

// Disabled
const disabled = new Variable(STRING(), { disabled: true })
console.log(disabled.isReady)  // true (disabled is always ready)
```

### 12. Form — Form with Validation

```typescript
import { SaveObjectForm, Variable, STRING, NUMBER } from 'mobx-model-ui'

// Create a form for saving an object
const user = new User({ id: 1, name: 'John' })

const form = new SaveObjectForm(
    user,
    {
        name: new Variable(STRING({ required: true, maxLength: 100 }), { value: user.name }),
        email: new Variable(STRING({ required: true }), { value: user.email })
    },
    (response) => {
        console.log('Saved!', response)
    },
    () => {
        console.log('Cancelled')
    }
)

// Check readiness
console.log(form.isReady)   // true if all inputs are valid
console.log(form.isError)   // true if there are errors

// Submit
await form.submit()

// Loading state
console.log(form.isLoading)

// Errors
console.log(form.errors)              // general errors
console.log(form.inputs.name.errors)  // field errors
```

### 13. ActionForm — Form for Actions

```typescript
import { ActionForm, Variable, STRING, NUMBER } from 'mobx-model-ui'

const form = new ActionForm(
    User.defaultRepository,
    'bulk_update',  // action name
    {
        status: new Variable(STRING(), { value: 'active' }),
        ids: new Variable(ARRAY(NUMBER()), { value: [1, 2, 3] })
    },
    (response) => console.log('Action completed!', response)
)

await form.submit()
// Calls: repository.modelAction('bulk_update', { status: 'active', ids: [1, 2, 3] })
```

### 14. ObjectInput — Select Object from List

```typescript
import { ObjectInput, Variable, NUMBER, STRING } from 'mobx-model-ui'

// Input for selecting a single object
const userSelect = new ObjectInput(
    NUMBER(),
    {
        query: User.getQuery({})  // Query to get options
    }
)

// Set selected object by ID
userSelect.set(5)
console.log(userSelect.obj)  // User with id=5 (from cache)

// Input with initial value
const userSelect = new ObjectInput(
    NUMBER(),
    {
        value: 5,
        query: User.getQuery({})
    }
)
```

---

## Important Rules

### Identity Map
One object = one instance in cache. When loading the same ID again, the same object is returned.

```typescript
const user1 = await User.findById(1)
const user2 = await User.findById(1)
console.log(user1 === user2)  // true
```

### @model Decorator is Required
Without it, the model won't work. Decorator order: adapter first, then @model.

```typescript
// Correct
@local()
@model
class User extends Model { ... }

// Incorrect - will throw an error
@model
class User extends Model { ... }
```

### @id Registers the Model
The `@id` decorator is mandatory. It registers the model in the global registry.

```typescript
@model
class User extends Model {
    @id(NUMBER()) id: number  // required!
}
```

### Repository, Not Adapter
Always use Repository for CRUD operations. Adapter is a low-level interface.

```typescript
// Correct
await User.defaultRepository.save(user)

// Incorrect (unless writing custom logic)
await User.defaultRepository.adapter.save(user)
```

### ID Cannot Be Changed
Once set, the ID cannot be modified.

```typescript
const user = new User({ id: 1 })
user.id = 2  // Error: You cannot change id field
```

### is_changed and cancelLocalChanges
The model tracks changes and can revert them.

```typescript
const user = new User({ id: 1, name: 'John' })
user.name = 'Jane'
console.log(user.is_changed)  // true

user.cancelLocalChanges()
console.log(user.name)  // 'John'
```

### destroy() to Remove from Cache
```typescript
user.destroy()  // removes from cache, calls all disposers
```

---

## What to Avoid

1. **Don't create models without `@id`** — the model won't register
2. **Don't change the ID** — it will throw an error
3. **Don't use Adapter directly** for CRUD — use Repository
4. **Don't forget `@model`** — without it, the model won't work
5. **Don't ignore `isReady`** — check it before form submit
6. **Don't create new instances for existing IDs** — use `Model.get(id)` or `findById`
7. **Don't forget `destroy()`** — for Query and Variable to avoid memory leaks

---

## Available Field Types

| Type | Description | Example |
|------|-------------|---------|
| `NUMBER()` | Number | `@field(NUMBER({ min: 0, max: 100 }))` |
| `STRING()` | String | `@field(STRING({ required: true, maxLength: 255 }))` |
| `BOOLEAN()` | Boolean | `@field(BOOLEAN())` |
| `DATE()` | Date | `@field(DATE())` |
| `DATETIME()` | Date and time | `@field(DATETIME())` |
| `ARRAY(type)` | Array | `@field(ARRAY(STRING()))` |
| `UUID()` | UUID | `@id(UUID())` |
| `ENUM(values)` | Enumeration | `@field(ENUM(['a', 'b', 'c']))` |
| `ORDER_BY()` | Sort order | `new Variable(ARRAY(ORDER_BY()))` |

---

## Available Query Types

| Type | Description |
|------|-------------|
| `Query` | Basic list query |
| `QueryPage` | Paginated query |
| `QueryStream` | Infinite scroll (appends to end) |
| `QueryCacheSync` | Live cache synchronization |
| `QueryRaw` | Raw data without models |
| `QueryRawPage` | Raw data + pagination |
| `QueryDistinct` | Unique field values |
