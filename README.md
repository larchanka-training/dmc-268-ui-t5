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
- Mock API и store находятся в `src/entities/review-comment`.

TanStack Query Devtools доступны в development-сборке. Ошибку запроса можно
воспроизвести кнопкой «Симулировать ошибку» в приложении.

## Tests

```bash
npm test
```
