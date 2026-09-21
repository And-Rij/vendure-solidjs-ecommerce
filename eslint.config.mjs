import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import solid from "eslint-plugin-solid/configs/typescript";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/.output/**",
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",
    "**/.nitro/**",
    "**/.tanstack/**",
    "**/.vendure/**",
    "**/coverage/**",
    "**/test-results/**",
    "**/playwright-report/**",
    "**/blob-report/**",
    "**/playwright/.auth/**",
    ".pnpm-store/**",
    "packages/shop-api/src/generated/**",
    "apps/commerce/src/gql/**",
    "apps/commerce/static/**",
  ]),

  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    files: ["apps/storefront/src/**/*.{ts,tsx}"],
    extends: [solid],
    languageOptions: {
      globals: globals.browser,
    },
  },

  prettier,
);
