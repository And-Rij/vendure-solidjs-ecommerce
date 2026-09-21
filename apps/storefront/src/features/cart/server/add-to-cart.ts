import "server-only";

import { AddItemToOrderDocument } from "@karpaty-gear/shop-api";
import { z } from "zod";

import { requestVendure, VendureApiError } from "~/lib/vendure/server-client";
import {
  getVendureAuthToken,
  setVendureAuthToken,
} from "~/lib/vendure/session";

const inputSchema = z.object({
  productVariantId: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
});

export async function addToCart(input: unknown) {
  const parsed = inputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Перевірте товар і кількість: від 1 до 99 одиниць.",
    };
  }

  try {
    const { data, authToken } = await requestVendure(
      AddItemToOrderDocument,
      parsed.data,
      {
        authToken: getVendureAuthToken(),
      },
    );

    if (authToken) {
      setVendureAuthToken(authToken);
    }

    const result = data.addItemToOrder;

    if (result.__typename !== "Order") {
      return {
        success: false as const,
        message:
          result.__typename === "InsufficientStockError"
            ? "Запитувана кількість недоступна. Перевірте кошик."
            : "Не вдалося додати товар. Перевірте кошик і кількість.",
      };
    }

    return {
      success: true as const,
      order: result,
    };
  } catch (error) {
    if (error instanceof VendureApiError) {
      return {
        success: false as const,
        message:
          "Не вдалося підтвердити додавання. Оновіть кошик перед повторною спробою.",
      };
    }

    throw error;
  }
}
