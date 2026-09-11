# Frontend Architecture (DMC-268 UI, Team 5)

Стек: **Vite 8 + React 18 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui + Zustand + TanStack Query + Shiki**.

Архитектурный подход: **Feature-Sliced Design** (строгий). Слои `shared/`, `entities/`, `features/`, `widgets/`, `pages/`, `app/` изолированы по правилам FSD: импорты идут только сверху вниз (от `shared` к `app`), горизонтальные импорты внутри одного слоя запрещены.

## Структура слоёв

```text
src/
├── app/
│   └── providers/
│       ├── query-provider/        # TanStack Query + Devtools
│       ├── theme-provider/        # light/dark тема (localStorage)
│       └── router/                # (planned) react-router
│
├── pages/
│   └── merge-request/
│       └── ui/MergeRequestPage.tsx
│
├── widgets/
│   └── diff-viewer/
│       └── ui/DiffViewer.tsx       # сборка DiffHunk[] для FileChange
│
├── features/                      # (planned) add-review-comment, toggle-diff-context, ...
│
├── entities/
│   ├── diff/
│   │   ├── api/getMergeRequest.ts
│   │   ├── model/types.ts
│   │   ├── model/diffUiStore.ts
│   │   └── ui/
│   │       ├── diff-line/DiffLine.tsx
│   │       ├── diff-hunk/DiffHunk.tsx
│   │       ├── expandable-context/ExpandableContext.tsx
│   │       └── inline-comment/InlineComment.tsx
│   ├── review-comment/
│   │   ├── api/getReviewComments.ts
│   │   └── model/reviewCommentsStore.ts
│   ├── merge-request/             # (planned)
│   └── review/                    # (planned)
│
└── shared/
    ├── api/                        # (planned) HTTP-клиент
    ├── ui/
    │   ├── button.tsx
    │   ├── badge.tsx
    │   ├── card.tsx
    │   └── code/Code.tsx           # блок кода с подсветкой Shiki
    ├── lib/
    │   ├── utils.ts                # cn()
    │   └── shiki/
    │       ├── shiki.ts            # init highlighter (github-light/dark + ts/js/json/bash)
    │       ├── ShikiProvider.tsx
    │       └── useShiki.ts
    ├── config/                    # (planned)
    └── types/                     # (planned)
```

## UI Kit

`shared/ui/` — shadcn-style примитивы на CVA + Tailwind v4 + CSS-токены из `src/styles.css`:

```text
shared/ui/
├── button.tsx
├── badge.tsx
├── card.tsx
└── code/Code.tsx
```

Planned: `tooltip`, `collapsible`, `scroll-area`, `skeleton`.

## Data model (`entities/diff/model/types.ts`)

```text
MergeRequest
 └── files: FileChange[]
      └── hunks: Hunk[]
           ├── lines: DiffLine[]        # type: 'context' | 'add' | 'delete'
           ├── comments: InlineComment[]  # привязка к line + side ('old' | 'new')
           ├── contextLinesBefore: DiffLine[]
           └── contextLinesAfter: DiffLine[]
```

- `DiffLine` — одна строка с `oldNumber?`/`newNumber?` и `content`.
- `InlineComment` — комментарий ревьюера, привязанный к `line` + `side`.
- `Hunk` — диапазон изменений с раскрывающимся контекстом до/после.

## State management

Разделение: **серверный стейт → TanStack Query**, **UI-стейт → Zustand**.

### TanStack Query (server state)

| Query key | Источник | Возвращает |
|---|---|---|
| `['merge-request']` | `entities/diff/api/getMergeRequest` | `MergeRequest` |
| `['review-comments']` | `entities/review-comment/api/getReviewComments` | `ReviewComment[]` |

`QueryProvider` (`app/providers/query-provider/QueryProvider.tsx`): `staleTime` 5 мин, `retry` 1, `refetchOnWindowFocus: false`.

### Zustand (UI state)

| Store | Файл | Состояние |
|---|---|---|
| `useReviewCommentsStore` | `entities/review-comment/model/reviewCommentsStore.ts` | `filter: 'all' \| 'unresolved' \| 'resolved'` (persisted) |
| `useDiffUiStore` | `entities/diff/model/diffUiStore.ts` | `expandedHunks: Record<string, boolean>`, `selectedFileId: string \| null` |

Мок состояния приложения (UI-state seed):

```ts
useDiffUiStore.getState() === {
  expandedHunks: {},        // хунки свёрнуты по умолчанию
  selectedFileId: null,     // авто-выбор первого файла на странице
}
```

### Подсветка синтаксиса (Shiki)

`ShikiProvider` (`shared/lib/shiki/ShikiProvider.tsx`) инициализирует один `Highlighter` на всё приложение с темами `github-light`/`github-dark` и языками `typescript`, `javascript`, `json`, `bash`. Хук `useShiki()` возвращает `{ highlighter, ready, shikiTheme }`; `shikiTheme` следует за `ThemeProvider`. `Code` и `DiffLine` токенизируют строку через `highlighter.codeToTokensBase`.

## Routing (planned, отложен в этой задаче)

Роутинг не подключён (`react-router` не установлен). Текущая страница — единственная, рендерится `App.tsx` через `MergeRequestPage`.

Планируемая структура (после подключения `app/providers/router/`):

```text
/                 → redirect → /merge-requests/:id
/merge-requests   → список MR
/merge-requests/:id → pages/merge-request (diff viewer)
/settings         → настройки
```

## Component inventory

| Компонент | Слой | Назначение |
|---|---|---|
| `Code` | `shared/ui` | блок кода с подсветкой Shiki и номерами строк |
| `DiffLine` | `entities/diff/ui` | строка дифа: gutter (old/new номера), знак +/−, цвет по типу, токены |
| `DiffHunk` | `entities/diff/ui` | заголовок хунка `@@ -a,b +c,d @@` + строки + inline-комментарии + expandable context |
| `ExpandableContext` | `entities/diff/ui` | сворачиваемый контекст до/после хунка (toggle через `diffUiStore`) |
| `InlineComment` | `entities/diff/ui` | комментарий ревьюера, привязанный к строке |
| `DiffViewer` | `widgets/diff-viewer` | сборка `DiffHunk[]` для `FileChange` + счётчики +/− |
| `MergeRequestPage` | `pages/merge-request` | выбор файла + `DiffViewer` + обработка загрузки/ошибок |
