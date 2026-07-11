# TODO — mobx-model-ui

## 1. Баги (Bugs)

## 2. Улучшения (Improvements)

### 2.2 Нет OR-фильтра

**Файл**: `src/filters/ComboFilter.ts`
**Проблема**: Есть только `AND_Filter`. Для полноценной фильтрации нужен `OR_Filter` (и, возможно, `NOT`).
**Фикс**: добавить `OR_Filter` и `OR()` фабрику.

### 2.8 `ReadOnlyAdapter` не блокирует `action`, `modelAction`, `getDistinct`

**Файл**: `src/adapters/read-only.ts`
**Проблема**: Блокирует только `create/update/delete`, но не `action`/`modelAction`.
**Фикс**: переопределить `action`, `modelAction`, `getDistinct` с выбрасыванием ошибки.

### 2.9 `ConstantAdapter` — неединообразное поведение

**Файл**: `src/adapters/constant.ts`
**Проблема**: `action()` возвращает `{}` с `console.warn`, остальные методы бросают `Error`.
**Фикс**: либо все кидают ошибки, либо все возвращают `undefined`.

### 2.11 Нет тестов для `@model` с нестандартным ID-полем

**Файл**: `src/model/model-decorator.spec.ts`
**Проблема**: Все тесты используют `@id(NUMBER())` или `@id()` (числовой по умолчанию).
**Фикс**: добавить тесты для `@id(STRING())` и `@id(UUID())`.

### 2.13 Нестабильный (flaky) тест `timestamp`

**Файл**: `src/queries/query-raw.spec.ts`, тест `timestamp` (строка ~84); причина в `src/queries/query.ts`, строка 218
**Проблема**: Тест ожидает `query.timestamp === timestamp + 1` после двух подряд `load()`. `timestamp` строится на `Date.now()`: инкремент `+1` происходит, только если обе загрузки попали в одну миллисекунду. Если между ними прошла ≥1 мс, `timestamp` становится новым `now` (больше, чем `timestamp + 1`), и тест падает. Флакает и на неизменённом коде.
**Фикс**: сделать `timestamp` монотонным счётчиком, не зависящим от `Date.now()` (например, всегда `timestamp = (this.timestamp ?? 0) + 1`), либо в тесте проверять `timestamp > previous`, а не точное `+1`.

### 2.14 Включить полный strict-режим TypeScript

**Файл**: `tsconfig.json`, строка 10
**Проблема**: `strictNullChecks`, `noImplicitAny`, `strictPropertyInitialization`, `useUnknownInCatchVariables` уже включены по отдельности, но `"strict": true` закомментирован. Остаются выключенными `strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `alwaysStrict`.
**Фикс**: включить `"strict": true` и починить возникшие ошибки.

### 2.15 `get model()` использует `__proto__`

**Файл**: `src/model/model.ts`, строки 92-94
**Проблема**: используется устаревший `(<any>this.constructor).__proto__`.
**Фикс**: `Object.getPrototypeOf(this.constructor)`.

### 2.16 Нестрогое сравнение `!=` в `Model`

**Файл**: `src/model/model.ts`, строки 122 и 131 (`only_changed_raw_data`, `is_changed`)
**Проблема**: используется `!=` (loose equality) вместо `!==`.
**Фикс**: заменить на `!==`.

### 2.17 `local_store` — мутабельный глобал модуля

**Файл**: `src/adapters/local.ts`, строка 13
**Проблема**: `local_store` — глобальная мутабельная мапа уровня модуля, общая для всех инстансов адаптера. Тесты могут протекать состоянием между собой.
**Фикс**: инкапсулировать стор в инстанс адаптера, либо экспортировать read-only с методами мутации + очистка в setup тестов.

### 2.18 `get items()` возвращает внутренний массив

**Файл**: `src/queries/query.ts`, строка 70
**Проблема**: `get items()` возвращает `__items` напрямую — внешний код может мутировать внутреннее состояние. (`QueryCacheSync.items` уже возвращает копию.)
**Фикс**: возвращать копию (`[...this.__items]`), либо явно задокументировать, что мутация допускается.

### 2.19 `LocalAdapter` пишет `console.error` вместо ошибки

**Файл**: `src/adapters/local.ts`, строки 73 и 84 (`action`, `modelAction`)
**Проблема**: нереализованные методы делают `console.error` и молча возвращают `undefined` — тихие сбои в тестах.
**Фикс**: бросать `Error('Not implemented')`.

### 2.20 `setTimeout(() => this.load())` без обработки ошибки

**Файл**: `src/queries/query.ts`, строка 144
**Проблема**: в autoupdate `setTimeout(() => this.load(), ...)` — промис `load()` без `.catch()`, потенциальный unhandled rejection.
**Фикс**: добавить `.catch()`.

### 2.21 Удалить устаревший класс `Input`

**Файл**: `src/inputs/Variable.ts`, строки 117-125
**Проблема**: класс `Input` помечен DEPRECATED (замена — `Variable`), мёртвый код.
**Фикс**: удалить в следующем major (сейчас уже есть `@deprecated`-комментарий).

### 2.22 `Model` использует `export default`

**Файл**: `src/model/model.ts`, строка 13
**Проблема**: `export default abstract class Model`, тогда как все остальные модули используют именованные экспорты.
**Фикс**: перейти на именованный экспорт для единообразия.

### 2.23 `config` — мутабельный объект

**Файл**: `src/config.ts`
**Проблема**: `config` — обычный мутабельный объект, любой потребитель может перезаписать значения.
**Фикс**: `Object.freeze()` или класс с приватными полями и сеттерами.

### 2.24 Разнобой в нейминге (snake_case / UPPER_CASE / camelCase)

**Файлы**: `src/model/model.ts` (`init_data`, `only_changed_raw_data`, `is_changed`), `src/config.ts` (`DEBOUNCE`, `UPDATE_SEARCH_PARAMS` — UPPER_CASE), `src/adapters/local.ts` (`init_local_data`, `store_name`), `src/queries/query-page.ts` (`is_first_page`/`isFirstPage` — оба стиля)
**Проблема**: смешение snake_case, UPPER_CASE и camelCase. В `query-page.ts` camelCase-алиасы намеренны (совместимость с JS-стилем), остальное — исторический разнобой.
**Фикс**: выбрать camelCase как основной для TS/JS, snake_case-имена задепрекейтить (breaking change — планировать на major).

---

## 3. Новый функционал (Features)

### 3.2 OR / ComboFilter с разными операторами

**Описание**: `ComboFilter` поддерживает только `AND`. Нужен `OR` и `NOT`.

### 3.3 Cross-field validation в Form

**Описание**: Правила вида `end_date > start_date` требуют валидации на уровне формы, а не отдельных полей.

### 3.6 Batch / Transaction операции в Repository

**Описание**: `saveAll()`, `deleteAll()`, `transaction()` для массовых операций.

### 3.11 Form dirty state

**Описание**: Отслеживание «была ли форма изменена» на уровне формы, не только на уровне объекта (`obj.is_changed`).

### 3.13 Конфигурация через декораторы

**Описание**: Сейчас `@local()`, `@constant()` без параметров. Нужна возможность `@local({storeName, delay})`.
