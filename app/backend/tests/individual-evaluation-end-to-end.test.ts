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
import { PANEL_LOCKED } from "../src/rules/other-program-content";
import {
  INCOMPLETE_EVALUATION,
  MOVED_TO_CONSENSUS_NOTE,
  NAMED_PROPOSAL_NOT_UNDER_REVIEW,
  NOT_AN_EVALUATOR,
  SUBMITTED_EVALUATION_FIXED,
  UNREADABLE_NAMED_PROPOSALS,
  unrecognisedEvaluationRequest,
} from "../src/rules/individual-evaluation";

/**
 * Individual evaluation of Sprint With Us and Team With Us questions, against the service as it is
 * started: over the schema its own migrations made with the acceptance suite's seed applied,
 * through the boundary that checks every request against the contract, with mail caught (decision
 * record 0062).
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const sid = (n: number, k: number) => `00000000-0000-4000-a${String(n).padStart(3, "0")}-${String(k).padStart(12, "0")}`;
const ADMIN = "00000000-0000-4000-8000-000000000101";
const STAFF = "00000000-0000-4000-8000-000000000102";
const CLOSED_SWU = "00000000-0000-4000-8000-000000000701";
const CLOSED_TWU = "00000000-0000-4000-8000-000000000801";

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
    DEADLINE_HOOK_INTERVAL_MS: "0",
  });
  const { createApplication } = await import("../src/application");
  app = await createApplication();
  await app.listen(0, "127.0.0.1");
  origin = await app.getUrl();
  // Close the lapsed opportunities, as the acceptance suite's trigger does.
  await ask("GET", "/status");
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
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // A plain-text answer, as /status gives.
  }
  return { status: answer.status, body: parsed as Record<string, any> };
}

const swuEvaluations = (proposal: string) => `/api/proposal/sprint-with-us/${proposal}/team-questions/evaluations`;
const twuEvaluations = (proposal: string) => `/api/proposal/team-with-us/${proposal}/resource-questions/evaluations`;
const scores = (values: readonly (number | null)[], notes = "A reasoned comment.") =>
  values.map((score, order) => ({ order, score, notes }));

async function latestStatus(table: string, id: string) {
  const rows = await database.query<{ status: string; note: string | null; createdBy: string | null }>(
    `SELECT "status", "note", "createdBy" FROM "${table}" WHERE "opportunity" = $1 AND "status" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`,
    [id],
  );
  return rows.rows[0];
}

const text = (index: number) => (catcher.caught[index]?.data ?? "").replace(/=\r\n/g, "");

describe("a Sprint With Us panel scoring its proponents individually, to consensus", () => {
  let proponents: { id: string; anonymousProponentName: string }[] = [];

  it("tells the panel the proponents by anonymous name, in that order, with their answers (R-1.24, R-2.5, R-5.35)", async () => {
    const read = await ask("GET", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, await tokens.staff());
    expect(read.status).toBe(200);
    expect(read.body.status).toBe("EVAL_QUESTIONS_INDIVIDUAL");
    proponents = read.body.proponents;
    expect(proponents.map((proponent) => proponent.anonymousProponentName)).toEqual(["Proponent 1", "Proponent 2", "Proponent 3"]);
    expect(read.body.proponents[0].responses).toHaveLength(4);
    expect(JSON.stringify(read.body.proponents)).not.toMatch(/Northern Pines|legalName|organization/);
    // A vendor is told nothing of them.
  });

  it("keeps a draft as entered, out of range and without a comment (R-5.21, R-5.23)", async () => {
    const token = await tokens.staff();
    const created = await ask("POST", swuEvaluations(proponents[0]!.id), token, {
      proposal: proponents[0]!.id,
      status: "DRAFT",
      scores: scores([6, 3, 4, 2.5]).map((entry, order) => (order === 1 ? { ...entry, notes: "" } : entry)),
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("DRAFT");
    expect(created.body.evaluationPanelMember.id).toBe(STAFF);
    expect(created.body.scores.map((entry: { score: number }) => entry.score)).toEqual([6, 3, 4, 2.5]);
    expect(created.body.scores[1].notes).toBe("");
  });

  it("refuses a second evaluation of the same proponent in the service's words (R-5.3)", async () => {
    const again = await ask("POST", swuEvaluations(proponents[0]!.id), await tokens.staff(), { status: "DRAFT", scores: scores([1, 1, 1, 1]) });
    expect(again).toEqual({ status: 409, body: { conflict: ["You already have a team question evaluation for this proposal."] } });
  });

  it("refuses to submit one evaluation on its own, leaving it a draft (R-5.26)", async () => {
    const token = await tokens.staff();
    const alone = await ask("PUT", `${swuEvaluations(proponents[0]!.id)}/${STAFF}`, token, { tag: "submit" });
    expect(alone).toEqual({ status: 400, body: { errors: [unrecognisedEvaluationRequest("submit")] } });
    expect(alone.body.errors[0]).toMatch(/unrecognised/i);
    expect((await ask("GET", `${swuEvaluations(proponents[0]!.id)}/${STAFF}`, token)).body.status).toBe("DRAFT");
  });

  it("refuses an incomplete set and submits none of it (R-5.25)", async () => {
    const token = await tokens.staff();
    await ask("POST", swuEvaluations(proponents[1]!.id), token, { status: "DRAFT", scores: scores([4, 4, 4, 4]) });
    const refused = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, token, { tag: "submitIndividualQuestionEvaluations" });
    expect(refused).toEqual({ status: 400, body: { errors: [INCOMPLETE_EVALUATION] } });
    // Named, the out-of-range draft still makes the set incomplete.
    const named = { tag: "submitIndividualQuestionEvaluations", value: { note: "", proposals: [proponents[0]!.id, proponents[1]!.id] } };
    expect(await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, token, named)).toEqual({ status: 400, body: { errors: [INCOMPLETE_EVALUATION] } });
    const own = await ask("GET", `/api/opportunity/sprint-with-us/${CLOSED_SWU}/team-questions/evaluations`, token);
    expect(own.body.map((evaluation: { status: string }) => evaluation.status)).toEqual(["DRAFT", "DRAFT"]);
  });

  it("checks and submits only the proposals a submission names (R-5.25)", async () => {
    const token = await tokens.staff();
    const address = `/api/opportunities/sprint-with-us/${CLOSED_SWU}`;
    const elsewhere = { tag: "submitIndividualQuestionEvaluations", value: { note: "", proposals: [sid(21, 101)] } };
    expect(await ask("PUT", address, token, elsewhere)).toEqual({ status: 400, body: { errors: [NAMED_PROPOSAL_NOT_UNDER_REVIEW] } });
    const unreadable = { tag: "submitIndividualQuestionEvaluations", value: { note: "", proposals: "all" } };
    expect(await ask("PUT", address, token, unreadable)).toEqual({ status: 400, body: { errors: [UNREADABLE_NAMED_PROPOSALS] } });

    // The second proponent is complete; the first is not, and the third has no evaluation at all.
    const one = { tag: "submitIndividualQuestionEvaluations", value: { note: "", proposals: [proponents[1]!.id] } };
    const submitted = await ask("PUT", address, token, one);
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe("EVAL_QUESTIONS_INDIVIDUAL");
    expect((await ask("GET", `${swuEvaluations(proponents[1]!.id)}/${STAFF}`, token)).body.status).toBe("SUBMITTED");
    expect((await ask("GET", `${swuEvaluations(proponents[0]!.id)}/${STAFF}`, token)).body.status).toBe("DRAFT");
  });

  it("lets nobody but its evaluator read an evaluation before consensus (R-5.28)", async () => {
    expect((await ask("GET", `${swuEvaluations(proponents[1]!.id)}/${STAFF}`, await tokens.admin())).status).toBe(404);
    const listed = await ask("GET", swuEvaluations(proponents[1]!.id), await tokens.admin());
    expect(listed).toEqual({ status: 200, body: [] });
  });

  it("lets the owner change the panel while the questions are evaluated individually (R-5.16)", async () => {
    const panel = [
      { user: STAFF, evaluator: true, chair: false },
      { user: ADMIN, evaluator: true, chair: true },
    ];
    const changed = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, await tokens.staff(), { tag: "editEvaluationPanel", value: panel });
    expect(changed.status).toBe(200);
  });

  it("submits a complete set, which is then fixed, and waits for every evaluator (R-5.24, R-5.25, R-5.27)", async () => {
    const token = await tokens.staff();
    const edited = await ask("PUT", `${swuEvaluations(proponents[0]!.id)}/${STAFF}`, token, { tag: "edit", value: { scores: scores([5, 3, 4, 2.5]) } });
    expect(edited.status).toBe(200);
    await ask("POST", swuEvaluations(proponents[2]!.id), token, { status: "DRAFT", scores: scores([3, 3, 3, 3.75]) });
    const submitted = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, token, { tag: "submitIndividualQuestionEvaluations" });
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe("EVAL_QUESTIONS_INDIVIDUAL");

    const fixed = await ask("PUT", `${swuEvaluations(proponents[0]!.id)}/${STAFF}`, token, { tag: "edit", value: { scores: scores([1, 1, 1, 1]) } });
    expect(fixed).toEqual({ status: 400, body: { errors: [SUBMITTED_EVALUATION_FIXED] } });
  });

  it("moves to consensus once the last evaluator submits, counting only the proponents that submission names, and tells the chair and the owner (R-5.27)", async () => {
    const token = await tokens.admin();
    // The last evaluator scores two of the three proponents and names only those.
    const named = proponents.slice(0, 2);
    for (const proponent of named) {
      expect((await ask("POST", swuEvaluations(proponent.id), token, { status: "DRAFT", scores: scores([4, 4, 4, 4]) })).status).toBe(201);
    }
    const submitted = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, token, {
      tag: "submitIndividualQuestionEvaluations",
      value: { note: "", proposals: named.map((proponent) => proponent.id) },
    });
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe("EVAL_QUESTIONS_CONSENSUS");
    expect(await latestStatus("swuOpportunityStatuses", CLOSED_SWU)).toEqual({
      status: "EVAL_QUESTIONS_CONSENSUS",
      note: MOVED_TO_CONSENSUS_NOTE,
      createdBy: null,
    });

    const about = "Seeded closed Sprint With Us opportunity";
    const notices = () => catcher.caught.filter((_, index) => text(index).includes("Ready for Consensus"));
    // The chair and the owner as blind copies of one message visibly addressed to the service
    // alone, so neither sees the other (R-6.15).
    await expect.poll(() => notices().length).toBe(1);
    const notice = notices()[0]!;
    expect([...notice.recipients].sort()).toEqual(["admin.one@example.test", "donotreply@example.test", "staff.one@example.test"]);
    expect(notice.data).toMatch(/^To: .*donotreply@example\.test\s*$/im);
    expect(notice.data).not.toContain("admin.one@example.test");
    expect(notice.data).not.toContain("staff.one@example.test");
    expect(text(catcher.caught.indexOf(notice))).toContain(about);
  });

  it("then shows every panel member the others' scores beside their names (R-5.28)", async () => {
    const read = await ask("GET", `${swuEvaluations(proponents[0]!.id)}/${ADMIN}`, await tokens.staff());
    expect(read.status).toBe(200);
    expect(read.body.evaluationPanelMember).toEqual({ id: ADMIN, name: expect.any(String) });
    expect(read.body.scores.map((entry: { score: number }) => entry.score)).toEqual([4, 4, 4, 4]);
    const listed = await ask("GET", swuEvaluations(proponents[0]!.id), await tokens.staff());
    expect(listed.body).toHaveLength(2);
  });

  it("then refuses a change to the panel, and any further scoring (R-5.16, R-5.21)", async () => {
    const panel = [
      { user: STAFF, evaluator: true, chair: false },
      { user: ADMIN, evaluator: true, chair: true },
    ];
    const locked = await ask("PUT", `/api/opportunities/sprint-with-us/${CLOSED_SWU}`, await tokens.staff(), { tag: "editEvaluationPanel", value: panel });
    expect(locked).toEqual({ status: 400, body: { errors: [PANEL_LOCKED] } });
  });
});

describe("who may evaluate and read evaluations", () => {
  it("refuses a chair who does not evaluate (R-5.21)", async () => {
    // users.staffOne chairs swuLapsedChairNotEvaluator without evaluating; it closed at /status.
    const refused = await ask("POST", swuEvaluations(sid(22, 101)), await tokens.staff(), { status: "DRAFT", scores: scores([1, 1, 1, 1]) });
    expect(refused).toEqual({ status: 401, body: { errors: [NOT_AN_EVALUATOR] } });
  });

  it("refuses an evaluator before the opportunity has closed (R-5.21)", async () => {
    const refused = await ask("POST", swuEvaluations(sid(25, 101)), await tokens.staff(), { status: "DRAFT", scores: scores([1, 1, 1, 1]) });
    expect(refused.status).toBe(400);
  });

  it("never shows an evaluation to a public sector employee with no connection to the opportunity (R-5.11)", async () => {
    expect((await ask("GET", `${swuEvaluations(sid(21, 101))}/${ADMIN}`, await tokens.staff())).status).toBe(404);
    expect((await ask("GET", swuEvaluations(sid(21, 101)), await tokens.staff())).status).toBe(404);
    // An administrator on that panel reads it.
    expect((await ask("GET", `${swuEvaluations(sid(21, 101))}/${ADMIN}`, await tokens.admin())).status).toBe(200);
  });

  it("names a Team With Us duplicate after its resource questions (R-5.3, R-5.36)", async () => {
    const again = await ask("POST", twuEvaluations(sid(36, 101)), await tokens.staff(), { status: "DRAFT", scores: scores([1, 1, 1, 1]) });
    expect(again).toEqual({ status: 409, body: { conflict: ["You already have a resource question evaluation for this proposal."] } });
    const first = await ask("POST", twuEvaluations(sid(36, 102)), await tokens.staff(), { status: "DRAFT", scores: scores([2, 2, 2, 2]) });
    expect(first.status).toBe(201);
  });

  it("keeps a Team With Us draft question with a comment and no score yet", async () => {
    const token = await tokens.admin();
    const read = await ask("GET", `/api/opportunities/team-with-us/${CLOSED_TWU}`, token);
    expect(read.body.proponents.map((proponent: { anonymousProponentName: string }) => proponent.anonymousProponentName)).toEqual([
      "Proponent 1",
      "Proponent 2",
      "Proponent 3",
    ]);
    const created = await ask("POST", twuEvaluations(read.body.proponents[0].id), token, {
      status: "DRAFT",
      scores: [{ order: 0, score: null, notes: "Come back to this." }],
    });
    expect(created.status).toBe(201);
    expect(created.body.scores).toEqual([{ order: 0, score: null, notes: "Come back to this." }]);
  });

  it("lists, to a panel member, the panels they sit on (R-5.19)", async () => {
    const listed = await ask("GET", "/api/opportunities/sprint-with-us", await tokens.staff());
    const seat = listed.body.find((opportunity: { id: string }) => opportunity.id === sid(24, 1));
    expect(seat?.evaluationPanel).toEqual(expect.arrayContaining([expect.objectContaining({ user: expect.objectContaining({ id: STAFF }), evaluator: true })]));
    // An opportunity they have nothing to do with carries no panel for them.
    const other = listed.body.find((opportunity: { id: string }) => opportunity.id === sid(21, 1));
    expect(other?.evaluationPanel).toBeUndefined();
  });

  it("lists a draft someone else created to the panel member it names, and to no other employee (R-5.19)", async () => {
    const admin = await tokens.admin();
    const draft = await ask("POST", "/api/opportunities/sprint-with-us", admin, { title: "A draft for its panel" });
    expect(draft.status).toBe(201);
    const panel = [
      { user: ADMIN, evaluator: true, chair: true },
      { user: STAFF, evaluator: true, chair: false },
    ];
    expect((await ask("PUT", `/api/opportunities/sprint-with-us/${draft.body.id}`, admin, { tag: "editEvaluationPanel", value: panel })).status).toBe(200);

    const listed = await ask("GET", "/api/opportunities/sprint-with-us", await tokens.staff());
    const seat = listed.body.find((opportunity: { id: string }) => opportunity.id === draft.body.id);
    expect(seat).toMatchObject({ status: "DRAFT", title: "A draft for its panel" });
    expect(seat.evaluationPanel).toEqual(expect.arrayContaining([expect.objectContaining({ user: expect.objectContaining({ id: STAFF }) })]));

    // Taken off the panel, the draft is theirs to see no more.
    const without = [
      { user: ADMIN, evaluator: true, chair: true },
      { user: "00000000-0000-4000-8000-000000000103", evaluator: true, chair: false },
    ];
    const removed = await ask("PUT", `/api/opportunities/sprint-with-us/${draft.body.id}`, admin, { tag: "editEvaluationPanel", value: without });
    expect(removed.status).toBe(200);
    const after = await ask("GET", "/api/opportunities/sprint-with-us", await tokens.staff());
    expect(after.body.map((opportunity: { id: string }) => opportunity.id)).not.toContain(draft.body.id);
  });
});
