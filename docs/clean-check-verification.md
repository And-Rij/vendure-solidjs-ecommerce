# Перевірка чистого checkout

Дата: 2026-09-21.

## Середовище та ізоляція

- Копія: `C:/Projects/Pet-Projects/ecommerce-clean-check-lf`.
- Node 24.12.0, pnpm 11.25.0; встановлення через `pnpm install --frozen-lockfile` підтверджене логом користувача. Пакети повторно використані з локального pnpm store — це не перевірка завантаження на новій машині.
- Локальні `.env` створені з прикладів з окремими тестовими паролями. Основні `.env` не змінювалися.
- Compose project: `karpaty-gear-clean-check`; volume: `karpaty-gear-clean-check_postgres-data`.
- БД `vendure_clean_check`, порт хоста 6544. Vendure API 3100, Worker health 3120, E2E storefront 3002.
- Зібраний Vendure запускався з `APP_ENV=dev`. Це не перевірка production deployment.

Команда запуску окремої PostgreSQL з каталогу чистої копії:

```powershell
docker compose -p karpaty-gear-clean-check up -d --wait postgres
```

Завжди використовувати це ім'я проєкту для керування тестовою БД: `compose.yaml` за замовчуванням містить ім'я основного проєкту.

## Результати

- Format check після чистого checkout пройшов. Початкову проблему CRLF усунуто `.gitattributes` у базовому репозиторії.
- Lint: усі 3 пакети. Typecheck: commerce і storefront.
- Build: storefront, Vendure Server, Worker і Dashboard.
- Перший build без env не пройшов: Dashboard завантажує Vendure config, що потребує DB/admin змінних. Після створення env повторний build пройшов.
- Початкова міграція застосована до нової порожньої БД під час запуску `node dist/index.js`.
- Server `/health` на 3100 і Worker `/health` на 3120: `status: ok`.
- Зібраний Dashboard `/dashboard`: HTTP 200. Окрему browser-перевірку всіх його функцій не проводили.
- Через Admin API налаштовано uk/UAH, Україну, tax/shipping zone, Standard tax category і VAT 20%; створено один доступний variant товару `polonyna-trek`, 899900 копійок, stock 12. Повний каталог, option groups, facets і collections у цій копії не відтворювалися — для трьох cart-тестів вони не потрібні.
- `pnpm test:e2e`: **3 passed**, Turbo **5 successful, 5 total**. Залежні tasks використали кеш попередніх успішних запусків; E2E виконався без кешу.
- GraphQL codegen від нового API успішний; згенеровані файли не змінилися, `git status --short` залишився порожнім.

Codegen config містить URL порту 3000. Для ізольованої перевірки використано програмний API встановленого `@graphql-codegen/cli`: `loadCodegenConfig({ configFilePath: 'codegen.ts' })`, потім `generate({ ...loaded.config, schema: 'http://localhost:3100/shop-api' }, true)`. Конфігурацію репозиторію не змінювали.

## Межі перевірки

Автоматичного seed/cleanup у репозиторії немає. Дані підготовлено одноразовими Admin API mutations лише в тестовій БД; тести створили незавершені кошики. Після перевірки тестові Server, Worker і PostgreSQL зупинені; тестовий volume і локальні env збережені. Для повторення на порожній БД потрібно знову створити demo-дані.

У логах був deprecation warning драйвера `pg` щодо паралельного `client.query`; тести й health checks пройшли. Походження warning окремо не діагностували. `ENTITY_NOT_FOUND` під час негативного тесту variant ID очікуваний.

Не перевірено production env, HTTPS/reverse proxy, Docker-образи застосунків, Dokploy, реальні email/payment/shipping integrations. Це наступні задачі, не гарантії поточного smoke test.
