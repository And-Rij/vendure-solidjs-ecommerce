/// <reference types="@solidjs/start/env" />

declare module "env:server/runtime" {
  const env: Record<string, string | undefined>;
  export default env;
}
