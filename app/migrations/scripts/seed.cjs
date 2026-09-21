"use strict";

/**
 * Put the database back to the state tests/seed/manifest.yaml describes.
 *
 * It wipes whatever is there, runs the whole migration history, then applies every
 * tests/seed/*.sql in ascending name order — which is the order the manifest names them in.
 * Running it twice leaves the same data.
 *
 * It is the `seed` service in app/compose/compose.yaml, and it runs nowhere near a deployed
 * environment: it drops the schema, which is only ever a thing to do to a sandbox.
 */

const fs = require("node:fs");
const path = require("node:path");
const knexFactory = require("knex");
const knexConfig = require("../knexfile.cjs");

const SEED_DIR =
  process.env.SEED_DIR || path.resolve(__dirname, "../../../tests/seed");

/**
 * @param {string} event
 * @param {Record<string, unknown>} [detail]
 */
function log(event, detail) {
  process.stdout.write(
    JSON.stringify({
      level: "info",
      time: new Date().toISOString(),
      logger: "seed",
      event,
      ...detail,
    }) + "\n",
  );
}

/**
 * @param {string} directory
 * @returns {string[]}
 */
function seedFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function main() {
  const knex = knexFactory({
    client: knexConfig.client,
    connection: knexConfig.connection,
    pool: knexConfig.pool,
    migrations: {
      ...knexConfig.migrations,
      directory: path.resolve(__dirname, "../migrations"),
    },
  });

  try {
    log("wiping");
    await knex.raw('DROP SCHEMA IF EXISTS "public" CASCADE');
    await knex.raw('CREATE SCHEMA "public"');

    log("migrating");
    const [, applied] = await knex.migrate.latest();
    log("migrated", { count: applied.length });

    const files = seedFiles(SEED_DIR);
    for (const file of files) {
      const sql = fs.readFileSync(path.join(SEED_DIR, file), "utf8");
      await knex.raw(sql);
      log("applied", { file });
    }
    log("seeded", { files: files.length });
  } finally {
    await knex.destroy();
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(
      JSON.stringify({
        level: "error",
        time: new Date().toISOString(),
        logger: "seed",
        event: "failed",
        message: error instanceof Error ? error.message : String(error),
      }) + "\n",
    );
    process.exitCode = 1;
  });
}

module.exports = { seedFiles };
