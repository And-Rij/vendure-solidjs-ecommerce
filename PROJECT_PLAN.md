# E-commerce на SolidStart + Vendure — master plan

> Статус: початковий архітектурний план, розширений OSS platform layer  
> Оновлено: 2026-08-03  
> Роль документа: єдине джерело правди щодо продукту, архітектури, структури репозиторію та порядку реалізації.

## 1. Коротко про проєкт

Мета — створити повноцінний headless e-commerce проєкт для портфоліо, у якому:

- SolidStart відповідає за storefront, SSR, SEO, маршрути, серверні запити й мутації;
- Vendure відповідає за каталог, варіанти товарів, ціни, залишки, кошик, checkout, замовлення, клієнтів, промокоди та адміністрування;
- PostgreSQL є основною базою даних;
- Vendure Worker виконує фонові задачі: індексацію пошуку, email та інші job-и;
- GraphQL Code Generator створює типобезпечний контракт між storefront і Vendure Shop API;
- Docker Compose піднімає локальну інфраструктуру однаково для всіх розробників;
- advanced profile додає broker, distributed job queue, окремий search engine, image optimization pipeline, observability і локальний AI/RAG без обов'язкових SaaS;
- проєкт демонструє не лише UI, а завершений commerce flow: від каталогу до створеного замовлення.

Затверджена концепція: **Karpaty Gear** — український portfolio ecommerce-магазин спорядження для походів, кемпінгу та активного відпочинку. Предметна область природно демонструє складний каталог, технічні характеристики, variants, facets, hybrid search, guided product discovery, stock, promotions, notifications та AI/RAG. `Karpaty Gear` є робочим portfolio brand; перед будь-яким реальним комерційним запуском окремо перевіряються trademark, domain і social handles.

Основна мова першої версії — українська, валюта — UAH. Англійська локалізація є наступним етапом, але структура від початку не повинна їй заважати.

## 2. Що саме має показувати цей проєкт у портфоліо

Проєкт повинен доводити, що автор уміє:

1. Побудувати SSR storefront на новому для себе фреймворку SolidStart.
2. Інтегрувати headless commerce backend через GraphQL.
3. Правильно розділити UI, серверну інтеграцію та commerce domain.
4. Реалізувати складний stateful flow: anonymous session → cart → checkout → order.
5. Працювати з авторизацією, cookie, помилками, валідацією та безпекою.
6. Моделювати каталог із продуктами, варіантами, колекціями та фасетами.
7. Написати хоча б один власний Vendure plugin із Shop API та Dashboard extension.
8. Покрити критичні сценарії автоматичними тестами.
9. Налаштувати CI, Docker, production-like конфігурацію та deployment.
10. Документувати архітектурні рішення й усвідомлено керувати scope.
11. Реалізувати event-driven інтеграцію з outbox, broker, retry, DLQ та idempotency.
12. Побудувати окремі keyword і vector search projections із fallback/reindex.
13. Інтегрувати локальний AI/RAG із безпечними tools та вимірюваною якістю.
14. Провести distributed tracing одного business flow через кілька сервісів.

## 3. Головні архітектурні рішення

| Питання                           | Рішення                                                                          | Причина                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Організація коду                  | pnpm monorepo                                                                    | Один lockfile, спільні типи, UI та конфігурація                                                                          |
| Storefront                        | SolidStart 2 stable + SolidJS 1 stable, SSR увімкнено                            | Production-ready лінія: SolidStart 2 уже stable і офіційно працює поверх SolidJS 1; SolidJS 2 поки не входить у baseline |
| Commerce backend                  | Vendure Core                                                                     | Готова commerce domain model і розширення через plugins                                                                  |
| База даних                        | PostgreSQL                                                                       | Production-ready база, рекомендована для реального commerce backend                                                      |
| API                               | Vendure Shop API через GraphQL                                                   | Це нативний публічний API Vendure                                                                                        |
| Межа browser/backend              | SolidStart як BFF                                                                | Токен Vendure не доступний JavaScript у браузері; централізовані cookie, помилки й headers                               |
| Сесія Vendure                     | Bearer token у HttpOnly cookie storefront                                        | Працює для SSR та guest cart, не використовує localStorage                                                               |
| Типізація API                     | GraphQL Code Generator                                                           | Типи генеруються зі справжньої схеми й операцій                                                                          |
| Локальна інфраструктура           | Docker Compose для PostgreSQL і сервісів                                         | Відтворюване середовище                                                                                                  |
| Черга задач на старті             | SQL job queue + окремий Vendure Worker                                           | Достатньо для core MVP і дає baseline для порівняння                                                                     |
| Черга задач advanced              | BullMQ + Valkey/Redis-compatible store                                           | Push-based jobs, retries, scheduling і масштабування worker-ів                                                           |
| Integration broker                | RabbitMQ                                                                         | Topic events між commerce, search, AI indexer та notification consumers                                                  |
| Пошук на старті                   | Вбудований Vendure search                                                        | Фільтри й пошук без окремого search service                                                                              |
| Пошук advanced                    | Self-hosted Meilisearch Community Edition                                        | Typo tolerance, facets, ranking і швидкий search-as-you-type                                                             |
| AI assistant                      | Self-hosted Ollama + Qdrant                                                      | Локальна LLM, embeddings і RAG без передачі catalog/customer data у зовнішній AI SaaS                                    |
| Assets                            | Vendure AssetServerPlugin + local persistent volume                              | Безкоштовне local storage, image transforms/cache; S3-compatible backend лише при реальній потребі                       |
| Monitoring/observability advanced | OpenTelemetry + Prometheus + Alertmanager + Grafana + Loki + Tempo + Uptime Kuma | Vendor-neutral telemetry, actionable alerts і external uptime checks                                                     |
| Стилі                             | CSS Modules + глобальні design tokens                                            | Мінімум магії, контроль стилів, демонстрація CSS навичок                                                                 |
| Тестовий платіж                   | Vendure dummy/test payment handler                                               | Повний checkout без зовнішнього акаунта                                                                                  |
| Production payment                | Окремий наступний етап                                                           | Не блокувати основний вертикальний сценарій                                                                              |
| Контент                           | Статичні сторінки в storefront; commerce-контент у Vendure                       | Не додавати CMS до MVP                                                                                                   |

### Рішення щодо версій

Перевірено 2026-09-11:

- storefront baseline — актуальний stable `@solidjs/start` 2.x із stable `solid-js` 1.x;
- SolidStart 2 stable побудований на Vite 8 Environment API та потребує Node.js 24 або новішого;
- використовувати Nitro 3 через `nitro()` з `nitro/vite`; не додавати Vinxi, `nitropack` або deprecated `@solidjs/vite-plugin-nitro-2`;
- використовувати офіційний Solid Router 1.x; SolidStart 2 router-agnostic, але TanStack Router не потрібен без конкретної продуктової причини;
- додати `@solidjs/start/env` до TypeScript environment types і використовувати `server-only` marker для Vendure transport, secrets та session modules;
- залишити default JSON serialization SolidStart 2; JavaScript serialization із потребою в `unsafe-eval` не вмикати;
- SolidJS 2 станом на цю перевірку має статус Release Candidate, тому не використовувати його у main portfolio branch;
- після stable-релізу SolidJS 2 та офіційно підтвердженої сумісності із SolidStart виконати окремий dependency/SSR/session ecosystem spike; migration не є умовою MVP;
- точні patch-версії `solid-js`, `@solidjs/start`, `@solidjs/router`, `vite`, `nitro`, Vendure та GraphQL tooling зафіксувати у `pnpm-lock.yaml` після scaffolding;
- Для основних framework-пакетів не робити неконтрольоване автоматичне оновлення major/minor версій.
- Якщо актуальна Vendure версія матиме несумісний `engines` діапазон, storefront і commerce запускаються у своїх Docker image з підтримуваними версіями Node. Архітектура monorepo від цього не змінюється.

## 4. Межі продукту

### 4.1 MVP — обов'язково

#### Каталог

- головна сторінка з hero, featured collections і featured products;
- дерево колекцій і навігація категоріями;
- сторінка колекції;
- пошук товарів;
- фільтри за фасетами;
- сортування за релевантністю, назвою та ціною;
- пагінація або “load more” з URL-параметрами;
- product details page;
- вибір конкретного ProductVariant;
- відображення ціни, старої ціни/discount, доступності й gallery;
- коректні empty, loading і error states.

#### Кошик

- створення guest cart;
- додавання варіанта товару;
- зміна кількості;
- видалення позиції;
- mini-cart;
- повна сторінка cart;
- промокод;
- totals беруться тільки з Vendure;
- кошик зберігається між перезавантаженнями сторінки.

#### Checkout

- контактні дані покупця;
- shipping address і billing address;
- вибір доступного способу доставки;
- перевірка order summary перед оплатою;
- тестовий payment method;
- перехід замовлення через дозволені Vendure states;
- сторінка успішного замовлення;
- зрозуміла обробка відхиленої оплати або невалідного стану.

#### Акаунт

- реєстрація;
- підтвердження email у dev-режимі;
- login/logout;
- forgot/reset password;
- профіль;
- адресна книга;
- історія замовлень;
- сторінка деталей замовлення;
- merge або коректне продовження guest cart після login згідно з поведінкою Vendure.

#### Адміністрування

- Vendure Dashboard доступний окремо від storefront;
- CRUD для товарів, варіантів, колекцій, фасетів і assets;
- керування залишками та цінами;
- перегляд і обробка замовлень;
- керування promotions/coupon codes;
- ролі та доступ адміністратора;
- seed із демонстраційним каталогом.

#### Якість

- responsive layout від mobile до desktop;
- базова відповідність WCAG 2.2 AA;
- SSR metadata, canonical URL, Open Graph;
- Product, BreadcrumbList та Organization JSON-LD;
- `sitemap.xml` і `robots.txt`;
- unit, integration та end-to-end тести критичних flows;
- CI перевіряє formatting, lint, types, tests і build;
- deployment storefront, Vendure server, worker і PostgreSQL;
- README з live demo, screenshots, архітектурою та локальним запуском.

### 4.2 Portfolio release — після основного checkout

Один із цих модулів повинен бути реалізований як власний Vendure plugin. Пріоритет — reviews, тому що він демонструє entity, service, resolver, permissions і Dashboard extension.

- product reviews: рейтинг, текст, moderation status, average rating;
- wishlist для авторизованого клієнта;
- українська й англійська локалізації;
- реальний payment provider у test mode;
- інтеграція служби доставки;
- transactional email з production-провайдером;
- persistent local storage і backup для assets;
- webhook для інвалідації catalog cache;
- recently viewed products або рекомендації;
- окрема сторінка “Architecture / Case study” для портфоліо.

### 4.3 Advanced OSS platform release

Цей шар є частиною загального плану, але починається тільки після стабільного core commerce flow. У нього входять:

- BullMQ job queue для Vendure Worker з Valkey або іншим перевіреним Redis-compatible OSS backend;
- RabbitMQ topic exchange для versioned integration events;
- transactional outbox у PostgreSQL, щоб не втрачати events між database commit і publish;
- retries, delayed retry, manual acknowledgement та dead-letter queues;
- окремий integration worker з ідемпотентними consumers;
- Meilisearch як зовнішній повнотекстовий пошук із facets, typo tolerance і ranking rules;
- incremental indexing із commerce events і команда повного reindex;
- fallback на вбудований Vendure search при недоступності Meilisearch;
- production-safe local asset volume, image presets, modern formats і backup/restore;
- S3-compatible storage/MinIO лише як optional future adapter, не release requirement;
- OpenTelemetry traces/metrics із correlation ID через storefront, commerce, consumers та AI;
- Prometheus, Alertmanager, Grafana, Loki й Tempo у локальному observability profile;
- Uptime Kuma для external uptime/TLS/keyword checks; у production він працює поза monitored host;
- notification worker із email/in-app channel adapters, preferences, retry, DLQ та delivery audit;
- in-app notification center для авторизованого клієнта;
- Mailpit як локальний SMTP inbox та API для integration tests;
- optional Web Push після явної згоди користувача;
- локальний AI shopping assistant через Ollama;
- Qdrant як vector store для catalog/policy embeddings;
- RAG, allowlisted read-only tools, streaming response та evaluation dataset;
- окремі Docker Compose profiles, щоб core development не вимагав запуску всього stack.

Важливе уточнення: “free open source” означає, що software можна self-host без обов'язкової платної ліцензії. Production hosting, storage, RAM/GPU, domain та email delivery все одно можуть коштувати грошей. Для кожного pinned image/package перед додаванням перевіряються актуальна ліцензія, community/enterprise межа й умови redistribution.

### 4.4 Свідомо не входить у MVP

- marketplace з кількома продавцями;
- mobile app;
- складна ERP/PIM інтеграція;
- multi-warehouse routing;
- subscription commerce;
- loyalty points;
- gift cards;
- повернення коштів через реальний банк;
- автономний AI, який сам змінює cart/order або приймає рішення про оплату;
- окремий CMS;
- microservices заради microservices;
- Kubernetes.

Ці обмеження захищають головну ціль: завершити якісний end-to-end магазин, а не колекцію недороблених інтеграцій.

## 5. Користувачі та ключові сценарії

### 5.1 Гість

1. Відкриває головну сторінку.
2. Переходить до колекції або пошуку.
3. Фільтрує товари за категорією, сезоном, вагою, технічними параметрами, брендом і ціною.
4. Відкриває товар, обирає variant.
5. Додає товар у cart без реєстрації.
6. Оформлює замовлення й отримує confirmation.
7. За бажанням створює акаунт.

### 5.2 Авторизований покупець

1. Входить в акаунт.
2. Продовжує роботу зі своїм active order.
3. Використовує збережену адресу.
4. Переглядає історію та деталі замовлень.
5. У portfolio release залишає review і керує wishlist.

### 5.3 Адміністратор магазину

1. Створює product, option groups і variants.
2. Додає assets, prices і stock.
3. Призначає facets та collections.
4. Налаштовує shipping, payment і promotion.
5. Переглядає нове замовлення й створює fulfillment.
6. У portfolio release модерує reviews.

## 6. Високорівнева архітектура

```text
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  HTML/SSR, navigation, forms; без прямого Vendure token     │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  SolidStart storefront / BFF                 │
│  routes • SSR queries • server actions • session cookie      │
│  SEO • UI • validation • normalized application errors      │
└──────────────────────────────┬───────────────────────────────┘
                               │ GraphQL + Authorization header
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       Vendure Server                         │
│  Shop API • Admin API • catalog • cart • checkout • auth    │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │ enqueue jobs
                ▼                              ▼
┌──────────────────────────┐       ┌───────────────────────────┐
│       PostgreSQL         │       │      Vendure Worker       │
│ commerce data + SQL jobs │       │ search • email • jobs     │
└──────────────────────────┘       └─────────────┬─────────────┘
                                                │
                                      ┌─────────▼──────────┐
                                      │ email/assets/etc.  │
                                      └────────────────────┘

Адміністратор ───── HTTPS ─────► Vendure Dashboard ─────► Admin API
```

### 6.1 Правила межі між системами

- Browser не звертається до Vendure Shop API напряму.
- Усі персоналізовані query та всі mutation проходять через SolidStart server functions/actions.
- Публічні catalog query теж спочатку виконуються на SolidStart server для SSR і єдиного API client.
- Vendure є єдиним джерелом правди для price, tax, stock, eligibility, order state і totals.
- Storefront не дублює business rules Vendure.
- UI може робити optimistic update тільки там, де легко відкотити стан; відповідь Vendure завжди фінальна.
- Vendure Dashboard працює з Admin API; storefront ніколи не використовує admin credentials.

## 7. Структура monorepo

Цільова структура після scaffolding:

```text
ecommerce/
├─ apps/
│  ├─ storefront/                    # SolidStart application
│  │  ├─ public/
│  │  │  ├─ fonts/
│  │  │  ├─ icons/
│  │  │  └─ images/
│  │  ├─ src/
│  │  │  ├─ routes/                  # file-based UI/API routes
│  │  │  ├─ features/                # вертикальні product modules
│  │  │  ├─ components/              # app-level shared components
│  │  │  ├─ lib/                     # Vendure client, session, validation
│  │  │  ├─ styles/                  # tokens, reset, global styles
│  │  │  ├─ config/                  # public app configuration
│  │  │  ├─ app.tsx
│  │  │  ├─ entry-client.tsx
│  │  │  └─ entry-server.tsx
│  │  ├─ tests/
│  │  ├─ vite.config.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  │
│  ├─ commerce/                      # Vendure server + worker + Dashboard
│  │  ├─ src/
│  │  │  ├─ config/
│  │  │  ├─ migrations/
│  │  │  ├─ plugins/
│  │  │  │  ├─ reviews/
│  │  │  │  │  ├─ api/
│  │  │  │  │  ├─ entities/
│  │  │  │  │  ├─ services/
│  │  │  │  │  ├─ dashboard/
│  │  │  │  │  └─ reviews.plugin.ts
│  │  │  │  └─ notifications/
│  │  │  │     ├─ api/
│  │  │  │     ├─ entities/
│  │  │  │     ├─ services/
│  │  │  │     ├─ consumers/
│  │  │  │     ├─ channels/
│  │  │  │     └─ notifications.plugin.ts
│  │  │  ├─ scripts/
│  │  │  ├─ index.ts
│  │  │  ├─ index-worker.ts
│  │  │  └─ vendure-config.ts
│  │  ├─ static/
│  │  │  ├─ assets/
│  │  │  └─ email/
│  │  ├─ tests/
│  │  ├─ vite.config.ts              # Vendure Dashboard build
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  │
│  ├─ integration-worker/            # RabbitMQ consumers
│  │  ├─ src/
│  │  │  ├─ consumers/
│  │  │  │  ├─ search-indexer.ts
│  │  │  │  └─ ai-indexer.ts
│  │  │  ├─ messaging/
│  │  │  ├─ observability/
│  │  │  └─ index.ts
│  │  ├─ tests/
│  │  └─ package.json
│  │
│  └─ assistant/                     # internal AI/RAG service; не public напряму
│     ├─ src/
│     │  ├─ chat/
│     │  ├─ retrieval/
│     │  ├─ tools/
│     │  ├─ guardrails/
│     │  └─ index.ts
│     ├─ tests/
│     └─ package.json
│
├─ packages/
│  ├─ shop-api/                      # pure GraphQL operations + generated types
│  │  ├─ src/
│  │  │  ├─ fragments/
│  │  │  ├─ operations/
│  │  │  └─ generated/               # не редагувати вручну
│  │  ├─ codegen.ts
│  │  └─ package.json
│  ├─ ui/                            # design-system primitives
│  │  ├─ src/
│  │  └─ package.json
│  ├─ events/                        # versioned event contracts/envelopes
│  │  ├─ src/
│  │  └─ package.json
│  ├─ observability/                 # shared OTel bootstrap і propagation
│  │  ├─ src/
│  │  └─ package.json
│  └─ config/                        # shared TS/lint/test configuration
│     ├─ eslint/
│     ├─ typescript/
│     └─ package.json
│
├─ tests/
│  └─ e2e/                           # Playwright: full-system scenarios
├─ infra/
│  ├─ docker-compose.yml
│  ├─ compose/                       # core/platform/ai/observability profiles
│  ├─ docker/
│  │  ├─ storefront.Dockerfile
│  │  ├─ commerce.Dockerfile
│  │  ├─ integration-worker.Dockerfile
│  │  └─ assistant.Dockerfile
│  ├─ rabbitmq/
│  ├─ meilisearch/
│  ├─ assets/                        # local volume/backup/image preset config
│  ├─ qdrant/
│  ├─ otel/
│  ├─ prometheus/
│  ├─ alertmanager/
│  ├─ grafana/
│  ├─ uptime-kuma/
│  └─ scripts/
├─ docs/
│  ├─ adr/                           # architecture decision records
│  ├─ api/
│  ├─ diagrams/
│  └─ test-plan.md
├─ .github/
│  └─ workflows/
│     ├─ ci.yml
│     └─ deploy.yml
├─ .env.example
├─ .gitignore
├─ eslint.config.js
├─ package.json
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ README.md
└─ PROJECT_PLAN.md                   # цей документ
```

### 7.1 Коли створювати shared package

Не переносити код у `packages/*` тільки через можливість reuse. Package створюється, якщо виконується хоча б одна умова:

- код використовують два application packages;
- потрібна окрема межа залежностей;
- артефакт генерується окремо, як GraphQL types;
- це справді незалежна UI primitive, а не storefront-specific section.

## 8. Детальна структура SolidStart storefront

### 8.1 Routes

Фінальні імена треба звірити з file-routing conventions встановленої SolidStart версії, але URL-контракт такий:

```text
src/routes/
├─ index.tsx                         # /
├─ search.tsx                        # /search?q=&facets=&sort=&page=
├─ collections/
│  └─ [slug].tsx                     # /collections/:slug
├─ products/
│  └─ [slug].tsx                     # /products/:slug
├─ cart.tsx                          # /cart
├─ checkout.tsx                      # shared checkout layout/guard
├─ checkout/
│  ├─ information.tsx                # /checkout/information
│  ├─ shipping.tsx                   # /checkout/shipping
│  ├─ payment.tsx                    # /checkout/payment
│  └─ success.tsx                    # /checkout/success?code=
├─ auth/
│  ├─ login.tsx
│  ├─ register.tsx
│  ├─ verify.tsx
│  ├─ forgot-password.tsx
│  └─ reset-password.tsx
├─ account.tsx                       # protected account layout
├─ account/
│  ├─ index.tsx
│  ├─ profile.tsx
│  ├─ addresses.tsx
│  ├─ orders.tsx
│  └─ orders/[code].tsx
├─ about.tsx
├─ delivery-and-returns.tsx
├─ privacy.tsx
├─ terms.tsx
├─ sitemap.xml.ts                    # API route
├─ robots.txt.ts                     # API route
└─ [...404].tsx
```

### 8.2 Feature modules

```text
src/features/
├─ catalog/
│  ├─ components/
│  ├─ server/                        # server-only query wrappers
│  ├─ mappers/
│  ├─ schemas/
│  └─ types.ts
├─ product/
├─ cart/
├─ checkout/
├─ auth/
├─ account/
├─ search/
├─ navigation/
├─ reviews/                          # portfolio release
├─ wishlist/                         # optional portfolio release
└─ notifications/                    # in-app center та optional Web Push UI
```

Кожен feature може містити тільки те, що належить цьому use case. Route збирає feature components, але не містить великих GraphQL documents або бізнес-логіки.

### 8.3 Shared storefront layers

```text
src/lib/
├─ vendure/
│  ├─ server-client.ts               # server-only GraphQL transport
│  ├─ request-context.ts             # language, channel, currency
│  ├─ errors.ts                      # GraphQL/domain error mapping
│  └─ money.ts
├─ session/
│  ├─ server-session.ts
│  └─ cookies.ts
├─ validation/
├─ seo/
├─ observability/
└─ env/
```

Обов'язкові правила:

- `server-client.ts`, session і secret-bearing modules захищаються `server-only` marker import;
- secrets імпортуються тільки у server modules;
- generated GraphQL types не редагуються вручну;
- компоненти не роблять довільні `fetch` до Shop API;
- transport errors перетворюються на власні типи `AppError`;
- route показує користувачу безпечне повідомлення, а технічні деталі потрапляють у server log.

### 8.4 State management

- Persistent commerce state зберігається у Vendure, не в глобальному client store.
- Route data завантажується через `query`/`createAsync` primitives офіційного Solid Router.
- Mutation виконується через server actions.
- Cart context містить snapshot `activeOrder` для header/mini-cart, але після mutation оновлюється відповіддю Vendure або revalidation.
- UI-only state — відкритий drawer, selected gallery image, temporary form state — зберігається у Solid signals.
- URL є джерелом правди для search query, filters, sorting і pagination.
- Не додавати окрему state library, поки реальна проблема цього не вимагає.

## 9. Vendure application

### 9.1 Вбудовані можливості, які треба використати

- Products і ProductVariants;
- ProductOptionGroups для size/color combinations;
- Collections для дерева каталогу та landing selections;
- Facets/FacetValues для filterable attributes;
- Search API для listing, full-text search і facet aggregations;
- Channels для мови, валюти та майбутнього multi-store сценарію;
- Zones, TaxRates і TaxCategories;
- StockLocations і stock tracking;
- ShippingMethods;
- PaymentMethods;
- Promotions і coupon codes;
- Customers, Users, Roles і Permissions;
- ActiveOrder як cart;
- Orders, Payments і Fulfillments;
- Assets;
- EmailPlugin;
- Worker і persistent job queue;
- Dashboard.

Не створювати власні таблиці для речей, які вже правильно моделює Vendure.

### 9.2 Початкова Vendure конфігурація

- один default channel;
- `defaultLanguageCode: uk` лише якщо код підтримується актуальним enum; інакше узгоджений supported language з перекладом storefront окремо;
- UAH як default currency;
- одна default tax zone і одна shipping zone для demo;
- prices include tax — рішення має бути однаковим у seed і UI;
- stock tracking увімкнено;
- cookie secret, superadmin credentials і DB credentials тільки через environment variables;
- CORS дозволяє лише відомі storefront/dashboard origins;
- production GraphQL Playground вимкнено або захищено;
- окремі server і worker processes;
- SQL job queue для MVP;
- локальне asset storage в development;
- dummy payment у development/test;
- file mailbox або preview mailbox у development.

### 9.3 Custom reviews plugin

Мінімальна модель `ProductReview`:

| Поле                     | Тип/правило                             |
| ------------------------ | --------------------------------------- |
| `id`                     | Vendure ID                              |
| `product`                | relation до Product                     |
| `customer`               | relation до Customer                    |
| `orderLine`              | optional relation для verified purchase |
| `rating`                 | integer 1..5                            |
| `title`                  | 3..100 символів                         |
| `body`                   | 10..2000 символів                       |
| `status`                 | pending / approved / rejected           |
| `authorName`             | display value без публічного email      |
| `createdAt`, `updatedAt` | audit timestamps                        |

Shop API:

- `productReviews(productId, options)` — тільки approved;
- `productReviewSummary(productId)` — average + count distribution;
- `createProductReview(input)` — тільки authenticated customer;
- `updateOwnProductReview(input)`;
- `deleteOwnProductReview(id)` за визначеним правилом.

Admin API/Dashboard:

- список із filters/status;
- approve/reject;
- перегляд автора, товару й тексту;
- permission `ReadProductReview` / `UpdateProductReview` або найближча безпечна модель permissions.

Правила:

- один review клієнта на product або order line — рішення зафіксувати ADR;
- rating summary рахується тільки з approved reviews;
- mutation проходять server-side validation;
- не дозволяти клієнту задавати `status`;
- HTML із review не рендериться без sanitization; краще зберігати plain text.

## 10. Модель каталогу

### 10.1 Приклад

```text
Collection: Спорядження
└─ Collection: Намети
   └─ Product: Полонина Trek
      ├─ Option group: Capacity → 2P, 3P
      ├─ Option group: Color → Forest, Sand
      ├─ Variant: 2P / Forest → SKU, price, stock
      ├─ Variant: 3P / Forest → SKU, price, stock
      └─ ...
```

### 10.2 Facets

Початковий набір:

- `category` — логічна категорія, якщо потрібна для правил;
- `brand`;
- `activity` — hiking, camping, trekking, travel;
- `season` — summer, three-season, winter;
- `audience` — adult, youth, unisex;
- `color`, `size`, `material`;
- `capacity` — кількість людей або об'єм рюкзака залежно від category;
- `weightClass` — ultralight, lightweight, standard;
- `waterproofRating` — нормалізований технічний діапазон;
- `comfortTemperature` — нормалізований діапазон для sleeping bags;
- `feature` — new, bestseller, eco, limited;
- `price` не є facet: використовується price range search input.

Collections будують навігацію й merchandising; facets будують фільтри та правила. Не змішувати ці поняття лише тому, що в UI вони можуть виглядати схоже.

### 10.3 Правила даних

- У cart додається `ProductVariant`, а не Product.
- SKU унікальний і належить variant.
- Price і stock належать variant та відповідному channel.
- Гроші зберігаються й передаються як integer у найменшій одиниці валюти.
- UI ніколи не рахує authoritative total самостійно.
- Product slug повинен бути стабільним і унікальним у своїй мовній/channel області.
- Product assets мають alt text або структурований fallback.
- Видалення catalog data після появи orders має виконуватися через дозволений Vendure lifecycle, а не прямий SQL.
- Усі timestamps у backend зберігаються в UTC; UI форматує їх у locale користувача.
- Vendure ID сприймається як opaque string, а не як число.

## 11. GraphQL contract

### 11.1 Організація

- `.graphql` documents зберігаються у `packages/shop-api/src`.
- Повторювані selections винесені у fragments.
- Codegen читає schema з локального Vendure Shop API або committed schema snapshot.
- Generated код не редагується вручну.
- CI перевіряє, що codegen output актуальний.
- Storefront імпортує тільки ті operations/types, які потрібні use case.
- Admin API schema не потрапляє у storefront package.

### 11.2 Мінімальний набір Shop API operations

Каталог:

- `GetTopLevelCollections`;
- `GetCollectionBySlug`;
- `SearchProducts`;
- `GetProductBySlug`;
- `GetProductRecommendations` — може бути проста collection/facet-based реалізація;
- `GetAvailableCountries`.

Cart/checkout:

- `GetActiveOrder`;
- `AddItemToOrder`;
- `AdjustOrderLine`;
- `RemoveOrderLine`;
- `RemoveAllOrderLines`;
- `ApplyCouponCode`;
- `RemoveCouponCode`;
- `SetCustomerForOrder`;
- `SetOrderShippingAddress`;
- `SetOrderBillingAddress`;
- `GetEligibleShippingMethods`;
- `SetOrderShippingMethod`;
- `GetEligiblePaymentMethods`;
- `GetNextOrderStates`;
- `TransitionOrderToState`;
- `AddPaymentToOrder`;
- `GetOrderByCode` з безпечним authorization/token flow.

Auth/account:

- `GetActiveCustomer`;
- `Login`;
- `Logout`;
- `RegisterCustomerAccount`;
- `VerifyCustomerAccount`;
- `RequestPasswordReset`;
- `ResetPassword`;
- `UpdateCustomer`;
- `GetCustomerAddresses`;
- `CreateCustomerAddress`;
- `UpdateCustomerAddress`;
- `DeleteCustomerAddress`;
- `GetCustomerOrders`;
- `GetCustomerOrder`.

Назви локальних operations можуть відрізнятися, але кожна повинна мати одну зрозумілу відповідальність.

### 11.3 Error handling

Клієнт розрізняє:

1. Network/timeout error.
2. Non-2xx HTTP response.
3. GraphQL top-level errors.
4. Vendure union result із domain error, наприклад insufficient stock.
5. Validation error до виклику API.
6. Unexpected data shape — захисна runtime validation на критичних boundaries.

Для cart і checkout domain error показується біля відповідної дії. Невідомі помилки мають correlation/request ID у server log, але не витікають у UI разом зі stack trace.

## 12. Session, authentication і cart persistence

Рекомендований BFF flow:

1. Browser викликає SolidStart route/server action.
2. SolidStart читає власну `HttpOnly` session cookie.
3. Якщо в сесії є Vendure bearer token, server додає `Authorization: Bearer …` до Shop API request.
4. Після mutation Vendure може повернути новий token у response header.
5. SolidStart зберігає його у захищеній cookie/session і повертає browser тільки UI result.
6. Увесь наступний SSR і mutation використовує той самий token, тому guest active order не губиться.
7. Після logout storefront очищує локальну session cookie після успішного Vendure logout.

Cookie policy:

- `HttpOnly: true`;
- `Secure: true` у production;
- `SameSite: Lax` як початкове рішення;
- мінімально необхідний `Path`;
- контрольований max age, узгоджений із Vendure session duration;
- secret не менше production-safe random value;
- ніяких bearer tokens у `localStorage`, HTML або client logs.

CSRF та abuse controls:

- усі зміни стану тільки через POST/server actions;
- перевірка `Origin`/same-site для mutation endpoints;
- rate limiting для login, register, password reset і review creation;
- generic response для password reset, щоб не розкривати існування email;
- validation довжини та формату inputs;
- account pages перевіряють active customer на сервері;
- redirect target дозволяється лише з локального allowlist.

Окремий ADR повинен описати точну реалізацію cookie storage після першого proof of concept. Для SolidStart 2 HTTP/cookie helpers імпортуються з `@solidjs/start/http`, а deployment output визначає Nitro 3 preset.

## 13. Checkout як state machine

Storefront не хардкодить припущення, що будь-який перехід дозволений. Він запитує актуальне замовлення та дозволені наступні states у Vendure.

```text
Cart / adding items
        │
        ▼
Customer details + addresses
        │
        ▼
Eligible shipping method selected
        │
        ▼
Order transitioned to payment-arranging state
        │
        ▼
Payment added
   ┌────┴────────────┐
   ▼                 ▼
success          declined/error
   │                 │
   ▼                 └── user can retry safely
Order confirmation
```

Правила checkout:

- кожен step отримує свіжий `activeOrder`;
- route guard не пускає далі, якщо попередні дані відсутні;
- back navigation не пошкоджує order;
- повторний submit payment не повинен створювати дубль; для реального provider потрібна idempotency strategy;
- success page не вважає query parameter доказом оплати — order перевіряється через API;
- після завершення checkout mini-cart оновлюється до нового/порожнього active order;
- shipping і payment eligibility визначає Vendure;
- ціна повторно перевіряється перед фінальним submit;
- checkout forms зберігають лише безпечні draft values; card data storefront не зберігає.

## 14. UI, design system та accessibility

### 14.1 Design tokens

- color roles: background, surface, text, muted, primary, danger, success, border;
- typography scale;
- spacing scale;
- radii;
- shadows;
- motion durations/easings;
- container widths і breakpoints;
- focus ring;
- light theme обов'язково, dark theme — тільки після MVP.

### 14.2 UI primitives

- Button;
- LinkButton;
- Input, Textarea, Select, Checkbox, Radio;
- Field + label/help/error;
- Dialog/Drawer;
- Toast або live notification region;
- Price;
- Badge;
- Skeleton;
- EmptyState;
- ErrorState;
- Pagination;
- Breadcrumbs;
- ResponsiveImage;
- QuantitySelector.

### 14.3 Storefront components

- Header, navigation, search, account link, cart badge;
- MobileMenu;
- Footer;
- Hero;
- CollectionCard/Grid;
- ProductCard/Grid;
- ProductGallery;
- VariantSelector;
- AddToCartForm;
- FacetFilters;
- SortControl;
- MiniCart;
- CartLine;
- OrderSummary;
- AddressForm;
- ShippingMethodList;
- PaymentMethodList;
- AccountNavigation;
- OrderStatus;
- ReviewSummary/List/Form у portfolio release.

### 14.4 Accessibility checklist

- повна keyboard navigation;
- видимий focus;
- semantic headings і landmarks;
- label для кожного control;
- error summary та field errors пов'язані через ARIA;
- dialog має focus trap, return focus і Escape;
- зміна cart count оголошується через live region;
- color contrast не нижче AA;
- touch targets достатнього розміру;
- `prefers-reduced-motion` враховано;
- product images мають змістовні alt або порожній alt для декоративних;
- loading не приховує контент від assistive technology без пояснення;
- axe check входить у component/e2e tests.

## 15. SEO та social sharing

Для кожної indexable сторінки:

- унікальні `title` і meta description;
- canonical URL;
- Open Graph/Twitter metadata;
- language/locale metadata;
- SSR content без залежності від client-only fetch;
- breadcrumb navigation;
- коректний HTTP status для 404;
- filter combinations не створюють необмежену кількість indexable duplicate URLs.

Structured data:

- `Organization` на site level;
- `WebSite` + search action, якщо реалізація валідна;
- `Product` + `Offer`/`AggregateOffer` на PDP;
- `AggregateRating` тільки коли є approved reviews;
- `BreadcrumbList` для collection/PDP.

Технічні сторінки:

- dynamic `sitemap.xml` для products і collections;
- `robots.txt` закриває cart, checkout, auth та account;
- preview/staging повністю закритий від індексації;
- image width/height відомі до render, щоб не створювати layout shift.

## 16. Performance targets

Цілі для production demo на mobile profile:

- Lighthouse Performance, Accessibility, Best Practices, SEO: прагнути 90+;
- LCP ≤ 2.5 s;
- CLS ≤ 0.1;
- INP ≤ 200 ms;
- мінімальний client JavaScript на catalog pages;
- responsive images із modern formats;
- fonts self-hosted, subset і preload тільки потрібного;
- не завантажувати checkout/account code на landing page;
- AI chat UI та model connection завантажуються lazy й не впливають на LCP;
- search/AI calls мають timeout, circuit breaker і контрольований fallback;
- catalog response можна коротко кешувати;
- cart, customer, checkout і personalized responses ніколи не кешуються як public.

Порядок оптимізації: спочатку вимірювання, потім зміна. Не додавати Redis/CDN cache без профілювання або чіткої deployment потреби.

## 17. Security baseline

- secrets тільки в environment/secret manager;
- `.env` не комітиться, `.env.example` не містить реальних значень;
- production cookies secure та HttpOnly;
- HTTPS усюди;
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame restrictions;
- CORS allowlist, не wildcard із credentials;
- окремі сильні superadmin credentials;
- принцип найменших permissions для Dashboard roles;
- Shop API і Admin API не змішуються;
- GraphQL query depth/complexity та rate limits оцінити перед public launch;
- uploaded assets перевіряються за MIME/type/size;
- user content вважається untrusted;
- dependency audit у CI без автоматичного небезпечного fix;
- database backup і restore procedure описані до production release;
- logs не містять password, bearer token, cookie, payment data або повної персональної адреси;
- RabbitMQ, Valkey, Meilisearch, Qdrant, Ollama та telemetry backends знаходяться у private network і не публікують admin ports;
- кожен internal service має окремі credentials із least privilege;
- broker payload не містить secrets і мінімізує PII;
- AI tools мають allowlist, schema validation, authorization і resource limits незалежно від відповіді моделі;
- моделі й container images pin-яться та проходять license/supply-chain перевірку;
- privacy/terms сторінки позначені як demo templates, не як готова юридична консультація.

## 18. Environment variables

Попередній контракт `.env.example`:

```dotenv
# Shared
NODE_ENV=development

# Storefront server-only
SERVER_VENDURE_SHOP_API_URL=http://localhost:3000/shop-api
SERVER_SESSION_SECRET=replace-with-long-random-value

# Storefront public
CLIENT_SITE_URL=http://localhost:3001
CLIENT_STORE_NAME=Karpaty Gear
CLIENT_DEFAULT_LOCALE=uk-UA

# Vendure
APP_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USERNAME=postgres
DB_PASSWORD=postgres
COOKIE_SECRET=replace-with-long-random-value
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=replace-me
STOREFRONT_URL=http://localhost:3001
DASHBOARD_URL=http://localhost:3000/dashboard

# Optional production integrations
ASSET_STORAGE_DRIVER=local
ASSET_STORAGE_PATH=/data/assets
ASSET_PUBLIC_URL=http://localhost:3000/assets
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_ADDRESS="Portfolio Store <noreply@example.test>"
MAILPIT_SMTP_HOST=localhost
MAILPIT_SMTP_PORT=1025
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=

# Advanced platform
VALKEY_HOST=localhost
VALKEY_PORT=6379
RABBITMQ_URL=amqp://app:replace-me@localhost:5672/ecommerce
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=replace-me
NOTIFICATIONS_ENABLED=true
WEB_PUSH_ENABLED=false
WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=

# Local AI
ASSISTANT_INTERNAL_URL=http://localhost:3100
ASSISTANT_INTERNAL_TOKEN=replace-me
OLLAMA_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=pin-after-benchmark
OLLAMA_EMBEDDING_MODEL=pin-after-benchmark
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=replace-me
AI_ASSISTANT_ENABLED=false

# Telemetry
OTEL_SERVICE_NAME=ecommerce-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_ENVIRONMENT=development
OTEL_TRACES_SAMPLER=always_on
PROMETHEUS_RETENTION_TIME=30d
LOKI_RETENTION_PERIOD=168h
TEMPO_RETENTION_PERIOD=168h
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=replace-me
ALERTMANAGER_SMTP_HOST=mailpit:1025
```

Назви треба уточнити під реальні adapters. Public prefix визначається конфігурацією SolidStart; секретні values мають fail-fast validation на startup.

## 19. Локальна розробка

Очікуваний happy path після bootstrap:

```text
pnpm install
pnpm infra:up
pnpm infra:up:platform
pnpm infra:up:ai
pnpm infra:up:observability
pnpm db:migrate
pnpm seed
pnpm dev
```

Очікувані endpoints:

- storefront: `http://localhost:3001`;
- Shop API: `http://localhost:3000/shop-api`;
- Admin API: `http://localhost:3000/admin-api`;
- Dashboard: `http://localhost:3000/dashboard`;
- Vendure health: `http://localhost:3000/health`;
- worker health: окремий порт, якщо ввімкнено.
- RabbitMQ management: тільки local/private port;
- Meilisearch: `http://localhost:7700`, не public у production;
- assets: `http://localhost:3000/assets/*`, файли фізично зберігаються у persistent volume;
- Qdrant: `http://localhost:6333`, не public;
- Ollama: `http://localhost:11434`, не public;
- Grafana: `http://localhost:3003`, local/private;
- Prometheus: `http://localhost:9090`, local/private;
- Alertmanager: `http://localhost:9093`, local/private;
- Uptime Kuma: `http://localhost:3002`, local demo; production instance окремо від application host;
- Mailpit UI: `http://localhost:8025`; development/testing only, не public у production.

Root scripts:

- `dev` — storefront + commerce server + worker;
- `dev:storefront`;
- `dev:commerce`;
- `dev:worker`;
- `build`;
- `typecheck`;
- `lint`;
- `format` / `format:check`;
- `test`;
- `test:unit`;
- `test:integration`;
- `test:e2e`;
- `codegen` / `codegen:check`;
- `db:migrate` / `db:rollback`;
- `seed`;
- `infra:up` / `infra:down`.
- `infra:up:platform` / `infra:up:ai` / `infra:up:observability` / `infra:up:full`;
- `events:replay` / `events:dlq:list`;
- `search:reindex` / `search:reconcile`;
- `ai:reindex` / `ai:eval`.
- `monitoring:check` — validate Prometheus rules, Alertmanager config і provisioned dashboards;
- `monitoring:smoke` — test metric, trace, log та firing/resolved alert path.

Не запускати destructive seed/reset проти production database. Environment guard повинен блокувати це.

## 20. Тестова стратегія

### 20.1 Unit tests

Тестувати:

- money/locale formatting;
- URL filter serialization і parsing;
- GraphQL/domain error mapping;
- form schemas;
- variant selection logic;
- pure mappers;
- reviews validation/rating aggregation;
- access helpers і route guards.

### 20.2 Component tests

- VariantSelector;
- QuantitySelector;
- CartLine;
- FacetFilters;
- forms з validation errors;
- dialogs/drawers і keyboard behavior;
- empty/error/loading states.

### 20.3 Vendure integration tests

- custom plugin resolvers і permissions;
- review moderation rules;
- seed/migrations;
- Shop API operation проти test database;
- session/active order behavior;
- test payment і order transition.
- outbox record створюється в тій самій transaction, що й domain change;
- publisher confirm/retry та idempotent event consumer;
- BullMQ retry/concurrency behavior;
- Meilisearch incremental update/delete/reindex/reconciliation;
- Qdrant upsert/delete та metadata filters;
- RabbitMQ DLQ/replay flow.
- EmailPlugin handlers/templates через Mailpit API;
- notification ownership/preferences/idempotency;
- transient/permanent email failure і notification DLQ;
- optional Web Push subscription authorization та revoked endpoint cleanup.

### 20.4 End-to-end tests

P0 flows:

1. Гість відкриває collection, фільтрує та відкриває PDP.
2. Гість обирає variant, додає його у cart і змінює quantity.
3. Cart відновлюється після reload.
4. Гість проходить checkout тестовою оплатою.
5. Невистачаючий stock показує коректну помилку.
6. Coupon застосовується, а total відповідає Vendure.
7. Користувач реєструється, підтверджує email і входить.
8. Авторизований користувач бачить створене замовлення.
9. Account route недоступний гостю.
10. У portfolio release review проходить moderation і з'являється на PDP.
11. У full profile product update асинхронно з'являється у Meilisearch та AI retrieval.
12. При зупиненому Meilisearch catalog використовує fallback.
13. При зупинених Ollama/Qdrant storefront і checkout залишаються робочими.
14. AI assistant не виконує недозволену mutation після prompt injection request.
15. Account verification і order confirmation створюють очікувані email без дублювання.
16. Fulfillment event створює notification згідно з preferences, а інший customer не має до нього доступу.

### 20.5 Quality gate

Pull request не готовий до merge, якщо не проходять:

- format check;
- lint;
- TypeScript strict check;
- GraphQL codegen check;
- unit/integration tests;
- production build обох apps;
- P0 e2e smoke для release branch.
- license/image policy check для advanced self-hosted services;
- AI eval regression для змін model/prompt/retrieval у відповідному pipeline.
- Prometheus/Alertmanager/OTel config validation і monitoring smoke для observability changes.

Coverage percentage не є самоціллю. Усі price/cart/checkout/auth/review rules мають позитивні й негативні тести.

## 21. Seed і demo content

Seed повинен створювати відтворюваний портфоліо-каталог:

- 4–6 collections;
- 20–30 products;
- 2–8 variants для більшості products;
- реалістичні SKU;
- різний stock, включно з low/out-of-stock cases;
- facets для filters;
- featured, new і sale selections;
- щонайменше одна promotion без coupon;
- щонайменше один coupon code;
- два shipping methods;
- test payment method;
- demo customer;
- кілька історичних orders у безпечному test environment;
- approved/pending reviews після появи plugin.

Вимоги до контенту:

- не використовувати чужі бренди як власні;
- images мають бути власними, згенерованими або з чіткою ліцензією;
- ліцензії й attribution, якщо потрібні, зберігати у `docs/assets-licenses.md`;
- product descriptions мають виглядати як реальний контент, а не lorem ipsum;
- seed можна запускати повторно або він чітко повідомляє, що дані вже існують.

## 22. CI/CD і deployment

### 22.1 CI

GitHub Actions pipeline:

1. Checkout.
2. Встановлення зафіксованої Node/pnpm версії.
3. `pnpm install --frozen-lockfile`.
4. Cache pnpm store.
5. Format/lint/typecheck/codegen check.
6. Unit та integration tests із PostgreSQL service container.
7. Build storefront, Vendure server/worker і Dashboard.
8. E2E smoke у release/PR pipeline, якщо час виконання прийнятний.
9. Завантаження test reports/artifacts при failure.

### 22.2 Production topology

```text
Public domain
├─ www.example.com       → SolidStart server/runtime
├─ api.example.com       → Vendure server
└─ admin.example.com     → Vendure Dashboard/Admin API access

Private services
├─ Vendure worker
├─ PostgreSQL
├─ Valkey + BullMQ
├─ RabbitMQ
├─ integration worker
├─ Meilisearch
├─ local persistent asset volume + transform cache
├─ assistant + Ollama + Qdrant
└─ OTel Collector + Prometheus/Alertmanager + Grafana/Loki/Tempo

Separate monitoring failure domain
└─ Uptime Kuma → public storefront/API/TLS probes
```

Для портфоліо deployment provider обирається після локального MVP за критеріями: підтримка Node runtime/adapters, background worker, persistent asset volume, managed PostgreSQL, secrets, logs, health checks і прогнозована ціна. Не прив'язувати domain logic до конкретного provider.

Production requirements:

- окремий server і worker process з одного Vendure image;
- health/readiness checks;
- автоматичні migrations як контрольований release step, не race між replicas;
- persistent PostgreSQL;
- assets не залежать від ephemeral filesystem;
- backup policy;
- staging environment або preview із окремою database;
- secrets у provider secret store;
- rollback image/version;
- після deploy запускається smoke test: home → PDP → cart → API health.

Core release працює на SQL queue, щоб спочатку завершити commerce flow і мати baseline. Advanced platform release свідомо мігрує Vendure jobs на BullMQ із self-hosted Valkey/перевіреним Redis-compatible backend — не тому, що demo traffic цього вимагає, а як окремий навчальний і portfolio milestone. В ADR та case study треба показати вимірювання до/після, операційну ціну й умови, за яких у реальному невеликому магазині SQL queue була б кращим рішенням.

## 23. Monitoring та observability

Monitoring відповідає на питання “чи працює система і чи треба діяти”, а observability — “чому вона не працює”. Для проєкту потрібні обидва.

### 23.1 OSS stack

| Шар                    | Технологія                                                  | Відповідальність                                                          |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| Instrumentation        | OpenTelemetry SDK + Vendure TelemetryPlugin                 | traces, metrics/log correlation, framework/database hooks                 |
| Collection             | OpenTelemetry Collector                                     | OTLP receive, batching, filtering, redaction, sampling, export            |
| Metrics                | Prometheus                                                  | scraping, time series, recording/alerting rules                           |
| Dashboards             | Grafana OSS                                                 | єдиний UI для metrics, logs і traces                                      |
| Logs                   | Loki                                                        | structured application/container logs                                     |
| Traces                 | Tempo                                                       | distributed traces між storefront, Vendure, broker consumers, search і AI |
| Alert routing          | Alertmanager                                                | grouping, deduplication, inhibition, silences, SMTP/webhook routing       |
| Internal probes        | Prometheus Blackbox Exporter                                | HTTP/TCP/DNS/TLS probes з monitoring network                              |
| External uptime        | Uptime Kuma                                                 | незалежні public endpoint, keyword, TLS certificate і status-page checks  |
| Host/container metrics | node_exporter + cAdvisor у Linux production                 | CPU, RAM, filesystem, network і container saturation                      |
| Data services          | postgres/RabbitMQ/Valkey та інші exporters/native endpoints | database, broker, cache/search/vector/object-storage health               |

Порядок впровадження:

1. Core: structured logs, correlation ID, liveness/readiness і Vendure health.
2. Metrics: Prometheus + Grafana, business/queue metrics і перші dashboards.
3. Tracing/log aggregation: Vendure TelemetryPlugin + OTel Collector + Tempo/Loki.
4. Alerting: Prometheus rules + Alertmanager + перевірені runbooks.
5. External monitoring: Uptime Kuma в окремому failure domain і synthetic checks.

Uptime Kuma у локальному Compose profile зручний для demo. У production його треба запускати на іншому host/network: monitor, який помирає разом із monitored server, не повідомить про повний outage.

### 23.2 Telemetry flow

```text
Storefront / Vendure / workers / assistant
           │ OTLP + correlation context
           ▼
   OpenTelemetry Collector
      ├─ metrics ─► Prometheus ─► alert rules ─► Alertmanager
      │                 │                              │
      │                 └──────────► Grafana           └─► SMTP/generic webhook
      ├─ traces ──► Tempo ─────────► Grafana
      └─ logs ────► Loki ──────────► Grafana

Blackbox Exporter ─► Prometheus
External Uptime Kuma ─► public storefront/API/TLS checks
```

OTel Collector є єдиною telemetry export boundary. Application services не знають про конкретні Loki/Tempo/Prometheus endpoints. Collector має memory limiter, batching і redaction. Для низького demo traffic можна зберігати всі traces; sampling додається після вимірювання volume. Якщо sampling потрібний, errors і high-latency traces зберігаються пріоритетно, а successful traces семплюються.

### 23.3 Що вимірювати

#### Golden signals

Для кожного public/internal service:

- traffic/request rate;
- latency p50/p95/p99;
- error rate за normalized status/error class;
- saturation: CPU, memory, event loop lag, connection/thread/queue usage.

#### Core commerce

- storefront SSR request duration/error;
- Shop API GraphQL duration/error за operation name;
- database connection pool usage, query duration, locks і storage;
- login/register/password-reset failures без email/customer labels;
- add-to-cart success/failure;
- checkout system success/failure;
- payment handler result за low-cardinality status;
- order state transition failures;
- worker heartbeat і job duration/failures;
- email verification/order-confirmation generation failures.

#### Async platform

- BullMQ queue depth, active/waiting/failed jobs і age of oldest job;
- RabbitMQ ready/unacked messages, consumer count, redelivery rate і DLQ depth;
- outbox unpublished count та age of oldest unpublished event;
- consumer processing latency, retry і idempotent duplicate count;
- Meilisearch query/index latency, zero-result rate, fallback count і projection drift;
- Qdrant/Ollama request latency/errors;
- notification pending/sent/failed/dead і age of oldest pending delivery;
- asset-volume usage/free space, asset route errors і image-transform failures.

#### AI

- request count/status;
- time to first token і total latency;
- retrieval latency/result count;
- tool call count/failure/denial;
- model timeout/context-limit events;
- fallback/feature-disabled count;
- offline eval results як release artifact, не як high-cardinality runtime metric.

Business metrics не повинні перетворювати monitoring на product analytics. Orders/checkout counts можна агрегувати server-side, але clickstream, chat content і marketing attribution потребують окремого consent/privacy рішення.

### 23.4 Metrics cardinality і privacy

У Prometheus labels заборонені:

- customer/user ID;
- email;
- order code/ID;
- product/variant ID для необмеженого catalog;
- URL із довільними query params;
- exception message;
- AI prompt/tool arguments.

Дозволені low-cardinality labels: service, environment, route template, GraphQL operation name, HTTP method/status class, queue name з allowlist, notification channel/status, error code із контрольованого enum.

Logs/traces можуть містити більше debugging context, але без password, cookie, bearer token, reset token, payment data, повної адреси або AI prompt із PII. Correlation ID пов'язує signals без копіювання sensitive payload.

### 23.5 Health, readiness і synthetic checks

Кожен process має розрізняти:

- liveness — process/event loop живий; не перевіряє всі downstream dependencies;
- readiness — process може виконувати свою критичну роль;
- dependency diagnostics — детальний private endpoint для operator-а.

Readiness Vendure залежить від PostgreSQL, але не повинна падати через optional Ollama або Meilisearch, якщо працює fallback. Liveness не можна прив'язувати до database/search, інакше dependency outage створить restart storm.

Checks:

- storefront home повертає очікуваний status і marker;
- Vendure `/health`;
- worker heartbeat/health;
- PostgreSQL connection;
- RabbitMQ/Valkey readiness;
- Meilisearch/Qdrant API health;
- asset volume read/write availability і вільне місце;
- AI shallow readiness без дорогої повної generation на кожен probe;
- TLS expiry;
- staging synthetic: home → search → PDP → cart → test checkout;
- production synthetic checkout лише через окремий demo channel/payment/data cleanup, щоб не створювати справжні orders або fulfillment.

### 23.6 Початкові SLI/SLO

Це стартові portfolio targets, які уточнюються після load test і production baseline:

| SLI                                     | Початковий SLO                                          |
| --------------------------------------- | ------------------------------------------------------- |
| Public storefront availability          | ≥ 99.5% за rolling 30 days                              |
| Vendure Shop API availability           | ≥ 99.5% за rolling 30 days                              |
| Core 5xx rate                           | < 1% за 15-minute window                                |
| Checkout system success                 | ≥ 99% без user validation і очікуваних payment declines |
| Warm catalog search p95                 | < 300 ms на documented demo hardware                    |
| Outbox oldest unpublished age           | < 60 s у normal operation                               |
| Critical worker oldest queued job       | < 60 s у normal operation                               |
| Notification critical delivery accepted | ≥ 99% протягом 5 min у test SMTP boundary               |
| AI assistant                            | Optional; outage не витрачає core availability budget   |

Latency thresholds завжди містять environment/hardware/load context. Не заявляти production-grade цифри за результатами одного локального запиту.

### 23.7 Dashboards

Dashboards provision-яться з repository як code:

1. Executive/core health: availability, 5xx, latency, checkout, active alerts.
2. Storefront/Vendure: routes/operations, SSR, database, worker.
3. Messaging: BullMQ, RabbitMQ, outbox, retries, DLQ, consumers.
4. Search/assets: Meilisearch, fallback, indexing drift, local asset volume і image transforms.
5. Notifications: delivery states, latency, failures, Mailpit test status.
6. AI: Ollama/Qdrant, TTFT, tool errors, fallback.
7. Infrastructure: host/container CPU, RAM, disk, network.

Кожна dashboard panel має зрозумілу одиницю, description і посилання на відповідний runbook/trace/log view. Dashboard без owner або рішення, яке з нього можна прийняти, не додається.

### 23.8 Alert policy

Prometheus rules визначають умови; Alertmanager групує, дедуплікує, пригнічує залежні alerts, підтримує silences і маршрутизує notification.

Operational alerts не проходять через customer `NotificationsPlugin`: це різні domains, recipients, retention і failure paths. Навіть якщо commerce notification worker зламаний, Alertmanager повинен повідомити operator-а незалежним каналом.

| Severity   | Приклади                                                                                                                   | Реакція                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `critical` | storefront/Vendure/DB down; sustained checkout system failure; disk майже заповнений; outbox/critical queue повністю stuck | Негайна actionable notification          |
| `warning`  | elevated 5xx/latency; DLQ > 0; search fallback довше threshold; notification failure spike; certificate expiry approaching | Перевірити найближчим часом              |
| `info`     | AI unavailable; reindex drift; optional service disabled                                                                   | Dashboard/daily review, без нічного page |

Правила alert-ів:

- кожен alert має `summary`, impact, likely cause, dashboard URL і runbook URL;
- використовувати `for` duration, щоб не реагувати на короткий spike;
- dependency alerts інгібують похідні service alerts;
- один outage не створює десятки notification;
- alert на симптом користувача важливіший за alert на внутрішню метрику;
- AI/search optional outage не має severity `critical`, поки checkout/fallback працюють;
- alert перевіряється тестовим firing/resolution до merge;
- dead/never-tested alerts видаляються.

Local Alertmanager надсилає у Mailpit або generic test webhook. Production receiver обирається окремо; сам Alertmanager залишається OSS routing layer.

### 23.9 Runbooks

`docs/runbooks/` містить щонайменше:

- `storefront-down.md`;
- `vendure-unhealthy.md`;
- `postgres-unavailable-or-slow.md`;
- `disk-space-low.md`;
- `worker-or-queue-stuck.md`;
- `rabbitmq-dlq.md`;
- `outbox-not-publishing.md`;
- `search-fallback-active.md`;
- `notification-delivery-failing.md`;
- `ai-unavailable.md`.

Runbook описує impact, safe diagnostics, mitigation, recovery verification, rollback і коли ескалувати. Він не містить production secrets або destructive команди без окремого підтвердження target/environment.

### 23.10 Retention і захист monitoring stack

Початковий self-hosted орієнтир:

- Prometheus metrics: 30 days;
- Loki logs: 7–14 days;
- Tempo traces: 7 days;
- Uptime history: 90 days;
- alerts/silences: persistent volume за потреби.

Retention коригується за реальним disk usage. Monitoring services знаходяться у private network, Grafana/Prometheus/Loki/Tempo/exporters не відкриваються public без authentication/reverse proxy. Grafana anonymous admin заборонений. Alert receivers і datasource credentials є secrets.

Потрібно моніторити сам monitoring stack: Prometheus scrape failures, rule evaluation errors, Collector dropped data/queue, Loki/Tempo write errors, disk usage, Alertmanager notification failures і Uptime Kuma heartbeat.

### 23.11 Monitoring acceptance criteria

Monitoring layer завершений, коли:

1. Один trace проходить storefront → Vendure → outbox/RabbitMQ → consumer.
2. Grafana дозволяє перейти від alert до dashboard, trace і correlated logs.
3. Навмисний test 5xx активує alert після `for` duration і надсилає resolved notification.
4. Зупинка worker-а активує queue/heartbeat alert, а не хибний storefront-down alert.
5. Meilisearch outage показує fallback metric і warning, але не critical checkout alert.
6. AI outage має info severity й не впливає на core SLO.
7. DLQ/outbox-stuck і disk-low scenarios мають перевірені alerts/runbooks.
8. Uptime Kuma з іншого failure domain бачить public outage і TLS expiry.
9. Prometheus labels не містять high-cardinality IDs або PII.
10. Restore dashboards/rules/config із repository перевірено на чистому environment.

## 24. Розширена free/open-source platform architecture

### 24.1 Принципи вибору технологій

Нова технологія додається, лише якщо:

1. Вона вирішує конкретну проблему або демонструє окремий engineering concept.
2. Її community edition та потрібні функції справді можна self-host.
3. Для pinned version/image перевірена й записана OSS license.
4. Для неї є health check, persistent volume, backup/rebuild strategy та integration test.
5. Вона прихована за application adapter, тому її можна замінити без переписування commerce domain.
6. Недоступність optional service не повинна блокувати checkout.
7. У README пояснено не лише “як”, але й “навіщо”, trade-offs та простішу альтернативу.

Не використовувати cloud-only або enterprise-only feature, якщо без нього локальний проєкт втрачає ключову функціональність. Не використовувати `latest` image у відтворюваному середовищі — усі images pin-яться після перевірки license і compatibility.

### 24.2 Docker Compose profiles

Щоб не вимагати багато RAM для звичайної UI роботи, інфраструктура поділяється на profiles:

| Profile         | Сервіси                                                                                                   | Для чого                                          |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `core`          | PostgreSQL, Vendure server, SQL worker, storefront                                                        | Каталог, cart, checkout, account                  |
| `platform`      | Valkey, RabbitMQ, integration worker, Meilisearch, Mailpit                                                | Distributed jobs, events, search, email testing   |
| `ai`            | Ollama, Qdrant, assistant service                                                                         | Local LLM, embeddings, RAG і tools                |
| `observability` | OTel Collector, Prometheus, Alertmanager, Blackbox Exporter, Grafana, Loki, Tempo, exporters, Uptime Kuma | Metrics, logs, traces, alerts, probes, dashboards |
| `full`          | усі попередні                                                                                             | Demo, E2E та architecture showcase                |

Core tests не залежать від AI hardware. AI profile має документувати мінімальні RAM/VRAM вимоги обраної моделі та мати маленьку CPU-compatible модель для smoke tests.

### 24.3 Ролі черг і broker-ів

BullMQ та RabbitMQ не дублюють одне одного:

| Механізм                       | Тип роботи                                                       | Приклади                                                                      |
| ------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Vendure Worker + BullMQ/Valkey | Command/job: один job має бути виконаний worker-ом               | email, search rebuild, collection update, image processing, scheduled cleanup |
| RabbitMQ                       | Integration event: факт може мати кількох незалежних subscribers | product changed, review approved, order placed, asset updated                 |

Для невеликого core release достатньо SQL job queue. Advanced release замінює її на BullMQ, щоб продемонструвати push-based queue, concurrency, retry, delayed jobs і горизонтальне масштабування worker-ів.

RabbitMQ використовується через topic exchange `commerce.events`. Початкові routing keys:

- `catalog.product.updated.v1`;
- `catalog.product.deleted.v1`;
- `catalog.collection.updated.v1`;
- `catalog.asset.updated.v1`;
- `review.approved.v1`;
- `review.deleted.v1`;
- `order.placed.v1`;
- `order.fulfillment.updated.v1`.

Подія має versioned envelope:

```ts
type IntegrationEvent<TType extends string, TPayload> = {
  eventId: string;
  type: TType;
  version: 1;
  occurredAt: string;
  aggregateId: string;
  channelId: string;
  correlationId?: string;
  payload: TPayload;
};
```

У payload передається мінімум даних. Події каталогу передають IDs та версію/`updatedAt`, а consumer дочитує актуальну projection. Customer address, token, password, payment details та зайва PII у broker не потрапляють.

### 24.4 Transactional outbox

Прямий publish у RabbitMQ із request handler заборонений: database transaction може завершитися, а publish — ні, або навпаки.

```text
Vendure transaction
   ├─ змінює commerce entity
   └─ записує OutboxEvent у тій самій PostgreSQL transaction
                    │
                    ▼
            outbox publisher job
                    │ publish confirm
                    ▼
          RabbitMQ commerce.events
             ├─ search-index queue
             ├─ ai-index queue
             └─ notification queue
```

Outbox record містить `eventId`, `type`, `version`, payload, timestamps, attempts, last error і published marker. Publisher:

- читає batch із locking, без паралельного дублювання;
- публікує persistent message;
- використовує publisher confirms;
- відмічає event published тільки після confirm;
- повторює transient failures із exponential backoff та jitter;
- залишає failed event доступним для replay/операторського аналізу;
- періодично очищує старі published records за retention policy.

Delivery semantic — at least once. Кожен consumer зобов'язаний бути ідемпотентним:

- зберігати processed `eventId` або використовувати idempotent upsert;
- ack робити лише після успішної durable зміни;
- transient error → retry queue з обмеженою кількістю спроб;
- poison message → dead-letter queue;
- DLQ має метрику, alert і documented replay command;
- порядок гарантується тільки там, де це явно потрібно; version/`updatedAt` не дозволяє старій події перезаписати новий index document.

### 24.5 Meilisearch integration

Meilisearch є read model для product discovery, але не джерелом правди для checkout.

Index document містить:

- product/variant IDs;
- channel і locale;
- name, slug, description excerpt;
- collection IDs/slugs;
- facets і option values;
- searchable SKU;
- price range для filtering/sorting;
- availability projection;
- primary asset URL/metadata;
- popularity/manual ranking fields;
- `updatedAt`/projection version.

Flow індексації:

1. Зміна catalog entity створює outbox event.
2. RabbitMQ доставляє event у `search-index` queue.
3. Consumer отримує актуальну projection із Vendure/service layer.
4. Consumer робить idempotent upsert/delete у Meilisearch.
5. Метрики фіксують indexing latency і failures.

Обов'язкові capabilities:

- typo-tolerant full-text search;
- facets і facet counts;
- filters за collection/channel/locale/availability/price;
- ranking rules і sortable attributes;
- synonyms для української outdoor-предметної області, наприклад `намет ↔ палатка`, `рюкзак ↔ наплічник`, `спальник ↔ спальний мішок`;
- zero-result state та query suggestions без зовнішнього SaaS;
- alias/versioned index для безпечного full reindex;
- CLI/admin job `search:reindex`;
- reconciliation job, який знаходить drift;
- search-only key ніколи не має index-management permissions;
- master/admin key не потрапляє у browser.

Storefront звертається до search adapter через SolidStart BFF. Якщо Meilisearch недоступний, circuit breaker відкривається й catalog search тимчасово використовує Vendure search із деградованими, але робочими можливостями. Add-to-cart і checkout завжди повторно перевіряють price/stock у Vendure, тому eventual consistency пошукового індексу не може продати товар за невалідною ціною.

### 24.6 AI shopping assistant

Мета AI-помічника — допомогти підібрати й порівняти outdoor-спорядження під маршрут, сезон, кількість людей, досвід і бюджет; пояснити характеристики та відповісти на питання про доставку/повернення. Ключовий demo prompt: «Підбери спорядження для дводенного осіннього походу Карпатами для двох людей, бюджет до 15 000 грн». Assistant не є authority для ціни, stock, safety, policy або order state.

Архітектура:

```text
Browser chat UI
      │ POST/SSE, rate limit, session
      ▼
SolidStart BFF
      │ internal authenticated request
      ▼
Assistant service
   ├─ Ollama                 # local chat/embedding models
   ├─ Qdrant                 # approved catalog/policy vectors
   ├─ Meilisearch adapter    # keyword/product discovery
   └─ allowlisted tools      # read-only Vendure queries
```

Початкові read-only tools:

- `search_catalog(query, filters)`;
- `get_product_details(slug)`;
- `compare_products(productIds)`;
- `get_collection(slug)`;
- `get_delivery_policy()`;
- `get_returns_policy()`.

AI v1 не отримує tool для payment, coupon administration, profile changes або автоматичної зміни order. Він може запропонувати product link чи сформувати явну кнопку “Додати”, але звичайну cart mutation запускає користувач через стандартний UI. Якщо пізніше з'являться write tools, кожна дія вимагає явного підтвердження, повторної server-side validation та audit event.

RAG pipeline:

1. Approved product/policy content нормалізується у chunks.
2. AI index consumer генерує embeddings локально через Ollama.
3. Vectors і safe metadata записуються у Qdrant з filters за channel/locale/type.
4. User question проходить intent/abuse checks.
5. Hybrid retrieval поєднує Qdrant semantic results та Meilisearch keyword results.
6. Assistant отримує тільки top relevant context і tool schemas.
7. Відповідь містить links/назви джерел із каталогу та чесно повідомляє, якщо даних недостатньо.

Guardrails:

- assistant endpoint доступний тільки через BFF;
- Qdrant, Ollama та internal tools не доступні з public network;
- system prompt і tool allowlist зберігаються server-side;
- retrieved/user content не може змінювати system/tool policy;
- tool arguments проходять schema validation;
- максимальні input/output tokens, retrieval count, tool iterations і timeout;
- rate limit і concurrency limit;
- prompt/response logs за замовчуванням не містять PII;
- customer-specific tools відсутні у v1;
- model failure повертає звичайний search CTA, а не ламає storefront;
- відповідь про price/stock завжди отримує актуальні дані через tool, не з пам'яті моделі;
- feature flag повністю вимикає assistant.

Evaluation до release:

- curated набір щонайменше 40 українських питань про походи, характеристики спорядження та policies;
- product discovery, trip-based selection, comparison, policy, ambiguous, safety-sensitive і out-of-scope cases;
- перевірка правильності product links/IDs;
- відсутність вигаданих price/stock/policy facts;
- prompt injection tests;
- tool authorization tests;
- latency p50/p95 на задокументованому hardware;
- regression run при зміні model, prompt, chunking або embeddings.

Точні chat/embedding models не фіксуються в цьому плані: вони обираються після benchmark на доступному hardware, pin-яться за tag/digest і заносяться в model card із license, memory requirements та eval result.

### 24.7 Notification architecture

Notification потрібен, але це не один канал і не один toast. Система розділяється на core transactional email та advanced notification orchestration.

#### Відповідальність core Vendure EmailPlugin

Security-sensitive і commerce-critical email залишаються у Vendure EmailPlugin:

- підтвердження email;
- reset password;
- підтвердження зміни email;
- order confirmation після правильного order transition.

Причина: Vendure вже публікує відповідні domain events, має готові handlers/templates і працює з verification/reset tokens у правильному security context. Ці tokens не треба переносити в RabbitMQ, notification tables або зовнішній worker.

У development core може використовувати Vendure dev mailbox. У `platform` profile EmailPlugin відправляє через SMTP у Mailpit, щоб integration tests могли перевіряти recipient, subject, HTML/text, links і attachments через API.

#### Відповідальність advanced NotificationsPlugin

Custom Vendure `NotificationsPlugin` відповідає за:

- in-app notification center;
- email про fulfillment/shipping update;
- in-app/email про moderation review;
- back-in-stock у майбутньому;
- optional Web Push для корисних time-sensitive подій;
- customer preferences для optional channels;
- delivery audit, retry і idempotency;
- Shop API для unread count/list/mark-as-read/preferences;
- worker-only RabbitMQ consumer.

Щоб не було дублювання, кожен notification type має рівно одного owner. Наприклад, email `order-confirmation` належить EmailPlugin, а in-app `order-confirmed` — NotificationsPlugin. Два модулі не повинні надсилати один і той самий email.

#### Канали та пріоритет

| Канал                                    | Статус                      | Початкові події                                                |
| ---------------------------------------- | --------------------------- | -------------------------------------------------------------- |
| Email через Vendure EmailPlugin          | Core, обов'язково           | verification, reset password, email change, order confirmation |
| In-app                                   | Advanced, обов'язково       | order confirmed, fulfillment updated, review approved/rejected |
| Email через notification channel adapter | Advanced                    | fulfillment update, optional back-in-stock                     |
| Web Push                                 | Optional після in-app       | fulfillment update, back-in-stock; тільки opt-in               |
| SMS/месенджери                           | Не входять у поточний scope | Потребують окремої причини, consent, provider та PII policy    |

Marketing notification не можна маскувати під transactional. Promotions, price-drop і recommendations потребують окремого opt-in та unsubscribe; вони не входять у першу notification release.

#### Події

Notification consumer слухає лише versioned integration events, потрібні для advanced каналів:

- `order.placed.v1` — створити in-app notification, але не дублювати confirmation email;
- `order.fulfillment.updated.v1` — in-app + email, optional push;
- `review.approved.v1` — in-app, optional email;
- `review.rejected.v1` — in-app із нейтральним текстом, optional email;
- `catalog.variant.back_in_stock.v1` — пізніший opt-in сценарій.

Event містить IDs, channel/locale, correlation ID та мінімальний safe payload. Consumer дочитує актуальні дані через service layer. Повна адреса, password/reset token, payment details і зайва PII у RabbitMQ не публікуються.

#### Data model

`Notification`:

| Поле                     | Призначення                                                |
| ------------------------ | ---------------------------------------------------------- |
| `id`                     | Vendure ID                                                 |
| `customerId`             | owner; обов'язковий для in-app                             |
| `type`                   | versioned logical notification type                        |
| `locale`, `channelId`    | template/context selection                                 |
| `title`, `body`          | уже локалізований safe snapshot для in-app history         |
| `data`                   | allowlisted JSON: order code, product slug, safe deep link |
| `readAt`                 | null або timestamp                                         |
| `createdAt`, `expiresAt` | retention/lifecycle                                        |

`NotificationDelivery`:

| Поле                                    | Призначення                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `notificationId`                        | relation до logical notification; optional для core email audit adapter |
| `eventId`                               | source integration event                                                |
| `channel`                               | email / in_app / web_push                                               |
| `recipientRef`                          | мінімізований/encrypted reference, не plain secret у log                |
| `template`, `templateVersion`, `locale` | відтворюваність повідомлення                                            |
| `status`                                | pending / processing / sent / failed / dead / skipped                   |
| `attempts`, `nextAttemptAt`             | retry state                                                             |
| `providerMessageId`                     | optional delivery correlation                                           |
| `lastErrorCode`, `sentAt`               | audit без sensitive body                                                |
| `idempotencyKey`                        | unique: event + notification type + channel + recipient                 |

`NotificationPreference`:

- customer;
- notification category;
- email enabled;
- in-app enabled;
- web push enabled;
- consent source/timestamp;
- updated timestamp.

`PushSubscription` у разі Web Push:

- customer relation;
- endpoint і encryption keys, захищені як secrets;
- user-agent/device label без fingerprinting;
- created/last-used timestamps;
- revoked timestamp.

#### Shop API та storefront

Мінімальні operations:

- `GetActiveCustomerNotifications` із cursor/page;
- `GetUnreadNotificationCount`;
- `MarkNotificationRead`;
- `MarkAllNotificationsRead`;
- `GetNotificationPreferences`;
- `UpdateNotificationPreferences`;
- `RegisterPushSubscription` / `RemovePushSubscription` лише у Web Push milestone.

Authorization завжди бере active customer із server context. Переданий клієнтом `customerId` не використовується для ownership. Deep links будуються з allowlisted route types, а не з довільного URL із broker payload.

Storefront UI:

- notification bell з unread badge;
- accessible popover або account page зі списком;
- тип, timestamp, прочитаний/непрочитаний стан;
- pagination;
- mark one/all as read;
- preferences page;
- empty/error/loading states;
- live region тільки для нового повідомлення під час активної сесії, без нав'язливого повторного оголошення history.

#### Delivery і retry rules

- Semantic — at least once; application-level idempotency не допускає повторного user-visible повідомлення.
- Consumer ack робиться після durable `Notification`/`NotificationDelivery` write.
- Network/SMTP 4xx/timeout → exponential retry із jitter.
- Permanent invalid address, validation error або revoked push endpoint → `failed/skipped`, без нескінченного retry.
- Після max attempts → DLQ і `dead` delivery.
- HTTP 404/410 від push endpoint деактивує subscription.
- Manual replay зберігає той самий idempotency key.
- Email sending не виконується всередині database transaction або request handler.
- Notification failure не rollback-ить order/payment/fulfillment.

#### Templates і локалізація

- email templates versioned у repository;
- HTML і plain-text variants;
- MJML/Handlebars через Vendure EmailPlugin для core email;
- українська обов'язково, англійська після locale milestone;
- template variables мають explicit schema;
- усі currency/date/URL values форматуються server-side за locale/channel;
- preview fixtures для кожного template/event state;
- snapshots не повинні містити real customer data;
- unsubscribe додається лише там, де це optional/marketing і юридично потрібно; security/critical transactional messages мають іншу preference policy.

#### Web Push policy

- permission запитується тільки після явної дії користувача в preferences, не на першому page load;
- потрібні Service Worker, VAPID keys і CSRF-protected subscription mutation;
- subscription endpoint вважається secret capability URL;
- payload мінімальний, без адреси, payment або sensitive order details;
- notification завжди дає зрозумілий opt-out;
- browser Push API не потребує платного aggregation provider, але фактична доставка використовує push service відповідного браузера;
- Web Push не є умовою готовності core або першої advanced notification release.

#### Notification acceptance criteria

1. Verification/reset/order confirmation працюють через Vendure EmailPlugin і не проходять через RabbitMQ.
2. Mailpit integration test підтверджує правильний recipient, locale, subject і link.
3. Один fulfillment event створює один in-app record і одну email delivery згідно з preferences.
4. Повторна доставка того самого RabbitMQ event не створює дубль.
5. Transient SMTP failure повторюється, permanent failure не retry-иться безкінечно, exhausted delivery потрапляє в DLQ.
6. Користувач не може прочитати або позначити notification іншого customer.
7. Marketing/optional channel вимкнений без consent.
8. При зупиненому notification consumer checkout завершується, а broker зберігає повідомлення для пізнішої обробки.
9. Notification metrics і trace доступні в Grafana.
10. Web Push, якщо реалізований, запитує permission лише після user action і коректно видаляє revoked subscription.

### 24.8 Asset storage та оптимізація зображень

Платний AWS S3 або інше object storage не потрібні для поточного масштабу. Default рішення — Vendure AssetServerPlugin із `LocalAssetStorageStrategy` та persistent filesystem volume. Оптимізація зображень від storage backend не залежить.

#### Storage topology

```text
Vendure Dashboard upload / seed import
              │ validation + hashed naming
              ▼
      AssetServerPlugin + Sharp preview
              │
              ▼
     /data/assets persistent volume
        ├─ source/preview assets
        └─ cached image transformations
              │
              ▼
   /assets/... ?preset=...&format=...&q=...
              │
              ▼
       browser/reverse-proxy cache
```

Development використовує Docker named volume. Production використовує mounted persistent disk/volume, який не зникає після redeploy. Ephemeral filesystem для mutable assets заборонений.

Local storage достатній, поки:

- Vendure server має один writer instance;
- volume переживає restart/redeploy;
- є backup і restore;
- catalog невеликий;
- немає потреби роздавати assets із багатьох регіонів або кількох replicas.

Якщо deployment platform не дає persistent disk, треба або вибрати інший host, або зробити demo catalog read-only і відновлювати його із seed. Зберігати runtime uploads лише всередині container image не можна.

#### Vendure image pipeline

AssetServerPlugin використовується для:

- генерації preview через default Sharp-based strategy;
- resize зі збереженням aspect ratio;
- crop із focal point;
- конвертації у AVIF, WebP і JPEG fallback;
- контролю quality;
- кешування кожної згенерованої transformation;
- довгого browser/proxy cache;
- hashed asset naming;
- обмеження довільних дорогих transformations через `PresetOnlyStrategy`.

Не дозволяти browser передавати будь-які `w/h/q` значення без обмежень: це створює необмежений cache key space і CPU abuse. Storefront використовує тільки allowlisted presets, formats і quality values.

Початкові presets:

| Preset               | Розмір    | Mode   | Використання                |
| -------------------- | --------- | ------ | --------------------------- |
| `product-thumb`      | 96×120    | crop   | mini-cart, order lines      |
| `product-card-sm`    | 320×400   | crop   | mobile product card         |
| `product-card-md`    | 480×600   | crop   | tablet/default product card |
| `product-card-lg`    | 720×900   | crop   | high-DPR product card       |
| `product-gallery`    | 960×1200  | resize | PDP gallery                 |
| `product-gallery-xl` | 1280×1600 | resize | PDP zoom/large desktop      |
| `collection-card`    | 720×480   | crop   | collection tiles            |
| `hero`               | 1600×900  | crop   | hero/banner                 |

Exact sizes коригуються після реального design/layout audit. Не створювати preset, який не використовується компонентом.

Початкові quality targets:

- AVIF: 50–60;
- WebP: 75–80;
- JPEG fallback: 80–85;
- card image transfer target: приблизно до 100 KB;
- PDP main image target: приблизно до 250 KB;
- hero target: приблизно до 300 KB.

Це budgets, а не гарантії для кожного фото. CI/performance audit перевіряє representative assets, а не лише розширення файлу.

#### SolidStart `ResponsiveImage`

Єдиний shared component відповідає за:

- `<picture>`;
- AVIF source;
- WebP source;
- JPEG fallback;
- `srcset` із Vendure presets;
- коректний `sizes` для конкретного layout;
- обов'язкові intrinsic `width`/`height` або `aspect-ratio` проти CLS;
- alt policy;
- `loading`, `decoding` і `fetchpriority`;
- placeholder/fallback при broken asset.

Правила loading:

- LCP image на home/PDP: `loading="eager"`, `fetchpriority="high"`, не lazy;
- інші gallery/card images: `loading="lazy"`, `decoding="async"`;
- hidden carousel slides не повинні одразу завантажувати найбільший варіант;
- mobile browser не отримує desktop/zoom image через неправильний `sizes`;
- original upload ніколи не використовується на PLP/card, якщо існує optimized preset.

Assets можна віддавати напряму з Vendure asset route або через reverse proxy на тому самому public domain. Немає потреби проксувати кожен image byte через SolidStart BFF: assets не містять bearer token і мають окрему caching policy.

#### Upload policy

Початкова policy для admin uploads:

- тільки необхідні raster MIME types;
- перевірка file signature, а не лише extension/header;
- maximum file size і maximum pixel dimensions;
- SVG заборонений для product upload без окремої sanitization strategy;
- metadata/EXIF, включно з GPS, видаляється під час контрольованого preprocessing, якщо pipeline це підтримує;
- filename нормалізує/хешує Vendure naming strategy;
- upload доступний лише ролі з потрібним asset permission;
- archive/unknown executable formats відхиляються;
- errors не показують filesystem path.

Seed images мають бути попередньо стиснені, мати підтверджену ліцензію й зберігатися у контрольованому seed source. Seed імпортує їх у Vendure asset storage. Runtime admin uploads не комітяться у Git.

#### Caching і invalidation

- Hashed/immutable asset URL отримує довгий `Cache-Control`.
- Transformed result кешується після першої генерації.
- Заміна image створює новий identifier/URL замість очищення всіх browser caches.
- Популярні LCP/card transforms можна pre-warm після seed/import у background job.
- Transform cache є rebuildable; authoritative source/preview assets і database references входять у backup.
- Cache headers для HTML/GraphQL не копіюються на assets і навпаки.

#### Backup і відновлення

- backup PostgreSQL та asset volume координуються достатньо близько, щоб references не вказували на відсутні файли;
- source/preview assets зберігаються в backup;
- disposable transform cache можна не backup-ити, якщо перевірено його автоматичне відновлення;
- restore test включає product gallery, collection image та новий transform request;
- disk usage і backup age моніторяться;
- documented cleanup видаляє orphan cache, але не source asset без перевірки references.

#### Коли все ж потрібен S3-compatible backend

Повернутися до `S3AssetStorageStrategy` варто лише якщо з'явиться хоча б одна реальна умова:

- кілька Vendure server replicas;
- host без надійного persistent disk;
- великий catalog/media volume;
- окремий CDN/origin workflow;
- multi-region delivery;
- operational backup object storage простіший за filesystem volume.

MinIO є безкоштовним OSS software, але його disk, backup, updates і monitoring не є “безкоштовними” операційно. Тому він не входить у release gate. Завдяки Vendure `AssetStorageStrategy` перейти на S3-compatible storage пізніше можна без зміни Product/Asset domain і storefront `ResponsiveImage` contract.

#### Monitoring

- asset request rate/error/latency;
- transform generation duration/failure;
- cache hit/miss, якщо доступно на обраному serving layer;
- volume usage і forecast до заповнення;
- backup success/age;
- broken asset count у synthetic/E2E crawl;
- output bytes за preset/format;
- LCP image timing у performance audit.

#### Asset acceptance criteria

1. Upload і seed assets переживають container restart/redeploy.
2. Card/PDP/hero використовують `ResponsiveImage`, `srcset` і правильний `sizes`.
3. Browser отримує AVIF/WebP із JPEG fallback.
4. LCP image не lazy, решта images lazy за правилами.
5. Width/height/aspect ratio не допускають image-related CLS.
6. `PresetOnlyStrategy` відхиляє невідомі/довільні transformations.
7. Повторний однаковий transform використовує cache.
8. PLP не завантажує original або PDP XL asset.
9. Backup/restore повертає database references і фізичні images.
10. Disk-low та transform-failure alerts проходять test.
11. Core/full profiles працюють без AWS S3, MinIO або платного CDN.

### 24.9 OpenTelemetry stack

Початкова observability pipeline:

```text
Storefront / Vendure / workers / assistant
                  │ OTLP
                  ▼
          OpenTelemetry Collector
          ├─ metrics → Prometheus → Grafana
          │                    └─ alerts → Alertmanager → receiver
          ├─ traces  → Tempo      → Grafana
          └─ logs    → Loki       → Grafana

Blackbox Exporter → Prometheus
External Uptime Kuma → public endpoints/TLS
```

Обов'язкові telemetry signals:

- trace: storefront request → Shop API → database/job/outbox publish;
- trace: RabbitMQ consume → Meilisearch/Qdrant/Ollama;
- metrics: request rate/error/latency;
- metrics: queue depth, consumer lag, retry і DLQ count;
- metrics: outbox oldest unpublished age;
- metrics: Meilisearch indexing latency/drift;
- metrics: notification pending/sent/failed/dead, retry latency та age of oldest pending delivery;
- metrics: AI time-to-first-token, total latency, tool calls і failures;
- logs: structured JSON із trace/correlation ID;
- dashboards: commerce health, messaging/search health, AI health;
- alerts: checkout error spike, worker stopped, DLQ > 0, outbox stuck, search fallback active.

Node server instrumentation є пріоритетом. Browser telemetry додається обережно й окремо, оскільки його privacy/status відрізняються; client events не повинні відправляти form values, chat text або PII без явного рішення.

### 24.10 Advanced platform acceptance criteria

Advanced platform layer завершений, коли:

1. `core` profile працює без RabbitMQ, Meilisearch, Qdrant і Ollama.
2. `full` profile піднімається однією documented командою.
3. Product update через Dashboard з'являється у Meilisearch і Qdrant через outbox/RabbitMQ.
4. Повторна доставка тієї самої події не створює duplicate/corrupt data.
5. Poison message потрапляє у DLQ і може бути replay після виправлення.
6. Повний reindex відновлює Meilisearch/Qdrant із source of truth.
7. При зупиненому Meilisearch storefront використовує fallback і checkout працює.
8. При зупиненому AI звичайний catalog/search/cart/checkout працює.
9. AI відповідає на eval dataset на основі catalog/policy sources і не вигадує authoritative commerce facts.
10. Notification flow не дублює EmailPlugin, поважає preferences і відновлюється після retry/DLQ.
11. Grafana trace показує шлях catalog update, notification delivery та AI request.
12. Test incident проходить Prometheus rule → Alertmanager → receiver → resolved notification, а Uptime Kuma перевіряє public endpoint з іншого failure domain.
13. Усі services мають pinned versions, licenses, health checks, resource limits і documented persistent volumes.

## 25. Roadmap

Етапи йдуть вертикально: кожен завершується перевірним результатом.

### Етап 0 — Product brief і технічні spike-и

Завдання:

- використати затверджений product brief Karpaty Gear, українську мову та UAH;
- зафіксувати exact versions Node, pnpm, SolidStart і Vendure;
- створити ADR: monorepo, BFF session, styling;
- spike 1: SolidStart SSR query до read-only Shop API;
- spike 2: mutation із capture/restore Vendure bearer token у HttpOnly session;
- spike 3: production build обох apps.

Готово, коли: SSR показує продукт, add-to-cart переживає reload, а обидва apps збираються. Це найважливіша рання перевірка ризику.

### Етап 1 — Foundation і commerce baseline

Завдання:

- створити pnpm workspace;
- scaffold `apps/storefront` і `apps/commerce`;
- налаштувати TypeScript strict, lint, formatting;
- додати PostgreSQL у Docker Compose;
- налаштувати Vendure config, migration, worker і Dashboard;
- додати `.env.example` та runtime validation;
- створити seed v1;
- додати root scripts;
- додати базовий CI.

Готово, коли: новий developer за README піднімає database, server, worker, Dashboard і storefront; health checks зелені.

### Етап 2 — Storefront shell і каталог

Завдання:

- design tokens, reset, typography, layout;
- Header/Footer/Mobile navigation;
- GraphQL schema/codegen;
- home page;
- collections listing;
- search/filter/sort/pagination через URL;
- PDP, gallery, variant selector, stock state;
- metadata, canonical, breadcrumbs, Product JSON-LD;
- responsive та accessibility pass.

Готово, коли: гість знаходить товар кількома способами, обирає variant, а catalog pages коректно SSR-rendered і shareable через URL.

### Етап 3 — Cart vertical slice

Завдання:

- BFF session остаточно реалізована;
- active order query;
- add/adjust/remove mutations;
- header cart badge;
- mini-cart;
- cart page;
- coupons;
- stock/domain error mapping;
- tests на persistence і cart mutations.

Готово, коли: анонімний cart переживає reload/server navigation, totals збігаються з Vendure, а помилки не руйнують UI.

### Етап 4 — Guest checkout

Завдання:

- checkout layout і guards;
- customer/contact form;
- addresses;
- eligible shipping methods;
- order review;
- test payment;
- success/error/retry states;
- confirmation email preview;
- E2E guest purchase.

Готово, коли: чистий browser session проходить шлях product → cart → completed test order без ручного втручання в Dashboard.

### Етап 5 — Customer account

Завдання:

- register/verify/login/logout;
- password reset;
- protected account layout;
- profile й addresses;
- order history/details;
- поведінка guest cart при login;
- auth security tests.

Готово, коли: користувач створює й відновлює акаунт, використовує адресу та бачить власне замовлення, але не чуже.

### Етап 6 — Portfolio differentiator

Завдання:

- reviews entity/migration/service/resolvers;
- Shop API queries/mutations;
- permissions;
- Dashboard moderation extension;
- review UI та structured data;
- plugin integration/e2e tests;
- технічна стаття/ADR про реалізацію.

Готово, коли: авторизований покупець створює review, admin його approve, після чого рейтинг з'являється на PDP.

### Етап 7 — Messaging, distributed jobs та asset pipeline

Завдання:

- додати `platform` Docker Compose profile;
- мігрувати Vendure job queue з SQL baseline на BullMQ;
- підняти Valkey/перевірений Redis-compatible backend;
- додати RabbitMQ exchange, durable queues, retry і DLQ policies;
- реалізувати versioned event contracts;
- реалізувати transactional outbox і publisher confirms;
- створити integration worker та idempotency store;
- налаштувати AssetServerPlugin, persistent local asset volume, presets, transform cache і backup/restore;
- залишити MinIO/S3-compatible adapter як documented future option, а не release requirement;
- налаштувати EmailPlugin templates і Mailpit SMTP/API tests;
- реалізувати NotificationsPlugin: entities, Shop API, preferences, in-app UI та worker-only RabbitMQ consumer;
- додати notification retry/DLQ/idempotency; Web Push залишити окремим optional task;
- додати queue/outbox metrics і integration tests;
- задокументувати license/operations/trade-offs.

Готово, коли: event після committed product update гарантовано доходить до test consumer, duplicate delivery безпечна, failed message потрапляє у DLQ, notification не дублюється, а core checkout продовжує працювати.

### Етап 8 — Meilisearch

Завдання:

- визначити versioned product index schema;
- реалізувати search adapter;
- створити incremental index consumer;
- додати full reindex, alias swap і reconciliation;
- налаштувати filters, facets, synonyms і ranking;
- інтегрувати storefront через BFF;
- додати circuit breaker/fallback на Vendure search;
- покрити search relevance, permissions і failure scenarios тестами.

Готово, коли: catalog update автоматично потрапляє в індекс, filters/sorting працюють, full reindex відтворює індекс, а зупинка Meilisearch не блокує storefront і checkout.

### Етап 9 — Local AI shopping assistant

Завдання:

- додати `ai` profile з Ollama та Qdrant;
- обрати й зафіксувати chat/embedding models після benchmark;
- створити AI indexing consumer;
- реалізувати hybrid retrieval;
- реалізувати assistant service і allowlisted read-only tools;
- додати SolidStart chat UI зі streaming;
- додати rate/concurrency/token limits і feature flag;
- створити eval dataset та prompt injection tests;
- додати AI traces/metrics і model card.

Готово, коли: assistant знаходить і порівнює реальні products із source links, не вигадує price/stock/policy, проходить зафіксовані eval thresholds, а його повне вимкнення не впливає на commerce flow.

### Етап 10 — Hardening

Завдання:

- accessibility audit;
- performance profiling;
- security headers і rate limiting;
- error boundaries та recovery;
- sitemap/robots/404;
- complete test matrix;
- asset optimization;
- dependency/license review;
- backup/restore rehearsal.
- підключити Vendure TelemetryPlugin та OTel instrumentation решти Node services;
- provision Prometheus, Alertmanager, Grafana, Loki, Tempo, exporters і Uptime Kuma;
- зафіксувати SLI/SLO, dashboards, alert rules, inhibition та retention;
- написати й перевірити runbooks;
- провести failure drills: 5xx, worker stop, DLQ, outbox stuck, search/AI outage, low disk;

Готово, коли: quality gate стабільний, критичні flows покриті, немає відомих P0/P1 defects, а test incidents коректно виявляються, маршрутизуються й закриваються за runbook.

### Етап 11 — Deployment і portfolio presentation

Завдання:

- production infrastructure;
- domain, HTTPS, secrets;
- database migration і seed/demo strategy;
- persistent asset volume з backup/restore та email provider за потреби;
- broker/search/AI services або чітко задокументований reduced production profile;
- error tracking і uptime check;
- screenshots/video;
- README: problem, architecture, trade-offs, setup, demo accounts;
- case study з рішеннями й lessons learned;
- фінальний smoke test.

Готово, коли: live demo доступне, відтворюється локально, Dashboard захищений, а README дозволяє оцінити технічну глибину за кілька хвилин.

## 26. Definition of Done для кожної фічі

Фіча завершена, якщо:

- acceptance scenario працює;
- loading, empty, success і error states продумані;
- server/client boundary не порушена;
- TypeScript не має `any` без обґрунтування;
- accessibility перевірена з клавіатури;
- responsive behavior перевірено мінімум на mobile/desktop;
- додані тести пропорційно ризику;
- telemetry/logging не розкриває secrets/PII;
- документація або ADR оновлені, якщо змінилось рішення;
- format, lint, typecheck, tests і build проходять;
- немає прихованого TODO, без якого сценарій фактично незавершений.

## 27. Git workflow

- `main` завжди buildable;
- короткі feature branches;
- Conventional Commits як рекомендований формат;
- один PR — один логічний change;
- PR description: проблема, рішення, screenshots, testing, ризики;
- database migration комітиться разом зі зміною entity/config;
- generated GraphQL output комітиться, якщо це обрано в ADR, і завжди перевіряється CI;
- не змішувати масове formatting із функціональною зміною;
- releases тегуються після завершеного milestone.

## 28. Ризики та запобіжні дії

| Ризик                                                                    | Вплив                                                              | Запобіжна дія                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| SolidStart 2/Nitro 3 ecosystem ще молодий                                | Deployment plugins або ecosystem packages можуть мати несумісності | Stable SolidJS 1 baseline, pin versions, dependency audit, ранній SSR/session/build/deploy spike |
| Передчасний перехід на SolidJS 2 RC                                      | Prerelease bugs і несумісні UI/testing packages                    | Не використовувати RC у main; міграційний spike лише після stable та compatibility confirmation  |
| SSR session із Vendure реалізована неправильно                           | Губиться cart або витікає token                                    | Етап 0 proof of concept, HttpOnly BFF, integration tests                                         |
| Scope стає завеликим                                                     | Проєкт не завершується                                             | MVP boundary, один custom plugin, інтеграції після checkout                                      |
| Frontend дублює Vendure rules                                            | Розбіжності totals/state                                           | Vendure — source of truth, generated contract                                                    |
| Demo data виглядає штучно                                                | Слабке портфоліо                                                   | Невеликий, але реалістичний curated seed                                                         |
| Images уповільнюють PDP/PLP                                              | Погані Web Vitals                                                  | Responsive assets, sizes, lazy loading, profiling                                                |
| Local assets втрачаються на ephemeral disk або конфліктують між replicas | Broken images після deploy                                         | Persistent volume + backup; S3-compatible backend лише при horizontal scaling                    |
| Реальний payment затримує MVP                                            | Checkout незавершений                                              | Dummy provider спочатку, real test integration потім                                             |
| Custom plugin має слабку authorization                                   | Витік/зміна чужих review                                           | permissions + ownership checks + integration tests                                               |
| Занадто багато infrastructure services                                   | Високі RAM/ops витрати й повільна розробка                         | Compose profiles, core-first roadmap, resource limits, documented reduced profile                |
| Event загубився або доставився двічі                                     | Search/AI index розходиться з Vendure                              | Transactional outbox, at-least-once, idempotent consumers, reconciliation/reindex                |
| Search index має застарілі price/stock                                   | Користувач бачить неточні дані                                     | Vendure authority, freshness metrics, versioned events, revalidation при cart/checkout           |
| Broker/Meilisearch недоступний                                           | Деградація discovery/background processing                         | Durable queues, retry/DLQ, circuit breaker, Vendure search fallback                              |
| Повторна event delivery надсилає email двічі                             | Spam і недовіра користувача                                        | Unique idempotency key, delivery audit, один owner на notification type                          |
| Notification змішує transactional і marketing                            | Порушення consent та поганий UX                                    | Categories/preferences, explicit opt-in, unsubscribe, no marketing у MVP                         |
| Self-hosted SMTP має слабку deliverability                               | Листи потрапляють у spam або не доходять                           | Mailpit для test; production SMTP/deliverability оцінюється окремо, email не блокує order        |
| Web Push permission запитується нав'язливо                               | Користувач назавжди блокує канал                                   | Запит лише після user action/value explanation, простий opt-out                                  |
| Monitoring працює на тому самому host                                    | Повний outage залишається непоміченим                              | Uptime Kuma в окремому failure domain, external public probes                                    |
| Alert fatigue                                                            | Важливий incident губиться серед шуму                              | Severity, `for`, grouping, inhibition, owner/runbook і регулярний review                         |
| Metrics мають high-cardinality labels                                    | Prometheus RAM/disk ростуть, можливий витік PII                    | Allowlisted labels, code review, cardinality dashboard і limits                                  |
| Telemetry pipeline перевантажує application                              | Monitoring погіршує production                                     | Async batch export, memory limits, sampling після вимірювання, bounded queues                    |
| AI вигадує товар, ціну або policy                                        | Недовіра й неправильне рішення користувача                         | RAG, read-only tools, source links, eval suite, no-answer behavior                               |
| Prompt injection викликає небезпечний tool                               | Несанкціонована дія або витік                                      | BFF boundary, allowlist, validation, no write tools v1, explicit confirmation later              |
| OSS edition/license змінюється                                           | Компонент більше не відповідає вимозі                              | Pin version, license inventory, ADR і replaceable adapter                                        |
| Local AI не поміщається у hardware                                       | AI profile неможливо запустити                                     | CPU smoke model, documented requirements, optional profile, benchmark before pinning             |
| Немає чіткої portfolio story                                             | Код важко оцінити                                                  | README, diagram, ADR, screenshots, case study                                                    |

## 29. Відкриті рішення

Ці питання не блокують створення структури, але мають бути закриті до відповідного етапу:

- [x] Portfolio brand і предметна область: Karpaty Gear, outdoor-спорядження для походів і кемпінгу.
- [ ] Фінальний logo та visual direction; робочий напрям — minimal editorial outdoor.
- [x] Storefront runtime baseline: SolidStart 2 stable + SolidJS 1 stable + Node.js 24+ + Vite 8/Nitro 3.
- [ ] Повторно оцінити SolidJS 2 тільки після stable-релізу та підтвердженої сумісності ecosystem.
- [ ] Точна підтримка `uk` у встановленій версії Vendure та стратегія двомовності.
- [ ] Prices include tax чи tax-exclusive base.
- [ ] Pagination чи “load more” як основний UX.
- [ ] Конкретний deployment provider.
- [ ] Production payment provider.
- [ ] Production shipping provider.
- [x] MVP/live demo assets: local persistent volume; S3/object storage не потрібні без scaling requirement.
- [ ] Email provider.
- [ ] Retention для in-app notifications і delivery audit.
- [ ] Які advanced notification types є transactional, optional або marketing.
- [ ] Чи потрібен Web Push після завершеного in-app center.
- [ ] Production SMTP strategy; self-hosting поштового сервера не є автоматичною частиною магазину.
- [ ] Reviews: один на Product чи один на purchased OrderLine.
- [ ] Чи потрібна wishlist після reviews.
- [ ] Чи комітити generated GraphQL files або генерувати тільки в CI/build.
- [ ] Valkey чи інший BullMQ-compatible OSS backend після compatibility test.
- [ ] RabbitMQ quorum/classic queue policy для demo та production profile.
- [ ] Meilisearch index schema, ranking rules і українські synonyms.
- [ ] Retention/replay policy для outbox, processed events і DLQ.
- [ ] Конкретні Ollama chat та embedding models після локального benchmark/eval.
- [ ] Qdrant collection/chunking strategy й embedding dimension.
- [ ] Мінімальний hardware profile для `ai` та `full` Compose profiles.
- [ ] Чи deploy-ити весь advanced stack у live demo, чи записати architecture demo й залишити reduced production profile.
- [ ] Фінальні SLO/alert thresholds після load test і deployment baseline.
- [ ] Metrics/logs/traces retention згідно з доступним disk budget.
- [ ] Production Alertmanager receiver: SMTP чи self-hosted generic webhook endpoint.
- [ ] Де розмістити external Uptime Kuma, щоб він не ділив failure domain із магазином.

Кожне рішення, яке змінює довгострокову структуру, оформлюється коротким ADR у `docs/adr/`.

## 30. Перший backlog

Наступні задачі після затвердження цього плану:

1. Створити `docs/adr/0001-monorepo.md`.
2. Створити `docs/adr/0002-solidstart-vendure-bff-session.md`.
3. Зафіксувати runtime/package versions.
4. Scaffold pnpm workspace без зайвих shared packages.
5. Scaffold Vendure, PostgreSQL і Dashboard.
6. Scaffold SolidStart 2 із SSR.
7. Додати мінімальний `GetProductBySlug` GraphQL document і codegen.
8. Зробити SSR product spike.
9. Зробити `addItemToOrder` session spike з HttpOnly cookie.
10. Перевірити reload persistence.
11. Перевірити production builds.
12. Лише після успішних spike-ів переходити до повної foundation структури.
13. До advanced release створити `docs/adr/0003-jobs-vs-integration-events.md`.
14. Створити `docs/adr/0004-transactional-outbox.md`.
15. Створити `docs/adr/0005-search-source-of-truth-and-fallback.md`.
16. Створити `docs/adr/0006-local-ai-rag-and-tool-security.md`.
17. Додати `docs/oss-inventory.md` із version, image digest, license, source URL та enterprise-feature exclusions.
18. До notification release створити `docs/adr/0007-notification-ownership-channels-and-consent.md`.
19. До hardening створити `docs/adr/0008-monitoring-slo-alerting-and-retention.md` та початкові `docs/runbooks/`.

## 31. Як підтримувати цей документ

- Оновлювати статус і дату при зміні scope/architecture.
- Завершені roadmap items відмічати тут або переносити в issue tracker, але не вести два суперечливі списки.
- Деталі реалізації виносити в ADR, API docs або test plan і додавати посилання звідси.
- Не перетворювати документ на changelog.
- Якщо код розходиться з планом, або код виправляється, або рішення явно оновлюється тут.
- Після MVP додати розділ “Фактична архітектура та відхилення від плану”.

## 32. Офіційні технічні орієнтири

Перевірено під час створення плану 2026-08-03; Solid ecosystem повторно перевірено 2026-09-11:

- [SolidStart 2 overview](https://docs.solidjs.com/solid-start/v2) — stable full-stack framework поверх SolidJS 1 і Vite 8 Environment API.
- [SolidStart 2 getting started](https://docs.solidjs.com/solid-start/v2/getting-started) — Node.js 24+, `create-solid`, Vite config і environment types.
- [SolidStart v1 → v2 migration](https://docs.solidjs.com/solid-start/v2/migrating-from-v1) — Vinxi/Nitro 2 removal, Nitro 3, HTTP imports, serialization та verification checklist.
- [SolidJS releases](https://github.com/solidjs/solid/releases) — status SolidJS 2 prereleases; stable 2.0 є окремим майбутнім decision gate.
- [SolidStart routing](https://docs.solidjs.com/solid-start/v2/building-your-application/routing) — file-based UI/API routes.
- [SolidStart configuration](https://docs.solidjs.com/solid-start/v2/reference/config/solid-start) — Vite/Nitro config, environment boundaries і server-only code.
- [Vendure architecture overview](https://docs.vendure.io/current/core/developer-guide/overview) — Server, Worker, Dashboard, Shop API та Admin API.
- [Connecting a storefront to the Shop API](https://docs.vendure.io/current/core/storefront/connect-api) — sessions, bearer tokens, cookies, channel і language headers.
- [Vendure core concepts](https://docs.vendure.io/current/core/core-concepts) — catalog, cart, checkout, order, inventory та access model.
- [Products and variants](https://docs.vendure.io/current/core/core-concepts/products) — Product/ProductVariant, SKU, price і stock ownership.
- [Collections](https://docs.vendure.io/current/core/core-concepts/collections) — catalog hierarchy та collection filters.
- [Search](https://docs.vendure.io/current/core/core-concepts/search) — search index, facets і filtering.
- [Vendure Worker and Job Queue](https://docs.vendure.io/current/core/developer-guide/worker-job-queue) — background jobs і окремий worker process.
- [Vendure BullMQ Job Queue Plugin](https://docs.vendure.io/current/core/reference/core-plugins/job-queue-plugin/bull-mqjob-queue-plugin) — офіційний push-based job queue adapter.
- [Vendure Email & Notifications](https://docs.vendure.io/current/core/core-concepts/email) — event-driven transactional email і notification channels.
- [Vendure EmailPlugin](https://docs.vendure.io/current/core/reference/core-plugins/email-plugin) — default handlers, templates, SMTP та dev mailbox.
- [Vendure TelemetryPlugin](https://docs.vendure.io/current/core/reference/core-plugins/telemetry-plugin) — офіційна OpenTelemetry instrumentation інтеграція.
- [Vendure deployment with Docker](https://docs.vendure.io/current/core/deployment/using-docker) — server/worker topology, PostgreSQL і health checks.
- [Valkey introduction](https://valkey.io/topics/introduction/) — self-hosted BSD-licensed in-memory data store; BullMQ compatibility перевіряється окремим spike.
- [RabbitMQ reliability guide](https://www.rabbitmq.com/docs/reliability) — acknowledgements, publisher confirms, at-least-once delivery та idempotent consumers.
- [RabbitMQ dead-letter exchanges](https://www.rabbitmq.com/docs/dlx) — DLQ/DLX behavior і policies.
- [Meilisearch local installation](https://www.meilisearch.com/docs/resources/self_hosting/getting_started/install_locally) — self-hosted/Docker setup.
- [Meilisearch open-source comparison](https://www.meilisearch.com/docs/resources/comparisons/alternatives) — Community Edition license і self-hosting boundary.
- [Ollama tool calling](https://docs.ollama.com/capabilities/tool-calling) — локальні model tools/agent loop.
- [Qdrant local quickstart](https://qdrant.tech/documentation/quick-start/) — self-hosted vector database через Docker.
- [Qdrant self-hosted security](https://qdrant.tech/documentation/security/) — API keys, TLS і network hardening.
- [Vendure AssetServerPlugin](https://docs.vendure.io/current/core/reference/core-plugins/asset-server-plugin) — local storage, Sharp transforms, presets і transform cache.
- [Vendure AssetServerOptions](https://docs.vendure.io/current/core/reference/core-plugins/asset-server-plugin/asset-server-options) — storage strategy, preview limits, cache headers і image transformation policy.
- [Vendure images & assets](https://docs.vendure.io/current/core/core-concepts/images-assets) — asset upload, previews, storage та URL transforms.
- [Vendure S3AssetStorageStrategy](https://docs.vendure.io/current/core/reference/core-plugins/asset-server-plugin/s3asset-storage-strategy) — optional future adapter для AWS S3 або S3-compatible backend.
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/) — Node/browser telemetry status, traces і metrics.
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) — vendor-neutral telemetry receive/process/export boundary.
- [OpenTelemetry sampling](https://opentelemetry.io/docs/concepts/sampling/) — head/tail sampling trade-offs.
- [Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) — rule evaluation і передача alerts у Alertmanager.
- [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/) — grouping, deduplication, routing, silences та inhibition.
- [Prometheus Blackbox Exporter pattern](https://prometheus.io/docs/guides/multi-target-exporter/) — HTTP/TCP/DNS-style external probes.
- [Uptime Kuma](https://github.com/louislam/uptime-kuma) — MIT-licensed self-hosted uptime, keyword і TLS monitoring.
- [Mailpit](https://github.com/axllent/mailpit) — MIT-licensed local SMTP inbox/API для integration testing.
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) — browser push subscriptions, Service Worker і security considerations.

---

Головний критерій успіху: live demo має дозволяти новому користувачу знайти товар, вибрати variant, пройти cart і завершити test checkout; код і документація мають чітко показувати, як SolidStart взаємодіє з Vendure та чому архітектура побудована саме так.
