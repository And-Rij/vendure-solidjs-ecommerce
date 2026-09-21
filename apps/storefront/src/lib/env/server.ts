import "server-only";

import runtimeEnv from "env:server/runtime";
import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  SERVER_VENDURE_SHOP_API_URL: z.url(),
  SERVER_VENDURE_CHANNEL_TOKEN: optionalString,
  SERVER_VENDURE_LANGUAGE_CODE: z.enum(["uk", "en"]).default("uk"),
});

const result = serverEnvSchema.safeParse({
  SERVER_VENDURE_SHOP_API_URL: runtimeEnv.SERVER_VENDURE_SHOP_API_URL,
  SERVER_VENDURE_CHANNEL_TOKEN: runtimeEnv.SERVER_VENDURE_CHANNEL_TOKEN,
  SERVER_VENDURE_LANGUAGE_CODE: runtimeEnv.SERVER_VENDURE_LANGUAGE_CODE,
});

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid storefront server environment:\n${details}`);
}

export const serverEnv = {
  vendureShopApiUrl: result.data.SERVER_VENDURE_SHOP_API_URL,
  vendureChannelToken: result.data.SERVER_VENDURE_CHANNEL_TOKEN,
  vendureLanguageCode: result.data.SERVER_VENDURE_LANGUAGE_CODE,
};
