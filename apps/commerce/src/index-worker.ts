import { bootstrapWorker } from "@vendure/core";
import { config } from "./vendure-config";
import { env } from "./config/env";

const healthPort = env.VENDURE_WORKER_HEALTH_PORT;

bootstrapWorker(config)
  .then((worker) => worker.startJobQueue())
  .then((worker) =>
    worker.startHealthCheckServer({
      port: healthPort,
      hostname: "0.0.0.0",
    }),
  )
  .catch((err) => {
    console.log(err);
  });
