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
  FINALIZED_NOTE,
  INCOMPLETE_CONSENSUS,
  NOT_ALL_CONSENSUSES_SUBMITTED,
  NOT_AT_CONSENSUS,
  NOT_PERMITTED_TO_FINALIZE,
  NOT_THE_CHAIR,
  ONLY_FINALIZING_LEAVES_CONSENSUS,
  ONLY_THE_CHAIRS_CONSENSUS,
  consensusWithheld,
  noScreenableProponentRefusal,
} from "../src/rules/consensus";

/**
 * The consensus of Sprint With Us and Team With Us questions, against the service as it is started:
 * over the schema its own migrations made with the acceptance suite's seed applied, through the
 * boundary that checks every request against the contract, with mail caught (decision record 0063).
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const sid = (n: number, k: number) => `00000000-0000-4000-a${String(n).padStart(3, "0")}-${String(k).padStart(12, "0")}`;
const ADMIN = "00000000-0000-4000-8000-000000000101";
const STAFF = "00000000-0000-4000-8000-000000000102";

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
  staffTwo: () => realm.token({ preferred_username: "gov-second", identity_provider: "idir", sid: "staff-two" }),
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

const swuConsensus = (proposal: string) => `/api/proposal/sprint-with-us/${proposal}/team-questions/consensus`;
const twuConsensus = (proposal: string) => `/api/proposal/team-with-us/${proposal}/resource-questions/consensus`;
const swuOpportunity = (n: number) => `/api/opportunities/sprint-with-us/${sid(n, 1)}`;
const twuOpportunity = (n: number) => `/api/opportunities/team-with-us/${sid(n, 1)}`;
const scores = (values: readonly (number | null)[], notes = "The panel agreed.") => values.map((score, order) => ({ order, score, notes }));
const text = (index: number) => (catcher.caught[index]?.data ?? "").replace(/=\r\n/g, "");
const mailAbout = (words: string) => catcher.caught.filter((_, index) => text(index).includes(words));

async function latestStatus(table: string, column: string, id: string) {
  const rows = await database.query<{ status: string; note: string | null; createdBy: string | null }>(
    `SELECT "status", "note", "createdBy" FROM "${table}" WHERE "${column}" = $1 AND "status" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`,
    [id],
  );
  return rows.rows[0];
}

describe("the chair recording the consensus (R-5.29, R-5.30)", () => {
  it("lets the chair change a submitted consensus, which stays submitted (R-5.30)", async () => {
    const changed = await ask("PUT", `${swuConsensus(sid(26, 101))}/${ADMIN}`, await tokens.admin(), {
      tag: "edit",
      value: { scores: scores([4, 7.5, 3.25, 3]) },
    });
    expect(changed.status).toBe(200);
    expect(changed.body.status).toBe("SUBMITTED");
    expect(changed.body.scores.map((entry: { score: number }) => entry.score)).toEqual([4, 7.5, 3.25, 3]);
    expect(changed.body.evaluationPanelMember.id).toBe(ADMIN);
  });

  it("refuses an evaluator who is not the chair, and keeps what the consensus held (R-5.29)", async () => {
    const refused = await ask("PUT", `${swuConsensus(sid(26, 102))}/${ADMIN}`, await tokens.staff(), {
      tag: "edit",
      value: { scores: scores([1, 1, 1, 1]) },
    });
    expect(refused).toEqual({ status: 401, body: { errors: [ONLY_THE_CHAIRS_CONSENSUS] } });
    const read = await ask("GET", `${swuConsensus(sid(26, 102))}/${ADMIN}`, await tokens.admin());
    expect(read.body.scores.map((entry: { score: number }) => entry.score)).toEqual([3, 3, 3, 3]);
    expect(read.body.scores[0].notes).toBe("Seeded note on question 1.");
  });

  it("refuses the chair once the opportunity has moved past consensus (R-5.29)", async () => {
    const refused = await ask("PUT", `${twuConsensus(sid(35, 101))}/${ADMIN}`, await tokens.admin(), {
      tag: "edit",
      value: { scores: scores([1, 1, 1, 1]) },
    });
    expect(refused).toEqual({ status: 401, body: { errors: [NOT_AT_CONSENSUS] } });
  });

  it("refuses a second consensus for a proponent, naming it after the program's questions (R-5.29, R-5.36)", async () => {
    const swu = await ask("POST", swuConsensus(sid(26, 101)), await tokens.admin(), { status: "DRAFT", scores: scores([1, 1, 1, 1]) });
    expect(swu).toEqual({ status: 409, body: { conflict: ["You already have a team question consensus for this proposal."] } });
    const twu = await ask("POST", twuConsensus(sid(34, 101)), await tokens.admin(), { status: "DRAFT", scores: scores([1, 1, 1, 1]) });
    expect(twu).toEqual({ status: 409, body: { conflict: ["You already have a resource question consensus for this proposal."] } });
  });

  it("refuses a consensus from anyone but the chair (R-5.29)", async () => {
    const refused = await ask("POST", swuConsensus(sid(11, 103)), await tokens.staff(), { status: "DRAFT", scores: scores([5, 5, 5, 5]) });
    expect(refused).toEqual({ status: 401, body: { errors: [NOT_THE_CHAIR] } });
  });
});

describe("who reads the consensus (R-5.12, R-5.28)", () => {
  it("shows an administrator and the panel every consensus, in anonymous order", async () => {
    const listed = await ask("GET", `/api/opportunity/sprint-with-us/${sid(11, 1)}/team-questions/consensus`, await tokens.staff());
    expect(listed.status).toBe(200);
    expect(listed.body.map((consensus: { proposal: { anonymousProponentName: string } }) => consensus.proposal.anonymousProponentName)).toEqual([
      "Proponent 1",
      "Proponent 2",
    ]);
  });

  it("tells the owner off the panel why the consensus is withheld, and nobody unconnected anything (R-5.12)", async () => {
    // users.staffOne owns 23 and is not on its panel; bring it to consensus.
    await database.query(
      `INSERT INTO "swuOpportunityStatuses" ("id", "createdAt", "createdBy", "opportunity", "status", "event", "note")
       VALUES (gen_random_uuid(), now() + interval '1 second', NULL, $1, 'EVAL_QUESTIONS_CONSENSUS', NULL, NULL)`,
      [sid(23, 1)],
    );
    const withheld = await ask("GET", `/api/opportunity/sprint-with-us/${sid(23, 1)}/team-questions/consensus`, await tokens.staff());
    expect(withheld).toEqual({ status: 401, body: { errors: [consensusWithheld("sprint-with-us")] } });
    const read = await ask("GET", `/api/opportunities/sprint-with-us/${sid(23, 1)}`, await tokens.staff());
    expect(read.body.proponents).toBeUndefined();
    const unconnected = await ask("GET", `/api/opportunity/sprint-with-us/${sid(11, 1)}/team-questions/consensus`, await tokens.staffTwo());
    expect(unconnected.status).toBe(404);
  });
});

describe("submitting the consensus (R-5.13, R-5.31)", () => {
  it("refuses a set with a proponent left without a consensus", async () => {
    const refused = await ask("PUT", swuOpportunity(11), await tokens.admin(), { tag: "submitConsensusQuestionEvaluations" });
    expect(refused).toEqual({ status: 400, body: { errors: [INCOMPLETE_CONSENSUS] } });
  });

  it("submits a complete set afresh and tells the owner and every administrator as blind copies (R-5.30, R-5.31, R-6.15)", async () => {
    const submitted = await ask("PUT", twuOpportunity(34), await tokens.admin(), { tag: "submitConsensusQuestionEvaluations" });
    expect(submitted.status).toBe(200);
    // Scoped to this opportunity: an earlier test's notices are sent asynchronously and may land after the catcher is cleared.
    const notices = () =>
      mailAbout("Consensus Has Been Submitted").filter((mail) =>
        text(catcher.caught.indexOf(mail)).includes("Seeded Team With Us opportunity at consensus with every consensus agreed"),
      );
    // The owner and both seeded administrators, as blind copies of one message visibly addressed
    // to the service alone, which names none of them.
    const readers = ["staff.one@example.test", "admin.one@example.test", "admin.two@example.test"];
    await expect.poll(() => notices().length).toBe(1);
    const notice = notices()[0]!;
    expect(notice.recipients).toEqual(["donotreply@example.test", ...readers]);
    expect(text(catcher.caught.indexOf(notice))).toMatch(/^To: .*donotreply@example\.test\s*$/im);
    for (const reader of readers) expect(notice.data).not.toContain(reader);
  });
});

describe("finalising the consensus (R-1.41, R-1.50, R-5.10, R-5.13, R-5.14, R-5.32, R-5.33, R-2.29)", () => {
  it("refuses while a consensus is outstanding, naming why (R-1.41, R-5.13)", async () => {
    const refused = await ask("PUT", swuOpportunity(11), await tokens.staff(), { tag: "finalizeQuestionConsensuses" });
    expect(refused).toEqual({ status: 400, body: { errors: [NOT_ALL_CONSENSUSES_SUBMITTED] } });
    expect((await latestStatus("swuOpportunityStatuses", "opportunity", sid(11, 1)))?.status).toBe("EVAL_QUESTIONS_CONSENSUS");
  });

  it("refuses when nobody met every minimum, naming the Code Challenge (R-1.41, R-5.10)", async () => {
    const refused = await ask("PUT", swuOpportunity(12), await tokens.admin(), { tag: "finalizeQuestionConsensuses" });
    expect(refused).toEqual({ status: 400, body: { errors: [noScreenableProponentRefusal("sprint-with-us")] } });
    expect(refused.body.errors[0]).toBe("You must have at least one proponent that can be screened into the Code Challenge.");
  });

  it("refuses anyone but the owner or an administrator (R-5.14)", async () => {
    // users.staffTwo is neither: they may read the published opportunity, and may not finalise it.
    const refused = await ask("PUT", swuOpportunity(13), await tokens.staffTwo(), { tag: "finalizeQuestionConsensuses" });
    expect(refused).toEqual({ status: 401, body: { errors: [NOT_PERMITTED_TO_FINALIZE] } });
  });

  it("has no older way out of the consensus stage (R-1.50)", async () => {
    const refused = await ask("PUT", swuOpportunity(11), await tokens.admin(), { tag: "startCodeChallenge" });
    expect(refused).toEqual({ status: 400, body: { errors: [ONLY_FINALIZING_LEAVES_CONSENSUS] } });
    const twu = await ask("PUT", twuOpportunity(31), await tokens.admin(), { tag: "startChallenge" });
    expect(twu).toEqual({ status: 400, body: { errors: [ONLY_FINALIZING_LEAVES_CONSENSUS] } });
  });

  it("screens in the four best Sprint With Us proponents that met every minimum, from the owner (R-2.29, R-5.14, R-5.32)", async () => {
    const finalized = await ask("PUT", swuOpportunity(13), await tokens.staff(), { tag: "finalizeQuestionConsensuses" });
    expect(finalized.status).toBe(200);
    expect(finalized.body.status).toBe("EVAL_CC");
    const states = await Promise.all([1, 2, 3, 4, 5, 6].map((p) => latestStatus("swuProposalStatuses", "proposal", sid(13, 100 + p))));
    expect(states.map((state) => state?.status)).toEqual([
      "UNDER_REVIEW_CODE_CHALLENGE",
      "UNDER_REVIEW_CODE_CHALLENGE",
      "UNDER_REVIEW_CODE_CHALLENGE",
      "UNDER_REVIEW_CODE_CHALLENGE",
      "UNDER_REVIEW_QUESTIONS",
      "UNDER_REVIEW_QUESTIONS",
    ]);
    expect(states[0]).toEqual({ status: "UNDER_REVIEW_CODE_CHALLENGE", note: FINALIZED_NOTE, createdBy: STAFF });
  });

  it("records every proponent's agreed scores on its history, and tells the chair and the owner (R-5.32, R-5.33)", async () => {
    const finalized = await ask("PUT", twuOpportunity(37), await tokens.admin(), { tag: "finalizeQuestionConsensuses" });
    expect(finalized.status).toBe(200);
    expect(finalized.body.status).toBe("EVAL_C");
    const events = await database.query<{ proposal: string; note: string }>(
      `SELECT "proposal"::text AS "proposal", "note" FROM "twuProposalStatuses"
        WHERE "event" = 'QUESTIONS_SCORE_ENTERED' AND "proposal" IN (SELECT "id" FROM "twuProposals" WHERE "opportunity" = $1)`,
      [sid(37, 1)],
    );
    expect(events.rows).toHaveLength(5);
    expect(events.rows.every((row) => /^Resource question scores were entered\. Q1: [\d.]+; Q2: [\d.]+; Q3: [\d.]+; Q4: [\d.]+\.$/.test(row.note))).toBe(true);
    const screened = await Promise.all([1, 2, 3, 4, 5].map((p) => latestStatus("twuProposalStatuses", "proposal", sid(37, 100 + p))));
    expect(screened.filter((state) => state?.status === "UNDER_REVIEW_CHALLENGE")).toHaveLength(3);

    // Scoped to this opportunity: the previous test's notices are sent asynchronously and may land after the catcher is cleared.
    const notices = () =>
      mailAbout("Consensus Has Been Finalized").filter((mail) =>
        text(catcher.caught.indexOf(mail)).includes("Seeded second Team With Us opportunity at consensus with five proponents"),
      );
    // The chair and the owner as blind copies of one message visibly addressed to the service alone (R-6.15).
    await expect.poll(() => notices().length).toBe(1);
    expect([...notices()[0]!.recipients].sort()).toEqual(["admin.one@example.test", "donotreply@example.test", "staff.one@example.test"].sort());
    expect(notices()[0]!.data).not.toContain("staff.one@example.test");
  });

  it("then refuses to finalise again, as the opportunity has moved on", async () => {
    const again = await ask("PUT", twuOpportunity(37), await tokens.admin(), { tag: "finalizeQuestionConsensuses" });
    expect(again.status).toBe(400);
  });

  it("names the Challenge when no Team With Us proponent can be screened in (R-5.10)", () => {
    expect(noScreenableProponentRefusal("team-with-us")).toBe("You must have at least one proponent that can be screened into the Challenge.");
  });
});

describe("the chair walking a Team With Us opportunity from individual evaluation to the challenge (R-5.36)", () => {
  const CLOSED_TWU = "00000000-0000-4000-8000-000000000801";
  const twuEvaluations = (proposal: string) => `/api/proposal/team-with-us/${proposal}/resource-questions/evaluations`;

  it("lets the chair agree, submit and the owner finalise", async () => {
    const admin = await tokens.admin();
    const staff = await tokens.staff();
    const read = await ask("GET", `/api/opportunities/team-with-us/${CLOSED_TWU}`, admin);
    expect(read.body.status).toBe("EVAL_QUESTIONS_INDIVIDUAL");
    const proponents: { id: string }[] = read.body.proponents;
    const questionCount = read.body.resourceQuestions.length;
    const top = read.body.resourceQuestions.map((question: { score: number }) => question.score);

    // Before consensus, the chair is not yet recording anything.
    expect((await ask("POST", twuConsensus(proponents[0]!.id), admin, { status: "DRAFT", scores: scores(top) })).status).toBe(401);

    for (const token of [staff, admin]) {
      for (const proponent of proponents) {
        expect((await ask("POST", twuEvaluations(proponent.id), token, { status: "DRAFT", scores: scores(top) })).status).toBe(201);
      }
      expect((await ask("PUT", `/api/opportunities/team-with-us/${CLOSED_TWU}`, token, { tag: "submitIndividualQuestionEvaluations" })).status).toBe(200);
    }
    expect((await ask("GET", `/api/opportunities/team-with-us/${CLOSED_TWU}`, admin)).body.status).toBe("EVAL_QUESTIONS_CONSENSUS");

    // The evaluator who is not the chair now reads the chair's scores beside the chair's name (R-5.28).
    const others = await ask("GET", `${twuEvaluations(proponents[0]!.id)}/${ADMIN}`, staff);
    expect(others.status).toBe(200);

    for (const proponent of proponents) {
      const created = await ask("POST", twuConsensus(proponent.id), admin, { proposal: proponent.id, status: "DRAFT", scores: scores(top) });
      expect(created.status).toBe(201);
      expect(created.body.scores).toHaveLength(questionCount);
    }
    expect((await ask("PUT", `/api/opportunities/team-with-us/${CLOSED_TWU}`, admin, { tag: "submitConsensusQuestionEvaluations" })).status).toBe(200);
    const finalized = await ask("PUT", `/api/opportunities/team-with-us/${CLOSED_TWU}`, staff, { tag: "finalizeQuestionConsensuses" });
    expect(finalized.status).toBe(200);
    expect(finalized.body.status).toBe("EVAL_C");
  });
});

