import {
  ChannelService,
  CollectionService,
  CountryService,
  CurrencyCode,
  FacetService,
  FacetValueService,
  GlobalSettingsService,
  LanguageCode,
  ProductService,
  ProductVariantService,
  ProductOptionGroupService,
  ProductOptionService,
  RequestContextService,
  TaxCategoryService,
  TaxRate,
  TaxRateService,
  TransactionalConnection,
  ZoneService,
  isGraphQlErrorResult,
} from "@vendure/core";
import type { VendureWorker } from "@vendure/core";
import { GlobalFlag } from "@vendure/common/lib/generated-types";
import { demoProduct } from "./demo-data";

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
  const summary = await connection.withTransaction(catalogCtx, async (ctx) => {
    const products = app.get(ProductService);
    const variants = app.get(ProductVariantService);
    let product = unique(
      await products.findAll(
        ctx,
        {
          filter: { slug: { eq: demoProduct.slug } },
          take: 2,
        },
        ["optionGroups", "facetValues"],
      ),
      "demo product slug",
    );
    const match = unique(
      await variants.findAll(ctx, {
        filter: { sku: { eq: demoProduct.variant.sku } },
        take: 2,
      }),
      "demo SKU",
    );
    if (match) {
      const owner = await variants.getProductForVariant(ctx, match);
      if (!product || !sameId(owner.id, product.id))
        throw new Error("Demo SKU belongs to another product.");
    }

    const facets = app.get(FacetService);
    let facet = unique(
      await facets.findAll(ctx, {
        filter: { code: { eq: "category" } },
        take: 2,
      }),
      "category facet",
    );
    if (!facet)
      facet = await facets.create(ctx, {
        code: "category",
        isPrivate: false,
        translations: [{ languageCode: LanguageCode.uk, name: "Категорія" }],
      });
    if (facet.isPrivate)
      throw new Error("Category facet is private; refusing to change it.");
    const values = app.get(FacetValueService);
    let value = unique(
      await values.findByFacetIdList(ctx, facet.id, {
        filter: { code: { eq: "tents" } },
        take: 2,
      }),
      "tents facet value",
    );
    if (!value)
      value = await values.create(ctx, facet, {
        code: "tents",
        translations: [{ languageCode: LanguageCode.uk, name: "Намети" }],
      });

    const productCreated = !product;
    if (!product)
      product = await products.create(ctx, {
        enabled: true,
        facetValueIds: [value.id],
        translations: [
          {
            languageCode: LanguageCode.uk,
            name: demoProduct.name,
            slug: demoProduct.slug,
            description: demoProduct.description,
          },
        ],
      });
    else if (!product.facetValues.some((item) => sameId(item.id, value.id))) {
      await products.update(ctx, {
        id: product.id,
        facetValueIds: [
          ...product.facetValues.map((item) => item.id),
          value.id,
        ],
      });
    }

    const optionIds: Array<string | number> = [];
    const groups = app.get(ProductOptionGroupService);
    const options = app.get(ProductOptionService);
    for (const spec of demoProduct.options) {
      let group = unique(
        await groups.findAll(ctx, {
          filter: { code: { eq: spec.code } },
          take: 2,
        }),
        `option group ${spec.code}`,
      );
      if (!group)
        group = await groups.create(ctx, {
          code: spec.code,
          translations: [{ languageCode: LanguageCode.uk, name: spec.name }],
        });
      let option = unique(
        await options.findAll(
          ctx,
          {
            filter: { code: { eq: spec.optionCode } },
            take: 2,
          },
          group.id,
        ),
        `option ${spec.optionCode}`,
      );
      if (!option)
        option = await options.create(ctx, group, {
          code: spec.optionCode,
          translations: [
            { languageCode: LanguageCode.uk, name: spec.optionName },
          ],
        });
      optionIds.push(option.id);
      await products.addOptionGroupToProduct(ctx, product.id, group.id);
    }

    let variant = match;
    if (!variant) {
      [variant] = await variants.create(ctx, [
        {
          productId: product.id,
          enabled: true,
          sku: demoProduct.variant.sku,
          translations: [
            { languageCode: LanguageCode.uk, name: demoProduct.variant.name },
          ],
          optionIds,
          taxCategoryId,
          price: demoProduct.variant.priceWithTax,
          stockOnHand: demoProduct.variant.initialStockOnHand,
          trackInventory: GlobalFlag.TRUE,
        },
      ]);
    } else {
      const detailed = await variants.findOne(ctx, variant.id, ["options"]);
      if (!detailed) throw new Error("Existing variant disappeared.");
      if (detailed.options.length === 0) {
        await variants.update(ctx, [{ id: variant.id, optionIds }]);
      } else if (
        detailed.options.length !== optionIds.length ||
        !detailed.options.every((item) =>
          optionIds.some((id) => sameId(id, item.id)),
        )
      ) {
        throw new Error(
          "Existing demo variant has conflicting options; refusing to overwrite.",
        );
      }
    }
    if (!variant) throw new Error("Demo variant creation returned no variant.");

    const collections = app.get(CollectionService);
    const filters = [
      {
        code: "facet-value-filter",
        arguments: [
          { name: "facetValueIds", value: JSON.stringify([String(value.id)]) },
          { name: "containsAny", value: "false" },
          { name: "combineWithAnd", value: "true" },
        ],
      },
    ];
    let collection = unique(
      await collections.findAll(ctx, {
        filter: { slug: { eq: "namety" } },
        take: 2,
      }),
      "collection namety",
    );
    if (!collection)
      collection = await collections.create(ctx, {
        isPrivate: false,
        inheritFilters: false,
        filters,
        translations: [
          {
            languageCode: LanguageCode.uk,
            name: "Намети",
            slug: "namety",
            description: "Намети для походів і кемпінгу.",
          },
        ],
      });
    else {
      const filter = collection.filters.find(
        (item) => item.code === "facet-value-filter",
      );
      const ids: unknown = JSON.parse(
        filter?.args.find((arg) => arg.name === "facetValueIds")?.value ?? "[]",
      );
      if (
        collection.isPrivate ||
        collection.filters.length !== 1 ||
        !Array.isArray(ids) ||
        ids.length !== 1 ||
        String(ids[0]) !== String(value.id)
      ) {
        throw new Error(
          "Existing namety collection has conflicting visibility/filters.",
        );
      }
    }
    return {
      productId: product.id,
      variantId: variant.id,
      collectionId: collection.id,
      productCreated,
      variantCreated: !match,
    };
  });
  await app.get(CollectionService).triggerApplyFiltersJob(catalogCtx, {
    collectionIds: [summary.collectionId],
  });
  console.log(
    `Demo product ${summary.productCreated ? "created" : "already exists"}: ${demoProduct.slug} (id=${summary.productId}).`,
  );
  console.log(
    `Demo variant ${summary.variantCreated ? "created" : "already exists"}: ${demoProduct.variant.sku} (id=${summary.variantId}).`,
  );
  console.log(`Demo collection ready: namety (id=${summary.collectionId}).`);
}
