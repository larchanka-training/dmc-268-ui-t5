# DMC-268 UI (Team 5)

Vite + React + TypeScript frontend for DMC-268 Team 5.

## Setup & Run

```bash
npm install
npm run dev
```

## State management

- TanStack Query отвечает за серверные данные review-комментариев.
- Zustand хранит UI-фильтр `all | unresolved | resolved` и сохраняет его в
  `localStorage`.
- `QueryProvider` находится в `src/app/providers/query-provider`.
- Tailwind CSS v4 используется для utility-классов и дизайн-токенов.
- shadcn/ui-компоненты находятся в `src/components/ui`; новые компоненты
  добавляются адресно.
- Переключатель темы находится в шапке, учитывает системную тему при первом
  запуске и сохраняет выбор в `localStorage`.
- Mock API и store находятся в `src/entities/review-comment`.

TanStack Query Devtools доступны в development-сборке. Ошибку запроса можно
воспроизвести кнопкой «Симулировать ошибку» в приложении.

## Tests

```bash
npm test
```

## UI components

Для добавления нового shadcn/ui-компонента используйте CLI:

```bash
npx shadcn@latest add <component>
```

Проект использует классический стиль `default`, alias `@/*` и CSS-токены в
`src/styles.css`.
