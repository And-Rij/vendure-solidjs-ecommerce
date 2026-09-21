import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { promisify } from "node:util";
import test from "node:test";
import pg from "pg";

const exec = promisify(execFile);
const cwd = new URL("../", import.meta.url);

test(
  "demo seed: empty DB, repeat, preservation, conflicts and guards",
  { timeout: 180_000 },
  async (t) => {
    assert.equal(
      process.env.ALLOW_DEMO_SEED_TEST,
      "true",
      "Explicit ALLOW_DEMO_SEED_TEST=true required",
    );
    assert.equal(
      process.env.DB_PORT,
      "6544",
      "Use the isolated PostgreSQL on 6544",
    );
    assert.ok(["localhost", "127.0.0.1"].includes(process.env.DB_HOST));
    const database = `vendure_seed_test_${randomBytes(6).toString("hex")}`;
    const config = {
      host: process.env.DB_HOST,
      port: 6544,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    };
    const admin = new pg.Client({ ...config, database: "postgres" });
    const db = new pg.Client({ ...config, database });
    const env = {
      ...process.env,
      DB_NAME: database,
      DB_SCHEMA: "public",
      APP_ENV: "test",
      NODE_ENV: "test",
      ALLOW_DEMO_SEED: "true",
      ASSET_PUBLIC_URL: "http://localhost:3101/assets",
      VENDURE_DISABLE_TELEMETRY: "true",
    };
    async function node(args, overrides = {}, expected = 0) {
      let result;
      try {
        result = {
          ...(await exec(process.execPath, args, {
            cwd,
            env: { ...env, ...overrides },
            timeout: 40_000,
          })),
          code: 0,
        };
      } catch (error) {
        if (!Number.isInteger(error.code)) throw error;
        result = error;
      }
      assert.equal(result.code, expected, `${result.stdout}\n${result.stderr}`);
      return `${result.stdout}\n${result.stderr}`;
    }
    const seedArgs = [
      "dist/scripts/seed-demo.js",
      `--confirm-database=${database}`,
    ];
    const counts = async () =>
      (
        await db.query(`SELECT
    (SELECT count(*) FROM product) AS products,
    (SELECT count(*) FROM product_variant) AS variants,
    (SELECT count(*) FROM tax_category) AS categories,
    (SELECT count(*) FROM tax_rate) AS rates,
    (SELECT count(*) FROM zone) AS zones,
    (SELECT count(*) FROM facet) AS facets,
    (SELECT count(*) FROM facet_value) AS values,
    (SELECT count(*) FROM product_option_group) AS groups,
    (SELECT count(*) FROM product_option) AS options,
    (SELECT count(*) FROM collection) AS collections`)
      ).rows[0];
    let created = false;
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE "${database}"`);
      created = true;
      await db.connect();
      await t.test("guards reject before connecting/bootstrap", async () => {
        const invalidPort = { DB_PORT: "1" };
        assert.match(
          await node(seedArgs, { ...invalidPort, ALLOW_DEMO_SEED: "false" }, 1),
          /Demo seed is disabled/,
        );
        assert.match(
          await node(seedArgs, { ...invalidPort, APP_ENV: "production" }, 1),
          /forbidden in production/,
        );
        assert.match(
          await node(seedArgs, { ...invalidPort, NODE_ENV: "production" }, 1),
          /forbidden in production/,
        );
        assert.match(
          await node(
            ["dist/scripts/seed-demo.js", "--confirm-database=wrong"],
            invalidPort,
            1,
          ),
          /confirm-database/,
        );
      });
      await node([
        "-e",
        "const {runMigrations}=require('@vendure/core'); const {config}=require('./dist/vendure-config'); runMigrations(config).catch(e=>{console.error(e.message);process.exitCode=1})",
      ]);
      await t.test(
        "creates configuration and complete demo product from empty schema",
        async () => {
          assert.match(await node(seedArgs), /Demo seed completed/);
          const snapshot = await counts();
          assert.equal(snapshot.products, "1");
          assert.equal(snapshot.variants, "1");
          assert.equal(snapshot.groups, "2");
          assert.equal(snapshot.options, "2");
          assert.equal(snapshot.collections, "2"); // root + Namety
          const channel = (
            await db.query("SELECT * FROM channel WHERE code = $1", [
              "__default_channel__",
            ])
          ).rows[0];
          assert.equal(channel.defaultLanguageCode, "uk");
          assert.equal(channel.defaultCurrencyCode, "UAH");
          assert.equal(channel.pricesIncludeTax, true);
          assert.ok(channel.defaultTaxZoneId);
          assert.equal(channel.defaultShippingZoneId, channel.defaultTaxZoneId);
          const rate = (await db.query("SELECT * FROM tax_rate")).rows[0];
          assert.equal(Number(rate.value), 20);
          assert.equal(rate.enabled, true);
          assert.equal(
            (
              await db.query(
                'SELECT price FROM product_variant_price WHERE "currencyCode"=$1',
                ["UAH"],
              )
            ).rows[0].price,
            899900,
          );
          assert.equal(
            (await db.query('SELECT "stockOnHand" FROM stock_level')).rows[0]
              .stockOnHand,
            12,
          );
        },
      );
      await t.test(
        "repeat keeps IDs/counts and existing modified price/stock",
        async () => {
          const before = await counts();
          const ids = (await db.query("SELECT id, sku FROM product_variant"))
            .rows;
          await db.query("UPDATE product_variant_price SET price = 777700");
          await db.query('UPDATE stock_level SET "stockOnHand" = 7');
          assert.match(await node(seedArgs), /already exists/);
          assert.deepEqual(await counts(), before);
          assert.deepEqual(
            (await db.query("SELECT id, sku FROM product_variant")).rows,
            ids,
          );
          assert.equal(
            (await db.query("SELECT price FROM product_variant_price LIMIT 1"))
              .rows[0].price,
            777700,
          );
          assert.equal(
            (await db.query('SELECT "stockOnHand" FROM stock_level')).rows[0]
              .stockOnHand,
            7,
          );
        },
      );
      await t.test(
        "upgrades legacy variant without options without resetting price/stock",
        async () => {
          await db.query("DELETE FROM product_variant_options_product_option");
          assert.match(await node(seedArgs), /already exists/);
          assert.equal(
            Number(
              (
                await db.query(
                  "SELECT count(*) FROM product_variant_options_product_option",
                )
              ).rows[0].count,
            ),
            2,
          );
          assert.equal(
            (await db.query("SELECT price FROM product_variant_price LIMIT 1"))
              .rows[0].price,
            777700,
          );
          assert.equal(
            (await db.query('SELECT "stockOnHand" FROM stock_level')).rows[0]
              .stockOnHand,
            7,
          );
        },
      );
      await t.test(
        "rejects conflicting options without silently replacing them",
        async () => {
          const link = (
            await db.query(
              'DELETE FROM product_variant_options_product_option WHERE "productOptionId" = (SELECT min("productOptionId") FROM product_variant_options_product_option) RETURNING *',
            )
          ).rows[0];
          try {
            assert.match(await node(seedArgs, {}, 1), /conflicting options/);
            assert.equal(
              Number(
                (
                  await db.query(
                    "SELECT count(*) FROM product_variant_options_product_option",
                  )
                ).rows[0].count,
              ),
              1,
            );
          } finally {
            await db.query(
              'INSERT INTO product_variant_options_product_option ("productVariantId", "productOptionId") VALUES ($1,$2)',
              [link.productVariantId, link.productOptionId],
            );
          }
        },
      );
      await t.test("rejects conflicting tax without resetting it", async () => {
        await db.query("UPDATE tax_rate SET value=10");
        assert.match(
          await node(seedArgs, {}, 1),
          /must be enabled and equal to 20/,
        );
        assert.equal(
          Number((await db.query("SELECT value FROM tax_rate")).rows[0].value),
          10,
        );
        await db.query("UPDATE tax_rate SET value=20");
      });
      await t.test(
        "rejects SKU owned by another product before creating anything",
        async () => {
          const before = await counts();
          await db.query("UPDATE product_translation SET slug=$1", [
            "different-product",
          ]);
          assert.match(
            await node(seedArgs, {}, 1),
            /SKU belongs to another product/,
          );
          assert.deepEqual(await counts(), before);
          await db.query("UPDATE product_translation SET slug=$1", [
            "polonyna-trek",
          ]);
        },
      );
      await t.test("rejects duplicate tax category", async () => {
        const inserted = (
          await db.query(
            'INSERT INTO tax_category (name,"isDefault") VALUES ($1,false) RETURNING id',
            ["Standard"],
          )
        ).rows[0];
        assert.match(await node(seedArgs, {}, 1), /Ambiguous tax category/);
        await db.query("DELETE FROM tax_category WHERE id=$1", [inserted.id]);
      });
      await t.test(
        "rejects concurrent seed while advisory lock is held",
        async () => {
          await db.query("SELECT pg_advisory_lock(782341, 1)");
          try {
            assert.match(await node(seedArgs, {}, 1), /Another demo seed/);
          } finally {
            await db.query("SELECT pg_advisory_unlock(782341, 1)");
          }
        },
      );
      await node(seedArgs);
      if (process.env.SEED_TEST_E2E === "true") {
        await t.test(
          "seeded Shop API, collection jobs and storefront cart E2E",
          async () => {
            await db.query("UPDATE product_variant_price SET price = 899900");
            await db.query('UPDATE stock_level SET "stockOnHand" = 12');
            const children = [];
            const logs = [];
            function start(file, overrides) {
              const child = spawn(process.execPath, [file], {
                cwd,
                env: { ...env, ...overrides },
                stdio: ["ignore", "pipe", "pipe"],
              });
              child.stdout.on("data", (data) => logs.push(String(data)));
              child.stderr.on("data", (data) => logs.push(String(data)));
              children.push(child);
              return child;
            }
            async function waitFor(check) {
              const deadline = Date.now() + 30_000;
              while (Date.now() < deadline) {
                if (children.some((child) => child.exitCode !== null))
                  throw new Error(logs.join(""));
                try {
                  if (await check()) return;
                } catch {
                  /* booting */
                }
                await new Promise((resolve) => setTimeout(resolve, 250));
              }
              throw new Error(
                `Seeded API did not become ready: ${logs.join("")}`,
              );
            }
            try {
              // Fail before starting tests if another user's service owns these ports.
              for (const port of [3101, 3121]) {
                await new Promise((resolve, reject) => {
                  const probe = createServer();
                  probe.once("error", reject);
                  probe.listen(port, () => probe.close(resolve));
                });
              }
              start("dist/index.js", { PORT: "3101" });
              start("dist/index-worker.js", {
                VENDURE_WORKER_HEALTH_PORT: "3121",
              });
              await waitFor(
                async () => (await fetch("http://localhost:3101/health")).ok,
              );
              await waitFor(async () => {
                const response = await fetch(
                  "http://localhost:3101/shop-api?languageCode=uk",
                  {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      query:
                        '{ product(slug:"polonyna-trek") { name variants { sku priceWithTax currencyCode stockLevel } } collection(slug:"namety") { productVariants { totalItems } } }',
                    }),
                  },
                );
                const result = await response.json();
                if (
                  result.errors ||
                  result.data.collection?.productVariants.totalItems !== 1
                )
                  return false;
                assert.equal(result.data.product.name, "Полонина Trek");
                assert.equal(
                  result.data.product.variants[0].priceWithTax,
                  899900,
                );
                assert.equal(
                  result.data.product.variants[0].currencyCode,
                  "UAH",
                );
                assert.equal(
                  result.data.product.variants[0].stockLevel,
                  "IN_STOCK",
                );
                return true;
              });
              const storefront = new URL("../../storefront/", import.meta.url);
              const result = await exec(
                process.execPath,
                [
                  fileURLToPath(
                    new URL("node_modules/@playwright/test/cli.js", storefront),
                  ),
                  "test",
                ],
                {
                  cwd: storefront,
                  timeout: 60_000,
                  env: {
                    ...env,
                    SERVER_VENDURE_SHOP_API_URL:
                      "http://localhost:3101/shop-api",
                    SERVER_VENDURE_CHANNEL_TOKEN: "",
                    SERVER_VENDURE_LANGUAGE_CODE: "uk",
                  },
                },
              );
              assert.match(result.stdout, /3 passed/);
            } finally {
              for (const child of children) {
                if (child.exitCode === null) {
                  const closed = once(child, "close");
                  child.kill();
                  await closed;
                }
              }
            }
          },
        );
      }
    } finally {
      await db.end();
      // Only the unique database created by this test, never the source env database.
      if (created && /^vendure_seed_test_[a-f0-9]{12}$/.test(database)) {
        await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
      }
      await admin.end();
    }
  },
);
