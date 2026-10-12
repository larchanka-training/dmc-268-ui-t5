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
│   ├── diff-viewer/
│   │   └── ui/DiffViewer.tsx       # сборка DiffHunk[] для FileChange (unified/split)
│   └── merge-request-meta/
│       └── ui/MergeRequestMeta.tsx # мета-карточка MR: автор, ветки, статус, вердикт, скор, сводка AI
│
├── features/                      # (planned) add-review-comment, toggle-diff-context, ...
│
├── entities/
│   ├── diff/
│   │   ├── api/getMergeRequest.ts
│   │   ├── model/types.ts
│   │   ├── model/diffUiStore.ts
  │   │   ├── lib/
│   │   │   ├── buildLinePairs.ts  # пары old/new для side-by-side
│   │   │   ├── countSeverities.ts # счётчики AI-замечаний по severity
│   │   │   ├── diffLineStyles.ts  # общие карты знаков/цветов строк дифа
│   │   │   └── useLineTokens.ts   # токенизация строки через Shiki
│   │   └── ui/
│   │       ├── diff-line/DiffLine.tsx
│   │       ├── diff-line-pair/DiffLinePair.tsx
│   │       ├── diff-hunk/DiffHunk.tsx
│   │       ├── diff-suggestion/DiffSuggestion.tsx
│   │       ├── expandable-context/ExpandableContext.tsx
│   │       ├── inline-comment/InlineComment.tsx
│   │       ├── line-tokens/LineTokens.tsx
│   │       └── severity-badge/SeverityBadge.tsx
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
MergeRequest (id, title, author, sourceBranch, targetBranch, reviewStatus, verdict, score 0–10, aiSummary)
  └── files: FileChange[]
       └── hunks: Hunk[]
            ├── lines: DiffLine[]        # type: 'context' | 'add' | 'delete'
            ├── comments: InlineComment[]  # привязка к line + side ('old' | 'new')
            ├── contextLinesBefore: DiffLine[]
            └── contextLinesAfter: DiffLine[]
```

- `DiffLine` — одна строка с `oldNumber?`/`newNumber?` и `content`.
- `InlineComment` — комментарий ревьюера, привязанный к `line` + `side`; опционально `severity: 'critical' | 'warning' | 'info'`, `suggestion` (предлагаемая замена строки) и `isAI` (замечание AI-ревьюера).
- `Hunk` — диапазон изменений с раскрывающимся контекстом до/после.
- `reviewStatus` — `'completed' | 'in_progress'`; `verdict` — `'approve' | 'changes_requested' | 'comment'`.

## State management

Разделение: **серверный стейт → TanStack Query**, **UI-стейт → Zustand**.

### TanStack Query (server state)

| Query key             | Источник                                        | Возвращает        |
| --------------------- | ----------------------------------------------- | ----------------- |
| `['merge-request']`   | `entities/diff/api/getMergeRequest`             | `MergeRequest`    |
| `['review-comments']` | `entities/review-comment/api/getReviewComments` | `ReviewComment[]` |

`QueryProvider` (`app/providers/query-provider/QueryProvider.tsx`): `staleTime` 5 мин, `retry` 1, `refetchOnWindowFocus: false`.

### Zustand (UI state)

| Store                    | Файл                                                   | Состояние                                                                                                    |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `useReviewCommentsStore` | `entities/review-comment/model/reviewCommentsStore.ts` | `filter: 'all' \| 'unresolved' \| 'resolved'` (persisted)                                                    |
| `useDiffUiStore`         | `entities/diff/model/diffUiStore.ts`                   | `expandedHunks: Record<string, boolean>`, `selectedFileId: string \| null`, `viewMode: 'unified' \| 'split'` |

Мок состояния приложения (UI-state seed):

```ts
useDiffUiStore.getState() ===
  {
    expandedHunks: {}, // хунки свёрнуты по умолчанию
    selectedFileId: null, // авто-выбор первого файла на странице
    viewMode: 'unified', // режим диффа по умолчанию
  }
```

### Подсветка синтаксиса (Shiki)

`ShikiProvider` (`shared/lib/shiki/ShikiProvider.tsx`) инициализирует один `Highlighter` на всё приложение с темами `github-light`/`github-dark` и языками `typescript`, `javascript`, `json`, `bash`. Хук `useShiki()` возвращает `{ highlighter, ready, shikiTheme }`; `shikiTheme` следует за `ThemeProvider`. `Code` и хук `entities/diff/lib/useLineTokens` (его используют `DiffLine`, `DiffLinePair`, `DiffSuggestion`) токенизируют строку через `highlighter.codeToTokensBase`.

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

| Компонент           | Слой                         | Назначение                                                                                           |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Code`              | `shared/ui`                  | блок кода с подсветкой Shiki и номерами строк                                                        |
| `DiffLine`          | `entities/diff/ui`           | строка дифа (unified): gutter (old/new номера), знак +/−, цвет по типу, токены                       |
| `DiffLinePair`      | `entities/diff/ui`           | строка-пара old/new для side-by-side + комментарии полной шириной                                    |
| `DiffHunk`          | `entities/diff/ui`           | заголовок хунка `@@ -a,b +c,d @@` + строки (unified/split) + inline-комментарии + expandable context |
| `DiffSuggestion`    | `entities/diff/ui`           | мини-диф «− текущая / + предлагаемая» для suggestion-блока AI-замечания                              |
| `ExpandableContext` | `entities/diff/ui`           | сворачиваемый контекст до/после хунка (toggle через `diffUiStore`)                                   |
| `InlineComment`     | `entities/diff/ui`           | карточка комментария под строкой: severity, пометка AI, сворачивание, suggestion                     |
| `LineTokens`        | `entities/diff/ui`           | подсвеченные Shiki-токены одной строки (общий рендер для дифа и suggestion)                          |
| `SeverityBadge`     | `entities/diff/ui`           | бейдж серьёзности: Критично / Предупреждение / Инфо                                                  |
| `DiffViewer`        | `widgets/diff-viewer`        | сборка `DiffHunk[]` для `FileChange` + счётчики +/−, читает `viewMode` из стора                      |
| `MergeRequestMeta`  | `widgets/merge-request-meta` | мета-карточка MR: автор, ветки, статус ревью, вердикт, скор, сводка AI, счётчики severity            |
| `MergeRequestPage`  | `pages/merge-request`        | мета-карточка + выбор файла + переключатель unified/split + `DiffViewer` + загрузка/ошибки           |
