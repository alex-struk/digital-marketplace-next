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
import { FILE_STORE, FileStore } from "../src/files/file";
import { addDays, pacificDayOf } from "../src/rules/opportunities";
import { ALREADY_HAVE_PROPOSAL, NOT_PERMITTED_TO_START, PROPOSALS_NOT_YET_VISIBLE } from "../src/rules/proposals";
import {
  NOT_ACTIVE_MEMBER,
  ORGANIZATION_LOCKED,
  ORGANIZATION_REQUIRED,
  OVER_TOTAL_BUDGET,
  PHASE_NOT_REQUIRED,
  PHASE_REQUIRED,
  SERVICE_AREAS_NOT_SATISFIED,
  SINGLE_SCRUM_MASTER,
  UNIQUE_MEMBERS,
  notQualified,
  phaseCostTooHigh,
  responseLengthMessage,
} from "../src/rules/team-proposals";

/**
 * Proposing on Sprint With Us and Team With Us opportunities, and attaching files to those
 * opportunities, against the service as it is started: over the schema its own migrations made
 * with the acceptance suite's seed applied, through the boundary that checks every request against
 * the contract.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const QUALIFIED = "00000000-0000-4000-8000-000000000301"; // organizationOwner's; organizationAdmin administers it
const UNQUALIFIED = "00000000-0000-4000-8000-000000000302"; // vendorOne's
const OWNER = "00000000-0000-4000-8000-000000000202"; // Agile Coaching, Backend Development, Delivery Management
const ORG_ADMIN = "00000000-0000-4000-8000-000000000203"; // DevOps, Frontend, Security
const MEMBER = "00000000-0000-4000-8000-000000000204"; // Architecture, UX Design, User Research
const PENDING = "00000000-0000-4000-8000-000000000217";
const FORMER = "00000000-0000-4000-8000-000000000218";
const STAFF_ONE = "00000000-0000-4000-8000-000000000102";
const ADMIN_ONE = "00000000-0000-4000-8000-000000000101";
const CLOSED_SPRINT = "00000000-0000-4000-8000-000000000701"; // staffOne's, lapsed, three submitted proposals

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

const vendorToken = (username: string) => () => realm.token({ preferred_username: username, identity_provider: "bceid", sid: username });
const tokens = {
  admin: () => realm.token({ preferred_username: "test-admin", identity_provider: "idir", sid: "admin" }),
  staff: () => realm.token({ preferred_username: "test-gov", identity_provider: "idir", sid: "staff" }),
  vendor: vendorToken("test-vendor-1"),
  owner: vendorToken("test-vendor-2"),
  orgAdmin: vendorToken("test-vendor-3"),
  member: vendorToken("test-vendor-4"),
  proponentTwo: vendorToken("test-vendor-11"),
  neverAgreed: vendorToken("test-vendor-17"),
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
  form.append("file", new Blob([`the content of ${name}`]), name);
  const answer = await fetch(`${origin}/api/files`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
  return (await answer.json()) as { id: string };
}

const today = pacificDayOf(new Date());
const SPRINT = "/api/opportunities/sprint-with-us";
const TEAM = "/api/opportunities/team-with-us";
const SWU = "/api/proposals/sprint-with-us";
const TWU = "/api/proposals/team-with-us";
const panel = [
  { user: STAFF_ONE, evaluator: true, chair: false },
  { user: ADMIN_ONE, evaluator: true, chair: true },
];

/** A published Sprint With Us opportunity with prototype and implementation phases, made by staffOne and published. */
async function publishedSprint(extra: Record<string, unknown> = {}): Promise<string> {
  const made = await ask("POST", SPRINT, await tokens.staff(), {
    title: "A sprint to bid on",
    location: "Victoria",
    description: "What the work is.",
    remoteOk: false,
    totalMaxBudget: 900_000,
    mandatorySkills: ["React"],
    proposalDeadline: addDays(today, 30),
    assignmentDate: addDays(today, 40),
    prototypePhase: { startDate: addDays(today, 45), completionDate: addDays(today, 60), maxBudget: 200_000, requiredCapabilities: ["User Research"] },
    implementationPhase: { startDate: addDays(today, 61), completionDate: addDays(today, 200), maxBudget: 700_000, requiredCapabilities: ["Backend Development"] },
    teamQuestions: [{ question: "Why you?", guideline: "Fit.", score: 5, wordLimit: 5 }],
    questionsWeight: 25,
    codeChallengeWeight: 25,
    scenarioWeight: 25,
    priceWeight: 25,
    evaluationPanel: panel,
    status: "UNDER_REVIEW",
    ...extra,
  });
  expect(made.status).toBe(201);
  const published = await ask("PUT", `${SPRINT}/${made.body.id}`, await tokens.admin(), { tag: "publish" });
  expect(published.body.status).toBe("PUBLISHED");
  return made.body.id as string;
}

async function publishedTeam(resources: { serviceArea: string; targetAllocation: number }[], maxBudget = 900_000): Promise<{ id: string; resources: string[] }> {
  const made = await ask("POST", TEAM, await tokens.admin(), {
    title: "A team to join",
    location: "Victoria",
    description: "Join the team.",
    remoteOk: true,
    remoteDesc: "Mostly at home.",
    maxBudget,
    proposalDeadline: addDays(today, 30),
    assignmentDate: addDays(today, 35),
    startDate: addDays(today, 40),
    completionDate: addDays(today, 40 + 27),
    resources,
    resourceQuestions: [{ question: "How?", guideline: "Detail.", score: 10, wordLimit: 5 }],
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    evaluationPanel: panel,
    status: "PUBLISHED",
  });
  expect(made.status).toBe(201);
  return { id: made.body.id, resources: (made.body.resources as { id: string }[]).map((resource) => resource.id) };
}

const goodSprintTeam = {
  organization: QUALIFIED,
  prototypePhase: { members: [{ member: MEMBER, scrumMaster: true }], proposedCost: 150_000 },
  implementationPhase: { members: [{ member: OWNER, scrumMaster: true }, { member: ORG_ADMIN, scrumMaster: false }], proposedCost: 600_000 },
  teamQuestionResponses: [{ order: 0, response: "We fit well." }],
  references: [],
};

describe("starting a proposal (R-2.1, R-2.7)", () => {
  it("refuses staff and a vendor who never accepted the terms, and any state but draft or submitted", async () => {
    const opportunity = await publishedSprint();
    expect((await ask("POST", SWU, await tokens.staff(), { opportunity })).status).toBe(401);
    expect(await ask("POST", SWU, await tokens.neverAgreed(), { opportunity })).toMatchObject({ status: 401, body: { errors: [NOT_PERMITTED_TO_START] } });
    const published = await ask("POST", SWU, await tokens.owner(), { opportunity, status: "PUBLISHED" });
    expect(published.status).toBe(400);
    expect(published.body.errors[0]).toMatch(/^status: /);
    const team = await publishedTeam([{ serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 }]);
    expect((await ask("POST", TWU, await tokens.owner(), { opportunity: team.id, status: "UNDER_REVIEW" })).status).toBe(400);
  });
});

describe("a Sprint With Us proposal", () => {
  it("is held one per vendor and one per organization, with a pointer to the one already held (R-2.2, R-2.11)", async () => {
    const opportunity = await publishedSprint();
    const draft = await ask("POST", SWU, await tokens.owner(), { opportunity, organization: QUALIFIED });
    expect(draft.status).toBe(201);
    expect(draft.body).toMatchObject({ status: "DRAFT", organization: { id: QUALIFIED } });
    expect(await ask("POST", SWU, await tokens.owner(), { opportunity })).toEqual({
      status: 400,
      body: { errors: [ALREADY_HAVE_PROPOSAL], existingProposalId: draft.body.id },
    });
    expect(await ask("POST", SWU, await tokens.orgAdmin(), { opportunity, organization: QUALIFIED })).toEqual({
      status: 400,
      body: { errors: ["organization: Please select a different organization."], existingOrganizationProposal: { proposalId: draft.body.id } },
    });
  });

  it("is refused at submission for each way its organization or team falls short (R-2.16, R-2.18, R-2.19, R-2.21)", async () => {
    const opportunity = await publishedSprint();
    const owner = await tokens.owner();
    const submit = (body: Record<string, unknown>) => ask("POST", SWU, owner, { opportunity, status: "SUBMITTED", ...body });

    expect((await submit({ ...goodSprintTeam, organization: undefined })).body.errors).toEqual([`organization: ${ORGANIZATION_REQUIRED}`]);
    expect((await ask("POST", SWU, await tokens.vendor(), { opportunity, status: "SUBMITTED", ...goodSprintTeam, organization: UNQUALIFIED })).body.errors).toEqual([
      `organization: ${notQualified("sprint-with-us")}`,
    ]);
    const missing = await submit({ ...goodSprintTeam, prototypePhase: undefined, inceptionPhase: { members: [{ member: OWNER, scrumMaster: true }], proposedCost: 1 } });
    expect(missing.body.errors).toEqual(
      expect.arrayContaining([`inceptionPhase: ${PHASE_NOT_REQUIRED}`, `prototypePhase: ${PHASE_REQUIRED}`, expect.stringMatching(/^team: .*User Research/)]),
    );
    const twoScrumMasters = await submit({
      ...goodSprintTeam,
      implementationPhase: { members: [{ member: OWNER, scrumMaster: true }, { member: ORG_ADMIN, scrumMaster: true }], proposedCost: 600_000 },
    });
    expect(twoScrumMasters.body.errors).toEqual([`implementationPhase.members: ${SINGLE_SCRUM_MASTER}`]);
    const pending = await submit({ ...goodSprintTeam, prototypePhase: { members: [{ member: MEMBER, scrumMaster: true }, { member: PENDING, scrumMaster: false }], proposedCost: 150_000 } });
    expect(pending.body.errors).toEqual([`prototypePhase.members: ${NOT_ACTIVE_MEMBER}`]);
    const overBudget = await submit({ ...goodSprintTeam, implementationPhase: { ...goodSprintTeam.implementationPhase, proposedCost: 800_000 } });
    expect(overBudget.body.errors).toEqual([`implementationPhase.proposedCost: ${phaseCostTooHigh(700_000)}`, `totalProposedCost: ${OVER_TOTAL_BUDGET}`]);
    const wordy = await submit({ ...goodSprintTeam, teamQuestionResponses: [{ order: 0, response: "one two three four five six" }, { order: 7, response: "Yes." }] });
    expect(wordy.body.errors).toEqual(["teamQuestionResponses.0.response: " + responseLengthMessage(5), "teamQuestionResponses.7.order: No matching opportunity question."]);
    // Nothing was made by any refusal.
    expect(((await ask("GET", `${SWU}?opportunity=${opportunity}`, owner)).body as unknown[]).length).toBe(0);

    const made = await submit(goodSprintTeam);
    expect(made.status).toBe(201);
    expect(made.body).toMatchObject({ status: "SUBMITTED", totalProposedCost: 750_000, implementationPhase: { proposedCost: 600_000 } });
  });

  it("answers a phase naming one person twice as a failure to store it, not a refusal (R-2.18)", async () => {
    const opportunity = await publishedSprint();
    const twice = await ask("POST", SWU, await tokens.owner(), {
      opportunity,
      status: "SUBMITTED",
      ...goodSprintTeam,
      implementationPhase: { members: [{ member: OWNER, scrumMaster: true }, { member: OWNER, scrumMaster: false }], proposedCost: 600_000 },
    });
    expect(twice.status).toBe(503);
  });

  it("keeps its organization once submitted until it is withdrawn, and keeps a pending member in a draft (R-2.18, R-2.22)", async () => {
    const opportunity = await publishedSprint();
    const owner = await tokens.owner();
    const made = await ask("POST", SWU, owner, { opportunity, status: "SUBMITTED", ...goodSprintTeam });
    const address = `${SWU}/${made.body.id}`;
    expect(await ask("PUT", address, owner, { tag: "edit", value: { organization: UNQUALIFIED } })).toEqual({
      status: 400,
      body: { errors: [`organization: ${ORGANIZATION_LOCKED}`] },
    });
    expect((await ask("PUT", address, owner, { tag: "withdraw" })).body.status).toBe("WITHDRAWN");
    const changed = await ask("PUT", address, owner, { tag: "edit", value: { organization: "00000000-0000-4000-8000-000000000304" } });
    expect(changed.status).toBe(200);
    expect(changed.body.organization.id).toBe("00000000-0000-4000-8000-000000000304");

    const other = await publishedSprint();
    const draft = await ask("POST", SWU, owner, {
      opportunity: other,
      ...goodSprintTeam,
      prototypePhase: { members: [{ member: MEMBER, scrumMaster: true }, { member: PENDING, scrumMaster: false }], proposedCost: 100 },
    });
    expect(draft.status).toBe(201);
    expect(draft.body.prototypePhase.members.map((member: { member: { id: string } }) => member.member.id)).toContain(PENDING);
    const refused = await ask("PUT", `${SWU}/${draft.body.id}`, owner, { tag: "submit" });
    expect(refused.body.errors).toEqual([`prototypePhase.members: ${NOT_ACTIVE_MEMBER}`]);
  });

  it("is read, history included, by its author and its organization's owner and administrators, and by no other vendor (R-2.9, R-2.24)", async () => {
    const opportunity = await publishedSprint();
    const made = await ask("POST", SWU, await tokens.orgAdmin(), { opportunity, ...goodSprintTeam });
    const address = `${SWU}/${made.body.id}`;
    for (const reader of [tokens.orgAdmin, tokens.owner]) {
      const read = await ask("GET", address, await reader());
      expect(read.status).toBe(200);
      expect(read.body.history[0]).toMatchObject({ status: "DRAFT", createdBy: { id: ORG_ADMIN } });
    }
    expect((await ask("GET", address, await tokens.member())).status).toBe(404);
    expect((await ask("GET", address, await tokens.proponentTwo())).status).toBe(404);
    const listed = (await ask("GET", SWU, await tokens.owner())).body as { id: string }[];
    expect(listed.map((proposal) => proposal.id)).toContain(made.body.id);
    expect(((await ask("GET", SWU, await tokens.proponentTwo())).body as { id: string }[]).map((proposal) => proposal.id)).not.toContain(made.body.id);
  });

  it("is withheld from staff until the opportunity closes, and then never shown as a draft (R-1.31, R-2.25)", async () => {
    const opportunity = await publishedSprint();
    await ask("POST", SWU, await tokens.owner(), { opportunity, status: "SUBMITTED", ...goodSprintTeam });
    expect(await ask("GET", `${SWU}?opportunity=${opportunity}`, await tokens.staff())).toMatchObject({
      status: 401,
      body: { errors: [PROPOSALS_NOT_YET_VISIBLE] },
    });
    expect((await ask("GET", `${SWU}?opportunity=${opportunity}`, await tokens.admin())).status).toBe(401);

    const closed = await ask("GET", `${SWU}?opportunity=${CLOSED_SPRINT}`, await tokens.staff());
    expect(closed.status).toBe(200);
    expect((closed.body as { status: string }[]).length).toBe(3);
    expect((closed.body as { status: string }[]).every((proposal) => proposal.status !== "DRAFT")).toBe(true);
  });
});

describe("a Team With Us proposal", () => {
  it("is refused for service areas, team, rates and resources it gets wrong (R-2.17, R-2.18, R-2.20)", async () => {
    const team = await publishedTeam([
      { serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 },
      { serviceArea: "DATA_PROFESSIONAL", targetAllocation: 50 },
    ]);
    const owner = await tokens.owner();
    const refused = await ask("POST", TWU, owner, {
      opportunity: team.id,
      status: "SUBMITTED",
      organization: QUALIFIED,
      team: [
        { member: OWNER, resource: team.resources[0], hourlyRate: 0 },
        { member: OWNER, resource: team.resources[1], hourlyRate: 100 },
        { member: FORMER, resource: "00000000-0000-4000-8000-000000000999", hourlyRate: 100 },
      ],
      resourceQuestionResponses: [{ order: 0, response: "Carefully." }],
    });
    expect(refused.body.errors).toEqual([
      `organization: ${SERVICE_AREAS_NOT_SATISFIED}`,
      "team.1.hourlyRate: Please enter an hourly rate of at least $1.",
      `team.2.member: ${UNIQUE_MEMBERS}`,
      `team.3.member: ${NOT_ACTIVE_MEMBER}`,
      "team.3.resource: The specified resource could not be found.",
    ]);
    const none = await ask("POST", TWU, owner, { opportunity: team.id, status: "SUBMITTED", organization: QUALIFIED, team: [], resourceQuestionResponses: [{ order: 0, response: "Yes." }] });
    expect(none.body.errors).toEqual([`organization: ${SERVICE_AREAS_NOT_SATISFIED}`, "team: Name at least one team member."]);
  });

  it("is held to the opportunity's maximum budget on create and on edit, a draft included (R-2.10)", async () => {
    // Twenty working days of 7.5 hours at full time: $150 an hour is $22,500.
    const team = await publishedTeam([{ serviceArea: "FULL_STACK_DEVELOPER", targetAllocation: 100 }], 22_500);
    const owner = await tokens.owner();
    const body = (hourlyRate: number) => ({
      opportunity: team.id,
      organization: QUALIFIED,
      team: [{ member: ORG_ADMIN, resource: team.resources[0], hourlyRate }],
      resourceQuestionResponses: [{ order: 0, response: "Carefully." }],
    });
    expect((await ask("POST", TWU, owner, { ...body(151), status: "SUBMITTED" })).body.errors).toEqual([`totalProposedCost: ${OVER_TOTAL_BUDGET}`]);
    expect((await ask("POST", TWU, owner, body(151))).body.errors).toEqual([`totalProposedCost: ${OVER_TOTAL_BUDGET}`]);
    const made = await ask("POST", TWU, owner, { ...body(150), status: "SUBMITTED" });
    expect(made.status).toBe(201);
    expect(made.body).toMatchObject({ status: "SUBMITTED", totalProposedCost: 22_500, team: [{ member: { id: ORG_ADMIN }, hourlyRate: 150 }] });
    const edited = await ask("PUT", `${TWU}/${made.body.id}`, owner, { tag: "edit", value: { team: [{ member: ORG_ADMIN, resource: team.resources[0], hourlyRate: 200 }] } });
    expect(edited.body.errors).toEqual([`totalProposedCost: ${OVER_TOTAL_BUDGET}`]);
  });
});

describe("files on Sprint With Us and Team With Us opportunities and proposals (R-8.19, R-8.20, R-8.25)", () => {
  it("reads an opportunity's attachment through the opportunity, in both programs", async () => {
    const staff = await tokens.staff();
    for (const address of [SPRINT, TEAM]) {
      const file = await upload(staff, "brief.pdf");
      const draft = await ask("POST", address, staff, { title: "With a brief", attachments: [file.id] });
      expect(draft.status).toBe(201);
      expect(draft.body.attachments.map((attachment: { id: string }) => attachment.id)).toEqual([file.id]);
      // Nothing about who may read it is recorded against the file itself.
      const grants = await app.get<FileStore>(FILE_STORE).find(file.id);
      expect(grants?.grants).toMatchObject({ public: false, users: [], userTypes: [] });
      expect((await ask("GET", `/api/files/${file.id}`, await tokens.vendor())).status).not.toBe(200);
      expect((await ask("GET", `/api/files/${file.id}`, staff)).status).toBe(200);
    }
    const file = await upload(staff, "published brief.pdf");
    const opportunity = await publishedSprint({ attachments: [file.id] });
    expect((await ask("GET", `/api/files/${file.id}`)).status).toBe(200);
    // Taken off the opportunity, it is no longer readable through it.
    await ask("PUT", `${SPRINT}/${opportunity}`, await tokens.admin(), { tag: "edit", value: { attachments: [] } });
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.vendor())).status).not.toBe(200);
  });

  it("reads a Sprint With Us proposal's attachment through the proposal", async () => {
    const opportunity = await publishedSprint();
    const owner = await tokens.owner();
    const file = await upload(owner, "approach.pdf");
    const made = await ask("POST", SWU, owner, { opportunity, ...goodSprintTeam, attachments: [file.id] });
    expect(made.body.attachments.map((attachment: { id: string }) => attachment.id)).toEqual([file.id]);
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.orgAdmin())).status).toBe(200);
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.proponentTwo())).status).not.toBe(200);
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.staff())).status).not.toBe(200);
  });
});
