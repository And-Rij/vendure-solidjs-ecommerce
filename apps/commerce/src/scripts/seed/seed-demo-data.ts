import {
  ChannelService,
  CollectionService,
  CountryService,
  CurrencyCode,
  GlobalSettingsService,
  LanguageCode,
  ProductService,
  RequestContextService,
  TaxCategoryService,
  TaxRate,
  TaxRateService,
  TransactionalConnection,
  ZoneService,
  isGraphQlErrorResult,
} from "@vendure/core";
import type { VendureWorker } from "@vendure/core";
import { seedDemoCatalog } from "./seed-catalog";

type App = VendureWorker["app"];

function unique<T>(
  result: { items: T[]; totalItems: number },
  label: string,
): T | undefined {
  if (result.totalItems > 1)
    throw new Error(`Ambiguous ${label}; resolve duplicates before seeding.`);
  return result.items[0];
}

function sameId(a: string | number, b: string | number): boolean {
  return String(a) === String(b);
}

/** Configuration commits first; catalog uses a fresh context and its own transaction. */
export async function seedDemo(app: App): Promise<void> {
  // Avoid the built-in 50ms debounced event handler racing with app.close().
  // Enqueue collection work explicitly and await persistence after our commit.
  app.get(CollectionService).setApplyAllFiltersOnProductUpdates(false);
  const connection = app.get(TransactionalConnection);
  const channels = app.get(ChannelService);
  const contexts = app.get(RequestContextService);
  const initialChannel = await channels.getDefaultChannel();
  const initialCtx = await contexts.create({
    apiType: "admin",
    channelOrToken: initialChannel,
  });

  const taxCategoryId = await connection.withTransaction(
    initialCtx,
    async (ctx) => {
      const productCount = (
        await app.get(ProductService).findAll(ctx, { take: 1 })
      ).totalItems;
      if (
        productCount > 0 &&
        (initialChannel.defaultCurrencyCode !== CurrencyCode.UAH ||
          !initialChannel.pricesIncludeTax)
      )
        throw new Error(
          "Refusing to change currency/tax price mode of a non-empty catalog.",
        );

      const settingsService = app.get(GlobalSettingsService);
      const settings = await settingsService.getSettings(ctx);
      if (!settings.availableLanguages.includes(LanguageCode.uk)) {
        await settingsService.updateSettings(ctx, {
          availableLanguages: [...settings.availableLanguages, LanguageCode.uk],
        });
      }
      const countries = app.get(CountryService);
      let country = unique(
        await countries.findAll(ctx, {
          filter: { code: { eq: "UA" } },
          take: 2,
        }),
        "country UA",
      );
      if (!country)
        country = await countries.create(ctx, {
          code: "UA",
          enabled: true,
          translations: [
            { languageCode: LanguageCode.uk, name: "Україна" },
            { languageCode: LanguageCode.en, name: "Ukraine" },
          ],
        });
      else if (!country.enabled)
        throw new Error(
          "Country UA is disabled; enable it explicitly before seeding.",
        );

      const zones = app.get(ZoneService);
      let zone = unique(
        await zones.findAll(ctx, {
          filter: { name: { eq: "Україна" } },
          take: 2,
        }),
        "zone Україна",
      );
      if (!zone)
        zone = await zones.create(ctx, {
          name: "Україна",
          memberIds: [country.id],
        });
      else {
        const loaded = await zones.findOne(ctx, zone.id);
        if (!loaded?.members.some((member) => sameId(member.id, country.id))) {
          await zones.addMembersToZone(ctx, {
            zoneId: zone.id,
            memberIds: [country.id],
          });
        }
      }
      for (const existing of [
        initialChannel.defaultTaxZone,
        initialChannel.defaultShippingZone,
      ]) {
        if (existing && !sameId(existing.id, zone.id)) {
          throw new Error(
            "Default channel already uses another zone; refusing to replace it.",
          );
        }
      }
      const needsChannelUpdate =
        initialChannel.defaultLanguageCode !== LanguageCode.uk ||
        !initialChannel.availableLanguageCodes.includes(LanguageCode.uk) ||
        initialChannel.defaultCurrencyCode !== CurrencyCode.UAH ||
        !initialChannel.availableCurrencyCodes.includes(CurrencyCode.UAH) ||
        !initialChannel.pricesIncludeTax ||
        !initialChannel.defaultTaxZone ||
        !initialChannel.defaultShippingZone;
      if (needsChannelUpdate) {
        const updated = await channels.update(ctx, {
          id: initialChannel.id,
          defaultLanguageCode: LanguageCode.uk,
          availableLanguageCodes: [
            ...new Set([
              ...initialChannel.availableLanguageCodes,
              LanguageCode.uk,
            ]),
          ],
          defaultCurrencyCode: CurrencyCode.UAH,
          availableCurrencyCodes: [
            ...new Set([
              ...initialChannel.availableCurrencyCodes,
              CurrencyCode.UAH,
            ]),
          ],
          pricesIncludeTax: true,
          defaultTaxZoneId: zone.id,
          defaultShippingZoneId: zone.id,
        });
        if (isGraphQlErrorResult(updated)) throw new Error(updated.message);
      }
      const categories = app.get(TaxCategoryService);
      let category = unique(
        await categories.findAll(ctx, {
          filter: { name: { eq: "Standard" } },
          take: 2,
        }),
        "tax category Standard",
      );
      if (!category) {
        const defaults = await categories.findAll(ctx, {
          filter: { isDefault: { eq: true } },
          take: 1,
        });
        category = await categories.create(ctx, {
          name: "Standard",
          isDefault: defaults.totalItems === 0,
        });
      }
      const rates = await connection.getRepository(ctx, TaxRate).find({
        where: { categoryId: category.id, zoneId: zone.id },
        relations: ["customerGroup"],
      });
      const genericRates = rates.filter((rate) => !rate.customerGroup);
      if (genericRates.length > 1)
        throw new Error("Multiple Standard tax rates for Ukraine.");
      const rate = genericRates[0];
      if (rate && (!rate.enabled || rate.value !== 20)) {
        throw new Error(
          "Existing Standard tax rate must be enabled and equal to 20%.",
        );
      }
      if (!rate)
        await app.get(TaxRateService).create(ctx, {
          name: "VAT 20%",
          enabled: true,
          value: 20,
          categoryId: category.id,
          zoneId: zone.id,
        });
      return category.id;
    },
  );
  console.log("Demo configuration ready: uk / UAH / Ukraine / VAT 20%.");

  const channel = await channels.findOne(initialCtx, initialChannel.id);
  if (!channel?.defaultTaxZone)
    throw new Error("Configured channel or tax zone is missing.");
  const catalogCtx = await contexts.create({
    apiType: "admin",
    channelOrToken: channel,
    languageCode: LanguageCode.uk,
  });
  await seedDemoCatalog(app, catalogCtx, taxCategoryId);
}
