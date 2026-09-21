import { action, useSubmission } from "@solidjs/router";
import { Show } from "solid-js";

const addToCartAction = action(async (formData: FormData) => {
  "use server";

  const { getWebRequest } = await import("@solidjs/start/http");
  const request = getWebRequest();

  const originUrl = new URL(request.url).origin;

  if (
    request.method !== "POST" ||
    request.headers.get("origin") !== originUrl
  ) {
    return {
      success: false as const,
      message: "Запит відхилено. Оновіть сторінку.",
    };
  }

  if (!(formData instanceof FormData)) {
    return {
      success: false as const,
      message: "Некоректні дані форми.",
    };
  }

  const { addToCart } = await import("~/features/cart/server/add-to-cart");

  return addToCart({
    productVariantId: formData.get("productVariantId"),
    quantity: 1,
  });
}, "add-to-cart");

type Props = {
  variantId: string;
  disabled?: boolean;
};

export default function AddToCartButton(props: Props) {
  const formId = () => `add-to-cart-form-${props.variantId}`;

  const submission = useSubmission(
    addToCartAction,
    ([data]) => data.get("formId") === formId(),
  );

  return (
    <div class="mt-4">
      <form
        action={addToCartAction}
        method="post"
        enctype="multipart/form-data"
      >
        <input type="hidden" name="formId" value={formId()} />

        <input type="hidden" name="productVariantId" value={props.variantId} />

        <button
          type="submit"
          disabled={props.disabled || submission.pending}
          class="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {submission.pending ? "Додаємо..." : "Додати в кошик"}
        </button>
      </form>

      <div aria-live="polite">
        <Show when={!submission.pending && submission.result}>
          {(result) => (
            <p class="mt-2">
              {result().success ? "Товар додано в кошик!" : result().message}
            </p>
          )}
        </Show>

        <Show when={!submission.pending && submission.error}>
          <p class="mt-2" role="alert">
            Не вдалося підтвердити додавання. Оновіть кошик перед повторною
            спробою.
          </p>
        </Show>
      </div>
    </div>
  );
}
