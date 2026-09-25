import {
  CollectionService,
  FacetService,
  FacetValueService,
  LanguageCode,
  ProductOptionGroupService,
  ProductOptionService,
  ProductService,
  ProductVariantService,
  TransactionalConnection,
} from "@vendure/core";
import type { RequestContext, VendureWorker } from "@vendure/core";
import { GlobalFlag } from "@vendure/common/lib/generated-types";
import { demoCategories, demoProducts } from "./demo-data";

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

export async function seedDemoCatalog(
  app: App,
  catalogCtx: RequestContext,
  taxCategoryId: string | number,
): Promise<void> {
  const connection = app.get(TransactionalConnection);
  const summary = await connection.withTransaction(catalogCtx, async (ctx) => {
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
    const categoryValueIds = new Map<string, string | number>();
    for (const category of demoCategories) {
      let value = unique(
        await values.findByFacetIdList(ctx, facet.id, {
          filter: { code: { eq: category.code } },
          take: 2,
        }),
        `${category.code} facet value`,
      );
      if (!value)
        value = await values.create(ctx, facet, {
          code: category.code,
          translations: [
            { languageCode: LanguageCode.uk, name: category.name },
          ],
        });
      categoryValueIds.set(category.code, value.id);
    }

    const products = app.get(ProductService);
    const variants = app.get(ProductVariantService);
    const groups = app.get(ProductOptionGroupService);
    const options = app.get(ProductOptionService);
    const productSummaries = [];
    for (const spec of demoProducts) {
      const categoryValueId = categoryValueIds.get(spec.categoryCode);
      if (categoryValueId === undefined)
        throw new Error(`Unknown demo category: ${spec.categoryCode}`);

      let product = unique(
        await products.findAll(
          ctx,
          { filter: { slug: { eq: spec.slug } }, take: 2 },
          ["optionGroups", "facetValues"],
        ),
        `demo product slug ${spec.slug}`,
      );
      const match = unique(
        await variants.findAll(ctx, {
          filter: { sku: { eq: spec.variant.sku } },
          take: 2,
        }),
        `demo SKU ${spec.variant.sku}`,
      );
      if (match) {
        const owner = await variants.getProductForVariant(ctx, match);
        if (!product || !sameId(owner.id, product.id))
          throw new Error(
            `Demo SKU belongs to another product: ${spec.variant.sku}`,
          );
      }

      const productCreated = !product;
      if (!product)
        product = await products.create(ctx, {
          enabled: true,
          facetValueIds: [categoryValueId],
          translations: [
            {
              languageCode: LanguageCode.uk,
              name: spec.name,
              slug: spec.slug,
              description: spec.description,
            },
          ],
        });
      else if (
        !product.facetValues.some((item) => sameId(item.id, categoryValueId))
      ) {
        await products.update(ctx, {
          id: product.id,
          facetValueIds: [
            ...product.facetValues.map((item) => item.id),
            categoryValueId,
          ],
        });
      }

      const optionIds: Array<string | number> = [];
      for (const optionSpec of spec.options) {
        let group = unique(
          await groups.findAll(ctx, {
            filter: { code: { eq: optionSpec.code } },
            take: 2,
          }),
          `option group ${optionSpec.code}`,
        );
        if (!group)
          group = await groups.create(ctx, {
            code: optionSpec.code,
            translations: [
              { languageCode: LanguageCode.uk, name: optionSpec.name },
            ],
          });
        let option = unique(
          await options.findAll(
            ctx,
            {
              filter: { code: { eq: optionSpec.optionCode } },
              take: 2,
            },
            group.id,
          ),
          `option ${optionSpec.optionCode}`,
        );
        if (!option)
          option = await options.create(ctx, group, {
            code: optionSpec.optionCode,
            translations: [
              { languageCode: LanguageCode.uk, name: optionSpec.optionName },
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
            sku: spec.variant.sku,
            translations: [
              { languageCode: LanguageCode.uk, name: spec.variant.name },
            ],
            optionIds,
            taxCategoryId,
            price: spec.variant.priceWithTax,
            stockOnHand: spec.variant.initialStockOnHand,
            trackInventory: GlobalFlag.TRUE,
          },
        ]);
      } else {
        const detailed = await variants.findOne(ctx, variant.id, ["options"]);
        if (!detailed) throw new Error("Existing variant disappeared.");
        if (detailed.options.length === 0 && optionIds.length > 0) {
          await variants.update(ctx, [{ id: variant.id, optionIds }]);
        } else if (
          detailed.options.length !== optionIds.length ||
          !detailed.options.every((item) =>
            optionIds.some((id) => sameId(id, item.id)),
          )
        ) {
          throw new Error(
            `Existing demo variant has conflicting options: ${spec.variant.sku}`,
          );
        }
      }
      if (!variant)
        throw new Error(
          `Demo variant creation returned no variant: ${spec.variant.sku}`,
        );
      productSummaries.push({
        slug: spec.slug,
        sku: spec.variant.sku,
        productId: product.id,
        variantId: variant.id,
        productCreated,
        variantCreated: !match,
      });
    }

    const collections = app.get(CollectionService);
    const collectionSummaries = [];
    for (const category of demoCategories) {
      const valueId = categoryValueIds.get(category.code);
      if (valueId === undefined)
        throw new Error(`Missing facet value for ${category.code}`);
      const filters = [
        {
          code: "facet-value-filter",
          arguments: [
            { name: "facetValueIds", value: JSON.stringify([String(valueId)]) },
            { name: "containsAny", value: "false" },
            { name: "combineWithAnd", value: "true" },
          ],
        },
      ];
      let collection = unique(
        await collections.findAll(ctx, {
          filter: { slug: { eq: category.slug } },
          take: 2,
        }),
        `collection ${category.slug}`,
      );
      if (!collection)
        collection = await collections.create(ctx, {
          isPrivate: false,
          inheritFilters: false,
          filters,
          translations: [
            {
              languageCode: LanguageCode.uk,
              name: category.name,
              slug: category.slug,
              description: category.description,
            },
          ],
        });
      else {
        const filter = collection.filters.find(
          (item) => item.code === "facet-value-filter",
        );
        const ids: unknown = JSON.parse(
          filter?.args.find((arg) => arg.name === "facetValueIds")?.value ??
            "[]",
        );
        if (
          collection.isPrivate ||
          collection.filters.length !== 1 ||
          !Array.isArray(ids) ||
          ids.length !== 1 ||
          String(ids[0]) !== String(valueId)
        ) {
          throw new Error(
            `Existing ${category.slug} collection has conflicting visibility/filters.`,
          );
        }
      }
      collectionSummaries.push({ slug: category.slug, id: collection.id });
    }
    return { products: productSummaries, collections: collectionSummaries };
  });

  await app.get(CollectionService).triggerApplyFiltersJob(catalogCtx, {
    collectionIds: summary.collections.map((collection) => collection.id),
  });
  for (const product of summary.products) {
    console.log(
      `Demo product ${product.productCreated ? "created" : "already exists"}: ${product.slug} (id=${product.productId}).`,
    );
    console.log(
      `Demo variant ${product.variantCreated ? "created" : "already exists"}: ${product.sku} (id=${product.variantId}).`,
    );
  }
  console.log(`Demo collections ready: ${summary.collections.length}.`);
}
