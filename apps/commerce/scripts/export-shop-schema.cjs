const { createRequire } = require("node:module");
const { writeFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const {
  ConfigService,
  getFinalVendureSchema,
  setConfig,
  VENDURE_SHOP_API_TYPE_PATHS,
} = require("@vendure/core");

// Resolve Nest's loader from Vendure's dependency tree; it is not an app dependency.
const requireFromVendure = createRequire(require.resolve("@vendure/core"));
const { GraphQLTypesLoader } = requireFromVendure("@nestjs/graphql");
const { config } = require("../dist/vendure-config.js");

async function main() {
  await setConfig(config);
  const schema = await getFinalVendureSchema({
    config: new ConfigService(),
    typePaths: VENDURE_SHOP_API_TYPE_PATHS,
    typesLoader: new GraphQLTypesLoader(),
    apiType: "shop",
    output: "sdl",
  });
  const destination = path.resolve(
    __dirname,
    "../../../packages/shop-api/schema/shop.graphql",
  );
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${schema}\n`);
  console.log(`Wrote ${destination}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
