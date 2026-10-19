---
name: mr-table
description: Рендер списка мерж реквестов в системе валидации MR: таблица на TanStack Table + Ant Design, фильтры по статусам валидации, сортировка, пагинация. Использовать при создании или изменении таблицы/списка MR, фильтров, сортировки, постраничной навигации.
---

# Таблица мерж реквестов (MR Table)

## Когда использовать
- Нужно построить или изменить список/таблицу мерж реквестов.
- Нужна фильтрация по статусам валидации, сортировка по полям, пагинация.
- Нужен выбор строк, массовые операции, колонка-ссылка на детальную страницу.

## Стек
- **TanStack Table** (`@tanstack/react-table`) — headless-логика: сортировка, фильтрация, пагинация, выбор строк.
- **Ant Design** — готовые компоненты отображения: `Table`, `Tag`, `Badge`, `Space`, `Tooltip`.
- **TanStack Query** — поставка данных (см. скилл `query-data`).

## Типовая структура страницы списка
```
src/pages/MrListPage.tsx        — страница: хуки данных + головная последовательность
src/features/mr-list/           — вся логика списка MR
  ├── columns.tsx               — колонки TanStack Table
  ├── filters.tsx               — компоненты фильтров (статус, автор, ветка)
  ├── useMrListQuery.ts         — хук TanStack Query для данных списка
  └── MrListTable.tsx           — обёртка AntD Table над TanStack Table
```

## Как реализовывать

### 1. Данные через TanStack Query
Данные списка получать хук-ом `useMrListQuery(page, pageSize, filters)`. Параметры запроса (пагинация, фильтры, сортировка) хранить в URL через `useSearchParams`, чтобы состояние переживало перезагрузку страницы.

```tsx
function useMrListQuery(...) {
  return useQuery({
    queryKey: ['mr-list', page, pageSize, filters, sort],
    queryFn: () => fetchMrList({ ... }),
    placeholderData: keepPreviousData, // избегаем "мигания" при смене страницы
  });
}
```

### 2. Колонки
Определять колонки ДО рендера и оборачивать в `useMemo`, чтобы не пересоздавать на каждый рендер. Через `columnHelper.accessor` от TanStack Table, а рендер ячеек — Ant Design-компоненты.

Референс-колонки:
- **Титул MR** — `title`, ссылка `Link` на детальную страницу `./<iid>`.
- **Источник → цель** — `source_branch` → `target_branch` (текст или `Tag`).
- **Автор** — `author.username` с `Tooltip` по `author.name`.
- **Общий статус валидации** — ячейка через скилл `validation-status` (единый `<ValidationStatus status={...}/>`).
- **Статус пайплайна** — `Badge`/`Tag` с цветом по статусу (success/process/error).

### 3. Фильтры
Фильтровать **частично на клиенте** (Таблица поддерживает `globalFilter`), частично на сервере (пагинация, большие наборы). Для постраничного источника фильтры уходят в `queryKey` и на бэкенд.

Типовые фильтры для валидации MR:
- по общему статусу валидации (passed / failed / running / pending);
- по автору и ветке-источнику;
- по наличию замечаний / количеству замечаний.

### 4. Пагинация
Server-side пагинация: `paginated: true` у TanStack Table + `Pagination` от AntD. Скип/лимит брать из `pageParam` и `refetchInViewport=false`. При смене фильтров сбрасывать `pageIndex` на 0.

### 5. Выбор строк и массовые операции
- Включить `enableRowSelection` + колонку с `checkbox` (`Header`/`Cell` от TanStack Table).
- Массовые действия выносить в `Space` над таблицей, показывать только когда выбрано ≥1 строки.

## Чек-лист готовности
- [ ] Данные приходят через `useQuery` с `queryKey`, учитывающим пагинацию/фильтры/сортировку.
- [ ] `placeholderData: keepPreviousData` включён (нет мигания при навигации).
- [ ] Состояние списка живёт в URL (`useSearchParams`).
- [ ] Статусы валидации рендерятся единым компонентом из скилла `validation-status`.
- [ ] Имеется обработка `isLoading` / `isError` (пустое состояние, скелетон, ретрай).
