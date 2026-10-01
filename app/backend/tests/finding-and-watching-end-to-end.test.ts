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
import { ALREADY_WATCHING, NOT_WATCHING, NOT_YOUR_OWN, NO_SUCH_OPPORTUNITY } from "../src/rules/opportunity-list";

/**
 * Finding opportunities, watching them and counting their views, against the service as it is
 * started: over the schema its own migrations made with the acceptance suite's seed applied,
 * through the boundary that checks every request against the contract.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const PUBLISHED = "00000000-0000-4000-8000-000000000601"; // staffOne's
const DRAFT_OF_STAFF_TWO = "00000000-0000-4000-8000-000000000602";
const CLOSED_SPRINT = "00000000-0000-4000-8000-000000000701";

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
  otherStaff: () => realm.token({ preferred_username: "gov-second", identity_provider: "idir", sid: "staff-two" }),
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

const ids = (listing: { id: string }[]) => listing.map((opportunity) => opportunity.id);

describe("who sees which opportunities (R-1.2, R-1.3)", () => {
  it("lists and opens only published opportunities to a visitor and a vendor", async () => {
    for (const token of [undefined, await tokens.vendor()]) {
      const listed = await ask("GET", "/api/opportunities/code-with-us", token);
      expect(listed.status).toBe(200);
      expect(ids(listed.body)).toContain(PUBLISHED);
      expect(ids(listed.body)).not.toContain(DRAFT_OF_STAFF_TWO);
      expect(listed.body.every((opportunity: { status: string }) => !["DRAFT", "UNDER_REVIEW"].includes(opportunity.status))).toBe(true);
      expect((await ask("GET", `/api/opportunities/code-with-us/${DRAFT_OF_STAFF_TWO}`, token)).status).toBe(404);
    }
  });

  it("shows each member of staff their own unpublished work and not another's, and an administrator both", async () => {
    const mine = await ask("POST", "/api/opportunities/code-with-us", await tokens.staff(), { title: "Staff one's draft" });
    expect(mine.status).toBe(201);
    const staffOne = ids((await ask("GET", "/api/opportunities/code-with-us", await tokens.staff())).body);
    const staffTwo = ids((await ask("GET", "/api/opportunities/code-with-us", await tokens.otherStaff())).body);
    const administrator = ids((await ask("GET", "/api/opportunities/code-with-us", await tokens.admin())).body);
    expect(staffOne).toContain(mine.body.id);
    expect(staffOne).not.toContain(DRAFT_OF_STAFF_TWO);
    expect(staffTwo).toContain(DRAFT_OF_STAFF_TWO);
    expect(staffTwo).not.toContain(mine.body.id);
    expect(administrator).toEqual(expect.arrayContaining([mine.body.id, DRAFT_OF_STAFF_TWO]));
  });

  it("lists the other two programs' opportunities by the same rule, with their budgets", async () => {
    const sprint = await ask("GET", "/api/opportunities/sprint-with-us");
    expect(sprint.status).toBe(200);
    const closed = sprint.body.find((opportunity: { id: string }) => opportunity.id === CLOSED_SPRINT);
    expect(closed).toMatchObject({ program: "sprint-with-us", totalMaxBudget: 500000, subscribed: false });
    expect(closed.createdBy).toBeUndefined();
    const team = await ask("GET", "/api/opportunities/team-with-us", await tokens.vendor());
    expect(team.status).toBe(200);
    expect(team.body.length).toBeGreaterThan(0);
    expect(team.body.every((opportunity: { status: string; maxBudget: number }) => opportunity.status !== "DRAFT" && opportunity.maxBudget >= 0)).toBe(true);
  });
});

describe("drafts in the other two programs, before slice 10 (R-1.3, R-1.39; decision record 0035)", () => {
  it("saves a Sprint With Us draft from a title alone and lists it to its author and administrators only", async () => {
    const created = await ask("POST", "/api/opportunities/sprint-with-us", await tokens.staff(), {
      title: "Staff one's sprint draft",
      status: "DRAFT",
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ program: "sprint-with-us", status: "DRAFT", title: "Staff one's sprint draft", totalMaxBudget: 0 });
    const id = created.body.id;
    expect(ids((await ask("GET", "/api/opportunities/sprint-with-us", await tokens.staff())).body)).toContain(id);
    expect(ids((await ask("GET", "/api/opportunities/sprint-with-us", await tokens.admin())).body)).toContain(id);
    expect(ids((await ask("GET", "/api/opportunities/sprint-with-us", await tokens.otherStaff())).body)).not.toContain(id);
    expect(ids((await ask("GET", "/api/opportunities/sprint-with-us", await tokens.vendor())).body)).not.toContain(id);
    expect((await ask("GET", `/api/opportunities/sprint-with-us/${id}`, await tokens.staff())).body.id).toBe(id);
    expect((await ask("GET", `/api/opportunities/sprint-with-us/${id}`, await tokens.vendor())).status).toBe(404);
  });

  it("saves a Team With Us draft with its dates, remote work and budget", async () => {
    const created = await ask("POST", "/api/opportunities/team-with-us", await tokens.admin(), {
      title: "A team draft",
      location: "Prince George",
      remoteOk: true,
      maxBudget: 250000,
      proposalDeadline: "2030-03-01",
      assignmentDate: "2030-03-15",
      startDate: "2030-04-01",
      completionDate: "2030-12-31",
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      status: "DRAFT",
      location: "Prince George",
      remoteOk: true,
      maxBudget: 250000,
      proposalDeadline: "2030-03-01",
      assignmentDate: "2030-03-15",
      startDate: "2030-04-01",
      completionDate: "2030-12-31",
    });
  });

  it("refuses a vendor and a published creation by staff", async () => {
    expect((await ask("POST", "/api/opportunities/team-with-us", await tokens.vendor(), { title: "x" })).status).toBe(401);
    expect((await ask("POST", "/api/opportunities/team-with-us", await tokens.staff(), { status: "PUBLISHED" })).status).toBe(401);
  });

  it("creates a Sprint With Us opportunity under review with its phases, questions, weights and panel (decision record 0036)", async () => {
    const created = await ask("POST", "/api/opportunities/sprint-with-us", await tokens.staff(), {
      status: "UNDER_REVIEW",
      title: "Staff one's sprint under review",
      totalMaxBudget: 600000,
      mandatorySkills: ["React"],
      assignmentDate: "2030-02-01",
      implementationPhase: { startDate: "2030-02-15", completionDate: "2030-08-31" },
      teamQuestions: [{ question: "Why you?", guideline: "Fit", score: 5, minimumScore: 3, wordLimit: 300 }],
      questionsWeight: 25,
      codeChallengeWeight: 40,
      scenarioWeight: 15,
      priceWeight: 20,
      evaluationPanel: [
        { user: "00000000-0000-4000-8000-000000000102", evaluator: true, chair: true },
        { user: "00000000-0000-4000-8000-000000000101", evaluator: true, chair: false },
        { user: "00000000-0000-4000-8000-000000000201", evaluator: true, chair: false },
      ],
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      status: "UNDER_REVIEW",
      mandatorySkills: ["React"],
      inceptionPhase: null,
      implementationPhase: { phase: "IMPLEMENTATION", startDate: "2030-02-15", completionDate: "2030-08-31", maxBudget: 600000 },
      teamQuestions: [{ question: "Why you?", score: 5, minimumScore: 3, wordLimit: 300, order: 0 }],
      codeChallengeWeight: 40,
      evaluationPanel: [
        { user: { id: "00000000-0000-4000-8000-000000000102" }, chair: true, order: 0 },
        { user: { id: "00000000-0000-4000-8000-000000000101" }, chair: false, order: 1 },
      ],
    });
    // A vendor cannot sit on a panel, so the third is left off.
    expect(created.body.evaluationPanel).toHaveLength(2);
    const staffList = (await ask("GET", "/api/opportunities/sprint-with-us", await tokens.staff())).body;
    expect(staffList.find((opportunity: { id: string }) => opportunity.id === created.body.id)?.status).toBe("UNDER_REVIEW");
    expect(ids((await ask("GET", "/api/opportunities/sprint-with-us", await tokens.otherStaff())).body)).not.toContain(created.body.id);
  });

  it("lets an administrator create a Team With Us opportunity published, which then everyone can list", async () => {
    const created = await ask("POST", "/api/opportunities/team-with-us", await tokens.admin(), {
      status: "PUBLISHED",
      title: "A published team",
      maxBudget: 300000,
      proposalDeadline: "2030-05-01",
      resources: [{ serviceArea: "DATA_PROFESSIONAL", targetAllocation: 80 }],
      resourceQuestions: [{ question: "How?", guideline: "Detail", score: 10, wordLimit: 500 }],
      questionsWeight: 30,
      challengeWeight: 40,
      priceWeight: 30,
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      status: "PUBLISHED",
      resources: [{ serviceArea: "DATA_PROFESSIONAL", targetAllocation: 80, order: 0 }],
      resourceQuestions: [{ question: "How?", order: 0 }],
      challengeWeight: 40,
      // Nobody named: the author alone, as chair and evaluator.
      evaluationPanel: [{ user: { id: "00000000-0000-4000-8000-000000000101" }, chair: true, evaluator: true }],
    });
    expect(created.body.publishedAt).not.toBeNull();
    expect(ids((await ask("GET", "/api/opportunities/team-with-us", await tokens.vendor())).body)).toContain(created.body.id);
    expect(ids((await ask("GET", "/api/opportunities/team-with-us")).body)).toContain(created.body.id);
  });
});

describe("watching (R-1.5)", () => {
  const BASE = "/api/subscribers/code-with-us";

  it("records a watch once, refuses it twice, and ends it once", async () => {
    const vendor = await tokens.vendor();
    const first = await ask("POST", BASE, vendor, { opportunity: PUBLISHED });
    expect(first.status).toBe(201);
    expect(first.body.opportunity.id).toBe(PUBLISHED);
    expect((await ask("GET", `/api/opportunities/code-with-us/${PUBLISHED}`, vendor)).body.subscribed).toBe(true);
    const watchers = `opportunity.code-with-us.${PUBLISHED}.watchers`;
    expect((await ask("GET", `/api/counters?counters=${watchers}`)).body).toEqual({ [watchers]: 1 });

    expect(await ask("POST", BASE, vendor, { opportunity: PUBLISHED })).toEqual({ status: 400, body: { errors: [ALREADY_WATCHING] } });

    expect((await ask("DELETE", `${BASE}/${PUBLISHED}`, vendor)).status).toBe(200);
    expect((await ask("GET", `/api/opportunities/code-with-us/${PUBLISHED}`, vendor)).body.subscribed).toBe(false);
    expect(await ask("DELETE", `${BASE}/${PUBLISHED}`, vendor)).toEqual({ status: 400, body: { errors: [NOT_WATCHING] } });
  });

  it("refuses a visitor, the opportunity's own author, and an opportunity the person may not read", async () => {
    expect((await ask("POST", BASE, undefined, { opportunity: PUBLISHED })).status).toBe(401);
    expect(await ask("POST", BASE, await tokens.staff(), { opportunity: PUBLISHED })).toEqual({ status: 400, body: { errors: [NOT_YOUR_OWN] } });
    expect(await ask("POST", BASE, await tokens.vendor(), { opportunity: DRAFT_OF_STAFF_TWO })).toEqual({
      status: 400,
      body: { errors: [NO_SUCH_OPPORTUNITY] },
    });
  });

  it("watches a Sprint With Us opportunity the same way", async () => {
    const vendor = await tokens.vendor();
    expect((await ask("POST", "/api/subscribers/sprint-with-us", vendor, { opportunity: CLOSED_SPRINT })).status).toBe(201);
    const listed = (await ask("GET", "/api/opportunities/sprint-with-us", vendor)).body;
    expect(listed.find((opportunity: { id: string }) => opportunity.id === CLOSED_SPRINT).subscribed).toBe(true);
    expect((await ask("DELETE", `/api/subscribers/sprint-with-us/${CLOSED_SPRINT}`, vendor)).status).toBe(200);
  });
});

describe("counting views (R-1.6)", () => {
  const views = `opportunity.code-with-us.${PUBLISHED}.views`;

  it("adds one view each time the public page is opened, by anyone", async () => {
    const before = (await ask("GET", `/api/counters?counters=${views}`)).body[views];
    expect(typeof before).toBe("number");
    expect((await ask("PUT", `/api/counters/${views}`)).body).toEqual({ [views]: before + 1 });
    expect((await ask("PUT", `/api/counters/${views}`, await tokens.vendor())).body).toEqual({ [views]: before + 2 });
    expect((await ask("GET", `/api/counters?counters=${views}`, await tokens.admin())).body).toEqual({ [views]: before + 2 });
  });

  it("reads several counters at once and refuses a name that is not a counter's", async () => {
    const watchers = `opportunity.code-with-us.${PUBLISHED}.watchers`;
    const repeated = await ask("GET", `/api/counters?counters=${views}&counters=${watchers}`);
    expect(Object.keys(repeated.body).sort()).toEqual([views, watchers].sort());
    const separated = await ask("GET", `/api/counters?counters=${encodeURIComponent(`${views},${watchers}`)}`);
    expect(separated.body).toEqual(repeated.body);
    expect((await ask("GET", "/api/counters?counters=made.up")).status).toBe(400);
    expect((await ask("PUT", `/api/counters/opportunity.code-with-us.${DRAFT_OF_STAFF_TWO}.views`)).status).toBe(400);
  });
});

describe("what has been awarded", () => {
  it("answers with the number of awarded opportunities and what they were worth", async () => {
    const metrics = await ask("GET", "/api/metrics");
    expect(metrics.status).toBe(200);
    expect(metrics.body).toHaveLength(1);
    expect(metrics.body[0].totalCount).toBeGreaterThan(0);
    expect(metrics.body[0].totalAwarded).toBeGreaterThan(0);
  });
});
