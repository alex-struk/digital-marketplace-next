import { createServer, Server } from "node:http";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { freePort } from "./free-port";
import { SmtpCatcher } from "./smtp-catcher";
import {
  NOT_PERMITTED_TO_ADD_ADDENDUM,
  ONLY_ADMINISTRATORS_CANCEL,
  addDays,
  pacificDayOf,
  transitionRefusal,
} from "../src/rules/opportunities";

/**
 * Running an opportunity after publication — addenda, private notes with files, cancelling, the
 * reporting figures and the history — and who is told, against the service as it is started:
 * over the schema its own migrations made with the acceptance suite's seed applied, through the
 * boundary that checks every request against the contract, with mail caught.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const STAFF_ONE = "00000000-0000-4000-8000-000000000102";
const ORGANIZATION_MEMBER = "00000000-0000-4000-8000-000000000204";
const THREE_PROPOSALS = "00000000-0000-4000-a003-000000000001"; // staffOne's, published, three submitted
const AWARDED = "00000000-0000-4000-a008-000000000001";
const CLOSED_SPRINT = "00000000-0000-4000-8000-000000000701";
const CLOSED_TEAM = "00000000-0000-4000-8000-000000000801";

let database: PGlite;
let socket: PGLiteSocketServer;
let keyServer: Server;
let realm: TestRealm;
let catcher: SmtpCatcher;
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
    SERVICE_ORIGIN: "http://localhost:4300",
    FILE_UPLOADS_DIR: mkdtempSync(path.join(tmpdir(), "dm-uploads-test-")),
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
  vendor: () => realm.token({ preferred_username: "test-vendor-1", identity_provider: "bceid", sid: "vendor" }),
  member: () => realm.token({ preferred_username: "test-vendor-4", identity_provider: "bceid", sid: "member" }),
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

async function upload(token: string, name: string) {
  const form = new FormData();
  form.append("name", name);
  form.append("metadata", "[]");
  form.append("file", new Blob(["a note's file"]), name);
  const answer = await fetch(`${origin}/api/files`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
  return (await answer.json()) as { id: string };
}

/**
 * Everyone a caught message went to, besides the service's own visible address, and its words with
 * soft line breaks undone.
 */
const caught = () =>
  catcher.caught.map((mail) => ({
    recipients: mail.recipients.filter((address) => address !== "donotreply@example.test"),
    text: mail.data.replace(/=\r\n/g, ""),
  }));
const subjectOf = (text: string) => /^Subject: (.*)$/m.exec(text)?.[1] ?? "";

const today = pacificDayOf(new Date());
const complete = {
  title: "An opportunity to run",
  teaser: "Made by a test.",
  remoteOk: false,
  remoteDesc: "",
  location: "Victoria",
  reward: 5000,
  skills: ["Backend Development"],
  description: "What the work is.",
  proposalDeadline: addDays(today, 30),
  assignmentDate: addDays(today, 40),
  startDate: addDays(today, 50),
  completionDate: addDays(today, 90),
};
const BASE = "/api/opportunities/code-with-us";

/** A published opportunity of staffOne's, watched by vendorOne and by organizationMember. */
async function publishedAndWatched(): Promise<string> {
  const made = await ask("POST", BASE, await tokens.staff(), { ...complete, status: "UNDER_REVIEW" });
  expect(made.status).toBe(201);
  expect((await ask("PUT", `${BASE}/${made.body.id}`, await tokens.admin(), { tag: "publish" })).status).toBe(200);
  for (const token of [await tokens.vendor(), await tokens.member()]) {
    expect((await ask("POST", "/api/subscribers/code-with-us", token, { opportunity: made.body.id })).status).toBe(201);
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  catcher.caught.length = 0;
  return made.body.id;
}

describe("addenda (R-1.32, R-1.35)", () => {
  it("appends an addendum from the author, records it in the history, and tells watchers and the author once each", async () => {
    const id = await publishedAndWatched();
    const added = await ask("PUT", `${BASE}/${id}`, await tokens.staff(), { tag: "addAddendum", value: "The meeting is by video." });
    expect(added.status).toBe(200);
    expect(added.body.addenda).toEqual([
      { id: expect.any(String), createdAt: expect.any(String), createdBy: { id: STAFF_ONE, name: expect.any(String) }, description: "The meeting is by video." },
    ]);
    expect(added.body.history[0]).toMatchObject({ event: "ADDENDUM_ADDED", createdBy: { id: STAFF_ONE } });

    // Anyone reading it sees the addendum.
    const visitors = await ask("GET", `${BASE}/${id}`);
    expect(visitors.body.addenda.map((addendum: { description: string }) => addendum.description)).toEqual(["The meeting is by video."]);

    await expect.poll(() => catcher.caught.length).toBe(1);
    const [mail] = caught();
    expect(mail!.recipients.sort()).toEqual(["org.member@example.test", "staff.one@example.test", "vendor.one@example.test"]);
    expect(mail!.text).toMatch(/^To: donotreply@example\.test/m);
    expect(subjectOf(mail!.text)).toBe("A Code With Us Opportunity Has Been Updated");
    expect(mail!.text).toContain("The meeting is by video.");
    expect(mail!.text).not.toMatch(/unsubscribe/i);
  });

  it("is refused to a vendor, to a draft, and outside 1 to 5,000 characters, and offers no way to remove one", async () => {
    const id = await publishedAndWatched();
    expect(await ask("PUT", `${BASE}/${id}`, await tokens.vendor(), { tag: "addAddendum", value: "Mine." })).toEqual({
      status: 401,
      body: { errors: [NOT_PERMITTED_TO_ADD_ADDENDUM] },
    });
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.staff(), { tag: "addAddendum", value: "  " })).status).toBe(400);
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "addAddendum", value: "x".repeat(5001) })).status).toBe(400);
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "addAddendum", value: "x".repeat(5000) })).status).toBe(200);
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "removeAddendum" })).status).toBe(400);

    const draft = await ask("POST", BASE, await tokens.staff(), { title: "A draft" });
    expect((await ask("PUT", `${BASE}/${draft.body.id}`, await tokens.staff(), { tag: "addAddendum", value: "Too soon." })).status).toBe(401);
  });

  it("tells watchers and the author when an administrator changes a published opportunity (R-1.35)", async () => {
    const id = await publishedAndWatched();
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "edit", value: { teaser: "Changed." } })).status).toBe(200);
    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(caught()[0]!.recipients.sort()).toEqual(["org.member@example.test", "staff.one@example.test", "vendor.one@example.test"]);
  });
});

describe("private notes with files (R-1.33)", () => {
  it("keeps a note with its file in the history, which only the author and administrators read", async () => {
    const id = await publishedAndWatched();
    const file = await upload(await tokens.staff(), "budget-approval.pdf");
    const noted = await ask("PUT", `${BASE}/${id}`, await tokens.staff(), {
      tag: "addNote",
      value: { note: "Confirmed the budget.", attachments: [file.id] },
    });
    expect(noted.status).toBe(200);
    expect(noted.body.history[0]).toMatchObject({
      event: "NOTE_ADDED",
      note: "Confirmed the budget.",
      attachments: [{ id: file.id, name: "budget-approval.pdf" }],
    });
    const administrators = await ask("GET", `${BASE}/${id}`, await tokens.admin());
    expect(administrators.body.history[0].attachments[0].id).toBe(file.id);
    const vendors = await ask("GET", `${BASE}/${id}`, await tokens.vendor());
    expect(vendors.body).not.toHaveProperty("history");
    // The note's file is readable through the note by an administrator, and not by a vendor.
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.vendor())).status).toBe(401);
    // Nobody is told about a private note.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(catcher.caught).toHaveLength(0);
  });

  it("is refused to a vendor and outside 1 to 1,000 characters", async () => {
    const id = await publishedAndWatched();
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.vendor(), { tag: "addNote", value: { note: "Hello." } })).status).toBe(401);
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "addNote", value: { note: "x".repeat(1001) } })).status).toBe(400);
    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "addNote", value: { note: "" } })).status).toBe(400);
  });

  it("is accepted on a Sprint With Us opportunity, and is not part of Team With Us", async () => {
    const noted = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SPRINT}`, await tokens.staff(), {
      tag: "addNote",
      value: { note: "A Sprint With Us note." },
    });
    expect(noted.status).toBe(200);
    expect(noted.body.history[0]).toMatchObject({ event: "NOTE_ADDED", note: "A Sprint With Us note." });
    expect((await ask("PUT", `/api/opportunities/team-with-us/${CLOSED_TEAM}`, await tokens.staff(), { tag: "addNote", value: { note: "No." } })).status).toBe(400);
  });
});

describe("the reporting figures and the history (R-1.30)", () => {
  it("gives the author and administrators the views, watchers and submitted proposals, and nobody else", async () => {
    await ask("PUT", `/api/counters/opportunity.code-with-us.${THREE_PROPOSALS}.views`);
    for (const token of [await tokens.staff(), await tokens.admin()]) {
      const answer = await ask("GET", `${BASE}/${THREE_PROPOSALS}`, token);
      expect(answer.body.reporting).toEqual({ numViews: expect.any(Number), numWatchers: 0, numProposals: 3 });
      expect(answer.body.reporting.numViews).toBeGreaterThan(0);
      expect(answer.body.history.length).toBeGreaterThan(0);
    }
    for (const token of [await tokens.vendor(), undefined]) {
      const answer = await ask("GET", `${BASE}/${THREE_PROPOSALS}`, token);
      expect(answer.body).not.toHaveProperty("reporting");
      expect(answer.body).not.toHaveProperty("history");
    }
  });

  it("withholds the figures while an opportunity is a draft or under review, even from its author", async () => {
    const draft = await ask("POST", BASE, await tokens.staff(), { title: "Not yet" });
    expect(draft.body).not.toHaveProperty("reporting");
    expect(draft.body.history).toHaveLength(1);
  });
});

describe("cancelling (R-1.28, R-1.36, R-1.20)", () => {
  it("is an administrator's alone, with an optional note; watchers and proponents are told, the author separately", async () => {
    const watcher = await tokens.vendor();
    expect((await ask("POST", "/api/subscribers/code-with-us", watcher, { opportunity: THREE_PROPOSALS })).status).toBe(201);
    catcher.caught.length = 0;

    expect(await ask("PUT", `${BASE}/${THREE_PROPOSALS}`, await tokens.staff(), { tag: "cancel", value: "Mine to cancel?" })).toEqual({
      status: 401,
      body: { errors: [ONLY_ADMINISTRATORS_CANCEL] },
    });
    expect((await ask("PUT", `${BASE}/${THREE_PROPOSALS}`, await tokens.admin(), { tag: "cancel", value: "x".repeat(1001) })).status).toBe(400);

    const cancelled = await ask("PUT", `${BASE}/${THREE_PROPOSALS}`, await tokens.admin(), { tag: "cancel", value: "Funding withdrawn." });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe("CANCELED");
    expect(cancelled.body.history[0]).toMatchObject({ status: "CANCELED", note: "Funding withdrawn." });

    await expect.poll(() => catcher.caught.length).toBe(2);
    const mails = caught();
    const toEveryone = mails.find((mail) => subjectOf(mail.text) === "A Code With Us Opportunity Has Been Cancelled");
    const toAuthor = mails.find((mail) => subjectOf(mail.text) === "Your Code With Us Opportunity Has Been Cancelled");
    expect(toEveryone!.recipients.sort()).toEqual([
      "org.owner@example.test",
      "proponent.three@example.test",
      "proponent.two@example.test",
      "vendor.one@example.test",
    ]);
    expect(toAuthor!.recipients).toEqual(["staff.one@example.test"]);
  });

  it("leaves a cancelled opportunity where it is, refusing any further change of state, and tells nobody of an addendum to it", async () => {
    const admin = await tokens.admin();
    expect(await ask("PUT", `${BASE}/${THREE_PROPOSALS}`, admin, { tag: "cancel" })).toEqual({
      status: 400,
      body: { errors: [transitionRefusal("CANCELED", "CANCELED")] },
    });
    expect((await ask("PUT", `${BASE}/${THREE_PROPOSALS}`, admin, { tag: "publish" })).status).toBe(400);
    expect((await ask("GET", `${BASE}/${THREE_PROPOSALS}`, admin)).body.status).toBe("CANCELED");

    expect((await ask("PUT", `${BASE}/${THREE_PROPOSALS}`, admin, { tag: "addAddendum", value: "For the record." })).status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(catcher.caught).toHaveLength(0);
  });

  it("refuses to cancel a draft, an opportunity under review and an awarded one", async () => {
    const admin = await tokens.admin();
    const draft = await ask("POST", BASE, admin, { title: "A draft" });
    expect(await ask("PUT", `${BASE}/${draft.body.id}`, admin, { tag: "cancel" })).toEqual({
      status: 400,
      body: { errors: [transitionRefusal("DRAFT", "CANCELED")] },
    });
    const review = await ask("POST", BASE, admin, { ...complete, status: "UNDER_REVIEW" });
    expect((await ask("PUT", `${BASE}/${review.body.id}`, admin, { tag: "cancel" })).status).toBe(400);
    expect((await ask("PUT", `${BASE}/${AWARDED}`, admin, { tag: "cancel" })).status).toBe(400);
    expect((await ask("GET", `${BASE}/${AWARDED}`, admin)).body.status).toBe("AWARDED");
  });

  it("cancels a Sprint With Us opportunity at an evaluation stage the same way", async () => {
    const cancelled = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SPRINT}`, await tokens.admin(), { tag: "cancel" });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe("CANCELED");
    expect((await ask("PUT", `/api/opportunities/team-with-us/${CLOSED_TEAM}`, await tokens.staff(), { tag: "cancel" })).status).toBe(401);
  });
});

describe("a deactivated account (R-6.17)", () => {
  it("is sent nothing about an opportunity it watches, and watches it again once reactivated", async () => {
    const id = await publishedAndWatched();
    expect((await ask("DELETE", `/api/users/${ORGANIZATION_MEMBER}`, await tokens.admin())).status).toBe(200);
    // The notice of deactivation itself, the one message that still reaches the account.
    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(caught()[0]!.recipients).toEqual(["org.member@example.test"]);
    catcher.caught.length = 0;

    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "addAddendum", value: "An update." })).status).toBe(200);
    await expect.poll(() => catcher.caught.length).toBe(1);
    expect(caught()[0]!.recipients.sort()).toEqual(["staff.one@example.test", "vendor.one@example.test"]);
    catcher.caught.length = 0;

    expect((await ask("PUT", `${BASE}/${id}`, await tokens.admin(), { tag: "cancel" })).status).toBe(200);
    await expect.poll(() => catcher.caught.length).toBe(2);
    expect(caught().flatMap((mail) => mail.recipients)).not.toContain("org.member@example.test");

    // The watch itself was kept.
    expect((await ask("PUT", `/api/users/${ORGANIZATION_MEMBER}`, await tokens.admin(), { tag: "reactivateUser" })).status).toBe(200);
    expect((await ask("GET", `${BASE}/${id}`, await tokens.member())).body.subscribed).toBe(true);
  });
});
