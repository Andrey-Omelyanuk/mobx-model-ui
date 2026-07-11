# TODO — mobx-model-ui

## 2. Улучшения (Improvements)

### 2.2 Нет OR-фильтра

**Файл**: `src/filters/ComboFilter.ts`
**Проблема**: Есть только `AND_Filter`. Для полноценной фильтрации нужен `OR_Filter` (и, возможно, `NOT`).
**Фикс**: добавить `OR_Filter` и `OR()` фабрику.

### 2.4 `model-decorator.ts` создаёт прокси-класс на каждый инстанс

**Файл**: `src/model/model-decorator.ts`, строка 32
**Проблема**: Каждый `new Model()` создаёт новый класс через `class extends constructor`.
**Фикс**: создать прокси-класс один раз при декорировании и кешировать.

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
