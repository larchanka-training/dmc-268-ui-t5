---
name: query-data
description: Работа с данными через TanStack Query для UI валидации MR: хуки запросов MR, кэширование, инвалидация, polling живых статусов пайплайнов/валидаторов, optimistic updates. Использовать при любой выборке данных MR, обновлении статуса, авто-обновлении страницы.
---

# Запросы данных (TanStack Query)

## Когда использовать
- Получение списка/детали MR (см. `mr-table`, `mr-detail`).
- Живое авто-обновление статуса пайплайнов и валидаторов.
- Отправка действий (ретрай валидации, смена настроек) с последующим обновлением кэша.

## Единые хуки (по принципу «один источник»)
Выносить обращения к API в переиспользуемые хуки в `src/api/` или `src/features/` — не дублировать `fetch` в каждом компоненте.

- `useMrListQuery(...)` — список.
- `useMrDetailQuery(iid)` — деталь.
- `useMutation` для действий (ретрай, обновление правил) + `invalidateQueries` после успеха.

## Ключи запросов
Строить предсказуемые `queryKey`, чтобы инвалидация не промахивалась:
```tsx
// структура: ['mr', { scope: 'detail', iid }, params]
{ queryKey: ['mr', 'detail', iid] }
{ queryKey: ['mr', 'list', filters, page] }
```
Инвалидация «всего по конкретному MR»: `queryClient.invalidateQueries({ queryKey: ['mr'] })`, точечно — `['mr','detail', iid]`.

## Polling живых статусов (важно для валидации MR)
Пайплайны и валидаторы обновляются — нужен фоновый опрос, но **только пока идёт работа**:

```tsx
const { data, refetchInterval } = useQuery({
  queryKey: ['mr', 'detail', iid],
  queryFn: () => fetchMrDetail(iid),
  refetchInterval: (query) => {
    const s = aggregateStatus(query.state.data?.validators);
    // опрашиваем, пока что-то выполняется/ожидает; завершено — стоп
    return (s === 'running' || s === 'pending') ? 5000 : false;
  },
});
```
- Интервал 3–10 сек (не чаще). 
- Обязательно остановить опрос по завершении всех проверок — иначе вечный трафик.
- Не запускать polling, когда вкладка неактивна: можно через `enabled` + visibility, либо полагаться на `refetchIntervalInBackground: false` (по умолчанию).

## Optimistic updates
Для действий с быстрым откликом (ретрай валидации, смена статуса) можно обновить кэш до ответа сервера через `onMutate`, с `onError`-откатом:

```tsx
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: ['mr','detail', vars.iid] });
  const prev = queryClient.getQueryData(['mr','detail', vars.iid]);
  queryClient.setQueryData(..., updater);   // оптимистично
  return { prev };
},
onError: (_e, vars, ctx) => queryClient.setQueryData(..., ctx.prev),
onSettled: (_e, vars) => queryClient.invalidateQueries({ queryKey: ['mr','detail', vars.iid] }),
```

## Состояния загрузки
- `isLoading` (нет данных вообще) → скелетон (AntD `Skeleton`) или `Spin`.
- `isFetching` при `keepPreviousData`/фоне → лёгкая индикация, не «прыгать» этим.
- `isError` → карточка ошибки с кнопкой «Повторить» (`refetch`).
- Пустые данные → осознанное пустое состояние (`Empty` от AntD + текст/действие).

## Чек-лист готовности
- [ ] API-вызовы инкапсулированы в хуки, в компонентах нет «голого» `fetch`.
- [ ] `queryKey` предсказуемы и покрывают инвалидацию.
- [ ] Polling включён только на время `running`/`pending` и выключается по завершении.
- [ ] После мутаций — `invalidateQueries` соответствующего ключа.
- [ ] Обработаны все состояния загрузки/ошибки.
