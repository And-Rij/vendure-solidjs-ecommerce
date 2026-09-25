# Karpaty Gear

Портфоліо ecommerce-проєкт магазину outdoor-спорядження для походів і кемпінгу. Основна мова — українська, валюта — UAH.

Поточний етап — **Stage 0: Foundation spike**. Працюють SSR-сторінка товару, додавання в гостьовий кошик, збереження сесії після reload та ізоляція покупців. Checkout і реальні платежі ще не реалізовані.

## Стек і структура

- SolidStart 2, SolidJS 1, Vite 8, Nitro 3 та UnoCSS — storefront.
- Vendure 3.7.3, окремі Server і Worker — commerce backend.
- PostgreSQL 18 у Docker Compose.
- GraphQL Code Generator — типізовані Shop API operations.
- pnpm workspaces, Turborepo, TypeScript, ESLint, Prettier та Playwright.

```text
apps/
  commerce/       Vendure API, worker, Dashboard, migrations
  storefront/     SolidStart SSR, server actions, Playwright tests
packages/
  shop-api/       GraphQL operations, codegen, generated types
docs/            Product brief та архітектурні документи
compose.yaml     Локальна PostgreSQL
PROJECT_PLAN.md  Архітектура й roadmap
NEXT_STEPS.md    Виконані кроки та поточні задачі
```

Браузер звертається до серверних функцій storefront, а вони — до Vendure Shop API. Vendure bearer token зберігається у storefront cookie `karpaty-gear-session` з `HttpOnly`, `SameSite=Lax`, `Path=/` і `Secure` у production-збірці. Token не повертається в результаті action для UI.

## Передумови

- Node.js **24.12.0** — поточна локально перевірена версія, зафіксована у `.nvmrc`; `engines.node` дозволяє 24+.
- pnpm **11.25.0** відповідно до `packageManager`.
- Docker із Docker Compose та запущеним Docker engine.
- Вільні порти: `6543` — PostgreSQL, `3000` — Vendure, `3020` — worker health, `3001` — storefront, `3002` — E2E storefront. Окремий Dashboard dev-сервер за замовчуванням використовує `5173`.

Команди розраховані на PowerShell і виконуються **з кореня репозиторію**, якщо не вказано інше. `pnpm --filter` запускає команду в каталозі відповідного пакета.

```powershell
node --version
pnpm --version
docker compose version
pnpm install --frozen-lockfile
```

Локальний запуск із чистого checkout перевірено з окремою БД та мінімальними demo-даними: [звіт і межі перевірки](./docs/clean-check-verification.md). Для повторення каталогу тепер є [seed:demo](./docs/demo-seed.md). Створіть env-файли перед build: Dashboard завантажує Vendure config і потребує його змінних навіть під час збірки.

## Environment variables

Є три незалежні `.env`. Реальні паролі та token не комітити, приклади паролів не використовувати як робочі.

### Кореневий `.env`: Docker Compose

Скопіюй шаблон лише за відсутності робочого файлу:

```powershell
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Заміни placeholder власним локальним паролем:

```dotenv
DB_NAME=vendure
DB_USERNAME=vendure
DB_PASSWORD=REPLACE_WITH_LOCAL_DATABASE_PASSWORD
POSTGRES_HOST_PORT=6543
```

Compose передає ці значення контейнеру PostgreSQL. Цей файл не є автоматично спільною конфігурацією застосунків.

### `apps/commerce/.env`: Vendure

Скопіюй шаблон лише за відсутності робочого файлу:

```powershell
if (-not (Test-Path apps/commerce/.env)) {
  Copy-Item apps/commerce/.env.example apps/commerce/.env
}
```

Перевір налаштування:

| Змінні                                  | Локальне значення / вимога                                             |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `APP_ENV`                               | `dev`                                                                  |
| `VENDURE_SERVER_PORT`                   | `3000`                                                                 |
| `VENDURE_WORKER_HEALTH_PORT`            | `3020`; залиш одне визначення                                          |
| `DB_HOST`, `DB_PORT`                    | `localhost`, `6543` для запуску Vendure на хості                       |
| `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | Мають збігатися з кореневим `.env`                                     |
| `DB_SCHEMA`                             | `public`                                                               |
| `SUPERADMIN_USERNAME`                   | Обраний локальний admin login                                          |
| `SUPERADMIN_PASSWORD`                   | Власний пароль, щонайменше 16 символів                                 |
| `CORS_ORIGINS`                          | `http://localhost:3001,http://localhost:5173`                          |
| `STOREFRONT_URL`                        | `http://localhost:3001`                                                |
| `ASSET_PUBLIC_URL`                      | Можна залишити порожнім у `dev`; обов'язковий при `APP_ENV=production` |
| `EMAIL_FROM`                            | Наприклад, `Karpaty Gear <noreply@karpaty-gear.local>`                 |

`PORT`, якщо заданий, має пріоритет над `VENDURE_SERVER_PORT`. Не перенось сюди storefront `PORT=3001`. `POSTGRES_HOST_PORT` використовується Compose у кореневому `.env`, а не підключенням Vendure до бази.

Vendure завантажує цей файл через `dotenv/config`. Зміна superadmin credentials у `.env` не повинна вважатися способом зміни пароля вже наявного користувача в базі.

### `apps/storefront/.env`: SolidStart

```powershell
if (-not (Test-Path apps/storefront/.env)) {
  Copy-Item apps/storefront/.env.example apps/storefront/.env
}
```

Перевір або додай:

```dotenv
PORT=3001
SERVER_VENDURE_SHOP_API_URL=http://localhost:3000/shop-api
SERVER_VENDURE_CHANNEL_TOKEN=
SERVER_VENDURE_LANGUAGE_CODE=uk
```

Порожній channel token підходить для default channel. Усі `SERVER_VENDURE_*` читаються серверним кодом. Для зібраного Node-сервера `.env` передається явно через `--env-file` — див. розділ запуску збірки.

## PostgreSQL і migrations

```powershell
docker compose up -d postgres
docker compose ps
```

Дочекайся стану `healthy`. Дані зберігаються у named volume `postgres-data`; порт усередині контейнера — `5432`, на хості за замовчуванням — `6543`.

### Migrations

`synchronize` вимкнено. Початкова схема знаходиться у `apps/commerce/src/migrations/1789242329624-initial-schema.ts`.

Застосування pending migrations до налаштованої локальної бази:

```powershell
pnpm --filter @karpaty-gear/commerce exec vendure migrate --run --config ./src/vendure-config.ts
```

Поточний `apps/commerce/src/index.ts` також викликає `runMigrations(config)` перед bootstrap сервера. Уже застосовані міграції повторно не виконуються; Worker запускай після готовності схеми. Перед міграціями не локальної тестової бази потрібні перевірка змін і резервна копія.

Не генеруй початкову міграцію заново для звичайного запуску. Після майбутньої зміни entities/custom fields створюй нову міграцію та перевіряй її SQL перед застосуванням.

Для зупинки PostgreSQL зі збереженням даних:

```powershell
docker compose stop postgres
```

Не додавай `-v` до `docker compose down`, якщо хочеш зберегти базу: ця опція видаляє volume з даними. Зміна `DB_PASSWORD` у файлі не змінює пароль у вже ініціалізованому PostgreSQL volume.

## Development-запуск

Після налаштування `.env`, PostgreSQL та migrations запусти в окремих терміналах:

```powershell
pnpm --filter @karpaty-gear/commerce dev:server
```

```powershell
pnpm --filter @karpaty-gear/commerce dev:worker
```

Для редагування Dashboard окремо:

```powershell
pnpm --filter @karpaty-gear/commerce dev:dashboard
```

Адресу Dashboard dev-сервера дивись у терміналі (зазвичай `http://localhost:5173/dashboard`). Dashboard на `http://localhost:3000/dashboard` потребує готового `apps/commerce/dist/dashboard`; його можна підготувати командою:

```powershell
pnpm --filter @karpaty-gear/commerce build:dashboard
```

Увійди власними admin credentials та налаштуй демонстраційний каталог за наступним розділом. Shop API types генеруються із зафіксованої schema; Vendure для цього не потрібен:

```powershell
pnpm run codegen
```

Після цього запусти storefront:

```powershell
pnpm --filter @karpaty-gear/storefront dev
```

Для наступних запусків уже налаштованого проєкту можна використати `pnpm run dev`: Turbo запускає storefront та `vendure dev all`. PostgreSQL ця команда не запускає. Не запускай її паралельно з тими самими сервісами в окремих терміналах.

### Локальні адреси

| Сервіс                                | Адреса                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Товар                                 | http://localhost:3001/products/polonyna-trek                               |
| Shop API                              | http://localhost:3000/shop-api                                             |
| Admin API                             | http://localhost:3000/admin-api                                            |
| Зібраний Dashboard                    | http://localhost:3000/dashboard                                            |
| GraphiQL Shop / Admin (`APP_ENV=dev`) | http://localhost:3000/graphiql/shop / http://localhost:3000/graphiql/admin |
| Assets                                | http://localhost:3000/assets                                               |
| Dev mailbox                           | http://localhost:3000/mailbox                                              |
| Server health                         | http://localhost:3000/health                                               |
| Worker health                         | http://localhost:3020/health                                               |

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3020/health
```

## Демонстраційні дані

Є повторюваний `seed:demo` для мінімального каталогу. Він створює початкові налаштування, один товар/variant, options, facet і колекцію, не скидаючи наявні price/stock. Після міграцій і build запусти його з явним дозволом і підтвердженням БД — [інструкція та перевірки](./docs/demo-seed.md). Для застосування правил колекцій потрібен звичайний Worker.

Еквівалентне ручне налаштування у Vendure Dashboard:

1. У default channel увімкнути українську мову (`uk`) і валюту UAH.
2. Створити/перевірити країну Україна та зону Україна з цією країною. Призначити її default tax zone і default shipping zone каналу.
3. Створити податкову категорію Standard і ввімкнену ставку Standard VAT 20% для цієї категорії та зони. Для demo використовувати ціни з податком.
4. Створити активний товар **Полонина Trek**, slug `polonyna-trek`, доступний поточному каналу.
5. Додати option groups і значення: `capacity` / Місткість → `2-person` / 2 особи; `color` / Колір → `forest` / Forest.
6. Створити один доступний variant **Полонина Trek 2 особи Forest**, SKU `KG-TENT-POL-2P-FST`, призначити Standard tax category. Кінцева ціна з податком — **8 999,00 UAH**, тобто Shop API `priceWithTax = 899900`. У локальному demo запас — 12 одиниць.
7. Додати facet `category` / Категорія зі значенням `tents` / Намети до товару та collection `namety` / Намети з фільтром, що включає цей variant.

Числові ID не потрібно відтворювати: storefront отримує variant ID із запиту товару. Поточні E2E-тести очікують один variant, зазначені назву/slug/ціну та доступний stock. ID `999999999` зарезервовано в тесті як неіснуючий.

## GraphQL Code Generator

```powershell
pnpm run codegen
pnpm run codegen:check
```

- Schema для генерації читається з `packages/shop-api/schema/shop.graphql`; запущений Vendure і база даних не потрібні.
- Operations: `packages/shop-api/src/operations/**/*.graphql`.
- Generated output: `packages/shop-api/src/generated/`; його не редагувати вручну.
- Публічні exports: `packages/shop-api/src/index.ts`.
- Після зміни operations запусти `pnpm run codegen`. Turbo запускає codegen перед storefront build і typecheck.
- Після зміни Vendure version, plugin API extensions або custom fields спочатку збери commerce і онови snapshot: `pnpm --filter @karpaty-gear/commerce build:server`, тоді `pnpm --filter @karpaty-gear/commerce schema:shop`, тоді `pnpm run codegen`. Для експорту потрібні валідні `apps/commerce/.env`, але сервер і PostgreSQL запускати не потрібно. Закоміть snapshot і generated-файли разом.

## Перевірки якості

```powershell
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:e2e
```

- `format:check` перевіряє форматування без запису. `pnpm run format` змінює форматування невиключених файлів.
- `lint` через Turbo перевіряє commerce, storefront і shop-api без допустимих warnings. Root ESLint config окремо: `pnpm exec eslint eslint.config.mjs --max-warnings 0`.
- `typecheck` має окремі tasks для commerce і storefront. У shop-api власного typecheck task поки немає; імпортовані storefront типи перевіряються разом зі storefront.
- Generated GraphQL, build output та runtime artifacts виключені з lint/format. Handlebars/MJML email templates виключені з Prettier через несумісність їхніх partials із його parser.

### E2E: реальний локальний Vendure

Один раз установи браузер для поточної версії Playwright:

```powershell
pnpm --filter @karpaty-gear/storefront exec playwright install chromium
```

Перед тестами PostgreSQL і Vendure мають працювати, demo-каталог — бути налаштованим, `apps/storefront/.env` — заповненим, а порт `3002` — вільним.

```powershell
pnpm run test:e2e
```

Turbo виконує залежні build/typecheck tasks; вони можуть використовувати кеш. Самі E2E запускаються щоразу (`cache: false`). Playwright запускає зібраний storefront на `http://localhost:3002`, не використовує вже запущений сервер і зупиняє свій сервер після тестів.

Три тести у `apps/storefront/tests/e2e/cart.spec.ts` перевіряють:

1. Створення кошика, cookie flags і те саме замовлення після reload.
2. Ізоляцію двох браузерних сесій.
3. Безпечне повідомлення та незмінність кошика після неіснуючого variant ID.

Тести працюють у Chromium, з одним worker і без retries. Trace/video вимкнено; screenshot створюється при помилці. Test artifacts виключено з Git. Не виводь cookie/token у звіти.

**Тести змінюють локальну базу:** звичайний `test:e2e` створює незавершені гостьові кошики, але не оформлює покупки, й не має автоматичного cleanup. Не направляй цей набір на реальний магазин. Окремий інтеграційний [test:seed](./docs/demo-seed.md) перевіряє seed у власній тимчасовій БД із cleanup та опційним прогоном cart E2E.

Якщо змінені тільки тести й production-збірка актуальна, швидкий запуск без Turbo:

```powershell
pnpm --filter @karpaty-gear/storefront test:e2e
```

## Збірка та запуск зібраного storefront

Зібрати всі пакети, які мають build script:

```powershell
pnpm run build
```

Або окремо:

```powershell
pnpm --filter @karpaty-gear/commerce build
pnpm --filter @karpaty-gear/storefront build
```

Зупини storefront dev-сервер на `3001`, залиш Vendure доступним і запусти:

```powershell
pnpm --filter @karpaty-gear/storefront exec node --env-file=.env .output/server/index.mjs
```

`PORT=3001` має бути в `apps/storefront/.env`. Команда `start` у пакеті запускає той самий Node entrypoint, але сама не передає `.env`: для неї environment variables повинні вже бути у середовищі процесу. `vite preview` не є командою deployment.

### Межі перевірки production

Підтверджені збірки Vendure Dashboard/Server/Worker і storefront, health endpoints зібраних Server/Worker та 3 cart E2E зі зібраним стеком у чистій копії. Vendure працював із `APP_ENV=dev`; production env і deployment ще не перевірені.

Команди запуску зібраного Vendure:

```powershell
pnpm --filter @karpaty-gear/commerce start:server
pnpm --filter @karpaty-gear/commerce start:worker
```

Запускати їх слід в окремих терміналах, після збірки та зупинки відповідних dev-процесів. Поточний entrypoint сервера застосовує pending migrations під час старту.

Збірка сама не змінює `APP_ENV`: для production-режиму Vendure потрібно явно налаштувати `APP_ENV=production`, `ASSET_PUBLIC_URL`, URL storefront, credentials, database connection і дозволені origins. EmailPlugin зараз завжди має `devMode: true`, оплати — dummy; це **не конфігурація для реальних продажів**. Перед deployment також перевірити trusted reverse proxy, Origin-перевірку server actions, HTTPS і Secure cookies. Поведінка localhost не замінює таку перевірку.

## Типові проблеми

- **Codegen: `ECONNREFUSED`** — перевір запущений Vendure та порт `3000`.
- **Codegen: немає GraphQL documents** — перевір `.graphql` файли у `packages/shop-api/src/operations`.
- **Active tax zone could not be determined** — признач default tax zone поточному каналу; перевір також tax category і ставку variant.
- **Storefront: invalid environment** — перевір його власний `.env`; зібраний сервер запускай із `--env-file` або явно заданим environment.
- **Порт зайнятий** — не запускай dev і зібрану версію одного сервісу одночасно; `3002` залишай для Playwright.
- **Lint через Turbo перевіряє не всі пакети** — кожен пакет повинен мати власний `scripts.lint`.
- **Сума має `грн` замість `₴`** — поточне `Intl.NumberFormat` може давати різне позначення у серверному й браузерному середовищах; E2E допускає обидва варіанти. Уніфікація відображення ще попереду.

## Подальша робота

[NEXT_STEPS.md](./NEXT_STEPS.md) містить актуальний checklist, [PROJECT_PLAN.md](./PROJECT_PLAN.md) — повну архітектуру, [product brief](./docs/product-brief.md) — scope магазину.

Stage 0 перевірено локально: чистий checkout, lint/format/typecheck, зібраний стек, міграція окремої БД та 3 cart E2E пройдені; setup/ADR і перевірку публічної збірки на секрети виконано. Мінімальний відтворюваний seed реалізовано. Codegen використовує versioned Shop schema і Turbo pipeline. CI перевіряє format/lint/codegen/typecheck/build та seed + cart E2E в ізольованій БД; перший прогін GitHub Actions на `main` пройшов успішно. Розширений seed-каталог із product brief, production-конфігурація та Docker/Dokploy deployment ще не налаштовані. Зовнішній пошук, брокери черг, AI, notifications та observability залишаються майбутніми етапами.
