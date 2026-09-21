import {
  dummyPaymentHandler,
  DefaultJobQueuePlugin,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from "@vendure/core";
import {
  defaultEmailHandlers,
  EmailPlugin,
  FileBasedTemplateLoader,
} from "@vendure/email-plugin";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { DashboardPlugin } from "@vendure/dashboard/plugin";
import { GraphiqlPlugin } from "@vendure/graphiql-plugin";
import { env } from "./config/env";
import path from "path";

const IS_DEV = env.APP_ENV === "dev";
// PORT wins because hosting platforms inject it into the environment at runtime, and that
// must take precedence over any value baked into the .env file at scaffold time.
const serverPort = env.PORT ?? env.VENDURE_SERVER_PORT;

const storefrontUrl = (pathname: string) =>
  new URL(pathname, env.STOREFRONT_URL).toString();

export const config: VendureConfig = {
  apiOptions: {
    port: serverPort,
    adminApiPath: "admin-api",
    shopApiPath: "shop-api",
    introspection: IS_DEV,
    trustProxy: IS_DEV ? false : 1,
    // Only explicitly configured browser origins may access the APIs.
    // An empty list blocks all cross-origin browser requests.
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: false,
    },
    // The following options are useful in development mode,
    // but are best turned off for production for security
    // reasons.
    ...(IS_DEV
      ? {
          adminApiDebug: true,
          shopApiDebug: true,
        }
      : {}),
  },
  authOptions: {
    tokenMethod: "bearer",
    superadminCredentials: {
      identifier: env.SUPERADMIN_USERNAME,
      password: env.SUPERADMIN_PASSWORD,
    },
  },
  dbConnectionOptions: {
    type: "postgres",
    // See the README.md "Migrations" section for an explanation of
    // the `synchronize` and `migrations` options.
    synchronize: false,
    migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
    logging: false,
    database: env.DB_NAME,
    schema: env.DB_SCHEMA,
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  // When adding or altering custom field definitions, the database will
  // need to be updated. See the "Migrations" section in README.md.
  customFields: {},
  plugins: [
    ...(IS_DEV ? [GraphiqlPlugin.init()] : []),
    AssetServerPlugin.init({
      route: "assets",
      assetUploadDir: path.join(__dirname, "../static/assets"),
      // For local dev, the correct value for assetUrlPrefix should
      // be guessed correctly, but for production it will usually need
      // to be set manually to match your production url.
      assetUrlPrefix: IS_DEV ? undefined : env.ASSET_PUBLIC_URL,
    }),
    DefaultSchedulerPlugin.init(),
    DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
    DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
    EmailPlugin.init({
      devMode: true,
      outputPath: path.join(__dirname, "../static/email/test-emails"),
      route: "mailbox",
      handlers: defaultEmailHandlers,
      templateLoader: new FileBasedTemplateLoader(
        path.join(__dirname, "../static/email/templates"),
      ),
      globalTemplateVars: {
        fromAddress: env.EMAIL_FROM,
        verifyEmailAddressUrl: storefrontUrl("/verify"),
        passwordResetUrl: storefrontUrl("/password-reset"),
        changeEmailAddressUrl: storefrontUrl("/verify-email-address-change"),
      },
    }),
    DashboardPlugin.init({
      route: "dashboard",
      appDir: IS_DEV
        ? path.join(__dirname, "../dist/dashboard")
        : path.join(__dirname, "dashboard"),
    }),
  ],
};
