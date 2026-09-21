import "server-only";

import { GetActiveOrderDocument } from "@karpaty-gear/shop-api";
import { setResponseHeader } from "@solidjs/start/http";

import { requestVendure } from "~/lib/vendure/server-client";
import { getVendureAuthToken } from "~/lib/vendure/session";

export async function getActiveOrder() {
  setResponseHeader("Cache-Control", "private, no-store");

  const authToken = getVendureAuthToken();

  if (!authToken) {
    return null;
  }

  const { data } = await requestVendure(
    GetActiveOrderDocument,
    {},
    { authToken },
  );

  return data.activeOrder;
}
