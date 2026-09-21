import "server-only";

import { GetProductBySlugDocument } from "@karpaty-gear/shop-api";
import { z } from "zod";

import { requestVendure } from "~/lib/vendure/server-client";

const slugSchema = z.string().trim().min(1).max(200);

export async function getProductBySlug(slug: string) {
  const parsed = slugSchema.safeParse(slug);

  if (!parsed.success) {
    return null;
  }

  const { data } = await requestVendure(GetProductBySlugDocument, {
    slug: parsed.data,
  });

  return data.product;
}
