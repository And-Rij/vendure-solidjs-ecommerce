import { createAsync, query } from "@solidjs/router";
import { ErrorBoundary, Show, Suspense } from "solid-js";

const getCart = query(async () => {
  "use server";

  const { getActiveOrder } =
    await import("~/features/cart/server/get-active-order");

  return getActiveOrder();
}, "active-order");

function CartContent() {
  const cart = createAsync(() => getCart(), {
    deferStream: true,
  });

  return (
    <Show when={cart()} fallback={<p>Кошик порожній.</p>}>
      {(order) => (
        <div class="sapce-y-2">
          <p>Код замовлення: {order().code}</p>
          <p>Кількість товарів: {order().totalQuantity}</p>
          <p>
            Сума:{" "}
            {new Intl.NumberFormat("uk-UA", {
              style: "currency",
              currency: order().currencyCode,
            }).format(order().totalWithTax / 100)}
          </p>
        </div>
      )}
    </Show>
  );
}

export default function CartSummary() {
  return (
    <section class="mt-8 rounded-lg border p-4">
      <h2 class="mb-4 text-xl font-semibold">Кошик</h2>

      <ErrorBoundary
        fallback={
          <p role="alert">Не вдалося завантажити кошик. Оновіть сторінку.</p>
        }
      >
        <Suspense fallback={<p>Завантажуємо кошик...</p>}>
          <CartContent />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
