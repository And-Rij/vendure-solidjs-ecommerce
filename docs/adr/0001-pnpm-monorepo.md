# ADR 0001: pnpm workspaces і Turborepo

Status: Accepted
Date: 2026-09-21

## Context

Karpaty Gear має SolidStart storefront, Vendure backend і спільні типізовані GraphQL operations. Зміни Shop API та його споживача потрібно перевіряти разом, без публікації окремого npm-пакета для кожної зміни.

Проєкт розробляється як портфоліо одним розробником. Окремі репозиторії та незалежне версіонування пакетів зараз створили б зайву координацію.

## Decision

Використовуємо один Git-репозиторій із pnpm workspaces:

- `apps/commerce` — Vendure Server, Worker, Dashboard і migrations.
- `apps/storefront` — SolidStart SSR, server actions і browser UI.
- `packages/shop-api` — GraphQL documents та згенеровані типи операцій.

Внутрішні залежності підключаємо через `workspace:*`. Залежності фіксуємо спільним `pnpm-lock.yaml`, версію pnpm — у `packageManager`, локально перевірену версію Node — у `.nvmrc`.

Turborepo керує порядком виконання package scripts і кешуванням build/lint/typecheck. Dev-процеси та E2E не кешуються. Форматування перевіряємо на рівні кореня репозиторію.

Типи API генерує GraphQL Code Generator, а не Turbo. Контракт storefront із backend — Vendure Shop API schema та конкретні GraphQL operations. Не імпортуємо Vendure entities, конфігурацію чи серверні модулі backend у storefront для спільної типізації.

## Consequences

- Зміни API operations, типів і storefront можна оформити одним commit.
- Кожен пакет явно декларує свої залежності; спільний workspace не замінює `dependencies`.
- Monorepo не означає один runtime: storefront, Vendure Server і Worker запускаються окремо.
- Кореневий `.env` призначений для Compose; застосунки мають окремі env-файли.
- Кеш Turbo потребує коректних inputs та outputs. У CI слід окремо перевірити врахування змінних, переданих через середовище, а не `.env`.
- Codegen використовує зафіксований Shop schema snapshot. Turbo запускає його перед storefront build/typecheck; snapshot оновлюємо офлайн із Vendure config після змін schema.
- Відтворення за README з чистого checkout ще має бути перевірене; наявність lockfile сама по собі цього не доводить.

## Alternatives considered

- **Окремі репозиторії:** дозволяють незалежні релізи, але ускладнюють синхронізацію API operations та storefront на цьому етапі.
- **pnpm workspaces без Turbo:** достатньо для простого запуску scripts, але обрано Turbo для графа задач і кешування.
- **Спільні вручну написані API-інтерфейси:** можуть розійтися зі schema; натомість генеруємо типи фактичних GraphQL operations.
