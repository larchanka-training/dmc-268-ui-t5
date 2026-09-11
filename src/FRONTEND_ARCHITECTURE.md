## Структура слоёв фронтенд-приложения
```text
src/
├── app/
│   ├── providers/
│   │   ├── query-provider/
│   │   └── router/
│   ├── styles/
│   └── App.tsx
│
├── pages/
│   └── merge-request/
│       └── ui/
│
├── widgets/
│   ├── diff-viewer/
│   ├── review-summary/
│   └── review-sidebar/
│
├── features/
│   ├── add-review-comment/
│   ├── reply-to-review/
│   ├── apply-suggestion/
│   ├── toggle-diff-context/
│   └── filter-review-comments/
│
├── entities/
│   ├── merge-request/
│   ├── diff/
│   ├── review-comment/
│   └── review/
│
└── shared/
    ├── api/
    ├── ui/
    ├── lib/
    ├── config/
    └── types/
```

## UI Kit
```text
shared/ui/
├── button/
├── badge/
├── tooltip/
├── collapsible/
├── scroll-area/
├── skeleton/
└── code/
```
