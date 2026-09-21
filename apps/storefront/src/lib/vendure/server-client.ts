import "server-only";

import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";
import { z } from "zod";

import { serverEnv } from "~/lib/env/server";

const REQUEST_TIMEOUT_MS = 5_000;

const responseSchema = z.object({
  data: z.record(z.string(), z.unknown()).nullish(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

export type VendureRequestOptions = {
  authToken?: string;
};

export type VendureRequestResult<TData> = {
  data: TData;
  authToken?: string;
};

type ErrorCode = "NETWORK" | "HTTP" | "GRAPHQL" | "INVALID_RESPONSE";

export class VendureApiError extends Error {
  constructor(public readonly code: ErrorCode) {
    super("Не вдалося отримати дані магазину. Спробуйте ще раз.");
    this.name = "VendureApiError";
  }
}

export async function requestVendure<
  TData,
  TVariables extends Record<string, unknown>,
>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: NoInfer<TVariables>,
  options: VendureRequestOptions = {},
): Promise<VendureRequestResult<TData>> {
  const endpoint = new URL(serverEnv.vendureShopApiUrl);

  endpoint.searchParams.set("languageCode", serverEnv.vendureLanguageCode);

  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
  });

  if (serverEnv.vendureChannelToken) {
    headers.set("vendure-token", serverEnv.vendureChannelToken);
  }

  if (options.authToken) {
    headers.set("authorization", `Bearer ${options.authToken}`);
  }

  const body = JSON.stringify({
    query: print(document),
    variables,
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new VendureApiError("HTTP");
    }

    let json: unknown;

    try {
      json = await response.json();
    } catch {
      throw new VendureApiError("INVALID_RESPONSE");
    }

    const parsed = responseSchema.safeParse(json);

    if (!parsed.success) {
      throw new VendureApiError("INVALID_RESPONSE");
    }

    if (parsed.data.errors?.length) {
      throw new VendureApiError("GRAPHQL");
    }

    if (parsed.data.data == null) {
      throw new VendureApiError("INVALID_RESPONSE");
    }

    return {
      data: parsed.data.data as TData,
      authToken: response.headers.get("vendure-auth-token") ?? undefined,
    };
  } catch (error) {
    if (error instanceof VendureApiError) {
      throw error;
    }

    throw new VendureApiError("NETWORK");
  }
}
