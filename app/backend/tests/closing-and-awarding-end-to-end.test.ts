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
  DISQUALIFY_REASON_MESSAGE,
  MOVED_TO_PROCESSING_NOTE,
  NOT_PERMITTED_TO_EVALUATE,
  OPPORTUNITY_CLOSED_NOTE,
  SCORE_MESSAGE,
} from "../src/rules/proposal-evaluation";

/**
 * Closing at the deadline, and scoring, disqualifying and awarding a Code With Us proposal, against
 * the service as it is started: over the schema its own migrations made with the acceptance suite's
 * seed applied, with the deadline hook in front of /api and /status, and with mail caught.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const sid = (n: number, k: number) => `00000000-0000-4000-a${String(n).padStart(3, "0")}-${String(k).padStart(12, "0")}`;
const PUBLISHED = "00000000-0000-4000-8000-000000000601";
const CLOSED_SWU = "00000000-0000-4000-8000-000000000701";
const CLOSED_TWU = "00000000-0000-4000-8000-000000000801";
const SWU_CHAIR_NOT_EVALUATOR = sid(22, 1);

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

const vendorToken = (username: string) => () =>
  realm.token({ preferred_username: username, identity_provider: "bceid", sid: username });
const tokens = {
  admin: () => realm.token({ preferred_username: "test-admin", identity_provider: "idir", sid: "admin" }),
  staff: () => realm.token({ preferred_username: "test-gov", identity_provider: "idir", sid: "staff" }),
  owner: vendorToken("test-vendor-2"),
  proponentTwo: vendorToken("test-vendor-11"),
  proponentThree: vendorToken("test-vendor-12"),
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

const PROPOSALS = "/api/proposals/code-with-us";
const change = async (id: string, token: string, tag: string, value?: unknown) =>
  ask("PUT", `${PROPOSALS}/${id}`, token, value === undefined ? { tag } : { tag, value });

/** The newest history row naming a state, for an opportunity or a proposal of a program. */
async function latest(table: string, parent: "opportunity" | "proposal", id: string) {
  const rows = await database.query<{ status: string; note: string | null; createdBy: string | null }>(
    `SELECT "status", "note", "createdBy" FROM "${table}" WHERE "${parent}" = $1 AND "status" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`,
    [id],
  );
  return rows.rows[0];
}

const text = (index: number) => (catcher.caught[index]?.data ?? "").replace(/=\r\n/g, "");
const mailAbout = (words: string) => catcher.caught.findIndex((_, index) => text(index).includes(words));

describe("closing at the proposal deadline (R-1.1, R-1.19, R-1.24, R-2.5, R-5.20)", () => {
  it("closes every lapsed opportunity of all three programs at a request to /status, and nothing else", async () => {
    const status = await ask("GET", "/status");
    expect(status.status).toBe(200);

    // Code With Us: to its single evaluation stage, by nobody, with the note (R-1.1).
    const cwu = await latest("cwuOpportunityStatuses", "opportunity", sid(2, 1));
    expect(cwu).toEqual({ status: "EVALUATION", note: OPPORTUNITY_CLOSED_NOTE, createdBy: null });
    expect((await latest("cwuProposalStatuses", "proposal", sid(2, 101)))?.status).toBe("UNDER_REVIEW");
    // A draft and a withdrawn proposal are left as they are; an open opportunity stays open.
    expect((await latest("cwuProposalStatuses", "proposal", sid(1, 101)))?.status).toBe("DRAFT");
    expect((await latest("cwuProposalStatuses", "proposal", sid(5, 103)))?.status).toBe("WITHDRAWN");
    expect((await latest("cwuOpportunityStatuses", "opportunity", PUBLISHED))?.status).toBe("PUBLISHED");
    // Code With Us proponents are not anonymised (R-1.24 note).
    const cwuNames = await database.query<{ anonymousProponentName: string }>(
      `SELECT "anonymousProponentName" FROM "cwuProposals" WHERE "opportunity" = $1`,
      [sid(2, 1)],
    );
    expect(cwuNames.rows.map((row) => row.anonymousProponentName)).toEqual([""]);

    // Sprint With Us and Team With Us: to individual question evaluation, each submitted proposal
    // to review of the questions and named "Proponent 1" to "Proponent 3" (R-1.24, R-2.5).
    for (const [prefix, id] of [
      ["swu", CLOSED_SWU],
      ["twu", CLOSED_TWU],
    ] as const) {
      expect((await latest(`${prefix}OpportunityStatuses`, "opportunity", id))?.status).toBe("EVAL_QUESTIONS_INDIVIDUAL");
      const proposals = await database.query<{ id: string; anonymousProponentName: string }>(
        `SELECT "id", "anonymousProponentName" FROM "${prefix}Proposals" WHERE "opportunity" = $1`,
        [id],
      );
      expect(proposals.rows.map((row) => row.anonymousProponentName).sort()).toEqual(["Proponent 1", "Proponent 2", "Proponent 3"]);
      for (const proposal of proposals.rows) {
        expect((await latest(`${prefix}ProposalStatuses`, "proposal", proposal.id))?.status).toBe("UNDER_REVIEW_QUESTIONS");
      }
    }

    // A second request closes nothing twice.
    await ask("GET", "/status");
    const closings = await database.query<{ count: number }>(
      `SELECT count(*)::int AS "count" FROM "cwuOpportunityStatuses" WHERE "opportunity" = $1 AND "status" = 'EVALUATION'`,
      [sid(2, 1)],
    );
    expect(closings.rows[0]?.count).toBe(1);
  });

  it("tells a Code With Us opportunity's author, and the evaluators on a panel but not a chair who does not evaluate", async () => {
    // Reopen one of each, so this test sees its own closure's notices.
    await database.query(
      `DELETE FROM "swuOpportunityStatuses" WHERE "opportunity" = $1 AND "status" = 'EVAL_QUESTIONS_INDIVIDUAL'`,
      [SWU_CHAIR_NOT_EVALUATOR],
    );
    await database.query(`DELETE FROM "cwuOpportunityStatuses" WHERE "opportunity" = $1 AND "status" = 'EVALUATION'`, [sid(4, 1)]);
    await ask("GET", "/status");

    await expect.poll(() => mailAbout("Seeded lapsed Sprint With Us opportunity with a chair who does not evaluate")).toBeGreaterThan(-1);
    const panel = catcher.caught[mailAbout("Seeded lapsed Sprint With Us opportunity with a chair who does not evaluate")]!;
    // The evaluators are blind copies of a message visibly addressed to the service alone; the chair is told nothing.
    const about = "Seeded lapsed Sprint With Us opportunity with a chair who does not evaluate";
    const panelMailNow = () => catcher.caught.filter((_, index) => text(index).includes(about));
    await expect.poll(() => panelMailNow().flatMap((mail) => mail.recipients)).toContain("admin.one@example.test");
    const panelMail = panelMailNow();
    expect(panelMail.flatMap((mail) => mail.recipients)).toContain("admin.one@example.test");
    expect(panelMail.flatMap((mail) => mail.recipients)).not.toContain("staff.one@example.test");
    // Visibly addressed to the service alone (R-6.15).
    expect(panel.data.replace(/=\r\n/g, "")).toMatch(/^To: .*donotreply@example\.test\s*$/im);
    expect(panel.data).not.toMatch(/^To: .*admin\.one@example\.test/im);

    await expect.poll(() => mailAbout("Seeded lapsed Code With Us opportunity at its final stage")).toBeGreaterThan(-1);
    const author = catcher.caught[mailAbout("Seeded lapsed Code With Us opportunity at its final stage")]!;
    expect(author.recipients).toEqual(["staff.one@example.test"]);
    expect(author.data).toContain("Your Code With Us Opportunity is Ready to Be Evaluated");
  });
});

describe("scoring and disqualifying a Code With Us proposal (R-1.25, R-2.26, R-2.27, R-2.34, R-2.35)", () => {
  it("refuses a score out of range or past two decimals, and records 87 in the history", async () => {
    const proposal = sid(2, 101);
    const staff = await tokens.staff();
    for (const value of [104, -1, 87.123, "eighty"]) {
      const refused = await change(proposal, staff, "score", value);
      expect(refused.status).toBe(400);
      expect(refused.body.errors).toEqual([`score: ${SCORE_MESSAGE}`]);
    }
    // The vendor who wrote it may read it but not score it.
    const vendor = await change(proposal, await tokens.owner(), "score", 87);
    expect(vendor.status).toBe(401);
    expect(vendor.body.errors ?? vendor.body.permissions).toBeDefined();
    expect(JSON.stringify(vendor.body)).toContain(NOT_PERMITTED_TO_EVALUATE);

    const scored = await change(proposal, staff, "score", 87);
    expect(scored.status).toBe(200);
    expect(scored.body.status).toBe("EVALUATED");
    expect(scored.body.score).toBe(87);
    expect(scored.body.rank).toEqual({ rank: 1, of: 1 });
    expect(scored.body.history[0]).toMatchObject({ event: "SCORE_ENTERED", note: 'A score of "87%" was entered.' });
    expect(scored.body.history[0].createdBy.name).toBeTruthy();
    expect(scored.body.history[1]).toMatchObject({ status: "EVALUATED" });
    // It was the only one in contention, so the opportunity moved on by itself (R-1.25).
    expect(await latest("cwuOpportunityStatuses", "opportunity", sid(2, 1))).toEqual({
      status: "PROCESSING",
      note: MOVED_TO_PROCESSING_NOTE,
      createdBy: null,
    });
  });

  it("needs a reason to disqualify, and does not count a disqualified proposal", async () => {
    const staff = await tokens.staff();
    const unexplained = await change(sid(3, 101), staff, "disqualify");
    expect(unexplained.status).toBe(400);
    expect(unexplained.body.errors).toEqual([`disqualificationReason: ${DISQUALIFY_REASON_MESSAGE}`]);
    expect((await change(sid(3, 101), staff, "disqualify", "x".repeat(5001))).status).toBe(400);

    const disqualified = await change(sid(3, 101), staff, "disqualify", "It did not meet the criteria.");
    expect(disqualified.body.status).toBe("DISQUALIFIED");
    expect(disqualified.body.history[0]).toMatchObject({ status: "DISQUALIFIED", note: "It did not meet the criteria." });

    await change(sid(3, 102), staff, "score", 80);
    expect((await latest("cwuOpportunityStatuses", "opportunity", sid(3, 1)))?.status).toBe("EVALUATION");
    await change(sid(3, 103), staff, "score", 70.5);
    expect((await latest("cwuOpportunityStatuses", "opportunity", sid(3, 1)))?.status).toBe("PROCESSING");
  });
});

describe("awarding a Code With Us proposal (R-1.26, R-1.27, R-2.32, R-2.33, R-2.36, R-6.25)", () => {
  it("awards one, marks the rest in contention not awarded, and leaves disqualified and withdrawn ones be", async () => {
    const staff = await tokens.staff();
    await change(sid(5, 101), staff, "score", 90);
    await change(sid(5, 102), staff, "disqualify", "Late references.");
    expect((await latest("cwuOpportunityStatuses", "opportunity", sid(5, 1)))?.status).toBe("PROCESSING");

    const awarded = await change(sid(5, 101), await tokens.admin(), "award");
    expect(awarded.status).toBe(200);
    expect(awarded.body.status).toBe("AWARDED");
    expect((await latest("cwuOpportunityStatuses", "opportunity", sid(5, 1)))?.status).toBe("AWARDED");
    expect((await latest("cwuProposalStatuses", "proposal", sid(5, 102)))?.status).toBe("DISQUALIFIED");
    expect((await latest("cwuProposalStatuses", "proposal", sid(5, 103)))?.status).toBe("WITHDRAWN");
    // Once awarded there is nothing left to award.
    expect((await change(sid(5, 101), await tokens.admin(), "award")).status).toBe(400);
  });

  it("tells the winner and each proponent passed over, who then sees their own score and rank", async () => {
    const staff = await tokens.staff();
    await change(sid(6, 101), staff, "score", 91);
    await change(sid(6, 102), staff, "score", 80);
    await change(sid(6, 103), staff, "score", 70);

    // Scored but not decided: the vendor sees neither score nor rank (R-2.32).
    const before = await ask("GET", `${PROPOSALS}/${sid(6, 102)}`, await tokens.proponentTwo());
    expect(before.body.status).toBe("EVALUATED");
    expect(before.body).not.toHaveProperty("score");
    expect(before.body).not.toHaveProperty("rank");
    expect(before.body.proponent.value).not.toHaveProperty("contact");

    catcher.caught.length = 0;
    const awarded = await change(sid(6, 101), staff, "award");
    expect(awarded.status).toBe(200);
    const winnerName = awarded.body.proponent.value.legalName as string;

    await expect.poll(() => catcher.caught.length).toBe(3);
    const toWinner = catcher.caught.findIndex((mail) => mail.recipients.includes("org.owner@example.test"));
    expect(text(toWinner)).toContain("You Have Been Awarded a Code With Us Opportunity");
    for (const address of ["proponent.two@example.test", "proponent.three@example.test"]) {
      const index = catcher.caught.findIndex((mail) => mail.recipients.includes(address));
      expect(index).toBeGreaterThan(-1);
      expect(text(index)).toContain("Seeded lapsed Code With Us opportunity for award notices");
      expect(text(index)).toContain(`Awarded to: ${winnerName}`);
      expect(text(index)).toContain("sign-in?redirectOnSuccess=");
    }

    const after = await ask("GET", `${PROPOSALS}/${sid(6, 102)}`, await tokens.proponentTwo());
    expect(after.body.status).toBe("NOT_AWARDED");
    expect(after.body.score).toBe(80);
    expect(after.body.rank).toEqual({ rank: 2, of: 3 });

    // The opportunity names its winner to everyone, and the score only to who may see scores (R-1.27).
    const anybody = await ask("GET", `/api/opportunities/code-with-us/${sid(6, 1)}`);
    expect(anybody.body.status).toBe("AWARDED");
    expect(anybody.body.successfulProponent).toEqual({ name: winnerName });
    const author = await ask("GET", `/api/opportunities/code-with-us/${sid(6, 1)}`, staff);
    expect(author.body.successfulProponent).toMatchObject({ name: winnerName, score: 91 });
    expect(author.body.successfulProponent.email).toBeTruthy();
  });

  it("names the seeded winner of an awarded opportunity, withholding contact details and score from a vendor", async () => {
    const vendor = await ask("GET", `/api/opportunities/code-with-us/${sid(8, 1)}`, await tokens.proponentTwo());
    expect(Object.keys(vendor.body.successfulProponent)).toEqual(["name"]);
    expect(vendor.body.successfulProponent.name).toBeTruthy();
    const admin = await ask("GET", `/api/opportunities/code-with-us/${sid(8, 1)}`, await tokens.admin());
    expect(admin.body.successfulProponent.score).toBe(91);
  });

  it("gives the winning organization's contact person on its proposal to whoever may see the score (R-1.27)", async () => {
    const admin = await ask("GET", `${PROPOSALS}/${sid(8, 101)}`, await tokens.admin());
    expect(admin.status).toBe(200);
    expect(admin.body.proponent.value.contact).toEqual({
      name: "Blake Placeholder",
      email: "org.owner@example.test",
      phone: "250-555-0101",
    });
  });
});

describe("awarding a Sprint With Us proposal, and the vendor's scoresheet (R-1.26, R-1.27, R-2.32, R-2.33)", () => {
  const SWU = "/api/proposals/sprint-with-us";

  it("withholds the scoresheet from the vendor until the award, then shows each its total and rank", async () => {
    const before = await ask("GET", `${SWU}/${sid(18, 101)}`, await tokens.owner());
    expect(before.body.status).toBe("EVALUATED_TEAM_SCENARIO");
    expect(before.body).not.toHaveProperty("scoresheet");
    expect(before.body.organization).not.toHaveProperty("contact");
    // The author sees it as it stands, with whom to reach at the organization (R-1.27).
    const staffView = await ask("GET", `${SWU}/${sid(18, 101)}`, await tokens.staff());
    expect(staffView.body.scoresheet).toMatchObject({ questions: 100, challenge: 80, scenario: 70, price: 100, total: 87.5 });
    expect(staffView.body.organization.contact).toMatchObject({ email: "org.owner@example.test" });

    // A vendor may not award, and a proposal left behind at the questions cannot be awarded.
    expect((await ask("PUT", `${SWU}/${sid(18, 101)}`, await tokens.owner(), { tag: "award" })).status).toBe(401);
    expect((await ask("PUT", `${SWU}/${sid(18, 103)}`, await tokens.admin(), { tag: "award" })).status).toBe(400);

    catcher.caught.length = 0;
    const awarded = await ask("PUT", `${SWU}/${sid(18, 101)}`, await tokens.admin(), { tag: "award" });
    expect(awarded.status).toBe(200);
    expect(awarded.body.status).toBe("AWARDED");
    expect((await latest("swuOpportunityStatuses", "opportunity", sid(18, 1)))?.status).toBe("AWARDED");
    expect((await latest("swuProposalStatuses", "proposal", sid(18, 102)))?.status).toBe("NOT_AWARDED");
    // Left behind at the questions, it was still in contention.
    expect((await latest("swuProposalStatuses", "proposal", sid(18, 103)))?.status).toBe("NOT_AWARDED");

    const winner = await ask("GET", `${SWU}/${sid(18, 101)}`, await tokens.owner());
    expect(winner.body.scoresheet).toMatchObject({ total: 87.5, rank: { rank: 1, of: 2 } });
    const runnerUp = await ask("GET", `${SWU}/${sid(18, 102)}`, await tokens.proponentTwo());
    expect(runnerUp.body.scoresheet).toMatchObject({ questions: 80, total: 72.75, rank: { rank: 2, of: 2 } });

    await expect.poll(() => catcher.caught.length).toBe(3);
    const toRunnerUp = catcher.caught.findIndex((mail) => mail.recipients.includes("proponent.two@example.test"));
    expect(text(toRunnerUp)).toContain("A Sprint With Us Opportunity You Proposed On Has Been Awarded");
    expect(text(toRunnerUp)).toContain(`Awarded to: ${awarded.body.organization.legalName}`);

    const shown = await ask("GET", `/api/opportunities/sprint-with-us/${sid(18, 1)}`);
    expect(shown.body.successfulProponent).toEqual({ name: awarded.body.organization.legalName });
  });

  it("disqualifies at any stage with a reason, and not without one (R-2.34)", async () => {
    const staff = await tokens.staff();
    const unexplained = await ask("PUT", `${SWU}/${sid(14, 102)}`, staff, { tag: "disqualify" });
    expect(unexplained.status).toBe(400);
    expect(unexplained.body.errors).toEqual([`disqualificationReason: ${DISQUALIFY_REASON_MESSAGE}`]);
    const disqualified = await ask("PUT", `${SWU}/${sid(14, 102)}`, staff, { tag: "disqualify", value: "No code was submitted." });
    expect(disqualified.status).toBe(200);
    expect(disqualified.body.status).toBe("DISQUALIFIED");
    expect(disqualified.body.history[0]).toMatchObject({ status: "DISQUALIFIED", note: "No code was submitted." });
  });
});

describe("withdrawing (R-2.36)", () => {
  it("tells the withdrawing vendor and every administrator", async () => {
    const withdrawn = await change(sid(4, 102), await tokens.proponentTwo(), "withdraw");
    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.status).toBe("WITHDRAWN");
    await expect.poll(() => catcher.caught.findIndex((mail) => mail.recipients.includes("admin.one@example.test"))).toBeGreaterThan(-1);
    await expect.poll(() => catcher.caught.findIndex((mail) => mail.recipients.includes("proponent.two@example.test"))).toBeGreaterThan(-1);
    const toVendor = catcher.caught.findIndex((mail) => mail.recipients.includes("proponent.two@example.test"));
    expect(text(toVendor)).toContain("Your Code With Us Proposal Has Been Withdrawn");
    // The administrators are blind copies of one message visibly addressed to the service alone (R-6.15).
    const toAdministrator = catcher.caught.findIndex((mail) => mail.recipients.includes("admin.one@example.test"));
    expect(text(toAdministrator)).toContain("A Code With Us Proposal Has Been Withdrawn");
    expect(catcher.caught[toAdministrator]!.recipients).toEqual(["donotreply@example.test", "admin.one@example.test", "admin.two@example.test"]);
    expect(text(toAdministrator)).toMatch(/^To: .*donotreply@example\.test\s*$/im);
    expect(text(toAdministrator)).not.toContain("admin.two@example.test");
  });
});
