# System Design: AI Code Reviewer

| Поле | Значение |
|---|---|
| Проект | DMC-268 UI, команда 5 |
| Статус | Черновик для командного утверждения; решения и стартовые SLO требуют валидации |
| Область | MVP: веб-интерфейс, API, асинхронный анализ изменений, GitHub/GitLab и LLM gateway |
| Источник требований | [`../main.md`](../main.md); продуктовые параметры, не определённые в задании, перечислены в разделе «Нерешённые вопросы» |

## Краткое резюме

Строим AI-ревьюера для Pull Request и Merge Request. Backend принимает подписанные события и команды UI, сохраняет проверку в PostgreSQL и передаёт задачу в RabbitMQ через outbox. Worker получает diff и ограниченный контекст, вызывает LLM через gateway, валидирует ответ и сохраняет findings. Отдельный worker публикует только одобренные результаты в GitHub или GitLab с идемпотентностью и ограничением скорости.

Web UI остаётся клиентом backend API: он показывает список review, diff, findings и статус публикации, но не вызывает VCS напрямую. Для MVP выбираем RabbitMQ с собственным consumer, Ollama с явно заданным контекстом и публикацию `draft_only` по умолчанию. Большой diff обрабатывается ограниченным числом параллельных частей в общем бюджете времени; детали приведены в разделе 12.

Ключевые решения, которые ещё требуют владельца и срока, собраны в разделе «Нерешённые вопросы». Термины вынесены в глоссарий, а подробные JSON-контракты -- в приложение.

## 1. Цель и границы

Система принимает событие о Pull Request / Merge Request или запрос на проверку diff, получает изменения по неизменяемым SHA, собирает ограниченный контекст, запускает анализ через LLM, валидирует замечания и показывает их в веб-интерфейсе. Публикация в VCS выполняется отдельным адаптером и подчиняется политике репозитория.

Основной принцип: LLM предлагает кандидатов на замечания, но не является источником истины. Backend проверяет структуру ответа, существование файла и координаты в diff, выполняет дедупликацию и только после этого сохраняет и/или публикует результат.

Триггеры нормализуются в общий контракт: автоматический запуск при открытии/обновлении PR/MR, ручной запуск из Web UI/API, platform quick action/slash command, mention и ответ в review thread. Последний тип создаёт follow-up к исходному review, а не новую независимую проверку. Набор включённых триггеров задаётся политикой installation/repository и возможностями VCS adapter; детали команд GitLab/GitHub не входят в доменную модель.

Вне MVP, пока команда не согласовала обратное: обучение собственной foundation model, индексирование всего репозитория, полноценный IDE-плагин, гарантии точности модели и автоматическое блокирование merge по результату LLM.

## 2. Архитектура

### C4 Level 1: System Context

```mermaid
flowchart LR
  Dev[Разработчик и ревьюер]
  Admin[Администратор tenant]
  System[AI Code Reviewer]
  VCS[GitHub или GitLab]
  Ollama[Локальный Ollama]

  Dev -->|запускает review, просматривает diff и findings| System
  Admin -->|настраивает installation, policy и доступы| System
  VCS -->|webhook: PR/MR и комментарии| System
  System -->|читает изменения, публикует review| VCS
  System -->|ограниченный контекст и запрос анализа| Ollama
```

### C4 Level 2: контейнеры

```mermaid
flowchart LR
    Dev[Разработчик]
    VCS[GitHub или GitLab]
    UI[Web UI<br/>React + TypeScript]
    API[Backend API<br/>FastAPI]
    DB[(PostgreSQL<br/>состояние и аудит)]
    Outbox[Outbox publisher]
    MQ[[RabbitMQ<br/>review + publish jobs]]
    Worker[Workers<br/>review + publication handlers<br/>LLM Gateway library]
    Cache[(Опциональный Redis<br/>кэш / rate limits)]
    LLM[Одобренный LLM provider<br/>Ollama для локального пути MVP]

    Dev -->|просмотр, запуск, решение по finding| UI
    UI -->|HTTPS: API| API
    VCS -->|подписанный webhook| API
    API -->|записи, транзакции, outbox| DB
    DB -->|читает неподтверждённый outbox| Outbox
    Outbox -->|версионированная задача| MQ
    MQ -->|at-least-once доставка| Worker
    Worker -->|чтение/запись статуса и результата| DB
    Worker -.->|опциональный cache-aside| Cache
    Worker -->|gateway contract; ограниченный запрос без VCS-секретов| LLM
    Worker -->|готовые результаты через адаптер| VCS
```

Backend API и consumers могут быть одним Python-пакетом и разными процессами/контейнерами. Review и publication handlers масштабируются независимо; публикация получает отдельные queue messages и не блокирует завершение анализа. Web UI не обращается напрямую к VCS, очереди или LLM.

### Компоненты backend

```mermaid
flowchart TB
    subgraph Backend[Backend: FastAPI и worker]
      Webhooks[Webhook/API adapters]
      App[Application services<br/>Review lifecycle and orchestration]
      VCSPorts[VCS ports<br/>GitHub / GitLab]
      Builder[Context Builder]
      LLMPort[LLM Gateway port]
      Validator[Finding validator<br/>coordinates + schema + dedupe]
      Repos[Repositories]
      Publisher[Outbox / queue publisher]
    end
    Webhooks --> App
    App --> VCSPorts
    App --> Repos
    App --> Publisher
    App --> Builder
    Builder --> VCSPorts
    App --> LLMPort
    LLMPort --> App
    App --> Validator
    Validator --> Repos
    App --> VCSPorts
```

| Компонент | Ответственность | Не отвечает за |
|---|---|---|
| Web UI | Просмотр MR/diff/findings, фильтры, статусы, запуск/повтор проверки, решение пользователя | Секреты провайдеров, непосредственные API вызовы VCS/LLM, оркестрацию фоновых задач |
| Backend API | Авторизация, webhook, команды UI, чтение состояния, запись переходов и outbox | Длительное ожидание LLM в HTTP-запросе |
| VCS adapter | Нормализация событий и API GitHub/GitLab; получение diff/файлов; публикация статуса и комментариев | Бизнес-правила review и LLM prompt |
| Context Builder | Фильтрация, разбиение на части, сбор четырёх уровней контекста и учёт бюджета | Решение о публикации результата |
| Review worker | Получение задачи, оркестрация сборки/анализа/валидации, повторы и сохранение статусов | Владение долговечным состоянием вне PostgreSQL |
| LLM Gateway | Провайдер-независимый контракт, лимиты, timeout, метаданные модели и политики обработки данных | Хранение VCS credential или принятие непроверенного вывода как истины |
| PostgreSQL | Источник истины для установок, проверок, findings, попыток, публикаций и аудита | Транспорт очереди |
| RabbitMQ | Буферизация и доставка асинхронных задач | Единственное долговечное бизнес-состояние |

## 3. Поток данных

### Упрощённый поток

```mermaid
flowchart LR
  A[PR/MR или запуск из UI] --> B[Backend сохраняет review]
  B --> C[Очередь и worker]
  C --> D[Diff и контекст]
  D --> E[LLM анализ]
  E --> F[Проверка findings]
  F --> G[UI: draft findings]
  G --> H[Одобренная публикация в VCS]
```

Ниже приведена подробная последовательность с транзакциями, очередью и обработкой повторов.

```mermaid
sequenceDiagram
    autonumber
    participant VCS as GitHub/GitLab
    participant API as Backend API
    participant DB as PostgreSQL
    participant O as Outbox publisher
    participant Q as RabbitMQ
    participant W as Review worker
    participant P as Publication worker
    participant C as Context Builder
    participant L as LLM Gateway
    participant UI as Web UI

    VCS->>API: Webhook (signature, delivery ID, MR/PR, head SHA)
    API->>API: Проверить подпись, installation и событие
    API->>DB: Транзакция: dedupe delivery, создать ReviewJob + Outbox
    API-->>VCS: 2xx после durable commit
    O->>DB: Читает неподтверждённый outbox
    O->>Q: Отправляет ReviewRequested.v1
    Q->>W: Доставка задачи (at-least-once)
    W->>DB: Claim job / записать попытку
    W->>C: Собрать diff и ограниченный контекст для base/head SHA
    C->>VCS: Получить diff и разрешённые файлы по SHA
    C-->>W: ContextBundle + budget metadata
    W->>L: Анализ ограниченных частей
    L-->>W: Структурированный список кандидатов
    W->>W: Проверить schema, commit, путь, координаты, дубли
    W->>DB: Сохранить findings; завершить review job
    alt Policy разрешает auto-publish
      W->>DB: Создать PublicationOperation + outbox
    else draft_only
      W->>DB: Отметить findings как ready_for_review
      opt Пользователь позже одобряет выбранные findings
        UI->>API: Одобрить публикацию выбранных findings
        API->>DB: Проверить права; создать PublicationOperation + outbox
      end
    end
    opt PublicationOperation создана
      O->>DB: Читает PublicationOperation outbox
      O->>Q: Отправляет PublishArtifact.v1
      Q->>P: Доставка publication operation
      P->>DB: Захватить operation (lease/CAS)
      P->>VCS: Найти публикацию с тем же marker
      alt Объект уже существует
        VCS-->>P: Существующий provider object ID
      else Объект не найден после reconciliation
        P->>VCS: Создать артефакт с тем же стабильным marker
        VCS-->>P: Provider object ID или неоднозначный timeout
      end
      P->>DB: Сохранить receipt либо отметить outcome unknown
    end
    UI->>API: Получить статус / findings
    API->>DB: Чтение актуального состояния
    DB-->>API: Job + findings
    API-->>UI: API response
```

Для on-demand запуска UI вызывает API; после авторизации путь присоединяется к созданию ReviewJob + Outbox. HTTP возвращает `202 Accepted` с `review_id`, не ожидая ответа модели. Обновление UI выполняется опросом статуса; streaming/SSE можно добавить отдельно, если polling окажется недостаточен.

## 4. Жизненный цикл проверки и хранение

Предлагаемые состояния ReviewJob: `queued -> collecting_context -> analyzing -> validating -> completed`. Терминальные состояния: `failed`, `cancelled`, `stale`. ReviewJob завершается независимо от публикации. Агрегатный `PublicationStatus`: `not_requested` (draft-only до approval), `pending`, `publishing`, `published`, `unknown`, `needs_manual_reconciliation` или `failed`. В draft-only findings остаются `ready_for_review`, а PublicationOperation не создаётся до явного approval; lifecycle конкретной операции начинается с `pending`. UI показывает статус review и публикации отдельно. Повторная доставка сообщения не должна создавать новую проверку.

Основные сущности:

- `Tenant`: изолированная организация, её policy и retention settings. Все записи review, cache namespace и installation принадлежат одному tenant.
- `User`: пользователь tenant с внешним identity subject; доступ проверяется для каждого API-запроса.
- `RoleBinding`: роль `tenant_admin`, `reviewer` или `viewer` на tenant/repository с явным набором разрешений.
- `Installation`: провайдер, внешний installation/project ID, зашифрованная ссылка на секрет, разрешённые репозитории.
- `Review`: provider, repository, PR/MR ID, base SHA, head SHA, инициатор, policy snapshot, статус и временные метки.
- `ReviewJob`: review ID, `kind` (`full`/`follow_up`), idempotency key, состояние, номер попытки, lease/heartbeat, последняя ошибка; follow-up дополнительно хранит `parent_review_id` и source comment/thread ID.
- `ContextManifest`: версия политики контекста, использованные уровни, исключённые/усечённые файлы, оценки размера; по умолчанию без полного текста файлов.
- `Finding`: стабильный fingerprint, путь, сторона/диапазон строк, severity, category, сообщение, предложение, confidence, статус.
- `PublicationOperation`: уникальный `idempotency_key`, тип артефакта, review/head SHA, fingerprint или summary version, provider marker, состояние, lease, request hash, provider object ID и временные метки. Попытки/ответы аудируются отдельно; одна логическая операция сохраняет один ключ между повторами.
- `OutboxEvent`: сериализованное событие для доставки в RabbitMQ и статус отправки.

Состояние модели фиксируется в review: `provider`, `model`, `prompt_version`, `schema_version`; секреты и полный prompt в обычные логи не записываются.

## 5. VCS: взаимодействие и контракты

1. Поддерживать GitHub и GitLab за единым внутренним контрактом `VCSAdapter`; платформенные имена событий, quick actions, форматы координат и синтаксис suggestion не протекают в UI или доменные сервисы.
2. Нормализовать открытие/обновление PR/MR, UI/API запуск, команды, mentions и ответы в review thread в типизированные события. До проверки подписи backend находит installation по provider installation ID, repository ID или webhook endpoint configuration, затем извлекает только её secret. Неизвестный repository или неверная подпись получают `401/404` без создания review.
3. Дедуплицировать webhook по provider + delivery ID, comment-trigger по provider comment ID, ручной запуск по idempotency key из repo, PR/MR, head SHA и request identity. Ответ в треде должен ссылаться на исходные review/finding/thread и проходить авторизацию автора.
4. Review привязан к неизменяемым `base_sha` и `head_sha`. Diff и содержимое файлов получать именно для них; перед публикацией сверять актуальный head. Если head изменился, пометить старую задачу `stale`, не публиковать её результат и, если включён automatic-update trigger, создать/дедуплицировать новый ReviewJob для нового SHA. Завершить старую задачу как stale без обработки нового события недостаточно.
5. Внутреннее finding хранит `path`, `old_line?`, `new_line?`, диапазон, сторону и SHA. Adapter преобразует их в GitHub diff position / GitLab discussion position; mapping покрывается контрактными тестами. Нельзя подменять diff position абсолютным номером строки.
6. Публикация выполняется отдельными durable-операциями для summary, каждой inline discussion и статуса проверки. Частичный успех не повторяет уже подтверждённые артефакты; детали протокола — ниже. Finding может включать структурированное предложение `{replacement, start_line, end_line}`; VCS adapter проверяет диапазон и форматирует предложение средствами платформы, а при несовместимости публикует обычный комментарий без предложения.
7. Токены VCS минимально привилегированы и остаются на сервере. LLM получает код и метаданные, но не VCS credential, webhook secret или пользовательский access token.
8. Автопубликация настраивается per repository. Предложение до утверждения политики: режим по умолчанию `draft_only`; findings остаются `ready_for_review`, PublicationOperation не создаётся до явного одобрения пользователем. Автоматическая публикация включается только явно после проверки качества/прав доступа.
9. Ответ в review thread создаёт ограниченный follow-up, связанный с исходным review и finding. В контекст включаются только доступные пользователю сообщения этой ветки и относящиеся к ним findings; весь MR conversation не загружается по умолчанию. Follow-up не запускает повторную полную проверку, если пользователь явно этого не запросил.

Поток follow-up: VCS comment/reply event проходит ту же проверку подписи, dedupe и авторизации; adapter нормализует его в `ReviewRequested.v1` с `kind=follow_up`, backend сохраняет ссылку на исходный review/thread и outbox event, worker получает разрешённый snapshot ветки и отправляет его через тот же Context Builder/LLM Gateway. Исходный текст рассматривается как недоверенные инструкции. Полный текст треда не сохраняется дольше установленной retention policy.

### Идемпотентная публикация

Exactly-once между PostgreSQL и внешним VCS API недостижима без общей транзакции или гарантированной idempotency key поддержки со стороны провайдера. Система обеспечивает effectively-once только при успешной reconciliation; неоднозначный результат никогда не повторяется вслепую.

1. Перед сетевым вызовом транзакционно создать `PublicationOperation` и outbox-событие `PublishArtifact.v1`. На `(provider, installation_id, repository_id, idempotency_key)` действует unique constraint; конкурентные/повторные события получают ту же операцию.
2. Стабильный ключ вычислять из канонического набора: provider, installation, repository, PR/MR, head SHA, тип артефакта и finding fingerprint. Для summary/status использовать стабильный artifact key и версию содержимого. Номер попытки и время запроса в ключ не включать. У каждого inline finding свой ключ.
3. Worker захватывает операцию через lease/CAS и перед create сначала выполняет provider-specific reconciliation по marker. Marker должен сохраняться и находиться через API конкретной платформы; adapter contract tests обязаны проверить round-trip. Если API не даёт надёжно искать marker, это ограничение фиксируется для провайдера и автоматический retry после ambiguous outcome запрещён.
4. При создании передавать тот же marker для каждого retry. Хранить request hash и внешний object ID. Найденный объект привязать к операции и перевести её в `published`; успешный повтор не создаёт новый комментарий.
5. Таймаут, обрыв соединения после отправки или падение worker до сохранения provider object ID переводят операцию в `unknown`, а не в обычный retryable failure. После lease expiry первым действием всегда остаётся reconciliation. Если объект найден — фиксировать его ID и успех; если отсутствие подтверждено с учётом окна видимости API — повторять создание с тем же marker.
6. Если отсутствие объекта нельзя доказать (например, API не поддерживает поиск marker или результат остаётся неоднозначным), переводить операцию в `needs_manual_reconciliation`, поднимать alert и не создавать новый артефакт автоматически. UI/API должны показывать частичный результат и статус публикации.
7. Повторять автоматически только ошибки, для которых adapter может доказать, что провайдер не принял создание (например, rate limit до обработки с `Retry-After`). 5xx/сетевые ошибки считать ambiguous, если контракт провайдера не гарантирует отсутствие side effect. Постоянные 4xx отправлять в terminal failure с причиной.
8. Перед отправкой и перед reconciliation проверять актуальность head SHA и право установки. Stale operation не публиковать; новый head получает новые operation keys. Summary, inline discussions и check/status имеют независимые состояния, поэтому повтор после частичного успеха затрагивает только незавершённые операции.

## 6. Очередь задач

### Рекомендация

Для первого надёжного контура использовать RabbitMQ как транспорт, PostgreSQL как источник истины и небольшой adapter очереди в backend. Прямой consumer достаточен для MVP. Не запускать Redis Streams как вторую очередь параллельно RabbitMQ без отдельной причины и модели восстановления.

| Вариант | Плюсы | Ограничения | Решение MVP |
|---|---|---|---|
| RabbitMQ + свой consumer | Прозрачные ack, prefetch, DLQ и схема сообщений; lifecycle/lease остаются в доменном коде | Нужно явно реализовать retry, tracing и worker bootstrap | Выбран: меньше скрытых retry и проще доказать идемпотентность |
| Celery + RabbitMQ | Готовые task/retry primitives и Python-экосистема | Семантика retry и result backend может скрыть доменные переходы; всё равно нужен outbox и PostgreSQL lease/CAS | Не выбран для MVP; допустим позже при сохранении текущих message contracts |

### Сообщение `ReviewRequested.v1`

Сообщение содержит ссылки и версии, а не исходный код или секреты. Полный пример приведён в приложении A.1.

- Delivery semantics: at-least-once; обработчик обязан быть идемпотентным.
- Создание job и outbox выполняется в одной DB-транзакции; отдельный publisher отправляет неподтверждённые outbox события. Это закрывает окно потери между commit PostgreSQL и publish в брокер.
- Consumer подтверждает сообщение после сохранения результата/терминального перехода. На временной ошибке — ограниченный retry с exponential backoff + jitter; после лимита — DLQ с alert и возможностью контролируемого replay.
- Ошибка схемы/неподдерживаемый event version не должна бесконечно повторяться: quarantine/DLQ и диагностика.
- Ограничить prefetch/число параллельных вызовов по лимитам VCS и LLM. Heartbeat/lease позволяет обнаружить зависший worker; повтор не создаёт второго активного job для того же idempotency key.
- Запрещено помещать исходный код, prompt, токены или PII в заголовки/логи сообщений.

### Сообщение `PublishArtifact.v1`

Сообщение содержит ссылку на уже сохранённую операцию, а не тело комментария или секреты. `operation_id` и `idempotency_key` указывают на одну и ту же логическую публикацию при всех повторных доставках; полный пример приведён в приложении A.2.

## 7. Стратегия кэширования контекста

Начать с cache-aside и выключаемого Redis-адаптера. Кэш — оптимизация, не источник истины. На первом этапе разрешить кэшировать результаты получения immutable diff/file content только при подтверждённых правах и политике хранения. Не кэшировать ответы LLM без измеримой выгоды и стратегии инвалидирования.

Кэшировать отдельные immutable-объекты, а не готовый prompt. Это позволяет повторно использовать содержимое одного blob в разных PR и не сбрасывать его после изменения описания MR.

| Namespace | Ключ | Данные |
|---|---|---|
| `diff` | `provider | repository_id | base_sha | head_sha | diff_format_version` | нормализованный diff и manifest неполноты |
| `file` | `provider | repository_id | blob_sha | redaction_policy_version` | текст одного разрешённого файла |
| `ast` | `provider | repository_id | blob_sha | parser_version | grammar_version` | symbols, imports и parse diagnostics |
| `review-feedback` | `tenant_id | review_id | feedback_snapshot_id` | краткий snapshot существующих комментариев |

`ReviewIntent`, правила проекта и feedback добавляются при сборке `ContextBundle`, но не входят в ключи `diff`, `file` или `ast`.

Правила:

- Разделять namespace между tenant/installation; проверять разрешения до cache hit, чтобы кэш не обходил авторизацию.
- Изменение SHA, blob SHA, parser/redaction version формирует новый ключ immutable-объекта; явная инвалидизация при новом commit не нужна. Изменение MR metadata, правил или feedback меняет только новый ContextBundle.
- Хранить только необходимое, шифровать в покое и ограничивать TTL. Стартовое предложение для временного кэша контента: максимум 24 часа; значение требует одобрения retention-политики.
- Поддержать удаление по tenant/repository и запрет кэширования для репозиториев с более строгой политикой.
- Redis, если включён, используется для короткоживущих кэш-записей, rate limits и distributed locks с TTL. Очередь остаётся RabbitMQ. При недоступности кэша система продолжает работу с деградацией производительности.
- До утверждения требований к размещению/удалению данных не сохранять целые файлы в постоянном хранилище и не отправлять их неутверждённому hosted LLM.

## 8. Context Builder: четыре уровня

Контракт верхнего уровня `ContextBundle` версионируется и включает `review_id`, provider/repository/MR IDs, base/head SHA, язык, режим redaction, лимит токенов, список chunks, manifest и `feedback_snapshot_id`. Отдельный `ReviewIntent` содержит title, description, labels и выбранные commit messages; `ProjectRules` — нормализованные правила и digest/version; `ExistingFeedback` — ограниченный snapshot релевантных review comments/discussions с provider IDs, путями, line ranges и состоянием. `review_metadata_digest` и `feedback_snapshot_id` меняются при обновлении title/description/labels/commit messages или доступных комментариев, даже если head SHA не изменился. Метаданные и feedback передаются как недоверенные данные, не как системные инструкции. Каждый элемент контекста содержит источник, путь, диапазон строк, SHA содержимого, encoding/language и число оценочных токенов. Контент передаётся модели только после проверки прав, фильтрации секретов/исключённых путей и бюджета.

| Уровень | Данные | Когда включать |
|---|---|---|
| 1. Diff | Для каждого файла: `path`, `change_type`, `base_sha`, `head_sha`, unified hunks, context/add/delete строки с `old_line`/`new_line`, изменённые диапазоны, язык. Исключать бинарные/сгенерированные файлы и пути из нормализованных repository ignore rules | Всегда; основной предмет ревью |
| 2. Surrounding | Ограниченные окна до/после изменённых диапазонов из head-файла, при необходимости base-версии для удалённых строк; точные start/end lines, связь с hunk, причина включения. Добавлять содержащую функцию/класс, если парсер определил её и бюджет позволяет | Начальное окно: 30 строк с каждой стороны; адаптивно расширять до 100 строк или до границ содержащего symbol, только в пределах бюджета |
| 3. Whole File | Полное содержимое небольшого изменённого текстового файла head-версии с номерами строк и маской изменённых диапазонов; для удаления — base-версия с явным указанием стороны | Не более 400 строк и 24kB после redaction; иначе использовать Surrounding |
| 4. AST / Imports | Изменённые symbol IDs/имена, kind, signature, диапазон определения; import edges и ограниченные определения непосредственно используемых символов; язык/версия parser/грамматики и confidence | Не более одного import hop от изменённого symbol и до 10 определений; только если локальные уровни не объясняют тип/контракт. Tree-sitter даёт синтаксическую структуру, но не заменяет type checker/семантический индекс |

Сборщик работает в порядке `Diff -> Surrounding -> Whole File -> AST/Imports`, но решение об уровнях зависит от бюджета и достаточности локального контекста. В MVP предпочтительны выборочные импорты/определения, а не индекс всего репозитория. Ignore rules нормализуются из платформенной конфигурации и правил репозитория (например, `.gitlab/duo-ignore` только как вход адаптера, а не внутренний формат); конфликт правил разрешается по явно заданной precedence и отражается в manifest. Все части сохраняют происхождение и координаты; нельзя смешивать строки base/head без явного `side`. Для большого diff разбивать по файлам и hunks, приоритизировать исходный код над generated/docs/config, однако не терять неизменённые файлы молча: записывать причину skip/truncation в manifest.

### Структуры одного элемента

Полный пример `ContextBundle` вынесен в приложение A.3. Он иллюстрирует форму данных, а не окончательный публичный API. Реальный `ContextBundle` должен использовать строгую schema validation и не включать отсутствующие уровни как пустые строки.

## 9. LLM Gateway и проверка результата

Перед вызовом gateway backend проверяет права installation/repository, выбранную модель и data policy. Провайдерный контракт описывает фактические retention/training capabilities; ZDR нельзя считать обеспеченным только наличием request flag. Если требуемая политика не подтверждена провайдером, запрос не отправляется.

LLM Gateway -- библиотека внутри backend/worker package, а не отдельный deployable-сервис MVP. Она принимает версионированный запрос с `review_id`, `chunk_id`, prompt version, ограниченным ContextBundle и лимитами. Prompt assembly включает diff positions, ReviewIntent и разрешённые ProjectRules, но явно маркирует их как недоверенные данные. Анализ фокусируется на security, correctness, performance и maintainability; style-only findings подавляются, если репозиторий делегирует их линтеру. Эти категории -- политика анализа, не гарантия обнаружения всех дефектов.

Локальная конфигурация MVP фиксируется как `qwen2.5-coder:14b` в Ollama, `num_ctx=32768`, `num_predict=4096`, `temperature=0.1`. Перед rollout image digest загруженной модели фиксируется в deployment configuration. Backend передаёт `num_ctx` в каждом запросе и на startup сверяет tag и digest. Если хост не вмещает эту модель или контекст, review не деградирует молча: установка помечается unavailable, а оператор выбирает подтверждённую меньшую конфигурацию и пересчитывает лимиты раздела 12.

Ответ модели парсится по JSON schema, содержащей список findings. Минимальные поля finding: `path`, `side`, `start_line`, `end_line`, `severity`, `category`, `title`, `body`; `suggestion` (`replacement` + целевой диапазон) и `confidence` опциональны. Для каждого finding требуется короткое evidence/reasoning, grounded в переданном контексте; confidence не используется как доказательство корректности.

Перед записью/публикацией validator проверяет:

- schema и допустимые enum значения;
- что путь есть в проверяемом изменении, диапазон существует в base/head snapshot и comment привязан к допустимой стороне diff;
- что finding относится к изменённой строке, если политика публикации требует inline-комментарий;
- лимит длины, отсутствие секретов в сообщении, дубли по нормализованному fingerprint и уже существующим комментариям;
- что head SHA всё ещё актуален перед отправкой в VCS.

Ошибки schema/координат отбрасываются или переводятся в диагностическое состояние; они не исправляются догадкой. LLM timeout/retry ограничены, prompt не содержит credential. Результаты имеют происхождение модели и prompt version. Начальный режим публикации предлагается `draft_only`; порог автопубликации и возможность блокировать merge требуют отдельного решения.

## 10. Frontend и API

Frontend (React + TypeScript) отвечает за рабочее место ревьюера: список файлов/hunks, стабильные old/new line numbers, inline findings/comments, фильтры severity/category/status и состояния loading/empty/error/partial. UI state и server state разделяются; API-клиент не знает платформенные детали GitHub/GitLab.

Предлагаемые backend endpoints:

- `POST /api/v1/reviews` — запросить проверку, требует auth/idempotency key, возвращает `202` + `review_id`.
- `GET /api/v1/repositories/{repository_id}/reviews?pull_request_id=` — список review конкретного PR/MR с пагинацией.
- `GET /api/v1/reviews/{review_id}` — состояние и прогресс.
- `GET /api/v1/reviews/{review_id}/diff` — нормализованный diff, список файлов и manifest усечённых/недоступных частей; UI получает его только из backend.
- `GET /api/v1/reviews/{review_id}/findings` — проверенные findings с фильтрами/пагинацией.
- `PATCH /api/v1/findings/{finding_id}` — пользовательское решение (accepted, dismissed, resolved), с автором и аудитом.
- `POST /api/v1/reviews/{review_id}/publish` — явное одобрение публикации выбранных findings в draft-only режиме; проверяет repository permissions/policy и транзакционно создаёт PublicationOperation + outbox, возвращает operation IDs и publication statuses.
- `POST /api/v1/reviews/{review_id}/retry` — повтор для актуального head SHA с авторизацией и rate limit.
- `POST /api/v1/reviews/{review_id}/cancel` — переводит только незавершённую проверку в `cancelled`, отзывает lease и помечает уже доставленные сообщения no-op; опубликованные артефакты не удаляет.
- `POST /api/v1/reviews/{review_id}/follow-ups` — (если включён диалоговый режим) продолжение по разрешённому thread/finding context; не заменяет отдельный endpoint полного rerun.
- `POST /api/v1/webhooks/{provider}` — webhook endpoint с provider-specific signature verification.

Схемы API версионируются; ошибки стабильны (`code`, `message`, `trace_id`). Пользователь видит частичный результат и статус задачи; повторная отправка запроса не должна создавать дубликат review. Текущий UI использует mock-функции в `entities/*/api`; при интеграции они заменяются HTTP-клиентом в `shared/api`, при этом TanStack Query keys и Zustand UI-state сохраняются. `GET /reviews/{id}/diff` заменяет mock merge request, а findings/status -- mock review comments.

## 11. Безопасность и приватность

- Backend хранит VCS credentials в secret manager/зашифрованном хранилище; минимальные scopes, rotation и аудит. Frontend получает только короткоживущую пользовательскую сессию.
- Проверять tenant/repository permissions на каждом API-запросе и до чтения кэша/результатов.
- Исходный код считается чувствительными данными. Передача в hosted LLM запрещена без явного одобрения провайдера/политики хранения; локальный Ollama не отменяет сетевые и access controls.
- TLS между компонентами, шифрование at rest, redaction secrets/PII, ограничение размера webhook/API, rate limits, защита от SSRF/подмены repository URL и вредоносных prompt-инструкций в коде.
- Код в diff рассматривается как недоверенный ввод, не как системные инструкции. Не исполнять предложенный код и не разрешать модели инструменты с доступом к shell/repo в MVP.
- Audit trail фиксирует инициатора, SHA, модель/prompt версии, переходы статуса, решение пользователя и публикацию без записи секретов или полного исходного кода.
- Retention/deletion и data residency должны быть согласованы до production.

## 12. Нефункциональные требования и стартовые лимиты

Числа ниже — **предлагаемые начальные цели для нагрузочной проверки**, не утверждённые SLA. Все лимиты конфигурируются; фактический максимум контекста ограничен меньшим из системного лимита и лимита выбранной модели.

| Метрика | Стартовая цель / лимит | Уточнение |
|---|---|---|
| Webhook acknowledgement | p95 <= 2 s после валидации и durable enqueue intent | Вебхук не ждёт LLM; очередь достигается через outbox |
| API чтения статуса/findings | p95 <= 500 ms при обычной нагрузке MVP | Требует измерения на staging |
| Context Builder | p95 <= 10 s для PR до 100 файлов и 5,000 изменённых строк | Исключая внешнюю задержку VCS; большие входы ограничиваются/разбиваются |
| Завершение review | p95 <= 120 s от durable enqueue до `completed`/`completed_partial` для PR до 500 изменённых строк; hard timeout 300 s | Queue age измеряется отдельно; SLO проверяется на staging с зафиксированной моделью и concurrency |
| Размер diff | Ingress: до 5 MiB patch. Анализ: до 1 MiB нормализованного patch, 100 файлов, 5,000 изменённых строк и 64k diff tokens | Ingress limit защищает API, но не обещает полный анализ. Превышение analysis limit даёт `completed_partial` с manifest либо `too_large`, если ни одна приоритетная часть не помещается |
| Prompt/context | По умолчанию <= 32k input tokens на LLM-вызов; output reserve <= 4k; жёсткий cap = min(32k, provider limit - output reserve) | Большая проверка разбивается на chunks; токены считаются tokenizer выбранной модели или консервативной оценкой |
| Chunking | До 2 частей для SLO-PR и до 4 частей для крупного review; до 16k diff tokens на часть | SLO-части запускаются одновременно; крупные части -- волнами с concurrency 2. Лишнее отражается в manifest |
| Retry | Одна повторная попытка на временную ошибку; 35 s на вызов для SLO-PR, 45 s для крупного review | Не повторять schema errors; retry допускается только пока остаётся общий deadline |
| VCS publication | Per installation/repository очередь: 1 запрос создания в секунду, burst 5; максимум 50 артефактов/review | Применяются provider headers и ограничения ниже; `429` или `Retry-After` приостанавливает key и переносит задачу |
| Восстановление | Повторная доставка безопасна; job/outbox переживают рестарт API/worker | Проверять fault-injection тестами |
| Доступность | Цель production пока не задана | Утвердить после выбора deployment и режима обслуживания |

Общий budget одного review: до 120 секунд для SLO-PR и до 300 секунд для крупного review. В него входят получение VCS-данных, сборка контекста, LLM и запись результатов; ожидание очереди измеряется отдельно. Для SLO-PR допускаются максимум две части, запускаемые одновременно: 15 секунд на VCS и Context Builder, 35 секунд на первый вызов LLM, 35 секунд на один retry только неуспевшей части и 35 секунд на валидацию/сохранение. Для крупного review допускаются четыре части двумя волнами по 45 секунд, а остаток 210 секунд резервируется для VCS, сборки, retry и записи. Если часть не завершилась к общему deadline, она отмечается `timed_out`; review возвращает частичный результат, а не продолжает работу после лимита.

Контекстный бюджет включает system/developer prompt; при 32k input tokens начальные ориентиры на один chunk: до 16k diff, 6k surrounding, 4k whole-file и 2k AST/import metadata, оставшееся -- метаданные и инструкции. Это верхние пределы, не квоты: Diff сохраняется приоритетом, расширенные уровни урезаются первыми. Diff больше 64k токенов, более 4 chunks или с нормализованным patch больше 1 MiB получает `completed_partial` с причиной для каждого пропуска; `too_large` возвращается, если нет ни одной анализируемой части. Предел 5 MiB остаётся ingress-защитой. VCS adapter записывает в manifest неполные file patches, которые некоторые GitHub/GitLab API возвращают для больших файлов; такие файлы не публикуются inline без полного подтверждённого диапазона.

| Provider | Внешнее ограничение | Политика adapter |
|---|---|---|
| GitHub | Для аутентифицированного REST API учитывать primary limit `5,000` requests/hour, secondary point limit и content-creation limit `80`/minute и `500`/hour; фактические значения читать из `x-ratelimit-*` и `retry-after` | Token bucket не превышает 1 create/s; при остатке primary quota <= 100 или любом secondary limit отложить key до reset/retry time |
| GitLab | Лимиты зависят от GitLab.com или self-managed instance; adapter читает `RateLimit-*`/`Retry-After`, а installation хранит утверждённые instance limits | До подтверждения instance policy действует 1 create/s; при отсутствии headers 429 считается обязательной паузой до retry time либо экспоненциального backoff |

Publication worker применяет token bucket к installation/repository, читает `Retry-After` и provider rate-limit headers, а 429 ставит в delayed queue до разрешённого времени. При 5xx/timeout действует reconciliation из раздела 5; при переполнении лимита 50 артефактов findings остаются в UI как draft, а итоговая summary сообщает о непубликованных результатах.

Обязательные метрики: webhook acceptance/invalid signatures, queue age/depth, job duration/status, context tokens по уровням, доля skip/truncation, VCS/LLM latency/errors/rate limits, schema/coordinate rejection, findings published/dismissed и стоимость на review. Логи структурированные с `trace_id`/`review_id`; исходный код и prompt body в логи не включаются.

## 13. Проверка качества

- Unit: diff parser, вычисление line mapping, фильтры путей, budget/chunking, fingerprint/dedup, state transitions.
- Contract: VCS event/API adapters, queue schema version, LLM JSON schema, GitHub/GitLab coordinates.
- Integration: PostgreSQL + RabbitMQ outbox/retry/DLQ, mock LLM, mock VCS; публикация проверяется при конкурентной доставке, падении до/после remote create, timeout после принятия запроса, задержанной видимости marker, частичном успехе и провайдере без надёжной reconciliation. Для ambiguous outcome тест подтверждает отсутствие слепого повторного create.
- E2E: webhook/on-demand -> review -> UI -> решение пользователя -> (если включено) публикация; сценарий stale head и duplicate delivery.
- LLM evaluation: versioned golden dataset, precision/recall по security/correctness/performance/maintainability, false-positive rate и координатная корректность; отдельно тестировать ignore rules, MR rules/metadata, существующие comments, suggestions и follow-up thread scope. Не считать self-review/judge без human-calibrated dataset доказательством true positive.
- Security: tenant isolation, webhook signature, secret redaction, authorization, prompt injection, retention/deletion.

## 14. Нерешённые вопросы

Все пункты ниже требуют решения до перехода соответствующей возможности в production. Владелец отвечает за фиксацию решения в policy/configuration, а не только за обсуждение.

| Вопрос | Владелец | Срок | Что блокирует |
|---|---|---|---|
| Формула `fingerprint`: какие нормализованные поля finding входят, как учитывать изменение диапазона/текста | Tech Lead + Backend Lead | 2026-10-30 | dedupe и idempotency key inline-публикации |
| Поведение findings при новом head SHA: закрывать, переносить или показывать как устаревшие | Product Owner + Tech Lead | 2026-11-06 | UX статуса stale и auto-publish |
| Debounce частых push и отмена активного review | Tech Lead | 2026-10-30 | защита от очереди устаревших review |
| Предотвращение trigger loop: bot comments не активируют mention/thread-reply | VCS Adapter owner | 2026-11-06 | безопасное включение диалога с ботом |
| Обязательные GitHub/GitLab adapters первого релиза | Product Owner | 2026-10-30 | план поставки и contract tests |
| Identity provider, роли и граница tenant/repository | Security Lead | 2026-11-06 | API authorization и tenant isolation |
| Retention, deletion, data residency и допустимые hosted LLM | Security/Legal owner | 2026-11-13 | выбор provider и cache TTL |
| Нагрузка, SLO, стоимость и производительность выбранного Ollama host | Platform Lead | 2026-11-13 | утверждение лимитов раздела 12 |
| Языки MVP, parser и точная глубина semantic index | Tech Lead | 2026-11-06 | AST/import level beyond Tree-sitter |
| Условия auto-publish и merge gate | Product Owner + Security Lead | 2026-11-20 | включение публикации вне `draft_only` |

До решения debounce действует стартовая политика: на `(tenant_id, provider, repository_id, pull_request_id)` существует один pending debounce record. Каждый новый push заменяет в нём `head_sha`, переносит `run_after` на 30 секунд и запрашивает cancellation предыдущего queued/collecting/analyzing job. Когда `run_after` наступает, publisher создаёт ровно один ReviewJob для последнего SHA; delivery с более старым SHA становится no-op. События от bot identity и comments с provider marker игнорируются как trigger. Это временная защита, не заменяющая решение владельца.

## 15. Глоссарий

| Термин | Значение |
|---|---|
| Outbox | Таблица событий, записываемая в одной транзакции с бизнес-состоянием и позже доставляемая publisher в брокер. |
| Lease/CAS | Временная аренда работы и compare-and-set переход состояния; не позволяет двум worker одновременно владеть одной операцией. |
| Reconciliation | Проверка внешнего VCS, был ли артефакт создан, прежде чем повторять сомнительный сетевой вызов. |
| DLQ | Dead-letter queue для сообщений, которые исчерпали допустимые попытки и требуют диагностики/replay. |
| Stale | Результат относится к неактуальному head SHA и не может быть опубликован. |
| Fingerprint | Стабильный идентификатор смысла finding; его формула пока является открытым решением. |

## 16. Критерии готовности системного дизайна

- [x] Описаны C4 Level 1 и контейнеры/компоненты, потоки данных и границы frontend/backend/LLM/VCS.
- [x] Определены рекомендуемая очередь, версия сообщения, retry/idempotency и стратегия кэширования.
- [x] Описаны payload-структуры для Diff, Surrounding, Whole File и AST/Imports.
- [x] Заданы стартовые проверяемые latency/context limits и отмечено, что они требуют валидации.
- [ ] Подтверждены GitHub renderer для Mermaid-диаграмм и Ollama model tag/`num_ctx` на целевом host.
- [ ] Команда подтвердила открытые решения и начальные SLO.
- [ ] Команда утвердила документ; до этого статус остаётся «Черновик для командного утверждения».

## Приложение A: примеры контрактов

### A.1 `ReviewRequested.v1`

```json
{
  "event_id": "uuid",
  "event_type": "ReviewRequested",
  "schema_version": 1,
  "occurred_at": "RFC3339 timestamp",
  "review_id": "uuid",
  "job_id": "uuid",
  "kind": "full | follow_up",
  "idempotency_key": "sha256 digest",
  "provider": "github | gitlab",
  "repository_id": "provider-scoped id",
  "pull_request_id": "provider-scoped id",
  "base_sha": "commit sha",
  "head_sha": "commit sha",
  "trigger": "automatic_open | automatic_update | manual_ui | quick_action | mention | thread_reply",
  "source_event_id": "provider webhook delivery ID or null",
  "source_comment_id": "provider comment ID or null",
  "source_thread_id": "provider thread ID or null",
  "parent_review_id": "uuid or null",
  "trace_id": "uuid"
}
```

### A.2 `PublishArtifact.v1`

```json
{
  "event_id": "uuid",
  "event_type": "PublishArtifact",
  "schema_version": 1,
  "operation_id": "uuid",
  "idempotency_key": "sha256 digest",
  "review_id": "uuid",
  "head_sha": "commit sha",
  "artifact_type": "summary | inline_finding | check_status",
  "trace_id": "uuid"
}
```

### A.3 `ContextBundle` fragment

```json
{
  "diff_file": {"path": "src/service.ts", "change_type": "modified", "base_sha": "...", "head_sha": "..."},
  "review_intent": {"title": "...", "description": "...", "labels": ["bug"], "metadata_digest": "..."},
  "project_rules": {"rules_version": "...", "rules_digest": "...", "ignore_patterns": ["generated/**"]},
  "existing_feedback": [{"provider_comment_id": "...", "path": "src/service.ts", "side": "head", "start_line": 11}],
  "surrounding_window": {"path": "src/service.ts", "side": "head", "start_line": 6, "end_line": 18},
  "whole_file": {"path": "src/service.ts", "side": "head", "content_sha256": "...", "changed_ranges": [[11, 11]]},
  "symbol_context": {"parser": "tree-sitter", "parser_version": "...", "symbols": ["..."], "imports": ["..."]}
}
```
