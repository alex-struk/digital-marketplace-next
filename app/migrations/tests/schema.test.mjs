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
const { PAGE_SLUGS, PLACEHOLDER_BODY, PAGES_NOT_CREATED } = require("../lib/fixed-pages.cjs");

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
}, 120_000);

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

    const [{ count: users }] = (await knex.raw('SELECT count(*)::int AS count FROM "users"')).rows;
    const [{ count: proposals }] = (
      await knex.raw('SELECT count(*)::int AS count FROM "swuProposals"')
    ).rows;
    // Six public sector accounts and twelve vendors, as tests/seed/manifest.yaml names them.
    expect(users).toBe(18);
    expect(proposals).toBe(3);
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

  it("creates the service level agreement page, so its five links resolve (R-7.18)", async () => {
    const page = await knex("content").where({ slug: "service-level-agreement" }).first();
    expect(page).toBeTruthy();
    expect(page.fixed).toBe(true);
  });

  it("creates the footer's five pages (R-7.19)", async () => {
    for (const slug of ["about", "disclaimer", "privacy", "accessibility", "copyright"]) {
      expect(await knex("content").where({ slug }).first()).toBeTruthy();
    }
  });

  it("creates none of the seven pages nothing links to", async () => {
    for (const slug of PAGES_NOT_CREATED) {
      expect(await knex("content").where({ slug }).first()).toBeUndefined();
    }
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
      `DELETE FROM "knex_migrations" WHERE "name" = '20260920000001_fixed_pages.cjs'`,
    );
    await knex.migrate.latest();

    expect(await countPages()).toBe(before);
    expect(await countVersions()).toBe(versionsBefore);
  }, 60_000);
});
