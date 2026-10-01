import { createServer, Server } from "node:http";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory, { Knex } from "knex";
import * as jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { SmtpCatcher } from "./smtp-catcher";
import { freePort } from "./free-port";

/**
 * A person's own profile and the file store, against the service as it is started: over the
 * schema its own migrations made, with tokens checked against a published key set and mail
 * handed to a mail server.
 */
let DB_PORT = 0;
let url = "";
let serviceUrl = "";
const ADMIN = "00000000-0000-4000-8000-000000000101";
const STAFF = "00000000-0000-4000-8000-000000000102";
const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";
const VENDOR_TWO = "00000000-0000-4000-8000-000000000202";
const RETURNING = "00000000-0000-4000-8000-000000000213";
const NOBODY = "00000000-0000-4000-8000-00000000ffff";

let database: PGlite;
let socket: PGLiteSocketServer;
let keyServer: Server;
let catcher: SmtpCatcher;
let realm: TestRealm;
let app: INestApplication;
let origin: string;
let knex: Knex;
let uploads: string;

function account(id: string, idp: string, type: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    createdAt: new Date("2026-01-05T17:00:00Z"),
    updatedAt: new Date("2026-01-05T17:00:00Z"),
    type,
    status: "ACTIVE",
    name: `Placeholder ${idp}`,
    email: `${idp}@example.test`,
    idpUsername: idp,
    idpId: idp,
    acceptedTermsAt: type === "VENDOR" ? new Date("2026-01-05T17:00:00Z") : null,
    lastAcceptedTermsAt: type === "VENDOR" ? new Date("2026-01-05T17:00:00Z") : null,
    ...overrides,
  };
}

beforeAll(async () => {
  DB_PORT = await freePort();
  url = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;
  serviceUrl = `${url}?connection_limit=1`;
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port: DB_PORT, host: "127.0.0.1" });
  await socket.start();

  knex = knexFactory({
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
    account(ADMIN, "test-admin", "ADMIN"),
    account(STAFF, "test-gov", "GOV", { jobTitle: "Procurement officer" }),
    account(VENDOR_ONE, "test-vendor-1", "VENDOR"),
    account(VENDOR_TWO, "test-vendor-2", "VENDOR"),
    account(RETURNING, "test-vendor-13", "VENDOR"),
  ]);
  await knex.destroy();

  realm = await testRealm();
  keyServer = createServer((request, response) => {
    request.resume();
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      if (request.url === "/protocol/openid-connect/logout") {
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
  uploads = mkdtempSync(path.join(tmpdir(), "dm-uploads-test-"));

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
    FILE_UPLOADS_DIR: uploads,
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
  vendorTwo: () =>
    realm.token({ preferred_username: "test-vendor-2", identity_provider: "bceid", sid: "vendor-two" }),
};

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

interface UploadParts {
  readonly name?: string;
  readonly metadata?: string;
  readonly content?: Uint8Array;
  readonly fileName?: string;
}

async function upload(
  address: "/api/files" | "/api/avatars",
  token: string | undefined,
  parts: UploadParts,
): Promise<{ status: number; body: any }> {
  const form = new FormData();
  if (parts.name !== undefined) form.append("name", parts.name);
  if (parts.metadata !== undefined) form.append("metadata", parts.metadata);
  if (parts.content !== undefined) {
    form.append("file", new Blob([parts.content]), parts.fileName ?? parts.name ?? "upload");
  }
  const answer = await fetch(`${origin}${address}`, {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const text = await answer.text();
  return { status: answer.status, body: text ? JSON.parse(text) : null };
}

/** A caught message's text, with the mail encoding's soft line breaks taken out. */
const caughtText = (index: number) => (catcher.caught[index]?.data ?? "").replace(/=\r\n/g, "");

const ANYONE = JSON.stringify([{ tag: "any" }]);
const NOBODY_ELSE = JSON.stringify([]);
const bytes = (text: string) => new TextEncoder().encode(text);

function png(width: number, height: number): Uint8Array {
  const image = new PNG({ width, height });
  image.data.fill(200);
  return PNG.sync.write(image);
}

function sizeOfPng(content: Buffer) {
  const image = PNG.sync.read(content);
  return { width: image.width, height: image.height };
}

async function download(id: string, token?: string) {
  const answer = await fetch(`${origin}/api/files/${id}?type=blob`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return { answer, content: Buffer.from(await answer.arrayBuffer()) };
}

describe("uploading a file (R-8.1, R-8.2, R-8.6, R-8.16)", () => {
  it("is refused to a visitor, and nothing is stored", async () => {
    const answer = await upload("/api/files", undefined, {
      name: "terms.pdf",
      metadata: ANYONE,
      content: bytes("%PDF-1.4 a visitor's file"),
    });
    expect(answer.status).toBe(401);
    expect(answer.body).toEqual({ errors: [expect.any(String)] });
  });

  it("stores the file, its name and its date, answers with its record, and keeps no working copy", async () => {
    const before = Date.now();
    const answer = await upload("/api/files", await tokens.vendorOne(), {
      name: "terms.pdf",
      metadata: ANYONE,
      content: bytes("%PDF-1.4 the terms"),
    });
    expect(answer.status).toBe(201);
    expect(answer.body).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      name: "terms.pdf",
      createdAt: expect.any(String),
      fileBlob: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(Date.parse(answer.body.createdAt)).toBeGreaterThanOrEqual(before - 1000);
    expect(readdirSync(uploads)).toEqual([]);
  });
});

describe("a refused upload (R-8.17, R-8.18, R-8.23, R-8.24)", () => {
  const cases: [string, UploadParts, number, RegExp][] = [
    ["carries no file part", { name: "terms.pdf", metadata: ANYONE }, 400, /no file/i],
    [
      "carries read-access information that is not well-formed",
      { name: "terms.pdf", metadata: "[{tag:", content: bytes("x") },
      400,
      /read-access information provided was invalid.*not well-formed/,
    ],
    [
      "names a kind of access the service does not recognise",
      { name: "terms.pdf", metadata: JSON.stringify([{ tag: "ministry" }]), content: bytes("x") },
      400,
      /read-access information provided was invalid/,
    ],
    [
      "carries no read-access statement",
      { name: "terms.pdf", content: bytes("x") },
      400,
      /read-access information provided was invalid/,
    ],
    [
      "has a name of 256 characters",
      { name: `${"a".repeat(252)}.pdf`, metadata: ANYONE, content: bytes("x") },
      400,
      /between 1 and 255 characters/,
    ],
  ];

  for (const [what, parts, status, message] of cases) {
    it(`is a bad request when it ${what}, naming why, and leaves nothing behind`, async () => {
      const answer = await upload("/api/files", await tokens.vendorOne(), parts);
      expect(answer.status).toBe(status);
      expect(answer.body.errors.join(" ")).toMatch(message);
      expect(readdirSync(uploads)).toEqual([]);
    });
  }

  it("is the requester's error, naming the limit, when the file is over 10 MB", async () => {
    const answer = await upload("/api/files", await tokens.vendorOne(), {
      name: "site-survey.pdf",
      metadata: ANYONE,
      content: new Uint8Array(10 * 1024 * 1024 + 1),
    });
    expect(answer.status).toBe(413);
    expect(answer.body.errors.join(" ")).toContain("10 MB");
    expect(readdirSync(uploads)).toEqual([]);
  });

  it("accepts a file of exactly 10 MB", async () => {
    const answer = await upload("/api/files", await tokens.vendorOne(), {
      name: "exactly-the-limit.bin",
      metadata: NOBODY_ELSE,
      content: new Uint8Array(10 * 1024 * 1024),
    });
    expect(answer.status).toBe(201);
  });
});

describe("reading a file (R-8.5, R-8.7, R-8.10, R-8.11, R-8.12)", () => {
  let privateFile: any;

  beforeAll(async () => {
    privateFile = (
      await upload("/api/files", await tokens.vendorOne(), {
        name: "private-note.txt",
        metadata: NOBODY_ELSE,
        content: bytes("Only its uploader may read this."),
      })
    ).body;
  });

  it("is allowed to its uploader and to an administrator, and refused to another vendor", async () => {
    expect((await ask("GET", `/api/files/${privateFile.id}`, await tokens.vendorOne())).status).toBe(200);
    expect((await ask("GET", `/api/files/${privateFile.id}`, await tokens.admin())).status).toBe(200);
    const refused = await ask("GET", `/api/files/${privateFile.id}`, await tokens.vendorTwo());
    expect(refused.status).toBe(401);
  });

  it("answers a missing or malformed identifier as not authorized, except to an administrator", async () => {
    expect((await ask("GET", `/api/files/${NOBODY}`, await tokens.vendorOne())).status).toBe(401);
    expect((await ask("GET", "/api/files/not-an-identifier", await tokens.vendorOne())).status).toBe(401);
    expect((await ask("GET", `/api/files/${NOBODY}`)).status).toBe(401);
    expect((await ask("GET", `/api/files/${NOBODY}`, await tokens.admin())).status).toBe(404);
    expect((await ask("GET", "/api/files/not-an-identifier", await tokens.admin())).status).toBe(404);
  });

  it("is allowed by a named person, or by a named kind of account", async () => {
    const named = (
      await upload("/api/files", await tokens.vendorOne(), {
        name: "for-vendor-two.txt",
        metadata: JSON.stringify([{ tag: "user", value: VENDOR_TWO }]),
        content: bytes("For vendor two."),
      })
    ).body;
    const forStaff = (
      await upload("/api/files", await tokens.vendorOne(), {
        name: "for-staff.txt",
        metadata: JSON.stringify([{ tag: "userType", value: "GOV" }]),
        content: bytes("For staff."),
      })
    ).body;
    expect((await ask("GET", `/api/files/${named.id}`, await tokens.vendorTwo())).status).toBe(200);
    expect((await ask("GET", `/api/files/${named.id}`, await tokens.staff())).status).toBe(401);
    expect((await ask("GET", `/api/files/${forStaff.id}`, await tokens.staff())).status).toBe(200);
    expect((await ask("GET", `/api/files/${forStaff.id}`, await tokens.vendorTwo())).status).toBe(401);
  });

  it("stores identical content once, as two records with their own read access", async () => {
    const second = (
      await upload("/api/files", await tokens.vendorTwo(), {
        name: "the-same-words.txt",
        metadata: NOBODY_ELSE,
        content: bytes("Only its uploader may read this."),
      })
    ).body;
    expect(second.id).not.toBe(privateFile.id);
    expect(second.fileBlob).toBe(privateFile.fileBlob);
    expect((await ask("GET", `/api/files/${privateFile.id}`, await tokens.vendorTwo())).status).toBe(401);
  });

  it("describes the file without its content, naming no uploader", async () => {
    const answer = await ask("GET", `/api/files/${privateFile.id}`, await tokens.vendorOne());
    expect(answer.body).toEqual({
      id: privateFile.id,
      name: "private-note.txt",
      createdAt: privateFile.createdAt,
      fileBlob: privateFile.fileBlob,
    });
  });

  it("offers the content to save, typed by its name, and to a visitor when anyone may read it", async () => {
    const terms = (
      await upload("/api/files", await tokens.vendorOne(), {
        name: "terms.pdf",
        metadata: ANYONE,
        content: bytes("%PDF-1.4 public terms"),
      })
    ).body;
    const { answer, content } = await download(terms.id);
    expect(answer.status).toBe(200);
    expect(answer.headers.get("content-type")).toBe("application/pdf");
    expect(answer.headers.get("content-disposition")).toMatch(/^attachment; filename="terms\.pdf"/);
    expect(content.toString("utf8")).toBe("%PDF-1.4 public terms");

    expect((await download(privateFile.id)).answer.status).toBe(401);
  });
});

describe("a profile picture (R-8.13, R-8.21, R-8.28, R-8.30)", () => {
  it("is narrowed to 500 pixels, keeping its proportions, and readable by anyone", async () => {
    const answer = await upload("/api/avatars", await tokens.vendorOne(), {
      name: "harbour.png",
      metadata: ANYONE,
      content: png(2000, 300),
    });
    expect(answer.status).toBe(201);
    const { answer: read, content } = await download(answer.body.id);
    expect(read.status).toBe(200);
    expect(sizeOfPng(content)).toEqual({ width: 500, height: 75 });
  });

  it("is shortened to 500 pixels when it is too tall, as a JPEG stays a JPEG", async () => {
    const tall = jpeg.encode({ width: 300, height: 2000, data: Buffer.alloc(300 * 2000 * 4, 128) }, 90).data;
    const answer = await upload("/api/avatars", await tokens.vendorOne(), {
      name: "Tower.JPG",
      content: tall,
    });
    expect(answer.status).toBe(201);
    const { answer: read, content } = await download(answer.body.id);
    expect(read.headers.get("content-type")).toBe("image/jpeg");
    const stored = jpeg.decode(content);
    expect({ width: stored.width, height: stored.height }).toEqual({ width: 75, height: 500 });
  });

  it("is refused when its name does not end in .jpg, .jpeg or .png", async () => {
    const answer = await upload("/api/avatars", await tokens.vendorOne(), {
      name: "portrait.gif",
      metadata: ANYONE,
      content: png(10, 10),
    });
    expect(answer.status).toBe(400);
  });

  it("is refused when its content is neither a JPEG nor a PNG, whatever its name", async () => {
    const answer = await upload("/api/avatars", await tokens.vendorOne(), {
      name: "portrait.png",
      metadata: ANYONE,
      content: bytes("not a picture at all"),
    });
    expect(answer.status).toBe(400);
    expect(readdirSync(uploads)).toEqual([]);
  });
});

describe("one's own profile (R-4.18, R-4.25, R-4.27, R-4.8, R-4.6)", () => {
  it("is read by its owner and an administrator, and refused to anyone else", async () => {
    expect((await ask("GET", `/api/users/${VENDOR_ONE}`, await tokens.vendorOne())).status).toBe(200);
    expect((await ask("GET", `/api/users/${VENDOR_ONE}`, await tokens.admin())).status).toBe(200);
    expect((await ask("GET", `/api/users/${VENDOR_ONE}`, await tokens.vendorTwo())).status).toBe(401);
    expect((await ask("GET", `/api/users/${VENDOR_ONE}`)).status).toBe(401);
  });

  it("takes a new name, address and picture, with the address in lower case", async () => {
    const picture = (
      await upload("/api/avatars", await tokens.vendorOne(), { name: "me.png", content: png(40, 40) })
    ).body;
    const answer = await ask("PUT", `/api/users/${VENDOR_ONE}`, await tokens.vendorOne(), {
      tag: "updateProfile",
      value: { name: "Vendor Renamed", email: "Renamed.One@Example.test", avatarImageFile: picture.id },
    });
    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({
      name: "Vendor Renamed",
      email: "renamed.one@example.test",
      avatarImageFile: picture.id,
    });
  });

  it("refuses an invalid name or address, and a picture the person may not read", async () => {
    const token = await tokens.vendorOne();
    const invalid = await ask("PUT", `/api/users/${VENDOR_ONE}`, token, {
      tag: "updateProfile",
      value: { name: "", email: "not-an-address" },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.errors).toHaveLength(2);

    const othersFile = (
      await upload("/api/files", await tokens.vendorTwo(), {
        name: "other.png",
        metadata: NOBODY_ELSE,
        content: png(5, 5),
      })
    ).body;
    const notTheirs = await ask("PUT", `/api/users/${VENDOR_ONE}`, token, {
      tag: "updateProfile",
      value: { name: "Vendor", email: "renamed.one@example.test", avatarImageFile: othersFile.id },
    });
    expect(notTheirs.status).toBe(400);
  });

  it("refuses any change an administrator submits against somebody else's account", async () => {
    const answer = await ask("PUT", `/api/users/${VENDOR_TWO}`, await tokens.admin(), {
      tag: "updateProfile",
      value: { name: "Changed by an administrator", email: "test-vendor-2@example.test" },
    });
    expect(answer.status).toBe(403);
    const capabilities = await ask("PUT", `/api/users/${VENDOR_TWO}`, await tokens.admin(), {
      tag: "updateCapabilities",
      value: ["User Research"],
    });
    expect(capabilities.status).toBe(403);
  });

  it("records a vendor's capabilities from the service's list, and allows none", async () => {
    const token = await tokens.vendorTwo();
    const two = await ask("PUT", `/api/users/${VENDOR_TWO}`, token, {
      tag: "updateCapabilities",
      value: ["User Research", "Backend Development"],
    });
    expect(two.body.capabilities).toEqual(["Backend Development", "User Research"]);
    const none = await ask("PUT", `/api/users/${VENDOR_TWO}`, token, { tag: "updateCapabilities", value: [] });
    expect(none.body.capabilities).toEqual([]);
    const unknown = await ask("PUT", `/api/users/${VENDOR_TWO}`, token, {
      tag: "updateCapabilities",
      value: ["Juggling"],
    });
    expect(unknown.status).toBe(400);
  });

  it("turns new-opportunity notices off without keeping a date", async () => {
    const token = await tokens.vendorTwo();
    const on = await ask("PUT", `/api/users/${VENDOR_TWO}`, token, { tag: "updateNotifications", value: true });
    expect(on.body.notificationsOn).toEqual(expect.any(String));
    const off = await ask("PUT", `/api/users/${VENDOR_TWO}`, token, { tag: "updateNotifications", value: false });
    expect(off.body.notificationsOn).toBeNull();
  });
});

describe("deactivating one's own account and coming back (R-4.9, R-4.5)", () => {
  it("keeps the account, marked by its owner, ends the session, and tells them by email", async () => {
    const token = await realm.token({
      preferred_username: "test-vendor-13",
      identity_provider: "bceid",
      sid: "returning-first",
    });
    const answer = await ask("DELETE", `/api/users/${RETURNING}`, token);
    expect(answer.status).toBe(200);
    expect(answer.body).toMatchObject({
      id: RETURNING,
      status: "INACTIVE_USER",
      deactivatedBy: RETURNING,
      deactivatedOn: expect.any(String),
    });

    // The session ended at once: the same token is no longer accepted.
    expect((await ask("GET", "/api/sessions/current", token)).status).toBe(401);

    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(caughtText(0)).toContain("signing in again");
    expect(caughtText(0)).toContain("Manage your notification settings");
    expect(caughtText(0)).not.toContain("Unsubscribe");
  });

  it("is let back in on the next sign-in, made active, and told so", async () => {
    const token = await realm.token({
      preferred_username: "test-vendor-13",
      identity_provider: "bceid",
      sid: "returning-second",
    });
    const answer = await ask("GET", "/api/sessions/current", token);
    expect(answer.status).toBe(200);
    expect(answer.body.user).toMatchObject({ id: RETURNING, status: "ACTIVE" });

    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(caughtText(0)).toContain("You have successfully reactivated your Digital Marketplace account");
  });

  it("refuses to deactivate somebody else's account here", async () => {
    expect((await ask("DELETE", `/api/users/${VENDOR_TWO}`, await tokens.vendorOne())).status).toBe(403);
  });
});

// Last of all, because PGlite lets go of its one connection after a constraint refuses a
// write, which PostgreSQL itself does not; nothing after this relies on that connection.
describe("an email address another vendor already holds (R-4.6)", () => {
  it("is refused on a profile edit, without saying why", async () => {
    const answer = await ask("PUT", `/api/users/${VENDOR_ONE}`, await tokens.vendorOne(), {
      tag: "updateProfile",
      value: { name: "Vendor", email: "test-vendor-2@example.test" },
    });
    expect(answer).toEqual({ status: 400, body: { errors: ["Your profile could not be saved."] } });
  });
});
