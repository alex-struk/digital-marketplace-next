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
import { ONLY_ADMINISTRATORS_ANNOUNCE } from "../src/notifications/terms-announcement";

/**
 * An administrator announcing changed terms and a vendor accepting them again, against the
 * service as it is started: over the schema its own migrations made with the acceptance
 * suite's seed applied, through the boundary that checks every request against the contract.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";
const VENDOR_DEACTIVATED = "00000000-0000-4000-8000-000000000205";

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
  const result = { status: answer.status, body: text ? JSON.parse(text) : null };
  // Kept off the compared fields, so an answer can still be compared whole.
  return Object.defineProperty(result, "headers", { value: answer.headers, enumerable: false }) as typeof result & {
    readonly headers: Headers;
  };
}

const AGREED = new Date("2026-09-01T17:30:00.000Z");

async function acceptancesOf(id: string) {
  const result = await database.query<{ acceptedTermsAt: Date | null; lastAcceptedTermsAt: Date | null }>(
    'SELECT "acceptedTermsAt", "lastAcceptedTermsAt" FROM "users" WHERE "id" = $1',
    [id],
  );
  return result.rows[0];
}

async function everyVendorAgreed() {
  await database.query(
    `UPDATE "users" SET "acceptedTermsAt" = $1, "lastAcceptedTermsAt" = $1 WHERE "type" = 'VENDOR'`,
    [AGREED],
  );
}

describe("announcing changed terms (R-6.23)", () => {
  it("is refused to anybody but an administrator, signed in or not, and withdraws nothing", async () => {
    await everyVendorAgreed();
    for (const token of [undefined, await tokens.staff(), await tokens.vendor()]) {
      const answer = await ask("POST", "/api/emailNotifications", token, { tag: "updateTerms" });
      expect(answer).toEqual({ status: 400, body: { errors: [ONLY_ADMINISTRATORS_ANNOUNCE] } });
    }
    expect((await acceptancesOf(VENDOR_ONE))?.acceptedTermsAt).toEqual(AGREED);
  });

  it("refuses any action but updateTerms", async () => {
    const answer = await ask("POST", "/api/emailNotifications", await tokens.admin(), { tag: "somethingElse" });
    expect(answer.status).toBe(400);
  });

  it("withdraws every vendor's acceptance, deactivated vendors' too, keeping when each last accepted (R-4.16)", async () => {
    await everyVendorAgreed();

    const answer = await ask("POST", "/api/emailNotifications", await tokens.admin(), { tag: "updateTerms" });

    expect(answer.status).toBe(200);
    for (const id of [VENDOR_ONE, VENDOR_DEACTIVATED]) {
      expect(await acceptancesOf(id)).toEqual({ acceptedTermsAt: null, lastAcceptedTermsAt: AGREED });
    }
    const remaining = await database.query(
      `SELECT 1 FROM "users" WHERE "type" = 'VENDOR' AND "acceptedTermsAt" IS NOT NULL`,
    );
    expect(remaining.rows).toEqual([]);
  });
});

describe("the shapes an announcement may arrive in (R-6.23)", () => {
  for (const [shape, body] of [
    ["with no value", { tag: "updateTerms" }],
    ["with a null value", { tag: "updateTerms", value: null }],
    ["with an empty value", { tag: "updateTerms", value: {} }],
  ] as const) {
    it(`withdraws every vendor's acceptance when asked ${shape}`, async () => {
      await everyVendorAgreed();

      const answer = await ask("POST", "/api/emailNotifications", await tokens.admin(), body);

      expect(answer.status).toBe(200);
      const remaining = await database.query(
        `SELECT 1 FROM "users" WHERE "type" = 'VENDOR' AND "acceptedTermsAt" IS NOT NULL`,
      );
      expect(remaining.rows).toEqual([]);
    });
  }
});

describe("accepting the new terms again (R-4.16)", () => {
  it("records a fresh acceptance for the vendor themselves", async () => {
    await everyVendorAgreed();
    await ask("POST", "/api/emailNotifications", await tokens.admin(), { tag: "updateTerms" });

    const answer = await ask("PUT", `/api/users/${VENDOR_ONE}`, await tokens.vendor(), { tag: "acceptTerms" });

    expect(answer.status).toBe(200);
    const accepted = new Date(answer.body.acceptedTermsAt as string);
    expect(accepted.getTime()).toBeGreaterThan(AGREED.getTime());
    expect(answer.body.lastAcceptedTermsAt).toBe(answer.body.acceptedTermsAt);
  });

  it("is refused when made on a vendor's behalf, an administrator's included", async () => {
    await everyVendorAgreed();
    await ask("POST", "/api/emailNotifications", await tokens.admin(), { tag: "updateTerms" });

    const answer = await ask("PUT", `/api/users/${VENDOR_ONE}`, await tokens.admin(), { tag: "acceptTerms" });

    expect(answer.status).toBeGreaterThanOrEqual(400);
    expect((await acceptancesOf(VENDOR_ONE))?.acceptedTermsAt).toBeNull();
  });
});

describe("the notification reference (R-6.13, R-6.19)", () => {
  it("is shown to an administrator, every message with its subject and its closing line", async () => {
    const answer = await ask("GET", "/admin/email-notification-reference", await tokens.admin());

    expect(answer.status).toBe(200);
    expect(answer.headers.get("cache-control")).toBe("no-store");
    const messages = (answer.body.groups as { messages: { subject: string; footer: unknown }[] }[]).flatMap(
      (group) => group.messages,
    );
    expect(messages.length).toBeGreaterThan(60);
    expect(messages.every((message) => message.subject !== "" && Boolean(message.footer))).toBe(true);
  });

  it("is not there for anybody else, signed in or not", async () => {
    for (const token of [undefined, await tokens.staff(), await tokens.vendor()]) {
      const answer = await ask("GET", "/admin/email-notification-reference", token);
      expect(answer.status).toBe(404);
      expect(answer.body).not.toHaveProperty("groups");
    }
  });
});
