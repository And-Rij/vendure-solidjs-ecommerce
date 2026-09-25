import {
  LanguageCode,
  PaymentMethodService,
  PromotionService,
  ShippingMethodService,
  TransactionalConnection,
  isGraphQlErrorResult,
} from "@vendure/core";
import type { RequestContext, VendureWorker } from "@vendure/core";

type App = VendureWorker["app"];

function unique<T>(result: { items: T[]; totalItems: number }, label: string) {
  if (result.totalItems > 1)
    throw new Error(`Ambiguous ${label}; resolve duplicates before seeding.`);
  return result.items[0];
}

export async function seedDemoCheckout(app: App, context: RequestContext) {
  await app
    .get(TransactionalConnection)
    .withTransaction(context, async (ctx) => {
      const promotions = app.get(PromotionService);
      const promotionName = "Demo: 10% від 1000 грн";
      const promotion = unique(
        await promotions.findAll(ctx, {
          filter: { name: { eq: promotionName } },
          take: 2,
        }),
        `promotion ${promotionName}`,
      );
      if (!promotion) {
        const created = await promotions.createPromotion(ctx, {
          enabled: true,
          conditions: [
            {
              code: "minimum_order_amount",
              arguments: [
                { name: "amount", value: "100000" },
                { name: "taxInclusive", value: "true" },
              ],
            },
          ],
          actions: [
            {
              code: "order_percentage_discount",
              arguments: [{ name: "discount", value: "10" }],
            },
          ],
          translations: [
            {
              languageCode: LanguageCode.uk,
              name: promotionName,
              description: "Автоматична знижка 10% для замовлень від 1000 грн.",
            },
          ],
        });
        if (isGraphQlErrorResult(created)) throw new Error(created.message);
      } else if (
        !promotion.enabled ||
        promotion.couponCode ||
        promotion.conditions.length !== 1 ||
        promotion.conditions[0].code !== "minimum_order_amount" ||
        promotion.actions.length !== 1 ||
        promotion.actions[0].code !== "order_percentage_discount"
      ) {
        throw new Error(
          `Existing promotion ${promotionName} conflicts with demo checkout.`,
        );
      }

      const shipping = app.get(ShippingMethodService);
      for (const method of [
        { code: "demo-standard", name: "Стандартна доставка", rate: 8000 },
        { code: "demo-express", name: "Експрес доставка", rate: 15000 },
      ]) {
        const existing = unique(
          await shipping.findAll(ctx, {
            filter: { code: { eq: method.code } },
            take: 2,
          }),
          `shipping method ${method.code}`,
        );
        if (!existing) {
          await shipping.create(ctx, {
            code: method.code,
            fulfillmentHandler: "manual-fulfillment",
            checker: {
              code: "default-shipping-eligibility-checker",
              arguments: [{ name: "orderMinimum", value: "0" }],
            },
            calculator: {
              code: "default-shipping-calculator",
              arguments: [
                { name: "rate", value: String(method.rate) },
                { name: "includesTax", value: "include" },
                { name: "taxRate", value: "20" },
              ],
            },
            translations: [
              {
                languageCode: LanguageCode.uk,
                name: method.name,
                description: "Демонстраційна доставка Україною.",
              },
            ],
          });
        } else if (
          existing.deletedAt ||
          existing.fulfillmentHandlerCode !== "manual-fulfillment" ||
          existing.checker.code !== "default-shipping-eligibility-checker" ||
          existing.calculator.code !== "default-shipping-calculator"
        ) {
          throw new Error(
            `Existing shipping method ${method.code} conflicts with demo checkout.`,
          );
        }
      }

      const payments = app.get(PaymentMethodService);
      const paymentCode = "demo-test-payment";
      const payment = unique(
        await payments.findAll(ctx, {
          filter: { code: { eq: paymentCode } },
          take: 2,
        }),
        `payment method ${paymentCode}`,
      );
      if (!payment) {
        await payments.create(ctx, {
          code: paymentCode,
          enabled: true,
          handler: {
            code: "dummy-payment-handler",
            arguments: [{ name: "automaticSettle", value: "true" }],
          },
          translations: [
            {
              languageCode: LanguageCode.uk,
              name: "Тестова оплата",
              description: "Демо-оплата без реального списання коштів.",
            },
          ],
        });
      } else if (
        !payment.enabled ||
        payment.handler.code !== "dummy-payment-handler"
      ) {
        throw new Error(
          `Existing payment method ${paymentCode} conflicts with demo checkout.`,
        );
      }
    });
  console.log(
    "Demo checkout ready: promotion, standard/express shipping and test payment.",
  );
}
