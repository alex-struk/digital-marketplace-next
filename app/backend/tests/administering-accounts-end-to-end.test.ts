import { createServer, Server } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { SmtpCatcher } from "./smtp-catcher";
import { freePort } from "./free-port";

/**
 * An administrator managing people's accounts, against the service as it is started: over the
 * schema its own migrations made with the acceptance suite's seed applied, with tokens checked
 * against a published key set and mail handed to a mail server.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const ADMIN = "00000000-0000-4000-8000-000000000101";
const STAFF = "00000000-0000-4000-8000-000000000102";
const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";
const ORGANIZATION_OWNER = "00000000-0000-4000-8000-000000000202";
const VENDOR_DEACTIVATED = "00000000-0000-4000-8000-000000000205";

let database: PGlite;
let socket: PGLiteSocketServer;
let keyServer: Server;
let catcher: SmtpCatcher;
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

  catcher = new SmtpCatcher();
  await catcher.start();

  Object.assign(process.env, {
    DATABASE_URL: `${url}?connection_limit=1`,
    CONTRACT_PATH: path.resolve(__dirname, "../../../spec/contract/openapi.yaml"),
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: CLIENT_ID,
    OIDC_JWKS_URL: `http://127.0.0.1:${keyPort}/certs`,
    OIDC_BACKCHANNEL_URL: `http://127.0.0.1:${keyPort}`,
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(catcher.port),
    MAILER_FROM: "Digital Marketplace <donotreply@example.test>",
    CONTACT_EMAIL: "marketplace.help@example.test",
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

beforeEach(() => {
  catcher.caught.length = 0;
});

const tokens = {
  admin: () => realm.token({ preferred_username: "test-admin", identity_provider: "idir", sid: "admin" }),
  staff: () => realm.token({ preferred_username: "test-gov", identity_provider: "idir", sid: "staff" }),
  vendorOne: () =>
    realm.token({ preferred_username: "test-vendor-1", identity_provider: "bceid", sid: "vendor-one" }),
  deactivated: () =>
    realm.token({ preferred_username: "test-vendor-5", identity_provider: "bceid", sid: "vendor-five" }),
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
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // Not every answer is JSON: the contact list is a file.
  }
  return { status: answer.status, headers: answer.headers, body: parsed };
}

const caughtText = (index: number) => (catcher.caught[index]?.data ?? "").replace(/=\r\n/g, "");

describe("the list of everyone registered (R-4.14, R-4.21)", () => {
  it("is answered to an administrator, active accounts first", async () => {
    const answer = await ask("GET", "/api/users", await tokens.admin());
    expect(answer.status).toBe(200);
    const ids = (answer.body as { id: string; status: string }[]).map((account) => account.id);
    expect(ids).toContain(VENDOR_DEACTIVATED);
    const statuses = (answer.body as { status: string }[]).map((account) => account.status);
    expect(statuses.indexOf("INACTIVE_ADMIN")).toBeGreaterThan(statuses.lastIndexOf("ACTIVE"));
  });

  it("is refused, carrying no account, to a public sector employee, a vendor and a visitor", async () => {
    for (const token of [await tokens.staff(), await tokens.vendorOne(), undefined]) {
      const answer = await ask("GET", "/api/users", token);
      expect(answer.status).toBe(401);
      expect(Object.keys(answer.body)).toEqual(["errors"]);
    }
  });
});

describe("the contact list (R-4.32)", () => {
  it("lists active accounts only, labels an administrator, and names a vendor's organization", async () => {
    const answer = await ask(
      "GET",
      "/api/contact-list?userTypes=GOV,VENDOR&fields=firstName,lastName,email,organizationName",
      await tokens.admin(),
    );
    expect(answer.status).toBe(200);
    expect(answer.headers.get("content-type")).toMatch(/^text\/csv/);
    expect(answer.headers.get("content-disposition")).toMatch(/attachment; filename="dm-contacts-\d{4}-\d{2}-\d{2}\.csv"/);
    const lines = (answer.body as string).trim().split("\r\n");
    expect(lines[0]).toBe("Account Type,First Name,Last Name,Email,Organization Name");
    expect(lines).toContain("Administrator,Robin,Placeholder,admin.one@example.test,");
    expect(lines.find((line) => line.includes("org.owner@example.test"))).toMatch(
      /^Vendor,Blake,Placeholder,org\.owner@example\.test,.*Northern Pines Digital Ltd\./,
    );
    expect(answer.body).not.toContain("vendor.deactivated@example.test");

    // The lists may also be written with their commas encoded.
    const encoded = await ask("GET", "/api/contact-list?userTypes=VENDOR%2CGOV&fields=email", await tokens.admin());
    expect(encoded.status).toBe(200);
  });

  it("is refused to anyone but an administrator, and a request choosing nothing is the requester's error", async () => {
    expect((await ask("GET", "/api/contact-list?userTypes=VENDOR&fields=email", await tokens.staff())).status).toBe(401);
    expect((await ask("GET", "/api/contact-list?userTypes=VENDOR&fields=email")).status).toBe(401);
    expect((await ask("GET", "/api/contact-list?userTypes=&fields=email", await tokens.admin())).status).toBe(400);
  });
});

describe("administrator rights (R-4.12)", () => {
  it("are granted to a public sector employee at once, and withdrawn again", async () => {
    const granted = await ask("PUT", `/api/users/${STAFF}`, await tokens.admin(), {
      tag: "updateAdminPermissions",
      value: true,
    });
    expect(granted.status).toBe(200);
    expect(granted.body.type).toBe("ADMIN");
    // The person is still found by the same sign-in, now as an administrator.
    expect((await ask("GET", "/api/users", await tokens.staff())).status).toBe(200);

    const withdrawn = await ask("PUT", `/api/users/${STAFF}`, await tokens.admin(), {
      tag: "updateAdminPermissions",
      value: false,
    });
    expect(withdrawn.body.type).toBe("GOV");
  });

  it("are refused to a vendor, saying so", async () => {
    const answer = await ask("PUT", `/api/users/${VENDOR_ONE}`, await tokens.admin(), {
      tag: "updateAdminPermissions",
      value: true,
    });
    expect(answer).toMatchObject({
      status: 400,
      body: { errors: ["Vendors cannot be granted administrator permissions."] },
    });
  });

  it("cannot be granted by anyone but an administrator", async () => {
    const answer = await ask("PUT", `/api/users/${STAFF}`, await tokens.staff(), {
      tag: "updateAdminPermissions",
      value: true,
    });
    expect(answer.status).toBe(403);
  });
});

describe("deactivating and reactivating somebody else's account (R-4.30, R-4.31, R-4.19, R-4.20, R-4.4)", () => {
  it("records the date and the administrator, and tells the person their access was removed", async () => {
    const answer = await ask("DELETE", `/api/users/${ORGANIZATION_OWNER}`, await tokens.admin());
    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({
      id: ORGANIZATION_OWNER,
      status: "INACTIVE_ADMIN",
      deactivatedBy: ADMIN,
      deactivatedOn: expect.any(String),
    });
    // The administrator is still signed in.
    expect((await ask("GET", "/api/sessions/current", await tokens.admin())).status).toBe(200);

    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(catcher.caught[0]?.recipients).toEqual(["org.owner@example.test"]);
    expect(caughtText(0)).toContain("An administrator has deactivated your Digital Marketplace account");
    expect(caughtText(0)).toContain("marketplace.help@example.test");
  });

  it("refuses a second deactivation, saying the account is already inactive", async () => {
    const answer = await ask("DELETE", `/api/users/${VENDOR_DEACTIVATED}`, await tokens.admin());
    expect(answer).toMatchObject({ status: 400, body: { errors: ["This account is already inactive."] } });
  });

  it("refuses the person sign-in afterwards", async () => {
    expect((await ask("GET", "/api/sessions/current", await tokens.deactivated())).status).toBe(403);
  });

  it("reactivates the account, telling the person an administrator did it", async () => {
    const answer = await ask("PUT", `/api/users/${VENDOR_DEACTIVATED}`, await tokens.admin(), {
      tag: "reactivateUser",
    });
    expect(answer.status).toBe(200);
    expect(answer.body.status).toBe("ACTIVE");

    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(caughtText(0)).toContain("An administrator has reactivated your Digital Marketplace account");
    expect(caughtText(0)).not.toContain("You have successfully reactivated");
    expect((await ask("GET", "/api/sessions/current", await tokens.deactivated())).status).toBe(200);
  });
});
