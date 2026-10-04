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
import { FILE_STORE, FileStore } from "../src/files/file";
import { addDays, pacificDayOf } from "../src/rules/opportunities";
import {
  ALREADY_HAVE_PROPOSAL,
  NOT_ACCEPTING_PROPOSALS,
  NOT_PERMITTED_TO_START,
  ONLY_DRAFTS_DELETED,
  PROPOSALS_NOT_YET_VISIBLE,
  TERMS_NOT_ACCEPTED,
} from "../src/rules/proposals";

/**
 * Proposing on a Code With Us opportunity, against the service as it is started: over the schema
 * its own migrations made with the acceptance suite's seed applied, through the boundary that
 * checks every request against the contract, with mail caught.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const PUBLISHED = "00000000-0000-4000-8000-000000000601"; // staffOne's, open until 2030
const LAPSED_WITH_DRAFT = "00000000-0000-4000-a001-000000000001";
const LAPSED_DRAFT = "00000000-0000-4000-a001-000000000101"; // organizationOwner's draft
const LAPSED_PAIR = "00000000-0000-4000-a009-000000000001";
const LAPSED_SUBMISSION = "00000000-0000-4000-a009-000000000101"; // organizationOwner's, submitted
const LAPSED_PAIR_DRAFT = "00000000-0000-4000-a009-000000000102"; // proponentTwo's draft
const QUALIFIED = "00000000-0000-4000-8000-000000000301"; // owned by organizationOwner, administered by organizationAdmin
const UNQUALIFIED = "00000000-0000-4000-8000-000000000302"; // owned by vendorOne
const ARCHIVED = "00000000-0000-4000-8000-000000000303";
const NEVER_CREATED = "00000000-0000-4000-8000-000000000399";
const PRIVATE_FILE = "00000000-0000-4000-8000-000000000901"; // fileUploader's alone
const TEAM_ATTACHMENT = "00000000-0000-4000-8000-000000000902"; // on a Team With Us proposal for QUALIFIED
const VENDOR_ONE = "00000000-0000-4000-8000-000000000201";

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

const vendorToken = (username: string) => () =>
  realm.token({ preferred_username: username, identity_provider: "bceid", sid: username });
const tokens = {
  admin: () => realm.token({ preferred_username: "test-admin", identity_provider: "idir", sid: "admin" }),
  staff: () => realm.token({ preferred_username: "test-gov", identity_provider: "idir", sid: "staff" }),
  vendor: vendorToken("test-vendor-1"),
  owner: vendorToken("test-vendor-2"),
  orgAdmin: vendorToken("test-vendor-3"),
  member: vendorToken("test-vendor-4"),
  uploader: vendorToken("test-vendor-6"),
  termsReset: vendorToken("test-vendor-10"),
  proponentTwo: vendorToken("test-vendor-11"),
  proponentThree: vendorToken("test-vendor-12"),
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
  form.append("file", new Blob(["a proposal's file"]), name);
  const answer = await fetch(`${origin}/api/files`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
  return (await answer.json()) as { id: string };
}

const BASE = "/api/proposals/code-with-us";
const OPPORTUNITIES = "/api/opportunities/code-with-us";

const individual = {
  legalName: "Alex Placeholder",
  email: "alex@example.test",
  phone: "250-555-0100",
  street1: "100 Example Street",
  street2: "",
  city: "Victoria",
  region: "BC",
  mailCode: "V8W 0A0",
  country: "Canada",
};
const complete = (opportunity: string, extra: Record<string, unknown> = {}) => ({
  opportunity,
  proposalText: "We will build it.",
  additionalComments: "",
  proponent: { tag: "individual", value: individual },
  attachments: [],
  status: "SUBMITTED",
  ...extra,
});

const today = pacificDayOf(new Date());
/** A Code With Us opportunity of staffOne's, published by the administrator and open for thirty days. */
async function openOpportunity(): Promise<string> {
  const made = await ask("POST", OPPORTUNITIES, await tokens.admin(), {
    title: "An opportunity to propose on",
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
    status: "PUBLISHED",
  });
  expect(made.status).toBe(201);
  await new Promise((resolve) => setTimeout(resolve, 200));
  catcher.caught.length = 0;
  return made.body.id;
}

describe("starting a proposal (R-2.1, R-2.2, R-2.7)", () => {
  it("is refused to staff, an administrator, a visitor and a vendor who never accepted the terms, and nothing is made", async () => {
    for (const token of [await tokens.staff(), await tokens.admin(), undefined, await tokens.neverAgreed()]) {
      expect(await ask("POST", BASE, token, complete(PUBLISHED, { status: "DRAFT" }))).toEqual({
        status: 401,
        body: { errors: [NOT_PERMITTED_TO_START] },
      });
    }
  });

  it("is made only as a draft or a submission, and one vendor holds one proposal per opportunity", async () => {
    const id = await openOpportunity();
    expect((await ask("POST", BASE, await tokens.vendor(), complete(id, { status: "PUBLISHED" }))).status).toBe(400);

    const draft = await ask("POST", BASE, await tokens.vendor(), { opportunity: id, status: "DRAFT" });
    expect(draft.status).toBe(201);
    expect(draft.body).toMatchObject({ status: "DRAFT", opportunity: { id }, createdBy: { id: VENDOR_ONE }, submittedAt: null });

    const second = await ask("POST", BASE, await tokens.vendor(), complete(id));
    expect(second).toEqual({ status: 400, body: { errors: [ALREADY_HAVE_PROPOSAL], existingProposalId: draft.body.id } });
    const mine = await ask("GET", `${BASE}?opportunity=${id}`, await tokens.vendor());
    expect(mine.body.map((proposal: { id: string }) => proposal.id)).toEqual([draft.body.id]);
  });
});

describe("what a proposal holds (R-2.12, R-2.13, R-2.14, R-8.22)", () => {
  it("keeps a blank draft, but checks its attachments even then", async () => {
    const id = await openOpportunity();
    expect(
      await ask("POST", BASE, await tokens.vendor(), { opportunity: id, status: "DRAFT", attachments: [NEVER_CREATED] }),
    ).toEqual({ status: 400, body: { errors: ["attachments: You can only attach a file you are permitted to read."] } });
    expect((await ask("POST", BASE, await tokens.vendor(), { opportunity: id, status: "DRAFT" })).status).toBe(201);
  });

  it("keeps a draft with an organization chosen but none picked, as made and as changed, and reopens it", async () => {
    const id = await openOpportunity();
    const unpicked = { tag: "organization", value: "" };
    const made = await ask("POST", BASE, await tokens.vendor(), { opportunity: id, status: "DRAFT", proponent: unpicked });
    expect(made.status).toBe(201);
    const reopened = await ask("GET", `${BASE}/${made.body.id}`, await tokens.vendor());
    expect(reopened.status).toBe(200);
    expect(reopened.body).toMatchObject({ id: made.body.id, status: "DRAFT" });
    expect(reopened.body.proponent.tag).not.toBe("organization");

    // Picked, and then given up again on the next save.
    const picked = { proposalText: "", additionalComments: "", attachments: [], proponent: { tag: "organization", value: UNQUALIFIED } };
    expect((await ask("PUT", `${BASE}/${made.body.id}`, await tokens.vendor(), { tag: "edit", value: picked })).status).toBe(200);
    const changed = await ask("PUT", `${BASE}/${made.body.id}`, await tokens.vendor(), { tag: "edit", value: { ...picked, proponent: unpicked } });
    expect(changed.status).toBe(200);
    const again = await ask("GET", `${BASE}/${made.body.id}`, await tokens.vendor());
    expect(again.status).toBe(200);
    expect(again.body.proponent.tag).not.toBe("organization");
  });

  it("refuses a submission naming each missing or malformed field", async () => {
    const id = await openOpportunity();
    const refused = await ask("POST", BASE, await tokens.vendor(), {
      ...complete(id),
      proposalText: "",
      additionalComments: "x".repeat(10_001),
      proponent: { tag: "individual", value: { ...individual, legalName: "", email: "alex@", phone: "call me", street1: "", city: "", region: "", mailCode: "", country: "" } },
    });
    expect(refused.status).toBe(400);
    expect(refused.body.errors.map((line: string) => line.split(":")[0])).toEqual([
      "legalName",
      "email",
      "phone",
      "street1",
      "city",
      "region",
      "mailCode",
      "country",
      "proposalText",
      "additionalComments",
    ]);
  });

  it("checks an organization only for existing and being active", async () => {
    const id = await openOpportunity();
    for (const organization of [NEVER_CREATED, ARCHIVED]) {
      const refused = await ask("POST", BASE, await tokens.vendor(), complete(id, { proponent: { tag: "organization", value: organization } }));
      expect(refused).toEqual({ status: 400, body: { errors: ["organization: Choose an organization that exists and is active"] } });
    }
    // vendorOne has no membership of QUALIFIED, and the service does not look.
    const accepted = await ask("POST", BASE, await tokens.vendor(), complete(id, { proponent: { tag: "organization", value: QUALIFIED } }));
    expect(accepted.status).toBe(201);
    expect(accepted.body.proponent).toEqual({ tag: "organization", value: { id: QUALIFIED, legalName: "Northern Pines Digital Ltd." } });
  });

  it("refuses a file the person attaching it may not read, keeping the attachments as they were", async () => {
    const id = await openOpportunity();
    const draft = await ask("POST", BASE, await tokens.vendor(), { opportunity: id, status: "DRAFT" });
    const refused = await ask("PUT", `${BASE}/${draft.body.id}`, await tokens.vendor(), { tag: "edit", value: { attachments: [PRIVATE_FILE] } });
    expect(refused.status).toBe(400);
    expect((await ask("GET", `${BASE}/${draft.body.id}`, await tokens.vendor())).body.attachments).toEqual([]);
  });
});

describe("one proposal per organization on an opportunity (R-2.11)", () => {
  it("refuses a second proposal naming the same organization, pointing at the first", async () => {
    const id = await openOpportunity();
    const first = await ask("POST", BASE, await tokens.owner(), complete(id, { proponent: { tag: "organization", value: QUALIFIED } }));
    expect(first.status).toBe(201);
    const second = await ask("POST", BASE, await tokens.orgAdmin(), complete(id, { proponent: { tag: "organization", value: QUALIFIED } }));
    expect(second).toEqual({
      status: 400,
      body: { errors: ["organization: Please select a different organization."], existingOrganizationProposal: { proposalId: first.body.id } },
    });
    // An existing proposal edited to name it is refused the same way.
    const own = await ask("POST", BASE, await tokens.vendor(), complete(id, { proponent: { tag: "organization", value: UNQUALIFIED } }));
    const edited = await ask("PUT", `${BASE}/${own.body.id}`, await tokens.vendor(), {
      tag: "edit",
      value: { proponent: { tag: "organization", value: QUALIFIED } },
    });
    expect(edited.body.existingOrganizationProposal).toEqual({ proposalId: first.body.id });
  });
});

describe("submitting (R-2.3, R-2.15, R-2.23)", () => {
  it("needs the current terms accepted, and records the submission", async () => {
    const id = await openOpportunity();
    expect(await ask("POST", BASE, await tokens.termsReset(), complete(id))).toEqual({ status: 401, body: { errors: [TERMS_NOT_ACCEPTED] } });
    const draft = await ask("POST", BASE, await tokens.termsReset(), complete(id, { status: "DRAFT" }));
    expect(draft.status).toBe(201);
    expect((await ask("PUT", `${BASE}/${draft.body.id}`, await tokens.termsReset(), { tag: "submit" })).status).toBe(401);

    const me = await ask("GET", "/api/sessions/current", await tokens.termsReset());
    expect((await ask("PUT", `/api/users/${me.body.user.id}`, await tokens.termsReset(), { tag: "acceptTerms" })).status).toBe(200);
    const submitted = await ask("PUT", `${BASE}/${draft.body.id}`, await tokens.termsReset(), { tag: "submit" });
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe("SUBMITTED");
    expect(submitted.body.submittedAt).toEqual(expect.any(String));
  });

  it("refuses a draft put forward, or a new submission, after the deadline", async () => {
    expect(await ask("PUT", `${BASE}/${LAPSED_DRAFT}`, await tokens.owner(), { tag: "submit" })).toEqual({
      status: 400,
      body: { errors: [NOT_ACCEPTING_PROPOSALS] },
    });
    expect((await ask("GET", `${BASE}/${LAPSED_DRAFT}`, await tokens.owner())).body.status).toBe("DRAFT");
    expect(await ask("POST", BASE, await tokens.proponentTwo(), complete(LAPSED_WITH_DRAFT))).toEqual({
      status: 400,
      body: { errors: [NOT_ACCEPTING_PROPOSALS] },
    });
  });

  it("withdraws at any time and puts back only while proposals are accepted", async () => {
    const withdrawn = await ask("PUT", `${BASE}/${LAPSED_SUBMISSION}`, await tokens.owner(), { tag: "withdraw" });
    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.status).toBe("WITHDRAWN");
    expect(await ask("PUT", `${BASE}/${LAPSED_SUBMISSION}`, await tokens.owner(), { tag: "submit" })).toEqual({
      status: 400,
      body: { errors: [NOT_ACCEPTING_PROPOSALS] },
    });

    const id = await openOpportunity();
    const made = await ask("POST", BASE, await tokens.vendor(), complete(id));
    expect((await ask("PUT", `${BASE}/${made.body.id}`, await tokens.vendor(), { tag: "withdraw" })).body.status).toBe("WITHDRAWN");
    const back = await ask("PUT", `${BASE}/${made.body.id}`, await tokens.vendor(), { tag: "submit" });
    expect(back.body.status).toBe("SUBMITTED");
    // Every change of state is in its history, newest first, with who made it (R-2.9).
    expect(back.body.history.map((entry: { status: string }) => entry.status)).toEqual(["SUBMITTED", "WITHDRAWN", "SUBMITTED"]);
    expect(back.body.history[0].createdBy).toEqual({ id: VENDOR_ONE, name: expect.any(String) });
  });
});

describe("deleting (R-2.4)", () => {
  it("deletes only a draft, which can then no longer be opened", async () => {
    const id = await openOpportunity();
    const submitted = await ask("POST", BASE, await tokens.vendor(), complete(id));
    expect(await ask("DELETE", `${BASE}/${submitted.body.id}`, await tokens.vendor())).toEqual({
      status: 400,
      body: { errors: [ONLY_DRAFTS_DELETED] },
    });
    const other = await openOpportunity();
    const draft = await ask("POST", BASE, await tokens.vendor(), complete(other, { status: "DRAFT" }));
    expect((await ask("DELETE", `${BASE}/${draft.body.id}`, await tokens.vendor())).status).toBe(200);
    expect((await ask("GET", `${BASE}/${draft.body.id}`, await tokens.vendor())).status).toBe(404);
  });
});

describe("who sees which proposal (R-1.31, R-2.9, R-2.24, R-2.25)", () => {
  it("shows a vendor only their own, an organization's owner and administrators its proposals too, and refuses another vendor's", async () => {
    const id = await openOpportunity();
    const mine = await ask("POST", BASE, await tokens.vendor(), complete(id));
    const theirs = await ask("POST", BASE, await tokens.owner(), complete(id, { proponent: { tag: "organization", value: QUALIFIED } }));

    const listed = await ask("GET", BASE, await tokens.vendor());
    expect(listed.body.map((proposal: { id: string }) => proposal.id)).toContain(mine.body.id);
    expect(listed.body.map((proposal: { id: string }) => proposal.id)).not.toContain(theirs.body.id);
    expect((await ask("GET", `${BASE}/${theirs.body.id}`, await tokens.vendor())).status).toBe(404);

    // The organization's administrator reads it, history and all; an ordinary member does not.
    const administrators = await ask("GET", `${BASE}/${theirs.body.id}`, await tokens.orgAdmin());
    expect(administrators.status).toBe(200);
    expect(administrators.body.history[0].status).toBe("SUBMITTED");
    expect((await ask("GET", BASE, await tokens.orgAdmin())).body.map((proposal: { id: string }) => proposal.id)).toContain(theirs.body.id);
    expect((await ask("GET", `${BASE}/${theirs.body.id}`, await tokens.member())).status).toBe(404);
  });

  it("refuses staff an opportunity's proposals until it has closed, and then shows the submitted ones and no draft", async () => {
    const id = await openOpportunity();
    const submitted = await ask("POST", BASE, await tokens.vendor(), complete(id));
    for (const token of [await tokens.staff(), await tokens.admin()]) {
      expect(await ask("GET", `${BASE}?opportunity=${id}`, token)).toEqual({ status: 401, body: { errors: [PROPOSALS_NOT_YET_VISIBLE] } });
      expect((await ask("GET", `${BASE}/${submitted.body.id}`, token)).status).toBe(404);
    }

    const closed = await ask("GET", `${BASE}?opportunity=${LAPSED_PAIR}`, await tokens.staff());
    expect(closed.status).toBe(200);
    const ids = closed.body.map((proposal: { id: string }) => proposal.id);
    expect(ids).not.toContain(LAPSED_PAIR_DRAFT);
    expect((await ask("GET", `${BASE}/${LAPSED_PAIR_DRAFT}`, await tokens.admin())).status).toBe(404);
  });
});

describe("files attached to proposals (R-8.20, R-8.31)", () => {
  it("are readable by whoever may read the proposal, until they are taken off it, and are then detached", async () => {
    const id = await openOpportunity();
    const file = await upload(await tokens.owner(), "delivery-plan.pdf");
    const made = await ask("POST", BASE, await tokens.owner(), complete(id, { proponent: { tag: "organization", value: QUALIFIED }, attachments: [file.id] }));
    expect(made.status).toBe(201);
    expect(made.body.attachments).toEqual([expect.objectContaining({ id: file.id, name: "delivery-plan.pdf" })]);

    expect((await ask("GET", `/api/files/${file.id}`, await tokens.orgAdmin())).status).toBe(200);
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.vendor())).status).toBe(401);
    // Staff do not read it before the opportunity closes.
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.staff())).status).toBe(401);

    const files = app.get<FileStore>(FILE_STORE, { strict: false });
    expect((await files.detached()).map((stored) => stored.id)).not.toContain(file.id);
    expect((await ask("PUT", `${BASE}/${made.body.id}`, await tokens.owner(), { tag: "edit", value: { attachments: [] } })).status).toBe(200);
    expect((await ask("GET", `/api/files/${file.id}`, await tokens.orgAdmin())).status).toBe(401);
    expect((await files.detached()).map((stored) => stored.id)).toContain(file.id);
  });

  it("follow one rule in every program: a Team With Us proposal's file is read by the opportunity's author once it has closed", async () => {
    expect((await ask("GET", `/api/files/${TEAM_ATTACHMENT}`, await tokens.staff())).status).toBe(200);
    expect((await ask("GET", `/api/files/${TEAM_ATTACHMENT}`, await tokens.orgAdmin())).status).toBe(200);
    expect((await ask("GET", `/api/files/${TEAM_ATTACHMENT}`, await tokens.vendor())).status).toBe(401);
  });
});

describe("telling proponents about an opportunity (R-1.35, R-1.36)", () => {
  it("emails a vendor who submitted a proposal when an addendum is added, and when the opportunity is cancelled", async () => {
    const id = await openOpportunity();
    expect((await ask("POST", BASE, await tokens.proponentThree(), complete(id))).status).toBe(201);
    // A draft's author is not a proponent.
    expect((await ask("POST", BASE, await tokens.proponentTwo(), complete(id, { status: "DRAFT" }))).status).toBe(201);

    expect((await ask("PUT", `${OPPORTUNITIES}/${id}`, await tokens.admin(), { tag: "addAddendum", value: "By video." })).status).toBe(200);
    await expect.poll(() => catcher.caught.length).toBe(1);
    const recipients = catcher.caught[0]!.recipients;
    expect(recipients).toContain("proponent.three@example.test");
    expect(recipients).not.toContain("proponent.two@example.test");

    catcher.caught.length = 0;
    expect((await ask("PUT", `${OPPORTUNITIES}/${id}`, await tokens.admin(), { tag: "cancel", value: "No longer needed." })).status).toBe(200);
    await expect.poll(() => catcher.caught.length).toBe(2);
    expect(catcher.caught.flatMap((mail) => mail.recipients)).toContain("proponent.three@example.test");
  });
});
