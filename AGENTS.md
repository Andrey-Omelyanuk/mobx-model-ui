# MobX-Model-UI

## Overview

MobX-based front-end ORM библиотека для декларативного определения моделей данных, управления связями, организации запросов, фильтрации, форм и синхронизации состояния с URL/localStorage/cookie.

## Boundaries

**Что делает:**
- Определение моделей через классы с декораторами (`@model`, `@id`, `@field`, `@foreign`, `@one`, `@many`)
- Реактивное управление связями (many-to-one, one-to-one, one-to-many) через MobX
- CRUD через Repository + Adapter с кешированием в Cache
- Объекты запросов с фильтрацией, пагинацией, stream-подгрузкой, distinct-значениями
- Система типов для валидации и сериализации/десериализации значений (STRING, NUMBER, DATE, ARRAY, ORDER_BY)
- Формы (save, delete, action) с маппингом ошибок и жизненным циклом submit
- Наблюдаемые инпуты (Variable / Input) с синхронизацией через URL, localStorage, cookie

**Что НЕ делает:**
- HTTP-запросов — нет встроенного REST/GraphQL адаптера (только Local, ReadOnly, Constant)
- UI-компонентов — не предоставляет React/Vue/другие компоненты, только состояние
- Роутинга — не управляет навигацией (только синхронизация search params)

## Tech Stack

- TypeScript (ES2017 target, ES2020 modules)
- MobX ~6.7 (makeAutoObservable, reaction, when, intercept/observe)
- Lodash ^4.17.21 (только `_.debounce`)
- Jest + jsdom (тесты)
- Rollup (сборка: UMD + ESM + d.ts)
- TSLint (линтер)

## Architecture

```
src/
├── index.ts                    # Точка входа, реэкспорт всех модулей
├── config.ts                   # Глобальные настройки (page size, debounce, URL, cookie)
├── utils.ts                    # waitIsTrue, waitIsFalse, timeout
├── cache.ts                    # Cache<M> — Observable Map<ID, M>
├── object.ts                   # Destroyable interface
│
├── model/
│   ├── model.ts                # Model — абстрактный базовый класс
│   ├── model-decorator.ts      # @model — декоратор класса
│   ├── model-descriptor.ts     # ModelDescriptor — метаданные модели
│   └── models.ts               # Map всех зарегистрированных моделей
│
├── fields/
│   ├── id.ts                   # @id — идентификатор модели
│   ├── field.ts                # @field — скалярное поле
│   ├── foreign.ts              # @foreign — many-to-one связь
│   ├── one.ts                  # @one — one-to-one inverse
│   └── many.ts                 # @many — one-to-many inverse
│
├── repository.ts               # Repository<M> — CRUD + фабрики запросов
│
├── adapters/
│   ├── adapter.ts              # Adapter<M> — абстрактный интерфейс
│   ├── local.ts                # LocalAdapter — in-memory с фильтрацией
│   ├── read-only.ts            # ReadOnlyAdapter — запрет мутаций
│   └── constant.ts             # ConstantAdapter — фиксированные данные
│
├── queries/
│   ├── query.ts                # Query<M> — базовый наблюдаемый запрос
│   ├── query-page.ts           # QueryPage — пагинация
│   ├── query-stream.ts         # QueryStream — infinite scroll
│   ├── query-cache-sync.ts     # QueryCacheSync — real-time sync с кешем
│   ├── query-raw.ts            # QueryRaw — сырые данные (без моделей)
│   ├── query-raw-page.ts       # QueryRawPage — сырые + пагинация
│   └── query-distinct.ts       # QueryDistinct — distinct значения
│
├── filters/
│   ├── Filter.ts               # Filter — абстрактный базовый класс
│   ├── SingleFilter.ts         # SingleFilter — фильтр по одному полю
│   └── ComboFilter.ts          # ComboFilter / AND — комбинация фильтров
│
├── inputs/
│   ├── Variable.ts             # Variable<T> / Input<T> — наблюдаемое значение
│   ├── ObjectInput.ts          # ObjectInput<M> — выбор модели по ID
│   ├── auto-reset/
│   │   └── autoResetId.ts      # autoResetId — сброс при удалении объекта
│   └── handlers/
│       ├── syncURL.ts          # syncURLHandler — URL search params
│       ├── syncLocalStorage.ts # syncLocalStorageHandler — localStorage
│       └── syncCookie.ts       # syncCookieHandler — cookie
│
├── forms/
│   ├── Form.ts                 # Form — абстрактная форма
│   ├── ActionForm.ts           # ActionForm — вызов modelAction
│   └── ObjectForm/
│       ├── ObjectForm.ts       # ObjectForm — форма для объекта
│       ├── SaveObjectForm.ts   # SaveObjectForm — сохранение объекта
│       ├── ActionObjectForm.ts # ActionObjectForm — action на объекте
│       └── DeleteObjectForm.ts # DeleteObjectForm — удаление объекта
│
├── types/
│   ├── index.ts                # ID = string | number
│   ├── type.ts                 # TypeDescriptor<T> — абстрактный базовый тип
│   ├── string.ts               # STRING() — строковый тип
│   ├── number.ts               # NUMBER() — числовой тип
│   ├── boolean.ts              # BOOLEAN() — булев тип
│   ├── date.ts                 # DATE() — тип даты
│   ├── datetime.ts             # DATETIME() — тип даты-времени (ISO string)
│   ├── array.ts                # ARRAY(type) — тип массива
│   └── order-by.ts             # ORDER_BY() — сортировка (ASC/DESC tuple)
│
└── test.utils.ts               # TestCache, TestAdapter, TestRepository — моки для тестов
```

## Patterns

- **Class Decorators**: модели регистрируются через `@model`, поля — через `@field`, `@id`, связи — через `@foreign`, `@one`, `@many`. Декораторы мутируют prototype и добавляют метаданные в ModelDescriptor.
- **Repository Pattern**: каждая модель имеет Repository, который делегирует persistence в Adapter. CRUD методы возвращают результаты адаптера, но работают через кеш.
- **Adapter Pattern**: абстрактный Adapter определяет контракт (create/update/delete/get/find/load/…), конкретные реализации переключаются декораторами (`@local()`, `@constant()`).
- **Query Objects**: каждый запрос — это observable-объект с собственным состоянием (`isLoading`, `isReady`, `error`, `items`). Параметры запроса — экземпляры Variable.
- **Variable Pattern**: любое наблюдаемое значение (фильтр, параметр запроса, поле формы) — Variable<T>. Поддерживает debounce, disabled, ошибки, синхронизацию.
- **Form Lifecycle**: `submit()` → валидация → вызов repository → `errorHandler()` маппит ошибки → разблокировка формы. cancel() сбрасывает изменения.
- **Error Handling**: `errorHandler()` в Form различает field errors (`{fieldName: "message"}`) и non-field errors по ключу из конфига. Unknown errors маппятся в стандартное сообщение.
- **Naming**:
  - Файлы: kebab-case (`query-page.ts`, `auto-reset/`, `syncURL.ts`)
  - Классы: PascalCase
  - Методы/функции: camelCase
  - Файл теста: `<module>.spec.ts`, co-located с исходником

## Non-Obvious Rules

- **useDefineForClassFields: true** — обязателен. Декораторы полей не могут полагаться на `[[Set]]` и используют `Object.defineProperty` для установки дескрипторов. Без этого флага MobX makeAutoObservable может не распознать поля.
- **Конструктор Model** всегда выполняет: `updateFromRaw(raw)` → `refreshInitData()` строго в этом порядке. `updateFromRaw` устанавливает все поля из raw-объекта, `refreshInitData` фиксирует слепок начального состояния для отслеживания изменений.
- **@model декоратор** подменяет конструктор класса: он вызывает `updateFromRaw` и `refreshInitData` после применения field/relation декораторов.
- **Cache через ObservableMap с intercept/observe**: @id декоратор ставит intercept на `set` для вызова `cache.eject()` старого ID и `cache.inject()` нового ID. observe ловит `delete` для вызова `destroy()` на модели.
- **Relation reaction'ы — ручная очистка**: @foreign, @one, @many создают MobX reaction. Все они собираются в массиве `disposers` и удаляются в `destroy()`. Утечка реакций — частая ошибка.
- **Query.autoupdate** использует MobX `when()` с debounce из config (100ms по умолчанию). При изменении любого dependency-Variable выставляется `isNeedToUpdate`, и `when()` запускает `load()` после debounce.
- **SingleFilter `__` (double underscore)** — разделитель для вложенных полей. Пример: `user__name` фильтрует по полю `name` связанной модели `user`. Это соглашение на уровне строк, без проверки типов.
- **Config — mutable singleton**. Глобальный объект config можно изменить в рантайме (например, `config.UPDATE_SEARCH_PARAMS = myFn` для React Router). Это единственный способ кастомизации без наследования.
- **E2E тесты импортят из dist/** (собранный бандл), unit тесты импортят исходники напрямую. E2E проверяют, что публичный API работает через собранный пакет.
- **TestUtils** (src/test.utils.ts): TestCache, TestAdapter, TestRepository оборачивают каждый метод в `jest.fn()` — это позволяет verify вызовов, но не даёт реального поведения.

## Verification

- **Unit-тесты** (Jest, jsdom): файлы `*.spec.ts` co-located с исходниками. Покрывают каждый модуль изолированно. Запуск: `jest --testMatch='**/src/**/*.spec.ts'`.
- **E2E-тесты** (Jest): файлы в `e2e/`. Импортируют собранный бандл из `dist/`. Проверяют сценарии использования через публичный API. Запуск: `jest --testMatch='**/e2e/**/*.ts'`.
- **Моки**: TestCache, TestAdapter, TestRepository из `src/test.utils.ts` для изоляции модулей.
- **CI**: GitHub Actions — сборка Docker → линтер → unit-тесты → e2e-тесты на каждый push в main и каждый PR.
- **Критерий готовности**: тест считается покрывающим модуль, если он проверяет публичный контракт (не internal-методы) и проходит изолированно.
