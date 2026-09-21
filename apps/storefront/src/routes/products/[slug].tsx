import { createAsync, query, useParams } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import { ErrorBoundary, For, Show, Suspense } from "solid-js";
import AddToCartButton from "~/features/cart/components/add-to-cart-button";
import CartSummary from "~/features/cart/components/cart-summary";

const getProduct = query(async (slug: string) => {
  "use server";

  const { getProductBySlug } = await import(
    `~/features/product/server/get-product-by-slug`
  );

  return getProductBySlug(slug);
}, "product-by-slug");

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();

  const product = createAsync(() => getProduct(params.slug), {
    deferStream: true,
  });

  return (
    <main class="mx-auto max-w-3xl p-6">
      <ErrorBoundary
        fallback={
          <>
            <HttpStatusCode code={500} />
            <h1 class="text-2xl font-bold">Не вдалося завантажити товар</h1>
            <p class="mt-4">Спробуйте оновити сторінку пізніше</p>
          </>
        }
      >
        <Suspense fallback={<p>Завантажуємо товар</p>}>
          <Show
            when={product()}
            fallback={
              <Show when={product() === null}>
                <HttpStatusCode code={404} />
                <h1 class="text-2xl font-bold">Товар не знайдено</h1>
              </Show>
            }
          >
            {(item) => (
              <>
                <h1 class="text-3xl font-bold">{item().name}</h1>

                <ul class="mt-6 space-y-4">
                  <For each={item().variants}>
                    {(variant) => (
                      <li class="rounded-lg border p-4">
                        <h2 class="text-xl font-semibold">{variant.name}</h2>

                        <p class="mt-2">SKU: {variant.sku}</p>

                        <p class="mt-2 text-lg">
                          {formatPrice(
                            variant.priceWithTax,
                            variant.currencyCode,
                          )}
                        </p>

                        <p class="mt-2">
                          {variant.stockLevel === "OUT_OF_STOCK"
                            ? "Немає в наявності"
                            : variant.stockLevel === "LOW_STOCK"
                              ? "Мало в наявності"
                              : variant.stockLevel === "IN_STOCK"
                                ? "Є в наявності"
                                : "Наявність уточнюється"}
                        </p>

                        <AddToCartButton
                          variantId={variant.id}
                          disabled={variant.stockLevel === "OUT_OF_STOCK"}
                        />
                      </li>
                    )}
                  </For>
                </ul>
                <CartSummary />
              </>
            )}
          </Show>
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
