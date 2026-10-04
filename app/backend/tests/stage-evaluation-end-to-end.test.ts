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
import { SmtpCatcher } from "./smtp-catcher";
import { MOVED_TO_PROCESSING_NOTE, SCORE_MESSAGE } from "../src/rules/proposal-evaluation";
import { ALL_MUST_BE_SCORED, NONE_SCREENED_IN, NOT_PERMITTED, SCREENED_BY_FINALIZING, WRONG_STAGE } from "../src/rules/team-evaluation";

/**
 * The stages after the questions — the code challenge and team scenario of Sprint With Us, the
 * challenge of Team With Us — against the service as it is started, over the schema its own
 * migrations made with the acceptance suite's seed applied (decision record 0065).
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const sid = (n: number, k: number) => `00000000-0000-4000-a${String(n).padStart(3, "0")}-${String(k).padStart(12, "0")}`;
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

const swuProposal = (id: string) => `/api/proposals/sprint-with-us/${id}`;
const twuProposal = (id: string) => `/api/proposals/team-with-us/${id}`;
const swuOpportunity = (n: number) => `/api/opportunities/sprint-with-us/${sid(n, 1)}`;
const twuOpportunity = (n: number) => `/api/opportunities/team-with-us/${sid(n, 1)}`;

async function latestStatus(table: string, column: string, id: string) {
  const rows = await database.query<{ status: string; note: string | null; createdBy: string | null }>(
    `SELECT "status", "note", "createdBy" FROM "${table}" WHERE "${column}" = $1 AND "status" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`,
    [id],
  );
  return rows.rows[0];
}

describe("a stage score at the wrong stage (R-2.28)", () => {
  it("refuses a team scenario score while the opportunity is still at the code challenge", async () => {
    const refused = await ask("PUT", swuProposal(sid(30, 101)), await tokens.admin(), { tag: "scoreTeamScenario", value: 80 });
    expect(refused).toEqual({ status: 400, body: { errors: [WRONG_STAGE] } });
    expect(WRONG_STAGE).toBe("The opportunity is not in the correct stage of evaluation to perform that action.");
  });

  it("refuses with the general message a proposal not carried into the stage", async () => {
    const refused = await ask("PUT", swuProposal(sid(30, 102)), await tokens.admin(), { tag: "scoreTeamScenario", value: 80 });
    expect(refused).toEqual({ status: 401, body: { errors: [NOT_PERMITTED] } });
  });

  it("refuses a Team With Us challenge score while the opportunity is still at the consensus", async () => {
    expect(await ask("PUT", twuProposal(sid(38, 101)), await tokens.admin(), { tag: "scoreChallenge", value: 80 })).toEqual({
      status: 400,
      body: { errors: [WRONG_STAGE] },
    });
    expect(await ask("PUT", twuProposal(sid(38, 102)), await tokens.admin(), { tag: "scoreChallenge", value: 80 })).toEqual({
      status: 401,
      body: { errors: [NOT_PERMITTED] },
    });
  });

  it("keeps Team With Us proponents to be screened by finalising the consensus", async () => {
    const refused = await ask("PUT", twuProposal(sid(38, 102)), await tokens.admin(), { tag: "screenInToChallenge" });
    expect(refused).toEqual({ status: 400, body: { errors: [SCREENED_BY_FINALIZING] } });
  });

  it("takes a code challenge score from the owner, recording it in the history (R-2.35)", async () => {
    const invalid = await ask("PUT", swuProposal(sid(30, 102)), await tokens.staff(), { tag: "scoreCodeChallenge", value: 100.5 });
    expect(invalid).toEqual({ status: 400, body: { errors: [`score: ${SCORE_MESSAGE}`] } });

    const scored = await ask("PUT", swuProposal(sid(30, 102)), await tokens.staff(), { tag: "scoreCodeChallenge", value: 72.5 });
    expect(scored.status).toBe(200);
    expect(scored.body.status).toBe("EVALUATED_CODE_CHALLENGE");
    expect(scored.body.scoresheet.challenge).toBe(72.5);
    expect(scored.body.history[0]).toMatchObject({
      event: "CHALLENGE_SCORE_ENTERED",
      note: 'A code challenge score of "72.5%" was entered.',
      createdBy: { id: STAFF },
    });
    expect(scored.body.history[1]).toMatchObject({ status: "EVALUATED_CODE_CHALLENGE", createdBy: { id: STAFF } });
  });
});

describe("starting the team scenario (R-1.42)", () => {
  it("is refused while a proponent in the code challenge is unscored", async () => {
    const refused = await ask("PUT", swuOpportunity(14), await tokens.staff(), { tag: "startTeamScenario" });
    expect(refused).toEqual({ status: 400, body: { errors: [ALL_MUST_BE_SCORED] } });
    expect((await latestStatus("swuOpportunityStatuses", "opportunity", sid(14, 1)))?.status).toBe("EVAL_CC");
  });

  it("is refused with nobody screened in, and starts once one is", async () => {
    expect((await ask("PUT", swuProposal(sid(14, 102)), await tokens.admin(), { tag: "scoreCodeChallenge", value: 65 })).status).toBe(200);
    expect(await ask("PUT", swuOpportunity(14), await tokens.admin(), { tag: "startTeamScenario" })).toEqual({
      status: 400,
      body: { errors: [NONE_SCREENED_IN] },
    });

    const screenedIn = await ask("PUT", swuProposal(sid(14, 101)), await tokens.admin(), { tag: "screenInToTeamScenario" });
    expect(screenedIn.body.status).toBe("UNDER_REVIEW_TEAM_SCENARIO");
    const screenedOut = await ask("PUT", swuProposal(sid(14, 101)), await tokens.admin(), { tag: "screenOutFromTeamScenario" });
    expect(screenedOut.body.status).toBe("EVALUATED_CODE_CHALLENGE");
    expect((await ask("PUT", swuProposal(sid(14, 101)), await tokens.admin(), { tag: "screenInToTeamScenario" })).status).toBe(200);

    const started = await ask("PUT", swuOpportunity(14), await tokens.staff(), { tag: "startTeamScenario" });
    expect(started.status).toBe(200);
    expect(started.body.status).toBe("EVAL_SCENARIO");

    // Screening belongs to the code challenge, which is over.
    expect(await ask("PUT", swuProposal(sid(14, 102)), await tokens.admin(), { tag: "screenInToTeamScenario" })).toEqual({
      status: 400,
      body: { errors: [WRONG_STAGE] },
    });
  });
});

describe("the last score at the final stage (R-2.30, R-2.31, R-1.25)", () => {
  it("ranks only the fully evaluated before it is entered (R-2.31)", async () => {
    const lower = await ask("GET", swuProposal(sid(16, 101)), await tokens.admin());
    expect(lower.body.scoresheet).toMatchObject({ total: 87.5, rank: { rank: 1, of: 1 } });
    const higher = await ask("GET", swuProposal(sid(16, 102)), await tokens.admin());
    expect(higher.body.scoresheet).toMatchObject({ total: null, rank: null });
  });

  it("works out the price score, ranks every proposal and moves the opportunity to processing", async () => {
    const scored = await ask("PUT", swuProposal(sid(15, 102)), await tokens.staff(), { tag: "scoreTeamScenario", value: 60 });
    expect(scored.status).toBe(200);
    expect(scored.body.status).toBe("EVALUATED_TEAM_SCENARIO");
    expect(scored.body.scoresheet).toMatchObject({ challenge: 75, scenario: 60, price: 50, total: 69, rank: { rank: 2, of: 2 } });
    expect(scored.body.history[0]).toMatchObject({ event: "PRICE_SCORE_ENTERED", note: 'A price score of "50%" was calculated.', createdBy: null });
    expect(scored.body.history[1]).toMatchObject({ event: "SCENARIO_SCORE_ENTERED", note: 'A team scenario score of "60%" was entered.' });

    expect(await latestStatus("swuOpportunityStatuses", "opportunity", sid(15, 1))).toEqual({
      status: "PROCESSING",
      note: MOVED_TO_PROCESSING_NOTE,
      createdBy: null,
    });
    const lower = await ask("GET", swuProposal(sid(15, 101)), await tokens.admin());
    expect(lower.body.scoresheet).toMatchObject({ price: 100, rank: { rank: 1, of: 2 } });
  });

  it("moves a Team With Us opportunity to processing, from where it is awarded (R-1.25, R-1.49)", async () => {
    const scored = await ask("PUT", twuProposal(sid(33, 102)), await tokens.admin(), { tag: "scoreChallenge", value: 70 });
    expect(scored.status).toBe(200);
    expect(scored.body.status).toBe("EVALUATED_CHALLENGE");
    expect(scored.body.scoresheet.price).toBe(81.48);
    expect((await ask("GET", twuOpportunity(33), await tokens.admin())).body.status).toBe("PROCESSING");

    const awarded = await ask("PUT", twuProposal(sid(33, 102)), await tokens.admin(), { tag: "award" });
    expect(awarded.status).toBe(200);
    expect(awarded.body.status).toBe("AWARDED");
    expect((await ask("GET", twuOpportunity(33), await tokens.admin())).body.status).toBe("AWARDED");
    expect((await latestStatus("twuProposalStatuses", "proposal", sid(33, 101)))?.status).toBe("NOT_AWARDED");
  });

  it("moves on when the last proponent waited for is disqualified instead (R-2.34)", async () => {
    const disqualified = await ask("PUT", swuProposal(sid(17, 102)), await tokens.admin(), { tag: "disqualify", value: "Missed the scenario." });
    expect(disqualified.status).toBe(200);
    expect((await latestStatus("swuOpportunityStatuses", "opportunity", sid(17, 1)))?.status).toBe("PROCESSING");
  });
});
