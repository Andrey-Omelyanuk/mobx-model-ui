# TODO — mobx-model-ui

## 1. Ошибки (Bugs)

### 1.5 `SaveObjectForm.apply()` проверяет поля через `Object.keys(this.obj)`

**Файл**: `src/forms/ObjectForm/SaveObjectForm.ts`, строка 10
**Проблема**: `Object.keys()` от MobX-объекта возвращает служебные поля (`init_data`, `disposers`, `modelName`, `modelDescriptor`). Проверка должна быть против `this.obj.modelDescriptor.fields`.
**Тест-ловушка**: `should check field existence against modelDescriptor.fields, not Object.keys` в `src/forms/ObjectForm/SaveObjectForm.spec.ts`
**Фикс**: вместо `Object.keys(this.obj)` проверять `this.obj.modelDescriptor.fields`.

### 1.6 `Variable.set()` с debounce сбрасывает `isNeedToUpdate` до валидации

**Файл**: `src/inputs/Variable.ts`, строка 69
**Проблема**: `this.isNeedToUpdate = false` вызывается сразу, до завершения debounced-валидации. Не критично, но логически непоследовательно.
**Фикс**: не сбрасывать `isNeedToUpdate` до окончания debounce/валидации.

### 1.7 `Model.destroy()` — потенциальный бесконечный цикл

**Файл**: `src/model/model.ts`, строка 73
**Проблема**: `while(disposers.size)` + `forEach` — если disposer во время выполнения добавляет новый disposer, может начаться бесконечный цикл.
**Фикс**: заменить на копирование ключей: `const keys = [...this.disposers.keys()]; keys.forEach(k => { ... })`.

### 1.8 `clearModels()` не очищает Cache'ы

**Файл**: `src/model/models.ts`, строки 14–25
**Проблема**: `clearModels()` не вызывает `modelDescriptor.cache.clear()`. Объекты в Cache остаются в памяти с активными disposers.
**Тест-ловушка**: `clearModels should clear all model caches` в `src/model/models.spec.ts`
**Фикс**: перед `models.clear()` пройти по всем descriptor'ам и вызвать `cache.clear()`.

### 1.9 `clearModels()` — `idFieldDescriptors.disposers` пуст

**Файл**: `src/fields/id.ts`
**Проблема**: `disposers: []` — `clearModels()` итерирует пустой массив. Не ошибка выполнения, но вводит в заблуждение.
**Фикс**: убрать `idFieldDescriptors.disposers` из `clearModels()` или синхронизировать с реальными disposers.

### 1.10 `syncCookieHandler` неправильно удаляет cookie

**Файл**: `src/inputs/handlers/syncCookie.ts`, строка 16
**Проблема**: Не устанавливает `max-age=0` или `expires` в прошлом. Некоторые браузеры могут не удалить cookie.
**Тест-ловушка**: `should properly delete cookie when value becomes undefined` в `src/inputs/handlers/syncCookie.spec.ts`
**Фикс**: добавить `max-age=0` при удалении.

---

## 2. Улучшения (Improvements)

### 2.1 Нет строгих типов TypeScript

**Файл**: `tsconfig.json`
**Проблема**: `strictNullChecks: false`, `noImplicitAny: false`, `useUnknownInCatchVariables: false`, `strictPropertyInitialization: false`.
**Фикс**: постепенно включать strict-режим, начиная с `noImplicitAny` и `useUnknownInCatchVariables`.

### 2.2 Нет OR-фильтра

**Файл**: `src/filters/ComboFilter.ts`
**Проблема**: Есть только `AND_Filter`. Для полноценной фильтрации нужен `OR_Filter` (и, возможно, `NOT`).
**Фикс**: добавить `OR_Filter` и `OR()` фабрику.

### 2.3 `disposers` — разная семантика именования

**Проблема**: `Model.disposers` — `Map`, `Query.disposers` — `[]`, `disposerObjects` — `Record`. Сбивает с толку.
**Фикс**: унифицировать на `Map<string, () => void>` везде.

### 2.4 `model-decorator.ts` создаёт прокси-класс на каждый инстанс

**Файл**: `src/model/model-decorator.ts`, строка 32
**Проблема**: Каждый `new Model()` создаёт новый класс через `class extends constructor`.
**Фикс**: создать прокси-класс один раз при декорировании и кешировать.

### 2.5 `Form.submit()` молча игнорирует неготовую форму

**Файл**: `src/forms/Form.ts`, строка 73–76
**Проблема**: `!isReady` → `console.error + return`. Вызывающий код не узнаёт, что submit не выполнен.
**Фикс**: возвращать rejected Promise с информативной ошибкой.

### 2.6 `Variable.stopDebouncing` — неправильное имя

**Файл**: `src/inputs/Variable.ts`, строка 64
**Проблема**: `stopDebouncing` на самом деле запускает валидацию после debounce, а не останавливает её.
**Фикс**: переименовать в `debouncedValidation` или `debouncedFn`.

### 2.7 `DateDescriptor.default()` возвращает новый `Date()` всегда

**Файл**: `src/types/date.ts`, строка 35
**Проблема**: Каждый вызов `default()` даёт текущее время момента вызова. Для `date_of_birth` это странно.
**Фикс**: опциональный параметр `defaultDate` в конструкторе.

### 2.8 `ReadOnlyAdapter` не блокирует `action`, `modelAction`, `getDistinct`

**Файл**: `src/adapters/read-only.ts`
**Проблема**: Блокирует только `create/update/delete`, но не `action`/`modelAction`.
**Фикс**: переопределить `action`, `modelAction`, `getDistinct` с выбрасыванием ошибки.

### 2.9 `ConstantAdapter` — неединообразное поведение

**Файл**: `src/adapters/constant.ts`
**Проблема**: `action()` возвращает `{}` с `console.warn`, остальные методы бросают `Error`.
**Фикс**: либо все кидают ошибки, либо все возвращают `undefined`.

### 2.10 Циркулярные импорты

**Файлы**: `model/model.ts` → `../queries` → `../repository` → `./model`
**Проблема**: Косвенная циркулярная зависимость при сборке.
**Фикс**: реорганизовать импорты (вынести типы в отдельный файл).

### 2.11 Нет тестов для `@model` с нестандартным ID-полем

**Файл**: `src/model/model-decorator.spec.ts`
**Проблема**: Все тесты используют `@id(NUMBER())` или `@id()` (числовой по умолчанию).
**Фикс**: добавить тесты для `@id(STRING())` и `@id(UUID())`.

### 2.12 Dockerfile — только `COPY package.json`

**Файл**: `dockerfile`
**Проблема**: Копируется только `package.json`, всё остальное — при запуске. Образ не кеширует `node_modules`.
**Фикс**: добавить `COPY yarn.lock .` и `RUN yarn install` в образ.

### 2.13 `config.AUTO_UPDATE_DELAY` закомментирован

**Файл**: `src/queries/query.ts`, строка 138–139
**Проблема**: `setTimeout(() => this.load())` без задержки, хотя конфиг задаёт `AUTO_UPDATE_DELAY = 100`.
**Фикс**: раскомментировать `config.AUTO_UPDATE_DELAY`.

---

## 3. Новый функционал (Features)

### 3.1 HTTP/REST Adapter

**Описание**: Нет встроенного Adapter'а, который реально ходит на сервер. `RestAdapter` на `fetch()` или `axios` — минимально необходимый функционал для production.

### 3.2 OR / ComboFilter с разными операторами

**Описание**: `ComboFilter` поддерживает только `AND`. Нужен `OR` и `NOT`.

### 3.3 Cross-field validation в Form

**Описание**: Правила вида `end_date > start_date` требуют валидации на уровне формы, а не отдельных полей.

### 3.4 Async validation

**Описание**: Валидация, которая ходит на сервер (уникальность email, и т.п.). Добавить `asyncValidator` в `Variable`.

### 3.5 Computed / Virtual Fields

**Описание**: `@computed`-декоратор для полей, которые есть только на клиенте, с регистрацией в `ModelDescriptor`.

### 3.6 Batch / Transaction операции в Repository

**Описание**: `saveAll()`, `deleteAll()`, `transaction()` для массовых операций.

### 3.7 React / Vue интеграция (hooks)

**Описание**: Базовые hooks (`useQuery`, `useForm`, `useVariable`) для распространённых UI-фреймворков.

### 3.8 SortableQuery

**Описание**: Компонент-обёртка над Query, управляющий состоянием сортировки (поле + направление) с переключением по клику.

### 3.9 Selection State

**Описание**: `SelectionState<M>` для управления выбором элементов списка (checkboxes, select all).

### 3.10 Collection / EntitySet

**Описание**: Локальная коллекция объектов (новые + существующие) с `add`/`remove` до сохранения, bulk-save при `commit()`.

### 3.11 Form dirty state

**Описание**: Отслеживание «была ли форма изменена» на уровне формы, не только на уровне объекта (`obj.is_changed`).

### 3.12 Validation groups

**Описание**: Для форм создания и обновления разные наборы правил валидации.

### 3.13 Конфигурация через декораторы

**Описание**: Сейчас `@local()`, `@constant()` без параметров. Нужна возможность `@local({storeName, delay})`.

### 3.14 Debounce в Query.autoupdate (исправить закомментированный код)

**Описание**: Раскомментировать `config.AUTO_UPDATE_DELAY` — баг-фикс, выделен отдельно от 2.13.
