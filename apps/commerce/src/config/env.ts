import "dotenv/config";
import { z } from "zod";

const port = z.coerce.number().int().min(1).max(65535);

const optionalPort = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  port.optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  z.url().optional(),
);

const envSchema = z
  .object({
    APP_ENV: z.enum(["dev", "production", "test"]).default("dev"),

    PORT: optionalPort,
    VENDURE_SERVER_PORT: port.default(3000),
    VENDURE_WORKER_HEALTH_PORT: port.default(3020),

    CORS_ORIGINS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),

    SUPERADMIN_USERNAME: z.string().min(1),
    SUPERADMIN_PASSWORD: z
      .string()
      .min(16)
      .refine((password) => password !== "superadmin", {
        error: "The default superadmin password is forbidden",
      }),

    DB_HOST: z.string().min(1),
    DB_PORT: port,
    DB_NAME: z.string().min(1),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_SCHEMA: z.string().min(1).default("public"),

    STOREFRONT_URL: z.url().default("http://localhost:3001"),
    ASSET_PUBLIC_URL: optionalUrl,
    EMAIL_FROM: z
      .string()
      .min(1)
      .default("Karpaty Gear <noreply@karpaty-gear.local>"),
  })
  .superRefine((value, ctx) => {
    if (value.APP_ENV === "production" && !value.ASSET_PUBLIC_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["ASSET_PUBLIC_URL"],
        message: "ASSET_PUBLIC_URL is required in production",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = result.data;
