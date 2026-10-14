# Инструкция по релизу и деплою: dmc-268-ui-t5

Документ описывает цикл сборки, доставки и независимого обновления интерфейса пользователя.

---

## 1. Архитектура и принципы

- **Полная изоляция**: Выпуск релиза UI затрагивает исключительно контейнер `dmc-ui`. Работа API-сервиса не прерывается.
- **Секреты**: UI-контейнеру секреты не нужны (статика за nginx). `GITHUB_TOKEN` для pull образа передается в ssh-сессию через `envs:` ssh-action (в текст скрипта не подставляется), после `docker pull` выполняется `docker logout ghcr.io`.
- **Сеть и доступ**: Контейнер подключается к сети `dmc-net`, порт наружу не публикуется. Снаружи UI доступен только через Caddy (`dmc-caddy`, порты 80/443, TLS), который поднимает Terraform из репозитория API (`terraform/`).
- **API**: UI и API живут на одном origin. Caddy проксирует `/api/*` в API и снимает префикс. Базовый адрес API в коде: `API_URL` из `src/shared/config/api.ts` (`VITE_API_URL`, по умолчанию `/api`, задается build-arg в `Dockerfile`). Локально `pnpm dev` проксирует `/api` на `http://localhost:8000`.

---

## 2. Секреты в GitHub Actions

В разделе **Settings -> Secrets and variables -> Actions**:

| Название секрета | Назначение |
| :--- | :--- |
| `VPS_DMC268_IP_T5` (Variable, не Secret) | IP-адрес сервера Hetzner |
| `VPS_DMC268_U` | SSH-пользователь |
| `VPS_DMC268_P` | Пароль пользователя SSH |

Необязательная переменная `APP_DOMAIN` (**Variable**) — та же, что в репозитории API. Без нее домен `<ip-через-дефисы>.sslip.io`.

---

## 3. Автодеплой UI

Пуш в `develop` деплоит `dmc-ui-staging` (`https://staging.<домен>/`, Environment `staging`). Пуш в `main` деплоит `dmc-ui-prod` (`https://<домен>/`, Environment `production`). Пуш в feature-ветки не деплоит.

Ручной деплой любой ветки: **Actions -> UI Release Pipeline -> Run workflow**, выбрать ветку и окружение (`staging` или `production`). Деплой перезаписывает текущую версию окружения. Ограничить, какие ветки можно выкатывать в production, можно в **Settings -> Environments -> production** (Deployment branches и/или Required reviewers).

- Перед сборкой выполняются CI (`.github/workflows/ci.yml`: lint, check-types, test) и проверка имени ветки (`.github/workflows/branch-name.yml`). Оба workflow также запускаются на каждый pull request.
- Образ собирается из `Dockerfile` (Vite + nginx), тег — SHA коммита.
- Откат на предыдущий контейнер выполняется, если UI не ответил внутри контейнера или не прошла проверка с раннера по HTTPS через Caddy. Резервный контейнер удаляется только после успешной проверки с раннера.
