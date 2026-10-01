import { createServer, Server } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { freePort } from "./free-port";
import { ADDRESS_IN_USE_REFUSAL, PAGES_ARE_FOR_ADMINISTRATORS } from "../src/rules/content";

/**
 * An administrator managing pages, against the service as it is started: over the schema its
 * own migrations made with the acceptance suite's seed applied, through the boundary that
 * checks every request against the contract, with tokens checked against a published key set.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const ADMIN = "00000000-0000-4000-8000-000000000101";
const ADMIN_TWO = "00000000-0000-4000-8000-000000000106";
const ABOUT_US = "00000000-0000-4000-8000-000000000501";

let database: PGlite;
let socket: PGLiteSocketServer;
let keyServer: Server;
let realm: TestRealm;
let app: INestApplication;
let origin: string;

beforeAll(async () => {
  const port = await freePort();
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port, host: "127.0.0.1" });
  await socket.start();

  const knex = knexFactory({
    client: "pg",
    connection: url,
    pool: { min: 1, max: 1 },
    migrations: {
      directory: path.resolve(__dirname, "../../migrations/migrations"),
      loadExtensions: [".cjs"],
    },
  });
  await knex.migrate.latest();
  for (const file of readdirSync(SEED_DIR).filter((name) => name.endsWith(".sql")).sort()) {
    await knex.raw(readFileSync(path.join(SEED_DIR, file), "utf8"));
  }
  await knex.destroy();

  realm = await testRealm();
  keyServer = createServer((request, response) => {
    request.resume();
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(realm.jwks));
    });
  });
  await new Promise<void>((resolve) => keyServer.listen(0, "127.0.0.1", resolve));
  const keyAddress = keyServer.address();
  const keyPort = typeof keyAddress === "object" && keyAddress ? keyAddress.port : 0;

  Object.assign(process.env, {
    DATABASE_URL: `${url}?connection_limit=1`,
    CONTRACT_PATH: path.resolve(__dirname, "../../../spec/contract/openapi.yaml"),
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: CLIENT_ID,
    OIDC_JWKS_URL: `http://127.0.0.1:${keyPort}/certs`,
    OIDC_BACKCHANNEL_URL: `http://127.0.0.1:${keyPort}`,
    DISABLE_NOTIFICATIONS: "1",
    SERVICE_ORIGIN: "http://localhost:4300",
  });
  const { createApplication } = await import("../src/application");
  app = await createApplication();
  await app.listen(0, "127.0.0.1");
  origin = await app.getUrl();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await new Promise<void>((resolve) => (keyServer ? keyServer.close(() => resolve()) : resolve()));
  await socket?.stop();
  await database?.close();
});

const tokens = {
  admin: () => realm.token({ preferred_username: "test-admin", identity_provider: "idir", sid: "admin" }),
  adminTwo: () => realm.token({ preferred_username: "admin-second", identity_provider: "idir", sid: "admin-two" }),
  staff: () => realm.token({ preferred_username: "test-gov", identity_provider: "idir", sid: "staff" }),
  vendor: () => realm.token({ preferred_username: "test-vendor-1", identity_provider: "bceid", sid: "vendor" }),
};

async function ask(method: string, address: string, token?: string, body?: unknown) {
  const answer = await fetch(`${origin}${address}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await answer.text();
  return { status: answer.status, body: text ? JSON.parse(text) : null };
}

async function versionsOf(contentId: string): Promise<string[]> {
  const result = await database.query<{ body: string }>(
    'SELECT "body" FROM "contentVersions" WHERE "contentId" = $1 ORDER BY "id"',
    [contentId],
  );
  return result.rows.map((row) => row.body);
}

describe("every page request refused for lack of permission (R-7.10, R-7.16)", () => {
  it("is answered 401 in the one shape, whoever asks and whatever they ask", async () => {
    const asking = [undefined, await tokens.staff(), await tokens.vendor()];
    for (const token of asking) {
      const answers = [
        await ask("GET", "/api/content", token),
        await ask("POST", "/api/content", token, { title: "Mine", slug: "mine", body: "Mine." }),
        await ask("PUT", "/api/content/about-us", token, { title: "Mine", slug: "about-us", body: "Mine." }),
        await ask("PUT", `/api/content/${ABOUT_US}`, token, { title: "Mine", slug: "about-us", body: "Mine." }),
        await ask("PUT", "/api/content/about", token, { title: "Mine", body: "Mine." }),
        await ask("DELETE", "/api/content/about-us", token),
      ];
      for (const answer of answers) {
        expect(answer).toEqual({ status: 401, body: { errors: [PAGES_ARE_FOR_ADMINISTRATORS] } });
      }
    }
    expect(await versionsOf(ABOUT_US)).toHaveLength(3);
    expect((await ask("GET", "/api/content/mine")).status).toBe(404);
  });
});

describe("the list of pages (R-7.5, R-7.12)", () => {
  it("names every page once, in order of title, with whether the service needs it", async () => {
    const answer = await ask("GET", "/api/content", await tokens.admin());
    expect(answer.status).toBe(200);
    const pages = answer.body as { slug: string; title: string; fixed: boolean; createdAt: string; updatedAt: string }[];
    const titles = pages.map((page) => page.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "en")));
    expect(new Set(pages.map((page) => page.slug)).size).toBe(pages.length);
    const about = pages.find((page) => page.slug === "about");
    expect(about).toMatchObject({ title: "about", fixed: true });
    expect(pages.find((page) => page.slug === "about-us")).toMatchObject({
      fixed: false,
      createdAt: "2026-01-05T17:00:00.000Z",
      updatedAt: "2026-01-07T17:00:00.000Z",
    });
  });
});

describe("authorship on the managing screen (R-7.27)", () => {
  it("names both people to an administrator, and nobody to anyone else", async () => {
    const toAdministrator = await ask("GET", "/api/content/changed-by-another-administrator", await tokens.admin());
    expect(toAdministrator.body).toMatchObject({
      createdBy: { id: ADMIN, name: expect.any(String) },
      updatedBy: { id: ADMIN_TWO, name: expect.any(String) },
    });
    const toVendor = await ask("GET", "/api/content/changed-by-another-administrator", await tokens.vendor());
    expect(toVendor.body).not.toHaveProperty("createdBy");

    const system = await ask("GET", "/api/content/privacy", await tokens.admin());
    expect(system.body).toMatchObject({ createdBy: null, updatedBy: null, body: "Initial version" });
  });
});

describe("an administrator writing pages (R-7.7, R-7.8, R-7.9, R-7.22, R-7.24, R-7.25)", () => {
  it("creates, re-words, renames and removes an ordinary page", async () => {
    const admin = await tokens.admin();
    const created = await ask("POST", "/api/content", admin, {
      title: "Hackathon rules",
      slug: "hackathon-rules",
      body: "The rules.",
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ slug: "hackathon-rules", fixed: false, createdBy: { id: ADMIN } });
    expect((await ask("GET", "/api/content/hackathon-rules")).body).toMatchObject({ body: "The rules." });

    const changed = await ask("PUT", `/api/content/${created.body.id}`, await tokens.adminTwo(), {
      title: "Hackathon rules",
      slug: "hackathon-rules",
      body: "The new rules.",
    });
    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({ createdBy: { id: ADMIN }, updatedBy: { id: ADMIN_TWO } });
    expect(await versionsOf(created.body.id)).toEqual(["The rules.", "The new rules."]);

    const clash = await ask("PUT", "/api/content/hackathon-rules", admin, {
      title: "Hackathon rules",
      slug: "about",
      body: "Moved.",
    });
    expect(clash).toEqual({ status: 400, body: { errors: [ADDRESS_IN_USE_REFUSAL] } });

    const renamed = await ask("PUT", "/api/content/hackathon-rules", admin, {
      title: "Hackathon rules",
      slug: "hackathon",
      body: "The new rules.",
    });
    expect(renamed.body).toMatchObject({ slug: "hackathon" });
    expect((await ask("GET", "/api/content/hackathon-rules")).status).toBe(404);

    const removed = await ask("DELETE", "/api/content/hackathon", admin);
    expect(removed.status).toBe(200);
    expect((await ask("GET", "/api/content/hackathon")).status).toBe(404);
    expect(await versionsOf(created.body.id)).toEqual([]);
  });

  it("refuses a second page at an address already held", async () => {
    const answer = await ask("POST", "/api/content", await tokens.admin(), { title: "About", slug: "about", body: "Again." });
    expect(answer).toEqual({ status: 400, body: { errors: [ADDRESS_IN_USE_REFUSAL] } });
  });

  it("re-words a page the service needs, but neither renames nor removes it", async () => {
    const admin = await tokens.admin();
    const reworded = await ask("PUT", "/api/content/disclaimer", admin, { title: "Disclaimer", body: "Written." });
    expect(reworded.body).toMatchObject({ slug: "disclaimer", title: "Disclaimer", fixed: true });

    expect((await ask("PUT", "/api/content/disclaimer", admin, { title: "D", slug: "notice", body: "x" })).status).toBe(400);
    expect((await ask("DELETE", "/api/content/disclaimer", admin)).status).toBe(400);
    expect((await ask("GET", "/api/content/disclaimer")).body).toMatchObject({ body: "Written." });
  });
});
