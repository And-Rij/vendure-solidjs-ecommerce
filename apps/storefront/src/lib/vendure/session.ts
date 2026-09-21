import "server-only";

import { deleteCookie, getCookie, setCookie } from "@solidjs/start/http";

const COOKIE_NAME = "karpaty-gear-session";

const cookieOptions = {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  path: "/",
} as const;

export function getVendureAuthToken(): string | undefined {
  return getCookie(COOKIE_NAME) || undefined;
}

export function setVendureAuthToken(token: string): void {
  if (!token.trim()) {
    throw new Error("Cannot save an empty Vendure session token");
  }

  setCookie(COOKIE_NAME, token, cookieOptions);
}

export function clearVendureAuthToken(): void {
  deleteCookie(COOKIE_NAME, cookieOptions);
}
