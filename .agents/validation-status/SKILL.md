---
name: validation-status
description: Единое отображение статусов валидации MR на Ant Design (Tag/Badge/Progress/Icon): общий статус мерж реквеста и статус каждого валидатора. Использовать во всех местах показа статуса (список, детальная страница, чек-лист), чтобы статусы выглядели и вели себя одинаково.
---

# Статусы валидации (Validation Status)

## Когда использовать
- Нужно показать статус прохождения валидации (общий для MR или отдельного валидатора).
- Нужно согласовать внешний вид и поведение статусов во всём приложении (список + деталь).

## Единый источник статусов
КЭШ всех статусов — через перечисление и маппинг `статус → (цвет, иконка, текст)`. Не хардкодить цвета по месту.

```tsx
// shared/validationStatus.ts
export type ValidationStatus =
  | 'passed'   // валидация прошла
  | 'failed'   // валидация не прошла
  | 'running'  // выполняется
  | 'pending'  // ожидает запуска
  | 'skipped'; // пропущена / не применима

export const validationStatusConfig: Record<ValidationStatus, {...}> = {
  passed:  { color: 'success',  icon: <CheckCircleOutlined />, label: 'Пройдено' },
  failed:  { color: 'error',    icon: <CloseCircleOutlined />, label: 'Провалено' },
  running: { color: 'processing', icon: <LoadingOutlined />,    label: 'Выполняется' },
  pending: { color: 'default',  icon: <ClockCircleOutlined />,  label: 'Ожидает' },
  skipped: { color: 'warning',  icon: <MinusCircleOutlined />,  label: 'Пропущено' },
};
```

## Единый компонент
Один компонент `<ValidationStatus status={...} size?/>`, используемый ВЕЗДЕ.

```tsx
export function ValidationStatus({ status, size = 'default' }: Props) {
  const cfg = validationStatusConfig[status] ?? fallback;
  return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
}
```

- В **таблице списка** — компактный `Tag`/`Badge`.
- В **детальной странице / чек-листе** — можно расширить строкой (длительность, доп. текст) через проп `extra`.

## Общий статус MR
Общий статус не обязан совпадать с «победой большинства»:
- `failed`, если хоть один критичный валидатор упал;
- `running`, если всё ещё выполняются проверки (даже если часть прошла);
- `passed`, только когда ВСЕ релевантные валидаторы прошли, а критичных ошибок нет.

Правило агрегации выносить в одну функцию `aggregateMrStatus(validatorStatuses): ValidationStatus` и покрывать юнит-тестами — чтобы список и деталь показывали одинаковый результат.

## Прогресс по набору проверок
Если нужно показать «5 из 8 пройдено» — использовать `Progress` от AntD а не набор иконок.

## Чек-лист готовности
- [ ] Все места показа статуса используют единый `<ValidationStatus/>`.
- [ ] Маппинг `статус → цвет/иконка/текст` сконцентрирован в одном месте.
- [ ] Агрегация общего статуса — единственная функция, покрытая тестами.
- [ ] Покрыты статусы running/pending (Live-обновление смотри в `query-data`).
