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


### 2.13 Нестабильный (flaky) тест `timestamp`

**Файл**: `src/queries/query-raw.spec.ts`, тест `timestamp` (строка ~84); причина в `src/queries/query.ts`, строка 218
**Проблема**: Тест ожидает `query.timestamp === timestamp + 1` после двух подряд `load()`. `timestamp` строится на `Date.now()`: инкремент `+1` происходит, только если обе загрузки попали в одну миллисекунду. Если между ними прошла ≥1 мс, `timestamp` становится новым `now` (больше, чем `timestamp + 1`), и тест падает. Флакает и на неизменённом коде.
**Фикс**: сделать `timestamp` монотонным счётчиком, не зависящим от `Date.now()` (например, всегда `timestamp = (this.timestamp ?? 0) + 1`), либо в тесте проверять `timestamp > previous`, а не точное `+1`.

### 2.17 `local_store` — мутабельный глобал модуля

**Файл**: `src/adapters/local.ts`, строка 13
**Проблема**: `local_store` — глобальная мутабельная мапа уровня модуля, общая для всех инстансов адаптера. Тесты могут протекать состоянием между собой.
**Фикс**: инкапсулировать стор в инстанс адаптера, либо экспортировать read-only с методами мутации + очистка в setup тестов.

### 2.20 `setTimeout(() => this.load())` без обработки ошибки

**Файл**: `src/queries/query.ts`, строка 144
**Проблема**: в autoupdate `setTimeout(() => this.load(), ...)` — промис `load()` без `.catch()`, потенциальный unhandled rejection.
**Фикс**: добавить `.catch()`.

### 2.24 Разнобой в нейминге (snake_case / UPPER_CASE / camelCase)

**Файлы**: `src/model/model.ts` (`init_data`, `only_changed_raw_data`, `is_changed`), `src/config.ts` (`DEBOUNCE`, `UPDATE_SEARCH_PARAMS` — UPPER_CASE), `src/adapters/local.ts` (`init_local_data`, `store_name`), `src/queries/query-page.ts` (`is_first_page`/`isFirstPage` — оба стиля)
**Проблема**: смешение snake_case, UPPER_CASE и camelCase. В `query-page.ts` camelCase-алиасы намеренны (совместимость с JS-стилем), остальное — исторический разнобой.
**Фикс**: выбрать camelCase как основной для TS/JS, snake_case-имена задепрекейтить (breaking change — планировать на major).

---

## 3. Новый функционал (Features)

### 3.2 OR / ComboFilter с разными операторами

**Описание**: `ComboFilter` поддерживает только `AND`. Нужен `OR` и `NOT`.

### 3.6 Batch / Transaction операции в Repository

**Описание**: `saveAll()`, `deleteAll()`, `transaction()` для массовых операций.

### 3.13 Конфигурация через декораторы

**Описание**: Сейчас `@local()`, `@constant()` без параметров. Нужна возможность `@local({storeName, delay})`.
