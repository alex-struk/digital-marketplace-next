import { readFileSync } from "node:fs";
import { createServer as createHttpServer, Server } from "node:http";
import { createServer as createTcpServer, Server as TcpServer } from "node:net";
import { AddressInfo } from "node:net";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { exportJWK, generateKeyPair, KeyLike, SignJWT } from "jose";
import knexFactory from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Signing in, finishing signing up and signing out, against the service as it is started,
 * over the schema its migrations made and the acceptance suite's own seeded accounts.
 *
 * The identity provider is stood in for by a key set this test publishes and tokens it
 * signs, shaped as the sandbox realm shapes them. The mail server is a few lines of SMTP
 * that keep what they are sent.
 */
const DB_PORT = 55436;
const url = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;
const ISSUER = "http://identity.test/realms/digital-marketplace";
const CLIENT = "digital-marketplace-app";
const SEED = path.resolve(__dirname, "../../../tests/seed");

const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";
const COMPLETING = "00000000-0000-4000-8000-000000000220";
const STAFF_ONE = "00000000-0000-4000-8000-000000000102";

let database: PGlite;
let socket: PGLiteSocketServer;
let keys: Server;
let smtp: TcpServer;
let app: INestApplication;
let origin: string;
let privateKey: KeyLike;
const caught: string[] = [];

interface Identity {
  username: string;
  identityProvider?: string;
  email?: string;
  name?: string;
  sid?: string;
}

async function tokenFor(identity: Identity, overrides: { issuer?: string; azp?: string } = {}) {
  return new SignJWT({
    preferred_username: identity.username,
    identity_provider: identity.identityProvider,
    email: identity.email,
    name: identity.name,
    sid: identity.sid ?? `sid-${identity.username}-${Math.random()}`,
    azp: overrides.azp ?? CLIENT,
    typ: "Bearer",
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(overrides.issuer ?? ISSUER)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(privateKey);
}

function call(method: string, address: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  return fetch(`${origin}${address}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Everything sent to the stand-in mail server, as one message's raw text apiece. */
function startSmtp(): Promise<number> {
  smtp = createTcpServer((connection) => {
    let data = false;
    let message = "";
    let pending = "";
    connection.write("220 sink ESMTP\r\n");
    connection.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      let at: number;
      while ((at = pending.indexOf("\r\n")) >= 0) {
        const line = pending.slice(0, at);
        pending = pending.slice(at + 2);
        if (data) {
          if (line === ".") {
            data = false;
            caught.push(message);
            message = "";
            connection.write("250 kept\r\n");
          } else {
            message += line + "\n";
          }
        } else if (/^DATA/i.test(line)) {
          data = true;
          connection.write("354 go on\r\n");
        } else if (/^QUIT/i.test(line)) {
          connection.end("221 bye\r\n");
        } else if (/^EHLO/i.test(line)) {
          connection.write("250 sink\r\n");
        } else {
          connection.write("250 ok\r\n");
        }
      }
    });
  });
  return new Promise((ready) =>
    smtp.listen(0, "127.0.0.1", () => ready((smtp.address() as AddressInfo).port)),
  );
}

async function waitForMail(count: number): Promise<void> {
  for (let i = 0; i < 100 && caught.length < count; i += 1) {
    await new Promise((next) => setTimeout(next, 20));
  }
}

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "RS256", use: "sig" };
  keys = createHttpServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise<void>((ready) => keys.listen(0, "127.0.0.1", ready));
  const smtpPort = await startSmtp();

  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port: DB_PORT, host: "127.0.0.1" });
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
  await knex.raw(readFileSync(path.join(SEED, "001-users.sql"), "utf8"));
  await knex.raw(readFileSync(path.join(SEED, "015-profile-completion.sql"), "utf8"));
  await knex.destroy();

  process.env.DATABASE_URL = url;
  process.env.CONTRACT_PATH = path.resolve(__dirname, "../../../spec/contract/openapi.yaml");
  process.env.OIDC_ISSUER = ISSUER;
  process.env.OIDC_CLIENT_ID = CLIENT;
  process.env.OIDC_JWKS_URI = `http://127.0.0.1:${(keys.address() as AddressInfo).port}/certs`;
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(smtpPort);
  process.env.SHOW_TEST_INDICATOR = "1";
  process.env.PUBLIC_ORIGIN = "http://localhost:4300";
  const { createApplication } = await import("../src/application");
  app = await createApplication();
  await app.listen(0, "127.0.0.1");
  origin = await app.getUrl();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await socket?.stop();
  await database?.close();
  keys?.close();
  smtp?.close();
  for (const name of [
    "OIDC_ISSUER",
    "OIDC_CLIENT_ID",
    "OIDC_JWKS_URI",
    "SMTP_HOST",
    "SMTP_PORT",
    "SHOW_TEST_INDICATOR",
    "PUBLIC_ORIGIN",
  ]) {
    delete process.env[name];
  }
});

describe("asking who is signed in", () => {
  it("answers with no account at all when nobody is", async () => {
    const answer = await call("GET", "/api/sessions/current");

    expect(answer.status).toBe(200);
    expect(await answer.json() as any).toEqual({ id: "current" });
  });

  it("answers with no account for a token the realm did not issue to this service", async () => {
    const elsewhere = await tokenFor(
      { username: "test-vendor-1", identityProvider: "github" },
      { issuer: "http://elsewhere.test/realms/other" },
    );
    const otherClient = await tokenFor(
      { username: "test-vendor-1", identityProvider: "github" },
      { azp: "another-client" },
    );

    for (const token of [elsewhere, otherClient, "not-a-token"]) {
      const answer = await call("GET", "/api/sessions/current", token);
      expect(await answer.json() as any).toEqual({ id: "current" });
    }
  });

  it("finds a seeded person's own account by their sign-in username", async () => {
    const token = await tokenFor({ username: "test-vendor-1", identityProvider: "github", sid: "s-1" });
    const answer = await call("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(200);
    const session = await answer.json() as any;
    expect(session.id).toBe("s-1");
    expect(session.user.id).toBe(VENDOR_ONE);
    expect(session.user.type).toBe("VENDOR");
    expect(session.user.idpUsername).toBe("test-vendor-1");
    expect(session.user).not.toHaveProperty("idpId");
  });

  it("finds an administrator through a government identity", async () => {
    const token = await tokenFor({ username: "test-admin", identityProvider: "idir" });
    const session = await (await call("GET", "/api/sessions/current", token)).json() as any;

    expect(session.user.type).toBe("ADMIN");
  });
});

describe("a first sign-in (R-4.1, R-4.2, R-6.20)", () => {
  it("makes a public sector employee of a government identity, once, and welcomes them", async () => {
    const identity = {
      username: "first-time-gov",
      identityProvider: "idir",
      email: "First.Time.Gov@Example.test",
      name: "Riley Placeholder",
    };
    const before = caught.length;

    const first = await (await call("GET", "/api/sessions/current", await tokenFor(identity))).json() as any;
    const again = await (await call("GET", "/api/sessions/current", await tokenFor(identity))).json() as any;

    expect(first.user).toMatchObject({
      type: "GOV",
      status: "ACTIVE",
      name: "Riley Placeholder",
      email: "first.time.gov@example.test",
      idpUsername: "first-time-gov",
      jobTitle: "",
      avatarImageFile: null,
      notificationsOn: null,
      acceptedTermsAt: null,
      lastAcceptedTermsAt: null,
    });
    expect(again.user.id).toBe(first.user.id);

    await waitForMail(before + 1);
    expect(caught.length).toBe(before + 1);
    const welcome = caught[before] ?? "";
    expect(welcome).toMatch(/^To: first\.time\.gov@example\.test$/m);
    expect(welcome).toMatch(/^From: "?Digital Marketplace"? <donotreply@example\.test>$/m);
    expect(welcome).toMatch(/^Subject: \[TEST\] Welcome to the Digital Marketplace$/m);
    expect(welcome).toContain("text/plain");
    expect(welcome).toContain("text/html");
  });

  it("makes a vendor of a code-hosting identity", async () => {
    const token = await tokenFor({
      username: "first-time-vendor",
      identityProvider: "github",
      email: "first.time.vendor@example.test",
      name: "Skyler Placeholder",
    });
    const session = await (await call("GET", "/api/sessions/current", token)).json() as any;

    expect(session.user.type).toBe("VENDOR");
    expect(session.user.notificationsOn).toBeNull();
  });

  it("makes an account with no address when none was shared, and welcomes nobody", async () => {
    // The welcome to the vendor before this one may still be on its way.
    await new Promise((next) => setTimeout(next, 200));
    const before = caught.length;
    const token = await tokenFor({ username: "no-address", identityProvider: "github", name: "No Address" });

    const session = await (await call("GET", "/api/sessions/current", token)).json() as any;

    expect(session.user.email).toBeNull();
    await new Promise((next) => setTimeout(next, 200));
    expect(caught.length).toBe(before);
  });

  it("refuses an identity of no kind the service knows", async () => {
    const token = await tokenFor({ username: "somebody", identityProvider: "bceid" });
    const answer = await call("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(403);
    expect(await answer.json() as any).toEqual({ errors: ["You could not be signed in."] });
  });

  it("refuses a second vendor carrying an address another vendor holds (R-4.6)", async () => {
    const token = await tokenFor({
      username: "copycat",
      identityProvider: "github",
      email: "Vendor.One@example.test",
    });
    const answer = await call("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(403);
    expect(await answer.json() as any).toEqual({ errors: ["You could not be signed in."] });
  });
});

describe("an account an administrator deactivated (R-4.4)", () => {
  it("is not let in", async () => {
    const token = await tokenFor({ username: "test-vendor-5", identityProvider: "github" });
    const answer = await call("GET", "/api/sessions/current", token);

    expect(answer.status).toBe(403);
  });
});

describe("finishing signing up (R-4.3, R-4.24, R-4.27)", () => {
  it("records the details, the notice choice and the moment the terms were agreed", async () => {
    const token = await tokenFor({ username: "test-vendor-17", identityProvider: "github" });

    const invalid = await call("PUT", `/api/users/${COMPLETING}`, token, {
      tag: "updateProfile",
      value: { name: "", email: "not-an-address" },
    });
    expect(invalid.status).toBe(400);
    expect((await invalid.json() as any).errors).toHaveLength(2);

    const profile = await call("PUT", `/api/users/${COMPLETING}`, token, {
      tag: "updateProfile",
      value: { name: "Tatum Placeholder", email: "Vendor.Completing@Example.test" },
    });
    expect(profile.status).toBe(200);
    expect((await profile.json() as any).email).toBe("vendor.completing@example.test");

    const notices = await call("PUT", `/api/users/${COMPLETING}`, token, {
      tag: "updateNotifications",
      value: true,
    });
    const noticesOn = (await notices.json() as any).notificationsOn;
    expect(Number.isNaN(Date.parse(noticesOn))).toBe(false);

    const terms = await call("PUT", `/api/users/${COMPLETING}`, token, { tag: "acceptTerms" });
    const agreed = await terms.json() as any;
    expect(agreed.acceptedTermsAt).not.toBeNull();
    expect(agreed.lastAcceptedTermsAt).toBe(agreed.acceptedTermsAt);

    const session = await (await call("GET", "/api/sessions/current", token)).json() as any;
    expect(session.user.notificationsOn).toBe(noticesOn);
  });

  it("refuses an address another vendor holds, without saying why (R-4.6)", async () => {
    const token = await tokenFor({ username: "test-vendor-17", identityProvider: "github" });
    const answer = await call("PUT", `/api/users/${COMPLETING}`, token, {
      tag: "updateProfile",
      value: { name: "Tatum Placeholder", email: "vendor.one@example.test" },
    });

    expect(answer.status).toBe(400);
    expect(await answer.json() as any).toEqual({ errors: ["Your profile could not be saved."] });
  });

  it("refuses a change to anybody else's account, and a change from nobody", async () => {
    const token = await tokenFor({ username: "test-vendor-17", identityProvider: "github" });

    const other = await call("PUT", `/api/users/${VENDOR_ONE}`, token, { tag: "acceptTerms" });
    const nobody = await call("PUT", `/api/users/${VENDOR_ONE}`, undefined, { tag: "acceptTerms" });

    expect(other.status).toBe(403);
    expect(nobody.status).toBe(401);
  });

  it("never asks a public sector employee to agree to the terms", async () => {
    const token = await tokenFor({ username: "test-gov", identityProvider: "idir" });
    const answer = await call("PUT", `/api/users/${STAFF_ONE}`, token, { tag: "acceptTerms" });

    expect(answer.status).toBe(403);
  });

  it("turns notices off by emptying the record", async () => {
    const token = await tokenFor({ username: "test-vendor-17", identityProvider: "github" });
    const answer = await call("PUT", `/api/users/${COMPLETING}`, token, {
      tag: "updateNotifications",
      value: false,
    });

    expect((await answer.json() as any).notificationsOn).toBeNull();
  });
});

describe("signing out (R-4.17)", () => {
  it("ends the session, after which its token is no longer anybody", async () => {
    const token = await tokenFor({ username: "test-vendor-1", identityProvider: "github", sid: "ending" });
    expect((await (await call("GET", "/api/sessions/current", token)).json() as any).user.id).toBe(VENDOR_ONE);

    const ended = await call("DELETE", "/api/sessions/current", token);

    expect(ended.status).toBe(200);
    expect(await (await call("GET", "/api/sessions/current", token)).json() as any).toEqual({ id: "current" });
    expect((await call("PUT", `/api/users/${VENDOR_ONE}`, token, { tag: "acceptTerms" })).status).toBe(401);
  });

  it("refuses to end somebody else's session", async () => {
    const token = await tokenFor({ username: "test-vendor-1", identityProvider: "github", sid: "mine" });
    const answer = await call("DELETE", "/api/sessions/00000000-0000-4000-8000-000000000999", token);

    expect(answer.status).toBe(403);
  });
});

describe("a token carried by the cookie the single-page app sets", () => {
  it("is read like the Authorization header", async () => {
    const token = await tokenFor({ username: "test-gov", identityProvider: "idir" });
    const answer = await fetch(`${origin}/api/sessions/current`, {
      headers: { cookie: `other=1; dm_access_token=${token}` },
    });

    expect((await answer.json() as any).user.id).toBe(STAFF_ONE);
  });
});
