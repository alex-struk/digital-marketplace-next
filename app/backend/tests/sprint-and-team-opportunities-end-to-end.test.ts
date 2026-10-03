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
import { OPPORTUNITY_INCOMPLETE, addDays, pacificDayOf } from "../src/rules/opportunities";
import { PANEL_LOCKED, PANEL_NO_CHAIR } from "../src/rules/other-program-content";

/**
 * Sprint With Us and Team With Us opportunities from creation to publication, their evaluation
 * panel and who is told of it, against the service as it is started: over the schema its own
 * migrations made with the acceptance suite's seed applied, through the boundary that checks every
 * request against the contract, with mail caught (decision record 0045).
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const ADMIN_ONE = "00000000-0000-4000-8000-000000000101";
const STAFF_ONE = "00000000-0000-4000-8000-000000000102";
const STAFF_TWO = "00000000-0000-4000-8000-000000000103";
const PANEL_EVALUATOR = "00000000-0000-4000-8000-000000000104";
const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";
const AT_CONSENSUS = "00000000-0000-4000-a011-000000000001";

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
    migrations: { directory: path.resolve(__dirname, "../../migrations/migrations"), loadExtensions: [".cjs"] },
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 250));
/** A message's subject, with a long header's folding undone. */
const subjectOf = (data: string) => /^Subject: (.*(?:\r\n .*)*)$/m.exec(data)?.[1]?.replace(/\r\n /g, " ") ?? "";
const subjects = () => catcher.caught.map((mail) => subjectOf(mail.data));
const recipientsOf = (subject: string) =>
  catcher.caught
    .filter((mail) => subjectOf(mail.data) === subject)
    .flatMap((mail) => mail.recipients.filter((address) => address !== "donotreply@example.test"));

const today = pacificDayOf(new Date());
const panel = (...members: [string, boolean, boolean][]) => members.map(([user, evaluator, chair]) => ({ user, evaluator, chair }));
const SPRINT = "/api/opportunities/sprint-with-us";
const TEAM = "/api/opportunities/team-with-us";

const sprint = {
  title: "A sprint to run",
  location: "Victoria",
  description: "What the work is.",
  remoteOk: false,
  totalMaxBudget: 900_000,
  mandatorySkills: ["React"],
  proposalDeadline: addDays(today, 30),
  assignmentDate: addDays(today, 40),
  implementationPhase: { startDate: addDays(today, 50), completionDate: addDays(today, 200) },
  teamQuestions: [{ question: "Why you?", guideline: "Fit.", score: 5, wordLimit: 300 }],
  questionsWeight: 25,
  codeChallengeWeight: 25,
  scenarioWeight: 25,
  priceWeight: 25,
  evaluationPanel: panel([STAFF_ONE, true, true], [STAFF_TWO, true, false]),
};

describe("a Sprint With Us opportunity from draft to publication (R-1.4, R-1.9, R-1.21, R-1.22, R-1.56)", () => {
  it("is edited as a new version, submitted, published by an administrator, and then changed only by one", async () => {
    const staff = await tokens.staff();
    const draft = await ask("POST", SPRINT, staff, { ...sprint, title: "" });
    expect(draft.status).toBe(201);
    expect(draft.body.status).toBe("DRAFT");
    const address = `${SPRINT}/${draft.body.id}`;

    // Incomplete: refused as incomplete, not field by field (R-1.21).
    expect(await ask("PUT", address, staff, { tag: "submitForReview" })).toEqual({ status: 400, body: { errors: [OPPORTUNITY_INCOMPLETE] } });

    const edited = await ask("PUT", address, staff, { tag: "edit", value: { title: "A sprint to run" } });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ title: "A sprint to run", location: "Victoria", totalMaxBudget: 900_000 });
    expect(edited.body.history.map((entry: { event: string | null }) => entry.event)).toContain("EDITED");
    // The panel is kept as it was: an edit does not change it.
    expect(edited.body.evaluationPanel).toHaveLength(2);

    const submitted = await ask("PUT", address, staff, { tag: "submitForReview" });
    expect(submitted.body.status).toBe("UNDER_REVIEW");
    await settle();
    expect(subjects()).toContain("A Sprint With Us Opportunity Has Been Submitted For Review");

    expect((await ask("PUT", address, staff, { tag: "publish" })).status).toBe(401);
    const published = await ask("PUT", address, await tokens.admin(), { tag: "publish" });
    expect(published.body.status).toBe("PUBLISHED");
    expect(published.body.publishedAt).not.toBeNull();

    // Once published, only an administrator changes it (R-1.56).
    expect((await ask("PUT", address, staff, { tag: "edit", value: { title: "Mine to change" } })).status).toBe(401);
    const changed = await ask("PUT", address, await tokens.admin(), { tag: "edit", value: { title: "Changed by an administrator" } });
    expect(changed.body.title).toBe("Changed by an administrator");
  });

  it("refuses a change that breaks the program's rules, naming the field", async () => {
    const admin = await tokens.admin();
    const made = await ask("POST", SPRINT, admin, { ...sprint, status: "PUBLISHED" });
    expect(made.status).toBe(201);
    const refused = await ask("PUT", `${SPRINT}/${made.body.id}`, admin, { tag: "edit", value: { totalMaxBudget: 6_000_000, priceWeight: 10 } });
    expect(refused).toEqual({
      status: 400,
      body: {
        errors: [
          "totalMaxBudget: Enter a total maximum budget between $1 and $5,000,000, in whole dollars.",
          "scoringWeights: The scoring weights must total 100%.",
        ],
      },
    });
  });
});

describe("deleting (R-1.53)", () => {
  it("lets the author delete a draft, an administrator one under review, and nobody one that has been published", async () => {
    const staff = await tokens.staff();
    const draft = await ask("POST", TEAM, staff, { title: "A team draft" });
    expect((await ask("DELETE", `${TEAM}/${draft.body.id}`, staff)).status).toBe(200);
    expect((await ask("GET", `${TEAM}/${draft.body.id}`, staff)).status).toBe(404);

    const review = await ask("POST", SPRINT, staff, { ...sprint, status: "UNDER_REVIEW" });
    expect(review.status).toBe(201);
    expect((await ask("DELETE", `${SPRINT}/${review.body.id}`, staff)).status).toBe(401);
    expect((await ask("PUT", `${SPRINT}/${review.body.id}`, await tokens.admin(), { tag: "publish" })).body.status).toBe("PUBLISHED");
    expect((await ask("DELETE", `${SPRINT}/${review.body.id}`, await tokens.admin())).status).toBe(401);
    expect((await ask("GET", `${SPRINT}/${review.body.id}`)).status).toBe(200);

    const another = await ask("POST", SPRINT, staff, { ...sprint, status: "UNDER_REVIEW" });
    expect((await ask("DELETE", `${SPRINT}/${another.body.id}`, await tokens.admin())).status).toBe(200);
  });

  it("lets an administrator delete a Sprint With Us draft of their own or another's, taking it out of the list", async () => {
    const admin = await tokens.admin();
    for (const [token, body] of [
      [admin, { title: "An administrator's sprint draft" }],
      [admin, { ...sprint, title: "An administrator's full sprint draft", status: "DRAFT" }],
      [await tokens.staff(), { title: "A staff sprint draft" }],
    ] as const) {
      const draft = await ask("POST", SPRINT, token, body);
      expect(draft.status).toBe(201);
      expect(draft.body.status).toBe("DRAFT");
      const listed = async () => ((await ask("GET", SPRINT, admin)).body as { id: string }[]).map((item) => item.id);
      expect(await listed()).toContain(draft.body.id);
      const deleted = await ask("DELETE", `${SPRINT}/${draft.body.id}`, admin);
      expect(deleted.status).toBe(200);
      expect(deleted.body).toMatchObject({ id: draft.body.id, status: "DRAFT" });
      expect(await listed()).not.toContain(draft.body.id);
    }
  });

  it("refuses public sector staff creating one published, in both programs (R-1.48)", async () => {
    expect((await ask("POST", SPRINT, await tokens.staff(), { ...sprint, status: "PUBLISHED" })).status).toBe(401);
    expect((await ask("POST", TEAM, await tokens.staff(), { status: "PUBLISHED" })).status).toBe(401);
  });
});

describe("the evaluation panel (R-1.43, R-5.1, R-5.9, R-5.16, R-5.17, R-5.18, R-5.37)", () => {
  async function published(): Promise<string> {
    const made = await ask("POST", SPRINT, await tokens.admin(), {
      ...sprint,
      status: "PUBLISHED",
      evaluationPanel: panel([ADMIN_ONE, true, true], [STAFF_TWO, true, false]),
    });
    expect(made.status).toBe(201);
    await settle();
    catcher.caught.length = 0;
    return made.body.id;
  }

  it("tells only the person newly added, once the opportunity has left draft", async () => {
    const id = await published();
    const changed = await ask("PUT", `${SPRINT}/${id}`, await tokens.admin(), {
      tag: "editEvaluationPanel",
      value: panel([ADMIN_ONE, true, true], [STAFF_TWO, true, false], [PANEL_EVALUATOR, true, false]),
    });
    expect(changed.status).toBe(200);
    expect(changed.body.evaluationPanel).toHaveLength(3);
    expect(changed.body.history.map((entry: { event: string | null }) => entry.event)).toContain("EDITED");
    await settle();
    const subject = "You Have Been Added to the Evaluation Panel of a Sprint With Us Opportunity";
    expect(recipientsOf(subject)).toHaveLength(1);
    expect(subjects()).toEqual([subject]);
  });

  it("tells nobody of a change made while it is a draft", async () => {
    const draft = await ask("POST", SPRINT, await tokens.staff(), { title: "Panel on a draft" });
    const changed = await ask("PUT", `${SPRINT}/${draft.body.id}`, await tokens.staff(), {
      tag: "editEvaluationPanel",
      value: panel([STAFF_ONE, true, true], [STAFF_TWO, true, false]),
    });
    expect(changed.status).toBe(200);
    await settle();
    expect(catcher.caught).toHaveLength(0);
  });

  it("refuses a panel with no chair, or a member with no role, naming the member, and keeps the panel it had", async () => {
    const id = await published();
    const admin = await tokens.admin();
    expect(await ask("PUT", `${SPRINT}/${id}`, admin, { tag: "editEvaluationPanel", value: panel([ADMIN_ONE, true, false], [STAFF_TWO, true, false]) })).toEqual({
      status: 400,
      body: { errors: [`evaluationPanel: ${PANEL_NO_CHAIR}`] },
    });
    const noRole = await ask("PUT", `${SPRINT}/${id}`, admin, {
      tag: "editEvaluationPanel",
      value: panel([ADMIN_ONE, true, true], [STAFF_TWO, false, false]),
    });
    expect(noRole.status).toBe(400);
    expect(noRole.body.errors).toEqual([expect.stringMatching(/^evaluationPanel: Panel member 2: .+ must be an evaluator, the chair, or both\.$/)]);
    const vendor = await ask("PUT", `${SPRINT}/${id}`, admin, {
      tag: "editEvaluationPanel",
      value: panel([ADMIN_ONE, true, true], [VENDOR_ONE, true, false]),
    });
    expect(vendor.body.errors).toEqual([expect.stringMatching(/Panel member 2: .+ is not a public sector employee\./)]);
    const kept = (await ask("GET", `${SPRINT}/${id}`, admin)).body.evaluationPanel;
    expect(kept.map((member: { user: { id: string } }) => member.user.id)).toEqual([ADMIN_ONE, STAFF_TWO]);
  });

  it("shows the panel to an administrator, the author and its members, and to nobody else", async () => {
    const id = await published();
    expect((await ask("GET", `${SPRINT}/${id}`, await tokens.otherStaff())).body.evaluationPanel).toHaveLength(2);
    expect((await ask("GET", `${SPRINT}/${id}`, await tokens.vendor())).body.evaluationPanel).toBeUndefined();
    expect((await ask("GET", `${SPRINT}/${id}`)).body.evaluationPanel).toBeUndefined();
    expect((await ask("GET", `${SPRINT}/${id}`, await tokens.staff())).body.evaluationPanel).toBeUndefined();
  });

  it("refuses a change from anyone but the author or an administrator, and once the consensus stage has begun", async () => {
    const id = await published();
    const value = panel([ADMIN_ONE, true, true], [STAFF_ONE, true, false]);
    expect((await ask("PUT", `${SPRINT}/${id}`, await tokens.otherStaff(), { tag: "editEvaluationPanel", value })).status).toBe(401);
    expect(await ask("PUT", `${SPRINT}/${AT_CONSENSUS}`, await tokens.admin(), { tag: "editEvaluationPanel", value })).toEqual({
      status: 400,
      body: { errors: [PANEL_LOCKED] },
    });
  });

  it("offers panel candidates, by name alone, on a public sector employee's own session", async () => {
    const session = await ask("GET", "/api/sessions/current", await tokens.staff());
    expect(session.body.panelCandidates).toEqual(expect.arrayContaining([{ id: STAFF_TWO, name: expect.any(String) }]));
    expect(session.body.panelCandidates.some((candidate: { id: string }) => candidate.id === VENDOR_ONE)).toBe(false);
    expect((await ask("GET", "/api/sessions/current", await tokens.vendor())).body.panelCandidates).toBeUndefined();
  });
});
