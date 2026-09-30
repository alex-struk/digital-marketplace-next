import { createServer, Server } from "node:http";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory, { Knex } from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { SmtpCatcher } from "./smtp-catcher";

/**
 * Signing in, finishing signing up and signing out, against the service as it is started:
 * over the schema its own migrations made, with its tokens checked against a published key
 * set and its mail handed to a mail server. Nothing inside the service is stood in for.
 */
const DB_PORT = 55436;
const url = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;
// PGlite answers one connection at a time, so the service is held to one.
const serviceUrl = `${url}?connection_limit=1`;
const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";
const DEACTIVATED = "00000000-0000-4000-8000-000000000205";

let database: PGlite;
let socket: PGLiteSocketServer;
let keyServer: Server;
let catcher: SmtpCatcher;
let realm: TestRealm;
let app: INestApplication;
let origin: string;

function account(id: string, idp: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    createdAt: new Date("2026-01-05T17:00:00Z"),
    updatedAt: new Date("2026-01-05T17:00:00Z"),
    type: "VENDOR",
    status: "ACTIVE",
    name: "Placeholder",
    email: `${idp}@example.test`,
    idpUsername: idp,
    idpId: idp,
    acceptedTermsAt: new Date("2026-01-05T17:00:00Z"),
    lastAcceptedTermsAt: new Date("2026-01-05T17:00:00Z"),
    ...overrides,
  };
}

beforeAll(async () => {
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port: DB_PORT, host: "127.0.0.1" });
  await socket.start();

  const knex: Knex = knexFactory({
    client: "pg",
    connection: url,
    pool: { min: 1, max: 1 },
    migrations: {
      directory: path.resolve(__dirname, "../../migrations/migrations"),
      loadExtensions: [".cjs"],
    },
  });
  await knex.migrate.latest();
  await knex("users").insert([
    account(VENDOR_ONE, "test-vendor-1", { email: "vendor.one@example.test" }),
    account(DEACTIVATED, "test-vendor-5", { status: "INACTIVE_ADMIN" }),
  ]);
  await knex.destroy();

  realm = await testRealm();
  keyServer = createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(realm.jwks));
  });
  await new Promise<void>((resolve) => keyServer.listen(0, "127.0.0.1", resolve));
  const keyAddress = keyServer.address();
  const keyPort = typeof keyAddress === "object" && keyAddress ? keyAddress.port : 0;

  catcher = new SmtpCatcher();
  await catcher.start();

  Object.assign(process.env, {
    DATABASE_URL: serviceUrl,
    CONTRACT_PATH: path.resolve(__dirname, "../../../spec/contract/openapi.yaml"),
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: CLIENT_ID,
    OIDC_JWKS_URL: `http://127.0.0.1:${keyPort}/certs`,
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(catcher.port),
    MAILER_FROM: "Digital Marketplace <donotreply@example.test>",
    SHOW_TEST_INDICATOR: "1",
    SERVICE_ORIGIN: "http://localhost:4300",
  });
  const { createApplication } = await import("../src/application");
  app = await createApplication();
  await app.listen(0, "127.0.0.1");
  origin = await app.getUrl();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await catcher?.stop();
  await new Promise<void>((resolve) => (keyServer ? keyServer.close(() => resolve()) : resolve()));
  await socket?.stop();
  await database?.close();
});

async function ask(
  method: string,
  address: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
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

describe("the current session", () => {
  it("names nobody for a visitor", async () => {
    expect(await ask("GET", "/api/sessions/current")).toEqual({
      status: 200,
      body: { id: null, user: null },
    });
  });

  it("is refused for a token that is not good", async () => {
    const answer = await ask("GET", "/api/sessions/current", "not-a-token");

    expect(answer.status).toBe(401);
    expect(answer.body).toEqual({ errors: [expect.any(String)] });
  });

  it("is reached only by 'current' or an identifier, as the boundary checks", async () => {
    expect((await ask("GET", "/api/sessions/somebody")).status).toBe(400);
  });

  it("is a returning person's own account, found and not made again", async () => {
    const token = await realm.token({
      preferred_username: "test-vendor-1",
      email: "vendor.one@example.test",
      identity_provider: "bceid",
    });

    const answer = await ask("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(200);
    expect(answer.body.user).toMatchObject({ id: VENDOR_ONE, type: "VENDOR", status: "ACTIVE" });
  });

  it("is refused for an account an administrator deactivated (R-4.4)", async () => {
    const token = await realm.token({ preferred_username: "test-vendor-5", identity_provider: "bceid" });

    const answer = await ask("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(403);
    expect(answer.body).toEqual({ errors: ["We could not sign you in."] });
  });
});

describe("a first sign-in, finished (R-4.1, R-4.2, R-4.3, R-4.24, R-6.20)", () => {
  let token: string;
  let accountId: string;

  beforeAll(async () => {
    token = await realm.token({
      sid: "first-session",
      preferred_username: "first-time-vendor",
      name: "Jordan Placeholder",
      email: "First.Vendor@Example.test",
      identity_provider: "bceid",
    });
  });

  it("makes an active vendor account with notices off and no terms agreed", async () => {
    const answer = await ask("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(200);
    expect(answer.body.id).toBe("first-session");
    expect(answer.body.user).toMatchObject({
      type: "VENDOR",
      status: "ACTIVE",
      name: "Jordan Placeholder",
      email: "first.vendor@example.test",
      idpUsername: "first-time-vendor",
      jobTitle: null,
      notificationsOn: null,
      acceptedTermsAt: null,
    });
    accountId = answer.body.user.id;

    const again = await ask("GET", "/api/sessions/current", token);
    expect(again.body.user.id).toBe(accountId);
  });

  it("welcomes the person by email, once, from the one sender, marked as a test", async () => {
    await expect.poll(() => catcher.caught.length, { timeout: 5000 }).toBe(1);
    const mail = catcher.caught[0]!;

    expect(mail.recipients).toEqual(["first.vendor@example.test"]);
    expect(mail.data).toMatch(/^From: Digital Marketplace <donotreply@example\.test>/m);
    expect(mail.data).not.toMatch(/^Reply-To:/im);
    expect(mail.data).toMatch(/^Subject: \[TEST\] Welcome to the Digital Marketplace/m);
    expect(mail.data).toContain("text/plain");
    expect(mail.data).toContain("text/html");
  });

  it("refuses a profile with an empty name, and saves one with a valid one (R-4.27)", async () => {
    const refused = await ask("PUT", `/api/users/${accountId}`, token, {
      tag: "updateProfile",
      value: { name: "", email: "first.vendor@example.test" },
    });
    expect(refused.status).toBe(400);

    const saved = await ask("PUT", `/api/users/${accountId}`, token, {
      tag: "updateProfile",
      value: { name: "Jordan P.", email: "Jordan.P@Example.test" },
    });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ name: "Jordan P.", email: "jordan.p@example.test" });
  });

  it("records the choice of new-opportunity notices and the agreement to the terms", async () => {
    const notices = await ask("PUT", `/api/users/${accountId}`, token, {
      tag: "updateNotifications",
      value: true,
    });
    const terms = await ask("PUT", `/api/users/${accountId}`, token, { tag: "acceptTerms" });

    expect(notices.status, JSON.stringify(notices.body)).toBe(200);
    expect(notices.body.notificationsOn).toMatch(/^\d{4}-/);
    expect(terms.body.acceptedTermsAt).toMatch(/^\d{4}-/);
    expect(terms.body.lastAcceptedTermsAt).toBe(terms.body.acceptedTermsAt);

    const session = await ask("GET", "/api/sessions/current", token);
    expect(session.body.user.notificationsOn).toBe(notices.body.notificationsOn);
  });

  it("refuses a change to somebody else's account", async () => {
    const answer = await ask("PUT", `/api/users/${VENDOR_ONE}`, token, {
      tag: "updateNotifications",
      value: false,
    });

    expect(answer.status).toBe(403);
  });

  it("refuses a change asked for without signing in", async () => {
    const answer = await ask("PUT", `/api/users/${accountId}`, undefined, {
      tag: "updateNotifications",
      value: false,
    });

    expect(answer.status).toBe(401);
  });

  it("ends the session on signing out, so its tokens are refused afterwards (R-4.17)", async () => {
    const other = await ask("DELETE", "/api/sessions/00000000-0000-4000-8000-000000000999", token);
    expect(other.status).toBe(403);

    const ended = await ask("DELETE", "/api/sessions/current", token);
    expect(ended).toEqual({ status: 200, body: { id: "first-session", user: null } });

    expect((await ask("GET", "/api/sessions/current", token)).status).toBe(401);
  });
});

describe("a first sign-in without an email address (R-4.1, R-4.2, R-6.28)", () => {
  it("makes the account and sends nothing", async () => {
    const before = catcher.caught.length;
    const token = await realm.token({
      sid: "no-email-session",
      preferred_username: "first-time-vendor-no-email",
      email: undefined,
      identity_provider: "bceid",
    });

    const answer = await ask("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(200);
    expect(answer.body.user.email).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(catcher.caught.length).toBe(before);
  });
});

describe("a mail server that refuses delivery (R-6.2)", () => {
  it("does not stop a first sign-in succeeding", async () => {
    catcher.refusing = true;
    try {
      const token = await realm.token({
        sid: "gov-session",
        preferred_username: "first-time-gov",
        email: "first.gov@example.test",
        identity_provider: "idir",
      });

      const answer = await ask("GET", "/api/sessions/current", token);

      expect(answer.status).toBe(200);
      expect(answer.body.user.type).toBe("GOV");
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 300));
      catcher.refusing = false;
    }
  });
});

// Last of all, because PGlite lets go of its one connection after a constraint refuses a
// write, which PostgreSQL itself does not; nothing after this relies on that connection.
describe("an email address another vendor already holds (R-4.6)", () => {
  it("is refused on a profile, without saying why", async () => {
    const token = await realm.token({
      sid: "duplicate-session",
      preferred_username: "another-new-vendor",
      email: "another.new.vendor@example.test",
      identity_provider: "bceid",
    });
    const made = await ask("GET", "/api/sessions/current", token);

    const refused = await ask("PUT", `/api/users/${made.body.user.id}`, token, {
      tag: "updateProfile",
      value: { name: "Another", email: "vendor.one@example.test" },
    });

    expect(refused).toEqual({ status: 400, body: { errors: ["Your profile could not be saved."] } });
  });
});
