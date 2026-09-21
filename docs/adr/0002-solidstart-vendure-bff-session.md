# ADR 0002: SolidStart BFF і гостьова сесія Vendure

Status: Accepted
Date: 2026-09-21

## Context

Storefront повинен отримувати товар під час SSR і зберігати гостьовий кошик між запитами. Сесії різних покупців не повинні змішуватися, а bearer token не має бути доступним browser JavaScript.

Vendure відповідає за commerce-логіку. SolidStart відповідає за UI та серверний шар, адаптований до потреб storefront (BFF).

## Decision

Браузер викликає SolidStart queries/actions. GraphQL-запити до Shop API виконує спільний server-only Vendure client. Це правило стосується Shop API transport; завантаження публічних зображень не потребує GraphQL BFF.

Серверні env, API client, session helpers і commerce services позначені `import "server-only"`. У server actions використовується `"use server"`. GraphQL operations і типи надходять із `@karpaty-gear/shop-api`.

Гостьова сесія працює так:

1. Server action перевіряє POST, відповідність Origin та вхідні дані й викликає `addItemToOrder`.
2. Якщо Vendure повернув `vendure-auth-token`, SolidStart записує його у cookie `karpaty-gear-session`.
3. Наступні серверні запити читають cookie поточного запиту й передають токен як `Authorization: Bearer ...` до Vendure.
4. UI отримує тільки потрібні дані замовлення або безпечне повідомлення про помилку, без токена.

Cookie має `HttpOnly`, `SameSite=Lax`, `Path=/` та `Secure` у production-збірці. `Domain` не задається. Наразі це session cookie без `Max-Age`; збереження після закриття браузера не є гарантією нашого контракту.

Токен не зберігаємо у глобальному стані сервера, `localStorage`, `sessionStorage`, client bundle чи логах. `HttpOnly` обмежує доступ JavaScript, але не приховує cookie від власника браузера та його DevTools.

Vendure залишається джерелом правди для cart, prices, stock і totals. Читання персонального кошика повертає `Cache-Control: private, no-store`; запити API client також використовують `no-store`.

## Consequences

- SSR і mutations використовують ту саму сесію, не передаючи bearer token у browser JavaScript.
- Cookie надсилається браузером автоматично, тому потрібен захист mutations від CSRF. `HttpOnly` не замінює перевірку Origin; поточний action відхиляє також запити без Origin.
- За reverse proxy потрібно перевірити зовнішній origin, HTTPS і cookie flow. Локальні тести не підтверджують production-конфігурацію proxy.
- Token передається server-to-server і не додається до результатів actions. Внутрішні помилки API перетворюються на безпечні повідомлення.
- Після неоднозначної мережевої помилки mutation не повторюємо автоматично: спочатку потрібно перечитати кошик, щоб уникнути подвійного додавання.
- BFF додає серверний перехід і потребує доступного SolidStart runtime.
- Поточні E2E перевіряють reload кошика, cookie flags, ізоляцію сесій та неіснуючий variant ID. Окремо перевірено поточну публічну збірку на значення секретів. Це не повний аудит безпеки.
- Account login/logout, об'єднання гостьового кошика, завершення сесії та checkout ще не реалізовані; їхні правила потрібно визначити окремо.

## Alternatives considered

- **Прямий Shop API із браузера та bearer у localStorage:** простіший transport, але робить токен доступним JavaScript і потребує іншої SSR/session інтеграції.
- **Vendure cookie auth напряму з браузера:** можливий інший контракт, але потребує узгодження доменів, CORS, cookies та SSR. Поточний проєкт обирає bearer між серверами.
- **Власний session store з opaque cookie:** дозволяє тримати Vendure token тільки на сервері, але додає сховище й lifecycle сесій. Для поточного spike не потрібен.
