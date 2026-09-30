import { createHash } from "node:crypto";
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

/**
 * The codes the stand-in realm has issued: each redeemable once, by the verifier whose
 * challenge it was issued against, for the claims of the person who signed in.
 */
const issuedCodes = new Map<string, { challenge: string; claims: Record<string, unknown> }>();
const realmLogouts: Record<string, string>[] = [];

async function answerTokenRequest(
  form: Record<string, string>,
): Promise<{ status: number; answer: unknown }> {
  const issued = issuedCodes.get(form.code ?? "");
  issuedCodes.delete(form.code ?? "");
  const verifierMatches =
    issued &&
    createHash("sha256").update(form.code_verifier ?? "").digest("base64url") === issued.challenge;
  if (
    form.grant_type !== "authorization_code" ||
    form.client_id !== CLIENT_ID ||
    form.redirect_uri !== "http://localhost:4300/auth/callback" ||
    !verifierMatches
  ) {
    return { status: 400, answer: { error: "invalid_grant" } };
  }
  return {
    status: 200,
    answer: {
      access_token: await realm.token(issued.claims),
      refresh_token: `refresh-for-${String(issued.claims.preferred_username)}`,
      id_token: `id-for-${String(issued.claims.preferred_username)}`,
    },
  };
}

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
  // The realm's key set, token endpoint and logout endpoint, as the service reaches them.
  keyServer = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const form = Object.fromEntries(new URLSearchParams(body));
      response.setHeader("content-type", "application/json");
      if (request.url === "/protocol/openid-connect/token") {
        void answerTokenRequest(form).then(({ status, answer }) => {
          response.statusCode = status;
          response.end(JSON.stringify(answer));
        });
        return;
      }
      if (request.url === "/protocol/openid-connect/logout") {
        realmLogouts.push(form);
        response.statusCode = 204;
        response.end();
        return;
      }
      response.end(JSON.stringify(realm.jwks));
    });
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
    OIDC_BACKCHANNEL_URL: `http://127.0.0.1:${keyPort}`,
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
    // This token was never handed over by a sign-in at the service, so the service holds no
    // refresh token to end the identity provider's session with, and says so.
    expect(ended).toEqual({
      status: 200,
      body: { id: "first-session", user: null, identityProviderSignedOut: false },
    });

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

describe("signing in through the service's own addresses (decision record 0015)", () => {
  async function visit(address: string, cookie?: string) {
    const answer = await fetch(`${origin}${address}`, {
      redirect: "manual",
      headers: cookie ? { cookie } : {},
    });
    return {
      status: answer.status,
      location: answer.headers.get("location"),
      cookies: answer.headers.getSetCookie(),
    };
  }

  const cookieNamed = (cookies: string[], name: string) =>
    cookies.find((cookie) => cookie.startsWith(`${name}=`));
  const valueOf = (cookie: string | undefined) =>
    cookie ? decodeURIComponent(cookie.split(";")[0]!.split("=").slice(1).join("=")) : undefined;

  /**
   * Signs in the way a browser does: begins at the service, is let in by the realm, which
   * issues a code against the challenge it was shown, and comes back to the service with it.
   */
  async function signIn(
    claims: Record<string, unknown>,
    begin = "/auth/sign-in",
    options: { verifierMatches?: boolean } = {},
  ) {
    const started = await visit(begin);
    const toRealm = new URL(started.location!);
    const state = toRealm.searchParams.get("state")!;
    const pending = cookieNamed(started.cookies, `dm-sign-in-${state}`)!.split(";")[0]!;
    const code = `code-${state}`;
    issuedCodes.set(code, {
      challenge:
        options.verifierMatches === false ? "another-challenge" : toRealm.searchParams.get("code_challenge")!,
      claims,
    });
    const back = await visit(
      `/auth/callback?state=${state}&session_state=idp-session&iss=${encodeURIComponent(ISSUER)}&code=${code}`,
      pending,
    );
    return { started, back, state };
  }

  it("begins by sending the browser to the realm, remembering the sign-in where only the service reads it", async () => {
    const started = await visit("/auth/sign-in?provider=vendor&redirectOnSuccess=%2Fdashboard");

    expect(started.status).toBe(302);
    const toRealm = new URL(started.location!);
    expect(`${toRealm.origin}${toRealm.pathname}`).toBe(`${ISSUER}/protocol/openid-connect/auth`);
    expect(toRealm.searchParams.get("code_challenge_method")).toBe("S256");
    const pending = cookieNamed(started.cookies, `dm-sign-in-${toRealm.searchParams.get("state")}`);
    expect(pending).toMatch(/HttpOnly/i);
    expect(pending).toMatch(/Path=\/auth/);
  });

  it("makes a first-time vendor's account, welcomes them, and lands them on profile completion with their tokens (R-4.1, R-4.2, R-4.22)", async () => {
    const { back } = await signIn({
      sid: "redirect-vendor-session",
      preferred_username: "redirect-first-vendor",
      name: "Robin Placeholder",
      email: "Redirect.First@Example.test",
      identity_provider: "bceid",
    });

    expect(back.status).toBe(302);
    expect(back.location).toBe("/sign-up/complete");
    const handedOver = valueOf(cookieNamed(back.cookies, "dm-handover-access"));
    expect(valueOf(cookieNamed(back.cookies, "dm-handover-refresh"))).toBe(
      "refresh-for-redirect-first-vendor",
    );
    expect(valueOf(cookieNamed(back.cookies, "dm-handover-id"))).toBe("id-for-redirect-first-vendor");
    expect(cookieNamed(back.cookies, "dm-handover-access")).not.toMatch(/HttpOnly/i);

    // The account exists before the browser has even arrived.
    const session = await ask("GET", "/api/sessions/current", handedOver);
    expect(session.body.user).toMatchObject({
      type: "VENDOR",
      status: "ACTIVE",
      idpUsername: "redirect-first-vendor",
      email: "redirect.first@example.test",
      notificationsOn: null,
      acceptedTermsAt: null,
    });
    await expect
      .poll(() => catcher.caught.some((mail) => mail.recipients.includes("redirect.first@example.test")), {
        timeout: 5000,
      })
      .toBe(true);
  });

  it("answers requests the app does not make, carrying only the browser's cookie, for the person until they sign out (decision record 0017; R-4.1, R-4.17, R-4.24)", async () => {
    const { back } = await signIn({
      sid: "cookie-vendor-session",
      preferred_username: "cookie-first-vendor",
      email: "cookie.first@example.test",
      identity_provider: "bceid",
    });
    const sessionCookie = cookieNamed(back.cookies, "dm-session");
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/Path=\/(;|$)/);
    const cookie = sessionCookie!.split(";")[0]!;
    const withCookie = async (method: string, address: string, body?: unknown) => {
      const answer = await fetch(`${origin}${address}`, {
        method,
        headers: {
          cookie,
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await answer.text();
      return {
        status: answer.status,
        body: text ? JSON.parse(text) : null,
        cookies: answer.headers.getSetCookie(),
      };
    };

    const session = await withCookie("GET", "/api/sessions/current");
    expect(session.status).toBe(200);
    expect(session.body.id).toBe("cookie-vendor-session");
    expect(session.body.user).toMatchObject({ idpUsername: "cookie-first-vendor", type: "VENDOR" });

    const notices = await withCookie("PUT", `/api/users/${session.body.user.id}`, {
      tag: "updateNotifications",
      value: true,
    });
    expect(notices.status).toBe(200);
    expect((await withCookie("GET", "/api/sessions/current")).body.user.notificationsOn).toMatch(/^\d{4}-/);

    // Signing out with the app's bearer token ends the cookie's session too, and the realm's
    // session, with the refresh token sign-in was completed with (decision record 0018).
    realmLogouts.length = 0;
    const token = valueOf(cookieNamed(back.cookies, "dm-handover-access"));
    const ended = await fetch(`${origin}/api/sessions/current`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}`, cookie },
    });
    expect(ended.status).toBe(200);
    expect(await ended.json()).toEqual({
      id: "cookie-vendor-session",
      user: null,
      identityProviderSignedOut: true,
    });
    expect(cookieNamed(ended.headers.getSetCookie(), "dm-session")).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(realmLogouts).toEqual([
      { client_id: CLIENT_ID, refresh_token: "refresh-for-cookie-first-vendor" },
    ]);

    expect((await withCookie("GET", "/api/sessions/current")).body).toEqual({ id: null, user: null });
  });

  it("signs out of the service and the realm by the browser's cookie alone (R-4.17)", async () => {
    const { back } = await signIn({
      sid: "cookie-only-session",
      preferred_username: "test-vendor-1",
      email: "vendor.one@example.test",
      identity_provider: "bceid",
    });
    const cookie = cookieNamed(back.cookies, "dm-session")!.split(";")[0]!;
    realmLogouts.length = 0;

    const ended = await fetch(`${origin}/api/sessions/current`, { method: "DELETE", headers: { cookie } });

    expect(await ended.json()).toEqual({
      id: "cookie-only-session",
      user: null,
      identityProviderSignedOut: true,
    });
    expect(realmLogouts).toEqual([{ client_id: CLIENT_ID, refresh_token: "refresh-for-test-vendor-1" }]);
    const token = valueOf(cookieNamed(back.cookies, "dm-handover-access"));
    expect((await ask("GET", "/api/sessions/current", token)).status).toBe(401);
  });

  it("hands over only the tokens, not the account: the app asks the service for that (decision record 0018)", async () => {
    const { back } = await signIn({
      sid: "handover-account-session",
      preferred_username: "test-vendor-1",
      email: "vendor.one@example.test",
      identity_provider: "bceid",
    });

    expect(cookieNamed(back.cookies, "dm-handover-access")).toBeTruthy();
    expect(cookieNamed(back.cookies, "dm-handover-account")).toBeUndefined();
  });

  it("finds the same account on a second sign-in rather than making another (R-4.1)", async () => {
    const claims = {
      sid: "redirect-again",
      preferred_username: "redirect-first-vendor",
      email: "redirect.first@example.test",
      identity_provider: "bceid",
    };
    const first = await signIn(claims);
    const second = await signIn(claims);
    const idOf = async (back: { cookies: string[] }) =>
      (await ask("GET", "/api/sessions/current", valueOf(cookieNamed(back.cookies, "dm-handover-access"))))
        .body.user.id;

    expect(await idOf(second.back)).toBe(await idOf(first.back));
  });

  it("lands a first-time public sector employee on their dashboard (R-4.22, R-4.23)", async () => {
    const { back } = await signIn({
      sid: "redirect-gov-session",
      preferred_username: "redirect-first-gov",
      email: "redirect.gov@example.test",
      identity_provider: "idir",
    });

    expect(back.location).toBe("/dashboard");
  });

  it("returns a person to the page sign-in began from, and never off the service (R-4.22)", async () => {
    const vendorOne = {
      preferred_username: "test-vendor-1",
      email: "vendor.one@example.test",
      identity_provider: "bceid",
    };

    const fromAPage = await signIn(vendorOne, "/auth/sign-in?redirectOnSuccess=%2Fcontent%2Fabout");
    const fromElsewhere = await signIn(
      vendorOne,
      "/auth/sign-in?redirectOnSuccess=https%3A%2F%2Felsewhere.example",
    );

    expect(fromAPage.back.location).toBe("/content/about");
    expect(fromElsewhere.back.location).toBe("/dashboard");
  });

  it("refuses an account an administrator deactivated, ending the realm's session and handing nothing over (R-4.4)", async () => {
    realmLogouts.length = 0;
    const { back } = await signIn({ preferred_username: "test-vendor-5", identity_provider: "bceid" });

    expect(back.location).toBe("/notice/authFailure");
    expect(cookieNamed(back.cookies, "dm-handover-access")).toBeUndefined();
    expect(cookieNamed(back.cookies, "dm-session")).toBeUndefined();
    expect(realmLogouts).toEqual([{ client_id: CLIENT_ID, refresh_token: "refresh-for-test-vendor-5" }]);
  });

  it("forgets the sign-in it was completing", async () => {
    const { back, state } = await signIn({
      preferred_username: "test-vendor-1",
      email: "vendor.one@example.test",
      identity_provider: "bceid",
    });

    expect(cookieNamed(back.cookies, `dm-sign-in-${state}`)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it("shows the failure notice for a code the realm will not exchange for this sign-in", async () => {
    const { back } = await signIn(
      { preferred_username: "test-vendor-1", identity_provider: "bceid" },
      "/auth/sign-in",
      { verifierMatches: false },
    );

    expect(back.location).toBe("/notice/authFailure");
  });

  it("shows the failure notice for a callback this browser did not begin", async () => {
    issuedCodes.set("stray-code", { challenge: "x", claims: {} });

    const back = await visit("/auth/callback?state=never-begun&code=stray-code");

    expect(back.status).toBe(302);
    expect(back.location).toBe("/notice/authFailure");
  });

  it("shows the failure notice when the realm reports that sign-in was abandoned", async () => {
    const started = await visit("/auth/sign-in");
    const state = new URL(started.location!).searchParams.get("state")!;
    const pending = cookieNamed(started.cookies, `dm-sign-in-${state}`)!.split(";")[0]!;

    const back = await visit(
      `/auth/callback?error=access_denied&error_description=cancelled&state=${state}`,
      pending,
    );

    expect(back.status).toBe(302);
    expect(back.location).toBe("/notice/authFailure");
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
