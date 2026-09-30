import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";

/**
 * The seed script as the compose `seed` service runs it: wipe, the whole migration history,
 * then every tests/seed/*.sql. It is run twice over the same database, as the harness does
 * between runs, and must leave the same data each time.
 */

const require = createRequire(import.meta.url);
const { seed } = require("../scripts/seed.cjs");

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(here, "../../../tests/seed");
const PORT = 55433;

/** @type {import("@electric-sql/pglite").PGlite} */
let database;
/** @type {import("@electric-sql/pglite-socket").PGLiteSocketServer} */
let socket;
/** @type {import("knex").Knex} */
let knex;

beforeAll(async () => {
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port: PORT, host: "127.0.0.1" });
  await socket.start();
  knex = knexFactory({
    client: "pg",
    connection: `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`,
    pool: { min: 1, max: 1 },
    migrations: {
      directory: path.resolve(here, "../migrations"),
      loadExtensions: [".cjs"],
    },
  });
}, 120_000);

afterAll(async () => {
  await knex?.destroy();
  await socket?.stop();
  await database?.close();
});

/** @returns {Promise<string[]>} */
async function serviceAreas() {
  return (await knex("serviceAreas").orderBy("id").select("id", "serviceArea")).map(
    (row) => `${row.id}:${row.serviceArea}`,
  );
}

describe("the seed script", () => {
  it("wipes, migrates and applies every seed file, and does the same again", async () => {
    await seed(knex, SEED_DIR);
    const first = await serviceAreas();
    const [{ count: firstUsers }] = (
      await knex.raw('SELECT count(*)::int AS count FROM "users"')
    ).rows;

    await seed(knex, SEED_DIR);
    expect(await serviceAreas()).toEqual(first);
    const [{ count: secondUsers }] = (
      await knex.raw('SELECT count(*)::int AS count FROM "users"')
    ).rows;
    expect(secondUsers).toBe(firstUsers);

    expect(first).toEqual([
      "1:FULL_STACK_DEVELOPER",
      "2:DATA_PROFESSIONAL",
      "3:AGILE_COACH",
      "4:DEVOPS_SPECIALIST",
      "5:SERVICE_DESIGNER",
    ]);
  }, 120_000);
});
