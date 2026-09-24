import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "./schema/shop.graphql",
  documents: ["src/operations/**/*.graphql"],
  generates: {
    "./src/generated/": {
      preset: "client",
      config: {
        useTypeImports: true,
        defaultScalarType: "unknown",
        scalars: {
          Money: "number",
          DateTime: "string",
          JSON: "unknown",
        },
        namingConvention: {
          enumValues: "keep",
        },
      },
    },
  },
};

export default config;
