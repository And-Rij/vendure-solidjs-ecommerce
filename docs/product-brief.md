# Product Brief — Karpaty Gear

Status: Approved for portfolio implementation  
Date: 2026-08-04  
Owner: Andrij

## 1. Концепція

**Karpaty Gear** — український ecommerce-магазин спорядження для походів, кемпінгу та активного відпочинку.

Магазин допомагає покупцю не просто знайти окремий товар, а підібрати сумісний набір спорядження під маршрут, сезон, кількість людей, досвід, вагу та бюджет.

`Karpaty Gear` є робочою назвою portfolio-проєкту. Поточний web scan не виявив помітного outdoor-магазину з точною назвою, але це не є юридичною перевіркою. Перед реальним комерційним запуском потрібно окремо перевірити trademark, domain і social handles.

## 2. Проблема користувача

Початківцю складно зрозуміти:

- який намет підходить для конкретного сезону й кількості людей;
- яку температуру комфорту спальника обрати;
- який об'єм рюкзака потрібен для тривалості походу;
- як збалансувати вагу, характеристики та бюджет;
- чи не забуто важливу частину комплекту;
- чим схожі товари реально відрізняються.

Звичайний keyword search не завжди вирішує цю проблему. Тому продукт поєднує faceted search, порівняння, структуровані характеристики, guides та read-only AI shopping assistant.

## 3. Цільові користувачі

### Початківець

Планує перший або другий похід, не знає професійної термінології, потребує пояснення характеристик і готового starting kit.

### Досвідчений турист

Знає потрібні параметри, швидко фільтрує каталог, порівнює вагу, матеріали, сезонність і ціну.

### Покупець подарунка

Має бюджет і приблизне розуміння активності, але потребує безпечних рекомендацій без складної термінології.

## 4. Ринок та локалізація demo

- Регіон: Україна.
- Мова першої версії: українська.
- Валюта: UAH.
- Англійська локалізація: після core MVP.
- Demo shipping: фіктивні standard та express methods.
- Demo payment: Vendure dummy/test payment handler.
- Working assumption: ціни у storefront показуються з податком; остаточно зафіксувати у Vendure configuration ADR.

## 5. Ціннісна пропозиція

> Знайди спорядження для свого маршруту без годин читання несумісних характеристик.

Ключові переваги demo-продукту:

- зрозумілі українські характеристики;
- сильні category filters;
- пошук із typo tolerance та українськими synonyms;
- порівняння товарів;
- підбір спорядження під сценарій;
- актуальні price і stock тільки з commerce backend;
- чесне пояснення, чому товар рекомендовано.

## 6. Каталог першого seed

### Top-level collections

1. Сон і укриття
   - Намети
   - Спальники
   - Килимки
2. Рюкзаки та перенесення
   - Одноденні рюкзаки
   - Трекінгові рюкзаки
3. Табірна кухня й аксесуари
   - Пальники
   - Посуд
   - Освітлення

### Демонстраційні товари

Назви вигадані й використовуються лише як seed data.

| Product             | Category | Приклад ключових характеристик                              |
| ------------------- | -------- | ----------------------------------------------------------- |
| Полонина Trek       | Намет    | 2P/3P, three-season, waterproof rating, weight, Forest/Sand |
| Чорногора Base 3    | Намет    | 3P, three-season, two entrances, standard weight            |
| Свидовець Comfort 0 | Спальник | comfort 0°C, limit -5°C, regular/long, left/right zip       |
| Петрос Down -5      | Спальник | comfort -5°C, down fill, lightweight, regular/long          |
| Тиса Air R5         | Килимок  | R-value 5, regular/wide, packed size, weight                |
| Бескид 35           | Рюкзак   | 35 L, S/M та M/L, rain cover, Forest/Graphite               |
| Ґорґани Trek 55     | Рюкзак   | 55 L, adjustable back, load range, Blue/Graphite            |
| Ватра Solo          | Пальник  | fuel type, power, boil time, weight                         |
| Черемош Duo         | Посуд    | 2-person set, material, volume, packed weight               |
| Мольфар 450         | Ліхтар   | 450 lm, battery type, runtime, IP rating                    |

Seed повинен мати різні stock states, одну promotion, featured products, bestseller/new flags і хоча б один unavailable variant.

## 7. Catalog attributes

### Global facets

- brand;
- activity;
- season;
- audience;
- material;
- weight class;
- features;
- availability;
- price range.

### Category-specific attributes

- tent capacity;
- packed weight;
- waterproof rating;
- sleeping bag comfort/limit temperature;
- sleeping pad R-value;
- backpack volume;
- fit/size;
- stove fuel type;
- lumen output;
- IP rating.

### Variant options

- color;
- size/fit;
- capacity там, де це справді окремий SKU;
- zipper side для sleeping bags;
- інша configuration лише якщо вона змінює SKU, price або stock.

## 8. Головний commerce flow

```text
Home
  → Collection/Search
  → Filters
  → Product details
  → Variant selection
  → Guest cart
  → Contact and address
  → Shipping method
  → Test payment
  → Completed order
```

Core success scenario: новий користувач знаходить спорядження, додає конкретний ProductVariant, проходить guest checkout і отримує test order confirmation.

## 9. Пошук

### Keyword/faceted search

Meilisearch advanced profile індексує:

- українські назви й descriptions;
- category hierarchy;
- normalized product attributes;
- price range;
- availability;
- popularity/featured signals;
- synonyms: `намет ↔ палатка`, `рюкзак ↔ наплічник`, `спальник ↔ спальний мішок`.

Приклади запитів:

- `легкий двомісний намет`;
- `спальник на мінус 5`;
- `рюкзак для походу на три дні`;
- `пальник до 1500 грн`.

### Semantic/RAG discovery

Qdrant містить embeddings тільки approved catalog content, buying guides та policies. Price, stock і order state не беруться з vector store.

## 10. AI shopping assistant

Головний demo prompt:

> Підбери спорядження для дводенного осіннього походу Карпатами для двох людей, бюджет до 15 000 грн.

Очікувана поведінка:

1. Уточнити температурний діапазон, досвід і вже наявне спорядження.
2. Знайти кандидатів через hybrid search.
3. Отримати актуальні price і stock через read-only Vendure tools.
4. Запропонувати комплект у межах бюджету.
5. Пояснити компроміси ваги, характеристик і ціни.
6. Дати посилання на реальні PDP та relevant guides.
7. Чесно повідомити про відсутність достатніх даних.

Assistant не надає гарантій безпеки маршруту, не замінює професійного гіда, не вигадує характеристики і не виконує cart/payment mutations у v1.

## 11. Події та background processing

Предметні приклади, які виправдовують advanced stack:

- `catalog.product.updated` → Meilisearch та Qdrant reindex;
- `catalog.variant.stock-changed` → back-in-stock notification;
- `catalog.variant.price-changed` → optional price-drop notification;
- `order.placed` → integration workflow та analytics projection;
- `fulfillment.updated` → transactional notification;
- scheduled reconciliation → перевірка search/index drift;
- background image transforms і pre-warm popular product cards.

## 12. Notification scenarios

Core:

- account verification;
- password reset;
- order confirmation;
- fulfillment update.

Advanced:

- back in stock;
- price drop після explicit opt-in;
- in-app notification center;
- optional Web Push тільки після user consent.

## 13. Visual direction

Робочий напрям: **minimal editorial outdoor**.

- великі фотографії природи й спорядження;
- багато вільного простору;
- спокійні природні кольори;
- чітка технічна типографіка для характеристик;
- один теплий accent для primary actions;
- light theme у MVP;
- мінімум декоративних анімацій.

Робоча палітра, яка ще потребує перевірки contrast:

| Role        | Color     |
| ----------- | --------- |
| Forest      | `#1F3A2E` |
| Moss        | `#6F7D54` |
| Sand        | `#E9E1D3` |
| Stone       | `#F5F3EE` |
| Charcoal    | `#1C211E` |
| Warm accent | `#D96C32` |

Final logo, font pair і palette не блокують Stage 0.

## 14. Non-goals першої версії

- marketplace і multiple sellers;
- rental/booking system;
- реальна оплата;
- production shipping integration;
- автоматичне планування або оцінка безпеки маршруту;
- weather forecasting;
- AI write tools;
- персоналізація на основі прихованого user tracking;
- складна система loyalty;
- повноцінний ERP/WMS;
- S3/MinIO;
- mobile application.

## 15. Критерії успіху

Core MVP успішний, коли:

- guest знаходить товар через collection/search/filter;
- обирає конкретний variant;
- cart переживає reload;
- checkout завершується test order;
- price, stock і totals збігаються з Vendure;
- storefront SSR-rendered, responsive та keyboard accessible;
- новий developer може повторити setup за README.

Advanced portfolio release успішний, коли:

- catalog events оновлюють окремі search/vector projections;
- duplicate event delivery не пошкоджує projections і не дублює notifications;
- hybrid search і AI assistant проходять український evaluation set;
- assistant посилається на реальні товари й не вигадує price/stock;
- broker/search/AI outage не ламає core checkout;
- один business flow простежується через logs, metrics і traces.

## 16. Пов'язані документи

- [Головний архітектурний план](../PROJECT_PLAN.md)
- [Поточний порядок роботи](../NEXT_STEPS.md)
