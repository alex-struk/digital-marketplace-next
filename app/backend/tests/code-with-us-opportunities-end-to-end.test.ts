import { createServer, Server } from "node:http";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { freePort } from "./free-port";
import { ATTACHMENT_NOT_READABLE } from "../src/opportunities/cwu-opportunities.service";
import { ONLY_ADMINISTRATORS_PUBLISH, OPPORTUNITY_INCOMPLETE, addDays, pacificDayOf } from "../src/rules/opportunities";

/**
 * Code With Us opportunities made, changed, put forward and published against the service as it
 * is started: over the schema its own migrations made with the acceptance suite's seed applied,
 * through the boundary that checks every request against the contract.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const PUBLISHED_SEEDED = "00000000-0000-4000-8000-000000000601";
const AWARDED_SEEDED_TITLE = "Seeded awarded Code With Us opportunity";
const PRIVATE_FILE_OF_ANOTHER = "00000000-0000-4000-8000-000000000901";

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
    FILE_UPLOADS_DIR: mkdtempSync(path.join(tmpdir(), "dm-uploads-test-")),
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
  return { status: answer.status, body: text ? JSON.parse(text) : null };
}

async function uploadAttachment(token: string, name: string, content: string) {
  const form = new FormData();
  form.append("name", name);
  // An opportunity's attachment records no read access against the file itself (R-8.19).
  form.append("metadata", "[]");
  form.append("file", new Blob([content]), name);
  const answer = await fetch(`${origin}/api/files`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
  return { status: answer.status, body: (await answer.json()) as { id: string } };
}

const today = pacificDayOf(new Date());
const complete = {
  title: "End-to-end opportunity",
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

describe("Code With Us opportunities over HTTP", () => {
  it("refuses a vendor and a visitor making one (R-1.7)", async () => {
    expect((await ask("POST", BASE, await tokens.vendor(), { ...complete, status: "DRAFT" })).status).toBe(401);
    expect((await ask("POST", BASE, undefined, { ...complete, status: "DRAFT" })).status).toBe(401);
  });

  it("saves a draft with blank fields, and keeps it from a vendor (R-1.9, R-1.2)", async () => {
    const created = await ask("POST", BASE, await tokens.staff(), { title: "Blank draft", status: "DRAFT" });
    expect(created.status).toBe(201);
    expect(created.body.proposalDeadline).toBe(addDays(today, 14));
    expect(created.body.completionDate).toBe(null);
    expect((await ask("GET", `${BASE}/${created.body.id}`, await tokens.vendor())).status).toBe(404);
    expect((await ask("GET", `${BASE}/${created.body.id}`)).status).toBe(404);
  });

  it("refuses a member of staff publishing, by creation or by request (R-1.48, R-1.22)", async () => {
    const byCreation = await ask("POST", BASE, await tokens.staff(), { ...complete, status: "PUBLISHED" });
    expect(byCreation).toEqual({ status: 401, body: { errors: [ONLY_ADMINISTRATORS_PUBLISH] } });

    const underReview = await ask("POST", BASE, await tokens.staff(), { ...complete, status: "UNDER_REVIEW" });
    expect(underReview.body.status).toBe("UNDER_REVIEW");
    const byRequest = await ask("PUT", `${BASE}/${underReview.body.id}`, await tokens.staff(), { tag: "publish" });
    expect(byRequest.status).toBe(401);
    expect((await ask("GET", `${BASE}/${underReview.body.id}`, await tokens.staff())).body.status).toBe("UNDER_REVIEW");
  });

  it("refuses an incomplete draft for review, saying it is incomplete (R-1.21)", async () => {
    const draft = await ask("POST", BASE, await tokens.staff(), { title: "Incomplete", status: "DRAFT" });
    const answer = await ask("PUT", `${BASE}/${draft.body.id}`, await tokens.staff(), { tag: "submitForReview" });
    expect(answer).toEqual({ status: 400, body: { errors: [OPPORTUNITY_INCOMPLETE] } });
  });

  it("names the offending fields when a submission is not a draft (R-1.10)", async () => {
    const answer = await ask("POST", BASE, await tokens.staff(), { ...complete, title: "", status: "UNDER_REVIEW" });
    expect(answer.status).toBe(400);
    expect(answer.body.errors[0]).toMatch(/^title: /);
  });

  it("takes an attachment the person may read, refuses one they may not, and opens it with the opportunity (R-8.22, R-8.25)", async () => {
    const staff = await tokens.staff();
    const vendor = await tokens.vendor();
    const draft = await ask("POST", BASE, staff, { ...complete, status: "DRAFT" });

    const refused = await ask("PUT", `${BASE}/${draft.body.id}`, staff, {
      tag: "edit",
      value: { attachments: [PRIVATE_FILE_OF_ANOTHER] },
    });
    expect(refused).toEqual({ status: 400, body: { errors: [ATTACHMENT_NOT_READABLE] } });

    const file = await uploadAttachment(staff, "Statement of work.txt", "The statement of work.");
    expect(file.status).toBe(201);
    const attached = await ask("PUT", `${BASE}/${draft.body.id}`, staff, { tag: "edit", value: { attachments: [file.body.id] } });
    expect(attached.status).toBe(200);
    expect(attached.body.attachments.map((record: { id: string }) => record.id)).toEqual([file.body.id]);
    expect(attached.body.title).toBe(complete.title);

    // Before publication, the vendor is refused the file; once published, they receive it.
    expect((await ask("GET", `/api/files/${file.body.id}`, vendor)).status).toBe(401);
    expect((await ask("PUT", `${BASE}/${draft.body.id}`, staff, { tag: "submitForReview" })).status).toBe(200);
    expect((await ask("PUT", `${BASE}/${draft.body.id}`, await tokens.admin(), { tag: "publish" })).body.status).toBe("PUBLISHED");
    const read = await fetch(`${origin}/api/files/${file.body.id}?type=blob`, { headers: { authorization: `Bearer ${vendor}` } });
    expect(read.status).toBe(200);
    expect(await read.text()).toBe("The statement of work.");
  });

  it("keeps each version and records the edit with who made it (R-1.4)", async () => {
    const admin = await tokens.admin();
    const before = await ask("GET", `${BASE}/${PUBLISHED_SEEDED}`, admin);
    const changed = await ask("PUT", `${BASE}/${PUBLISHED_SEEDED}`, admin, {
      tag: "edit",
      value: { description: "A changed description." },
    });
    expect(changed.status).toBe(200);
    expect(changed.body.description).toBe("A changed description.");
    expect(changed.body.history[0]).toMatchObject({ event: "EDITED", createdBy: { name: "Robin Placeholder" } });
    const versions = await database.query<{ description: string }>(
      'SELECT "description" FROM "cwuOpportunityVersions" WHERE "opportunity" = $1 ORDER BY "createdAt"',
      [PUBLISHED_SEEDED],
    );
    expect(versions.rows.map((row) => row.description)).toEqual([before.body.description, "A changed description."]);
  });

  it("refuses the author changing a published opportunity (R-1.56)", async () => {
    const answer = await ask("PUT", `${BASE}/${PUBLISHED_SEEDED}`, await tokens.staff(), {
      tag: "edit",
      value: { title: "The author's change" },
    });
    expect(answer.status).toBe(401);
  });

  it("withholds who created and changed it from a vendor and a visitor (R-1.29)", async () => {
    for (const token of [await tokens.vendor(), undefined]) {
      const answer = await ask("GET", `${BASE}/${PUBLISHED_SEEDED}`, token);
      expect(answer.status).toBe(200);
      expect(answer.body).not.toHaveProperty("createdBy");
      expect(answer.body).not.toHaveProperty("updatedBy");
    }
  });

  it("refuses deleting a published opportunity, and a change of state out of an awarded one (R-1.53, R-1.20)", async () => {
    const admin = await tokens.admin();
    expect((await ask("DELETE", `${BASE}/${PUBLISHED_SEEDED}`, admin)).status).toBe(401);
    const all = await ask("GET", BASE, admin);
    const awarded = all.body.find((opportunity: { title: string }) => opportunity.title === AWARDED_SEEDED_TITLE);
    expect(awarded.status).toBe("AWARDED");
    expect((await ask("PUT", `${BASE}/${awarded.id}`, admin, { tag: "publish" })).status).toBe(400);
    expect((await ask("GET", `${BASE}/${awarded.id}`, admin)).body.status).toBe("AWARDED");
  });

  it("deletes a draft for its author (R-1.53)", async () => {
    const staff = await tokens.staff();
    const draft = await ask("POST", BASE, staff, { title: "To be deleted", status: "DRAFT" });
    expect((await ask("DELETE", `${BASE}/${draft.body.id}`, staff)).status).toBe(200);
    expect((await ask("GET", `${BASE}/${draft.body.id}`, staff)).status).toBe(404);
  });

  it("stores no state its program does not recognise, suspended included (R-1.19, R-1.51)", async () => {
    for (const status of ["SUSPENDED", "EVAL_CC", "SOMETHING"]) {
      await expect(
        database.query(
          `INSERT INTO "cwuOpportunityStatuses" ("id", "createdAt", "opportunity", "status") VALUES (gen_random_uuid(), now(), $1, $2)`,
          [PUBLISHED_SEEDED, status],
        ),
      ).rejects.toThrow();
    }
  });
});
