# DMC-268 UI (Team 5)

Vite + React + TypeScript frontend for DMC-268 Team 5.

## Requirements

- Node.js 24 LTS
- pnpm (version pinned in `package.json` → `packageManager`)

## Setup & Run

```bash
pnpm install
pnpm dev
```

## Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Start the Vite dev server                |
| `pnpm build`        | Type-check and build for production      |
| `pnpm preview`      | Preview the production build             |
| `pnpm test`         | Run Vitest unit tests                    |
| `pnpm check-types`  | Run TypeScript type checking (no output) |
| `pnpm lint`         | Run ESLint and Stylelint                 |
| `pnpm lint:eslint`  | Run ESLint                               |
| `pnpm lint:styles`  | Run Stylelint on CSS files               |
| `pnpm format`       | Format files with Prettier               |
| `pnpm format:check` | Check formatting without changing files  |

## Git hooks

Managed by Husky (installed automatically by `pnpm install`):

- **pre-commit** — ESLint on staged `*.{js,jsx,ts,tsx}` files via lint-staged; errors block the commit.
- **pre-push** — `pnpm check-types`, `pnpm lint`, `pnpm build`; any failure blocks the push.

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
pnpm test
```

## UI components

Для добавления нового shadcn/ui-компонента используйте CLI:

```bash
npx shadcn@latest add <component>
```

Проект использует классический стиль `default`, alias `@/*` и CSS-токены в
`src/styles.css`.
