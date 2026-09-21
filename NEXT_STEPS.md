# Що робити зараз

> Поточний milestone: **Stage 0 — Foundation spike**  
> Детальна архітектура: [PROJECT_PLAN.md](./PROJECT_PLAN.md)  
> Статус: **SSR і guest cart перевірено, 3 E2E-тести проходять через Turbo; наступний етап — lint, форматування та документація запуску. Stage 0 ще не завершено.**  
> Останнє оновлення: **2026-09-21**.

### Поточна точка

- [x] PostgreSQL запускається через Docker Compose і проходить health check.
- [x] Vendure Server, Worker, Dashboard і окремий Worker health endpoint працюють.
- [x] Початкову migration застосовано до чистої бази.
- [x] Runtime environment Vendure валідований через Zod.
- [x] Vendure використовує bearer auth, explicit CORS origins і production-safe superadmin credentials.
- [x] GraphiQL та introspection доступні лише у development.
- [x] Налаштовано українську мову, UAH, країну/зону Україна та standard tax 20%.
- [x] Створено `Полонина Trek`, variant, option groups, stock, facet і collection `Намети`.
- [x] Product і Collection перевірені безпосередньо через Shop API.
- [x] `pnpm typecheck` проходить для commerce і storefront.
- [x] Vendure production build проходить.
- [x] Створено спільний пакет `@karpaty-gear/shop-api` з GraphQL Code Generator та типізованими документами.
- [x] Server-only Vendure Shop API client підключено до SolidStart.
- [x] Сторінка `/products/polonyna-trek` показує товар, variant, ціну та наявність; користувач підтвердив назву товару в початковому HTML.
- [x] Вручну перевірено неіснуючий товар, повідомлення при недоступному Vendure та відновлення після запуску сервера.
- [x] Створено й експортовано `AddItemToOrder` і `GetActiveOrder`, codegen виконано успішно; після експорту користувач підтвердив виконання кроку з `pnpm run typecheck`.
- [x] Реалізовано server-only session helper, add-to-cart action і читання `activeOrder` через bearer token із cookie.
- [x] Перевірено збереження кошика після reload та ізоляцію браузерних сесій.
- [x] Storefront production build і локальний запуск зібраного Node-сервера працюють.
- [x] Playwright перевіряє збереження кошика, cookie flags, ізоляцію сесій і незмінність кошика після неіснуючого variant ID: **3 passed**.
- [x] Коренева команда `pnpm run test:e2e` проходить через Turbo: **5 successful, 5 total**; E2E виконується з `cache bypass`.
- [ ] Наступне: налаштувати реальні lint tasks і перевірку форматування, потім актуалізувати README.

**Межа готовності:** основний SSR/cart flow працює у локальній production-збірці storefront. Ще не підтверджені запуск усього стеку зі зібраним Vendure, відтворення з чистого checkout, перевірка client bundle на secrets та deployment у Docker/Dokploy. Lint, форматування й документація залишаються відкритими. Результати тестів і збірок підтверджені наданими користувачем логами; це не новий запуск під час оновлення документа.

## 1. Мета поточного етапу

Не потрібно одразу будувати весь магазин. Спочатку треба перевірити найризикованішу інтеграцію:

1. Vendure запускається з PostgreSQL, окремими Server і Worker.
2. У Vendure є хоча б один демонстраційний товар із variant.
3. SolidStart отримує цей товар через Shop API під час SSR.
4. SolidStart додає variant у Vendure cart через server action.
5. Vendure bearer token зберігається у `HttpOnly` cookie storefront.
6. Після перезавантаження сторінки той самий `activeOrder` залишається доступним.
7. Обидві програми проходять production build.

Це не готовий MVP. Це короткий vertical spike, який підтверджує, що фундаментальна архітектура працює.

## 2. Що зробити прямо зараз

### Крок 1 — Зафіксувати мінімальний product brief

Product brief зафіксовано у [`docs/product-brief.md`](./docs/product-brief.md):

- [x] робоча назва — Karpaty Gear;
- [x] предметна область — outdoor-спорядження для походів і кемпінгу;
- [x] описані цільові покупці;
- [x] основна мова storefront — українська;
- [x] валюта — UAH;
- [x] регіон demo-магазину — Україна;
- [x] визначені категорії першого seed;
- [x] визначені 10 демонстраційних товарів;
- [x] головний сценарій: product → cart → guest checkout → completed test order;
- [x] зафіксовані non-goals першої версії.

До non-goals зараз віднести:

- реальну оплату;
- production shipping integration;
- RabbitMQ, Valkey і BullMQ;
- Meilisearch;
- AI assistant, Ollama і Qdrant;
- notification center;
- reviews plugin;
- повний observability stack;
- S3 або MinIO;
- складний фінальний дизайн.

**Результат:** scope можна пояснити за одну хвилину, а для старту не потрібні додаткові продуктові рішення.

### Крок 2 — Створити основу репозиторію

- [x] ініціалізувати Git;
- [x] зафіксувати Node.js 24+ у `engines.node`;
- [x] додати `.nvmrc` із локально перевіреною версією Node.js 24.12.0;
- [x] scaffold storefront на stable `@solidjs/start` 2.x зі stable `solid-js` 1.x;
- [x] перевірити, що storefront використовує Vite 8, Nitro 3 і не містить Vinxi/`nitropack`/`@solidjs/vite-plugin-nitro-2`;
- [x] зафіксувати точну версію pnpm у полі `packageManager` root `package.json`;
- [x] створити `pnpm-workspace.yaml`;
- [x] додати `.gitignore`;
- [x] додати `.editorconfig` і безпечні `.env.example` для root та apps; прибрати дублікати й Compose-only змінну з commerce example та додати PORT у storefront example;
- [x] створити `apps/storefront`, `apps/commerce` і `docs`;
- [ ] створити `docs/adr` та `infra/compose`, якщо останній каталог справді буде використовуватися;
- [x] додати root scripts для `dev`, `build`, `lint`, `format` і `typecheck`;
- [x] додати root `test:e2e` script і package-level `test:e2e` для storefront;
- [x] налаштувати Turbo `test:e2e`: `dependsOn: ["build", "typecheck"]`, `cache: false`, `outputs: []`;
- [ ] додати реальні package-level lint tasks (сама коренева команда `lint` ще не підтверджує перевірку коду);
- [ ] додати перевірку форматування без перезапису файлів і без обробки generated/build output;
- [x] увімкнути TypeScript strict і Prettier;
- [ ] додати та перевірити єдині lint rules;
- [ ] створити короткий root `README.md` з prerequisites та командами запуску.

Цільова мінімальна структура після цього кроку:

```text
ecommerce/
├─ apps/
│  ├─ commerce/
│  └─ storefront/
├─ docs/
│  ├─ adr/
│  └─ product-brief.md
├─ infra/
│  └─ compose/
├─ .editorconfig
├─ .env.example
├─ .gitignore
├─ .nvmrc
├─ compose.yaml
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ PROJECT_PLAN.md
├─ NEXT_STEPS.md
└─ README.md
```

**Важливо:** затверджений storefront baseline — SolidStart 2 stable, SolidJS 1 stable, Node.js 24+, Vite 8 і Nitro 3. SolidJS 2 поки RC і не входить у main branch. Перед scaffolding ще раз звірити patch-версії та Vendure `engines`; після першого успішного build зафіксувати все в lockfile.

### Крок 3 — Записати два ADR

Створити:

- [x] `docs/adr/0001-pnpm-monorepo.md`;
- [x] `docs/adr/0002-solidstart-vendure-bff-session.md`.

Кожен ADR повинен містити:

```md
# Назва рішення

Status: Accepted
Date: YYYY-MM-DD

## Context

## Decision

## Consequences

## Alternatives considered
```

В ADR про BFF зафіксувати:

- browser не звертається до Vendure Shop API напряму;
- GraphQL transport знаходиться у server-only модулі SolidStart;
- Vendure bearer token зберігається у `HttpOnly` cookie;
- cookie має `Secure` у production, `SameSite=Lax` і обмежений `Path`;
- token не потрапляє в `localStorage`, client bundle або browser logs;
- catalog queries і mutations використовують один server-side API client;
- Vendure залишається джерелом правди для cart, prices, stock і totals.

### Крок 4 — Підняти мінімальний Vendure

- [x] додати лише PostgreSQL у `compose.yaml`;
- [x] додати health check і persistent database volume;
- [x] створити `apps/commerce` офіційним Vendure generator;
- [x] налаштувати connection через validated environment variables;
- [x] створити й запустити початкову migration;
- [x] запустити Vendure Server;
- [x] запустити Vendure Worker окремим process;
- [x] додати окремий health endpoint для Worker на порту `3020`;
- [x] відкрити Dashboard;
- [x] налаштувати channel language/currency, tax category, zone і tax rate;
- [x] створити один Product, один ProductVariant, ціну, stock, facet і collection;
- [x] перевірити `product(slug: ...)` безпосередньо через Shop API;
- [x] перевірити `collection(slug: ...)` безпосередньо через Shop API;
- [ ] записати точні команди setup/run у README.

На цьому кроці використовувати:

- PostgreSQL;
- вбудовану SQL job queue Vendure;
- локальні assets;
- dummy/test configuration.

Не додавати broker, external search, Redis-compatible store або AI services.

**Результат:** чиста база може бути створена migration-командою, Server і Worker стартують без помилок, Dashboard бачить demo product.

### Крок 5 — Підняти мінімальний SolidStart SSR

- [x] створити `apps/storefront` офіційним SolidStart generator;
- [x] залишити SSR увімкненим;
- [x] перевірити `vite.config.ts`: `solidStart()` + Nitro 3 `nitro()` plugin, без `app.config.ts`/Vinxi setup;
- [x] додати `@solidjs/start/env` до TypeScript `types`;
- [x] підключити UnoCSS із `preset-wind4`;
- [x] додати Zod як пряму залежність storefront;
- [x] додати server-only Vendure GraphQL client;
- [x] захистити Vendure client, product service та environment config через `server-only` marker import;
- [x] винести Shop API URL, channel і language у validated server-only environment config;
- [x] виправити валідацію `env:server/runtime`: передавати Zod явний об'єкт значень, а не сам Proxy або його spread;
- [x] створити пакет `packages/shop-api` і підключити його до storefront через workspace dependency;
- [x] налаштувати GraphQL Code Generator: schema з Shop API, documents із `src/operations/**/*.graphql`, client preset і scalar mappings;
- [x] створити мінімальний `GetProductBySlug` GraphQL document;
- [x] згенерувати та експортувати типізований документ і типи `GetProductBySlug` зі спільного пакета;
- [x] виконати query на сервері у route `/products/:slug`;
- [x] показати name, variant name, price і stock state;
- [x] додати loading, not-found і safe error states;
- [x] вручну перевірити not-found та недоступний Vendure; після перезапуску Vendure товар знову відображається;
- [x] перевірити, що product name є у початковому HTML, а не з'являється лише після client hydration;
- [x] залишити spike без design system, складної gallery та повного catalog UI.
- [x] усунути dev-помилку імпорту `@jridgewell/resolve-uri` через `optimizeDeps.include: ["@solidjs/start > @jridgewell/trace-mapping"]`.

Поточна генерація типів потребує запущеного Vendure:

```powershell
pnpm --filter @karpaty-gear/shop-api codegen
```

Окремі задачі для відтворюваної збірки: підключити `codegen` до Turbo pipeline та визначити спосіб доступу до schema у CI (запущений API або versioned schema snapshot). Вони ще не виконані.

Мінімальні файли spike:

```text
apps/storefront/src/
├─ routes/
│  └─ products/[slug].tsx
├─ features/product/
│  └─ server/get-product-by-slug.ts
└─ lib/
   ├─ env/server.ts
   └─ vendure/server-client.ts
```

**Результат:** пряме відкриття product URL повертає SSR HTML із даними реального ProductVariant із Vendure.

### Крок 6 — Перевірити BFF session і guest cart

- [x] створити `packages/shop-api/src/operations/cart.graphql` з `AddItemToOrder` і `GetActiveOrder`;
- [x] включити `__typename` та `ErrorResult` (`errorCode`, `message`) у результат додавання товару;
- [x] успішно згенерувати документи й типи кошика та експортувати їх через `@karpaty-gear/shop-api`;
- [x] створити server-only session helper для читання, запису та видалення Vendure bearer cookie;
- [x] додати мінімальну кнопку `Add to cart` на spike PDP;
- [x] виконувати `addItemToOrder` тільки через SolidStart server action;
- [x] перевіряти POST та Origin у server action, а variant ID і кількість — через Zod;
- [x] прочитати Vendure auth token із response header після mutation;
- [x] записати token у `HttpOnly` cookie storefront (`Secure` у production, `SameSite=Lax`, `Path=/`);
- [x] на наступних server requests передавати його як Bearer token до Vendure;
- [x] підключити `GetActiveOrder` до server-side query з token поточної сесії;
- [x] встановити `Cache-Control: private, no-store` для читання персонального кошика;
- [x] тимчасово показати order code, total quantity і total у простому cart/debug block;
- [x] перезавантажити PDP і переконатися, що повертається той самий order;
- [x] перевірити нову browser session: вона не повинна отримати чужий cart;
- [x] перевірити неіснуючий variant ID: безпечне повідомлення та незмінний кошик після reload;
- [x] прив'язати `useSubmission` до стабільного `formId`, похідного від variant ID, а не `createUniqueId()`, який змінюється при повторному створенні компонента;
- [x] додати Playwright E2E-тести на create cart → reload → same active order, ізоляцію сесій та неіснуючий variant ID;
- [x] перевірити через E2E cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, без виведення token у assertion results.

Для cookie не логувати й не показувати повне значення token. У репозиторій не комітити реальні secrets або session data.

**Результат:** anonymous cart переживає reload, а token недоступний browser JavaScript.

### Крок 7 — Перевірити production build

- [ ] зупинити reliance на випадкові local-only налаштування;
- [ ] виконати format check і lint;
- [x] виконати typecheck для commerce і storefront (у наданому Turbo-лозі commerce — cache hit);
- [x] виконати 3 E2E-тести session/cart flow на зібраному storefront;
- [x] зібрати production build Vendure Server;
- [x] зібрати production build Vendure Worker;
- [x] зібрати Vendure Dashboard;
- [x] зібрати production build SolidStart;
- [x] локально запустити зібраний storefront і перевірити товар, кошик та нову сесію;
- [ ] запустити також зібрані Vendure Server/Worker і повторити smoke test всього production-стеку;
- [ ] перевірити, що client bundle не містить secrets або Vendure bearer token;
- [ ] записати відомі обмеження spike у README.

Окремо перевірити production output обраного Nitro 3 Node preset у Docker/Dokploy. `vite preview` підходить лише для локальної перевірки build і не є production start command.

### Поточний запуск E2E

З кореня репозиторію:

```powershell
pnpm run test:e2e
```

- PostgreSQL і Vendure мають бути запущені вручну; потрібен demo product `polonyna-trek` із доступним variant за ціною 8 999 грн.
- Потрібні встановлені залежності, Chromium для Playwright і налаштований `apps/storefront/.env`.
- Turbo виконує залежні build/typecheck tasks; вони можуть використовувати кеш. Самі E2E-тести кеш не використовують.
- Playwright запускає `.output/server/index.mjs` через Node з `--env-file=.env` на порту `3002`; порт має бути вільним, `reuseExistingServer: false`.
- Тести працюють у Chromium, одним worker, без retries. Trace і video вимкнено; screenshot зберігається при помилці.
- Test results, reports і auth artifacts виключені з Git.
- Браузерні сесії ізольовані, але база спільна локальна: кожен запуск створює незавершені кошики. Окрема тестова БД, автоматичний seed і cleanup ще не налаштовані.
- Останній наданий результат: **3 passed**, Turbo — **5 successful, 5 total**.

Перед deployment окремо перевірити Origin за reverse proxy та HTTPS/cookie flow; локальний тест не підтверджує ці налаштування.

## 3. Порядок виконання

Не виконувати всі задачі паралельно. Рекомендований порядок:

```text
Product brief
    ↓
Repository foundation + ADR
    ↓
Vendure + PostgreSQL
    ↓
SolidStart SSR product query
    ↓
BFF session + guest cart reload
    ↓
Production builds
    ↓
Stage 0 complete
```

Якщо попередній крок не працює, наступний не починати. Спочатку виправити або задокументувати фундаментальну несумісність.

## 4. Критерій завершення поточного milestone

Stage 0 можна позначити завершеним тільки коли одночасно виконано все:

- [ ] `pnpm install` працює з чистого checkout;
- [ ] PostgreSQL стартує однією documented командою;
- [x] Vendure migration виконується на чистій database;
- [x] Vendure Server, Worker і Dashboard запускаються;
- [x] demo Product/Variant доступний через Shop API;
- [x] product route повертає SSR HTML із правильними даними (ручна перевірка користувача);
- [x] add-to-cart проходить через SolidStart server action;
- [x] bearer token зберігається у `HttpOnly` cookie й не повертається в результаті action для UI;
- [x] cart переживає reload;
- [x] інша browser session ізольована;
- [x] typecheck commerce/storefront, 3 cart E2E-тести і production builds проходять;
- [ ] format check і lint проходять;
- [ ] client bundle перевірено на відсутність secrets;
- [ ] smoke test зі зібраними storefront та Vendure Server/Worker пройдено;
- [ ] README дозволяє повторити результат із чистого checkout.

Після цього зробити git tag або milestone commit на кштал:

```text
feat: validate SolidStart and Vendure foundation
```

## 5. Що не робити до завершення Stage 0

Не витрачати час на:

- фінальний UI та анімації;
- повну головну сторінку;
- checkout/account;
- reviews або notifications plugins;
- Meilisearch/Typesense;
- RabbitMQ, BullMQ або Valkey;
- Ollama/Qdrant і AI assistant;
- Grafana/Loki/Tempo;
- S3/MinIO;
- Kubernetes або microservices decomposition;
- production payment provider;
- великий seed catalog.

Ці частини вже описані в основному плані й будуть додані послідовно. Зараз вони лише збільшать кількість можливих причин помилки.

## 6. Якщо spike не проходить

Не маскувати проблему workaround-ами. Створити запис у `docs/spikes/`:

```md
# Spike: коротка назва проблеми

## Expected

## Actual

## Environment and versions

## Reproduction

## Attempts

## Decision
```

Критичні причини зупинити Stage 0 і переглянути ADR:

- SolidStart runtime несумісний із необхідним deployment adapter;
- SSR не може надійно передавати/оновлювати Vendure session token;
- cookie flow не забезпечує ізоляцію browser sessions;
- production build працює інакше, ніж development;
- Vendure та SolidStart вимагають несумісні runtime versions без прийнятної Docker boundary.

## 7. Що буде наступним

Тільки після проходження Stage 0 перейти до **Stage 1 — Foundation і commerce baseline**:

1. привести repo scripts і CI до стабільного стану;
2. доповнити вже наявну runtime environment validation для нових інтеграцій;
3. оформити повноцінні migrations і seed v1;
4. завершити Vendure configuration;
5. створити storefront shell;
6. доповнити вже підключений GraphQL Code Generator: Turbo pipeline і відтворювана генерація в CI;
7. почати catalog vertical slice.

Поточне джерело правди для роботи — цей файл. Після виконання пункту змінити `[ ]` на `[x]`. Архітектурні рішення та повний roadmap залишаються у [PROJECT_PLAN.md](./PROJECT_PLAN.md#25-roadmap).
