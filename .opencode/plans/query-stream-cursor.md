# QueryStream Cursor-Based Implementation Plan

## Q1 — Переделать QueryStream на cursor через offset
**Описание:** Переиспользовать `offset` Variable для хранения cursor (ID последнего элемента). Адаптер определяет режим по `instanceof QueryStream`.

**Решение:**
- В конструкторе QueryStream: `if (!props.offset) this.offset.set(undefined)`
- `offset.value` = undefined означает начало, иначе = ID последнего загруженного элемента
- В `toString()` offset уже участвует — корректное сравнение состояний работает

---

## Q2 — Переделать QueryStream методы
**Описание:** Cursor-based методы для infinite scroll.

**Решение:**
- `restart()` — полный сброс: очистить `__items`, сбросить `offset.value` в undefined, сбросить `total`, вызвать `load()`
- `loadMore()` — если `this.controller` уже есть (запрос в процессе) — ничего не делать; иначе вызвать `load()`
- `total === 1` — признак конца (последняя загрузка вернула 0 элементов)

---

## Q3 — Переделать `__load()` в QueryStream
**Описание:** Загрузка использует cursor (offset.value), items накапливаются.

**Решение:**
- `__load()` вызывает `repository.load()` — адаптер читает `offset.value` как cursor
- После загрузки: если `objs.length === 0` — `total = 1` (конец)
- Если `objs.length > 0` — обновить `offset.value` = ID последнего элемента (`objs[objs.length-1].ID`)
- Items push-ятся в `__items` (накапливаются, не заменяются)

---

## Q4 — LocalAdapter поддержка cursor
**Описание:** LocalAdapter проверяет `instanceof QueryStream` и фильтрует по ID > cursor.

**Решение:**
- В `load()` проверить `query instanceof QueryStream`
- Если да — `query.offset.value` это cursor, фильтровать объекты с ID > cursor.value
- Применить sort, затем slice по limit

---

## Q5 — Написать тесты для QueryStream
**Описание:** Полное покрытие тестами.

**Решение:**
- Constructor: default values (offset=undefined, limit=50, items=[])
- restart: очищает items, сбрасывает offset, загружает
- loadMore: загружает следующую порцию по cursor
- Защита от параллельных запросов: второй вызов во время загрузки игнорируется
- total === 1 когда ответ пустой (конец)
- Accumulation: items накапливаются, не заменяются
