# Demo seed: каталог і checkout

Команда відтворює демонстраційний каталог і checkout із порожньої **мігрованої** БД. Вона створює 10 товарів із різними залишками, 8 категорій, автоматичну promotion, два способи доставки та тестову оплату.

## Що створюється

- Українська мова в global settings і default channel; наявні мови зберігаються.
- UAH як default currency, ціни з податком; інші доступні валюти зберігаються.
- Країна UA, зона `Україна`, default tax/shipping zone.
- Категорія `Standard`, загальна ставка ПДВ 20% для цієї зони.
- 10 товарів із [product brief](./product-brief.md), по одному variant на товар; у «Петрос Down -5» початковий залишок 0.
- «Полонина Trek» зберігає SKU `KG-TENT-POL-2P-FST`, початкову ціну 899900 копійок, залишок 12 та опції `capacity / 2-person` і `color / forest`.
- Публічний facet `category` з 8 значеннями та 8 колекцій, які відбирають товари за відповідним значенням. Колекція `namety` містить два намети.
- Promotion «Demo: 10% від 1000 грн»: автоматична знижка 10% на товари при сумі від 1000 грн із податком, без купона.
- Доставка Україною: `demo-standard` — 80 грн і `demo-express` — 150 грн, ціна вже включає ПДВ 20%. Це демонстраційні тарифи з ручним fulfillment.
- `demo-test-payment`: тестова оплата через Vendure dummy handler із автоматичним підтвердженням. Реального списання коштів немає.

Зображення, акаунти покупців, замовлення та проведені платежі seed не створює. Vendure bootstrap може ініціалізувати власні службові записи та superadmin із env. Повторний запуск не змінює наявні способи доставки, оплату та promotion; явні конфлікти handler/операцій блокують seed.

Demo payment handler призначений лише для локальної перевірки checkout. Перед production deployment його потрібно прибрати або замінити реальним провайдером і перевірити, що тестовий спосіб оплати недоступний у production channel.

## Запуск

Спочатку налаштуй `apps/commerce/.env`, запусти PostgreSQL та застосуй міграції. Seed сам їх не запускає. Команди з кореня репозиторію:

```powershell
pnpm --filter @karpaty-gear/commerce build:server
pnpm --filter @karpaty-gear/commerce exec vendure migrate --run --config ./src/vendure-config.ts
```

Перевір `DB_HOST`, `DB_PORT`, `DB_NAME` перед будь-яким запуском. Наведений нижче приклад явно підтверджує БД `vendure`; для іншої БД заміни аргумент її точною назвою.

```powershell
$previousSeedPermission = $env:ALLOW_DEMO_SEED
try {
  $env:ALLOW_DEMO_SEED = "true"
  pnpm --filter @karpaty-gear/commerce seed:demo --confirm-database=vendure
} finally {
  [Environment]::SetEnvironmentVariable("ALLOW_DEMO_SEED", $previousSeedPermission, "Process")
}
```

За замовчуванням `ALLOW_DEMO_SEED=false`. Запуск заблокований при `APP_ENV=production` **або** `NODE_ENV=production`, без явного дозволу чи без правильного `--confirm-database`. Назва БД — захист від випадкової помилки, не спосіб визначити, що база справді тестова. Не використовуй production credentials.

Після seed запусти звичайний Vendure Worker: він застосує правила колекцій та оновить пошуковий індекс. Сам seed лише очікує запису відповідних jobs у SQL queue, не запускає API/health server чи обробку черг.

Для поточної ізольованої БД можна запустити **код основного проєкту** з env чистої копії. З каталогу `apps/commerce`:

```powershell
node --env-file=C:/Projects/Pet-Projects/ecommerce-clean-check-lf/apps/commerce/.env -e "if(process.env.DB_NAME !== 'vendure_clean_check' || process.env.DB_PORT !== '6544' || process.env.DB_HOST !== 'localhost') throw new Error('Unexpected seed target'); process.env.ALLOW_DEMO_SEED='true'; process.argv.push('--confirm-database=vendure_clean_check'); require('./dist/scripts/seed-demo.js');"
```

## Повторні запуски та конфлікти

- Пошук за стабільними code/slug/SKU; повторний запуск не створює нових копій товарів, опцій чи колекцій.
- Наявні назви/описи, ціни, залишки та enabled state товарів/variant не перезаписуються. Відсутні зв'язки з demo facet/options додаються; старий мінімальний variant без options доповнюється.
- Не змінюється валюта чи tax-inclusive mode непорожнього каталогу. Конфлікт іншої default zone, вимкненої країни, ставки не 20%, дублікати ключів, чужий SKU або несумісні options/collection filters завершують seed з помилкою.
- PostgreSQL advisory lock блокує одночасні запуски цього seed у тій самій БД. Він не блокує редагування через Dashboard: не редагуй demo-дані одночасно з seed.
- Дві транзакції: налаштування, потім каталог. Помилка відкочує поточний етап; успішно завершені налаштування можуть залишитися при помилці каталогу. Після виправлення конфлікту запуск можна повторити.
- Немає автоматичного reset, truncate або видалення даних. Seed не є інструментом синхронізації всього каталогу.

## Інтеграційний тест

Тест дозволено лише для локального PostgreSQL на порту **6544**. Використовує credentials із переданого env, але не його DB_NAME: створює власну БД `vendure_seed_test_<random>`, застосовує міграції та видаляє **тільки її** у `finally`. Користувач PostgreSQL повинен мати право CREATE DATABASE. При аварійному завершенні процесу тестова БД може залишитися.

З кореня репозиторію, після `build:server`, із `DB_HOST=127.0.0.1`, `DB_PORT=6544` та credentials тимчасової PostgreSQL у середовищі:

```powershell
$previousSeedTestPermission = $env:ALLOW_DEMO_SEED_TEST
try {
  $env:ALLOW_DEMO_SEED_TEST = "true"
  pnpm --filter @karpaty-gear/commerce test:seed
} finally {
  [Environment]::SetEnvironmentVariable("ALLOW_DEMO_SEED_TEST", $previousSeedTestPermission, "Process")
}
```

Перевіряються guards до підключення, 10 товарів і 8 категорій у порожній schema, повторний запуск, збереження вручну змінених price/stock, конфлікт ставки/чужого SKU/дубль категорії та advisory lock.

Додатково `SEED_TEST_E2E=true` вмикає перевірку Shop API, усіх 8 колекцій, недоступного variant та трьох Playwright cart-тестів. Для неї спочатку збери storefront, встанови Chromium і звільни порти 3101, 3121, 3002. Тест запускає й зупиняє власні Server/Worker; використовує лише нову тестову БД. Після запуску прибери тимчасову змінну `SEED_TEST_E2E`.

## Перевірено 2026-09-25

- Promotion застосувала 10% знижки до кошика на 8999 грн; Shop API показав обидва тарифи доставки, а guest checkout завершився тестовим платежем у стані `PaymentSettled`.
- Повторний seed не дублює promotion, shipping methods або payment method; повний прогін seed + Shop API + Playwright: **11 passed**.
- Повний прогін із `SEED_TEST_E2E=true`: **11 passed**, включно з батьківським тестом; усередині API/E2E-перевірки — **3 passed** у Playwright. Shop API повернув очікувану кількість товарів для кожної з 8 колекцій.
- Старий variant без опцій доповнюється без скидання вручну змінених ціни й залишку. Конфліктні опції не перезаписуються.
- Commerce Server/Worker/Dashboard і storefront успішно зібрані; TypeScript, ESLint і Prettier пройдені.
- Тимчасові БД видалені після прогонів; основна БД не використовувалася.

Відоме попередження драйвера `pg` про паралельний `client.query` зберігається; воно не зірвало перевірки. Окрему проблему закриття seed до відкладеної постановки collection job виправлено: автоматичний debounce для колекцій вимикається в seed-процесі, а job явно додається й очікується після commit. Обробка job залишається за звичайним Worker.
