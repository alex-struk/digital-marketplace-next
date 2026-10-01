import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";

/**
 * The whole history, run against a real PostgreSQL, followed by the acceptance suite's own
 * seed files.
 *
 * This is the check that matters for a kept schema: the seed files are written against the
 * schema the old application left behind, so if every one of them applies unchanged, the
 * baseline is the shape they expect. PostgreSQL here is PGlite — the same engine, in
 * process — so the check needs nothing but Node.
 */

const require = createRequire(import.meta.url);
const { PAGE_SLUGS, PLACEHOLDER_BODY, SERVICE_LEVEL_AGREEMENT_SLUG } = require("../lib/fixed-pages.cjs");

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(here, "../../../tests/seed");
const PORT = 55432;

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
  await knex.migrate.latest();
  // What the migrations alone left, before the seed files — which restore every page the old
  // application carried — are applied on top.
  freshPageSlugs = (await knex("content").select("slug")).map((row) => row.slug);
}, 120_000);

/** @type {string[]} */
let freshPageSlugs = [];

afterAll(async () => {
  await knex?.destroy();
  await socket?.stop();
  await database?.close();
});

describe("the kept schema", () => {
  it("takes every one of the acceptance suite's seed files, in order", async () => {
    const files = fs.readdirSync(SEED_DIR).filter((n) => n.endsWith(".sql")).sort();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      await knex.raw(fs.readFileSync(path.join(SEED_DIR, file), "utf8"));
    }

    // The seed is another stage's and grows as criteria need records, so what is checked is
    // that the handles tests/seed/manifest.yaml names are there, not how many rows there are.
    for (const id of [
      "00000000-0000-4000-8000-000000000101", // users.administratorOne
      "00000000-0000-4000-8000-000000000102", // users.staffOne
      "00000000-0000-4000-8000-000000000201", // users.vendorOne
      "00000000-0000-4000-8000-000000000207", // users.vendorWithoutEmail
      "00000000-0000-4000-8000-000000000220", // users.vendorCompletingProfile
    ]) {
      expect(await knex("users").where({ id }).first(), id).toBeTruthy();
    }
    expect(
      await knex("cwuProposals").where({ opportunity: "00000000-0000-4000-a007-000000000001" }),
    ).toHaveLength(2); // opportunities.cwuInProcessing
    expect(
      await knex("swuProposals").where({ opportunity: "00000000-0000-4000-8000-000000000701" }),
    ).toHaveLength(3); // opportunities.closedSprintWithUs
  }, 120_000);

  it("holds the page an administrator made, with a history behind it", async () => {
    const page = await knex("content").where({ slug: "about-us" }).first();
    expect(page.fixed).toBe(false);
    const versions = await knex("contentVersions")
      .where({ contentId: page.id })
      .orderBy("id");
    // What matters here is that the page an administrator made carries a history and that
    // the wording the acceptance suite reads is in it. The seed is another stage's file and
    // may grow a further version, so this reads the history it has rather than a count.
    expect(versions.length).toBeGreaterThanOrEqual(3);
    expect(versions[2].body).toContain("**formatted**");
  });

  it("still counts twenty-two needed pages once the seed has put the old ones back (R-7.12)", async () => {
    // 000-installation.sql restores the old application's twenty-two, each only where it is
    // missing; the migrations must not have left a needed page of their own beside them.
    const needed = await knex("content").where({ fixed: true }).select("slug");
    expect(needed.map((row) => row.slug).sort()).toEqual([...PAGE_SLUGS].sort());
  });
});

describe("what a fresh installation carries (R-7.12, R-7.18)", () => {
  it("creates every page the service needs, titled by its own address", async () => {
    for (const slug of PAGE_SLUGS) {
      const page = await knex("content").where({ slug }).first();
      expect(page, `no page at ${slug}`).toBeTruthy();
      expect(page.fixed).toBe(true);
      // No author, so an administrator's screen names the service itself (R-7.27).
      expect(page.createdBy).toBeNull();

      const version = await knex("contentVersions")
        .where({ contentId: page.id })
        .orderBy("id", "desc")
        .first();
      expect(version.title).toBe(slug);
      expect(version.body).toBe(PLACEHOLDER_BODY);
    }
  });

  it("stores no service level agreement page, which the service answers itself (R-7.18)", async () => {
    expect(freshPageSlugs).not.toContain(SERVICE_LEVEL_AGREEMENT_SLUG);
  });

  it("creates the footer's five pages (R-7.19)", async () => {
    for (const slug of ["about", "disclaimer", "privacy", "accessibility", "copyright"]) {
      expect(await knex("content").where({ slug }).first()).toBeTruthy();
    }
  });

  it("stores exactly the twenty-two needed pages and nothing else (R-7.12)", async () => {
    expect([...freshPageSlugs].sort()).toEqual([...PAGE_SLUGS].sort());
    expect(freshPageSlugs).toHaveLength(22);
  });

  it("leaves a page an installation already holds exactly as it is", async () => {
    // The migration is run a second time here; the page an administrator made keeps its own
    // wording, its history and its author, and no needed page is duplicated.
    const countPages = async () =>
      (await knex.raw('SELECT count(*)::int AS count FROM "content"')).rows[0].count;

    const ordinary = await knex("content").where({ slug: "about-us" }).first();
    const countVersions = async () =>
      (await knex("contentVersions").where({ contentId: ordinary.id })).length;

    const before = await countPages();
    const versionsBefore = await countVersions();
    await knex.raw(
      `DELETE FROM "knex_migrations" WHERE "name" = '20260930000005_the_twenty_two_needed_pages.cjs'`,
    );
    await knex.migrate.latest();

    expect(await countPages()).toBe(before);
    expect(await countVersions()).toBe(versionsBefore);
  }, 60_000);
});
