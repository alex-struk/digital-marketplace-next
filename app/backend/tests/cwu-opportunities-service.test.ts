import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { refusalFor } from "../src/common/refusals";
import { MailLog, Mailer, MailTransport, OutgoingMail } from "../src/mail/mailer";
import { MailSettings } from "../src/mail/settings";
import {
  ATTACHMENT_NOT_READABLE,
  CwuOpportunitiesService,
} from "../src/opportunities/cwu-opportunities.service";
import {
  CwuOpportunityStore,
  HistoryEntry,
  Recipient,
  StoredCwuOpportunity,
  SuccessfulProponent,
} from "../src/opportunities/cwu-opportunity";
import {
  CwuContent,
  CwuStatus,
  ONLY_ADMINISTRATORS_PUBLISH,
  OPPORTUNITY_INCOMPLETE,
  OpportunityViewer,
} from "../src/rules/opportunities";

const settings: MailSettings = {
  from: "Digital Marketplace <donotreply@example.test>",
  fromAddress: "donotreply@example.test",
  disabled: false,
  testEnvironment: true,
  serviceOrigin: "http://localhost:4300",
  contactEmail: "digitalmarketplace@example.test",
  smtp: { host: "mail", port: 1025 },
  batchSize: 50,
};

const ADMIN: OpportunityViewer = { id: "admin-1", type: "ADMIN" };
const STAFF: OpportunityViewer = { id: "staff-1", type: "GOV" };
const OTHER_STAFF: OpportunityViewer = { id: "staff-2", type: "GOV" };
const VENDOR: OpportunityViewer = { id: "vendor-1", type: "VENDOR" };

const NAMES: Record<string, string> = { "admin-1": "Ada Admin", "staff-1": "Sam Staff", "staff-2": "Sky Staff" };

/** Opportunities in memory, keeping every version as the kept schema does. */
class OpportunitiesInMemory implements CwuOpportunityStore {
  readonly opportunities = new Map<
    string,
    { createdBy: string; createdAt: Date; versions: { content: CwuContent; by: string; at: Date }[]; history: HistoryEntry[] }
  >();
  subscribers: Recipient[] = [];
  administrators: Recipient[] = [{ email: "admin.one@example.test" }, { email: "admin.two@example.test" }];
  private next = 1;
  private tick = 0;

  private now() {
    this.tick += 1;
    return new Date(Date.UTC(2026, 8, 30, 17, 0, this.tick));
  }

  async create(content: CwuContent, status: CwuStatus, by: string) {
    const id = `00000000-0000-4000-8000-${String(this.next++).padStart(12, "0")}`;
    const at = this.now();
    this.opportunities.set(id, {
      createdBy: by,
      createdAt: at,
      versions: [{ content, by, at }],
      history: [{ createdAt: at, createdBy: person(by), status, event: null, note: null }],
    });
    return id;
  }

  async find(id: string): Promise<StoredCwuOpportunity | null> {
    const row = this.opportunities.get(id);
    if (!row) return null;
    const version = row.versions[row.versions.length - 1]!;
    const history = [...row.history].reverse();
    const changes = history.filter((entry) => entry.status !== null);
    const published = [...changes].reverse().find((entry) => entry.status === "PUBLISHED");
    return {
      id,
      createdAt: row.createdAt,
      createdBy: person(row.createdBy),
      updatedAt: version.at,
      updatedBy: person(version.by),
      status: changes[0]!.status!,
      publishedAt: published?.createdAt ?? null,
      content: version.content,
      attachments: version.content.attachments.map((file) => ({ id: file, name: `${file}.pdf`, createdAt: "", fileBlob: "" })),
      history,
    };
  }

  async list() {
    const found = await Promise.all([...this.opportunities.keys()].map((id) => this.find(id)));
    return found.filter((row): row is StoredCwuOpportunity => row !== null);
  }

  async addVersion(id: string, content: CwuContent, by: string) {
    const row = this.opportunities.get(id)!;
    const at = this.now();
    row.versions.push({ content, by, at });
    row.history.push({ createdAt: at, createdBy: person(by), status: null, event: "EDITED", note: null });
  }

  async changeStatus(id: string, status: CwuStatus, by: string) {
    this.opportunities.get(id)!.history.push({ createdAt: this.now(), createdBy: person(by), status, event: null, note: null });
  }

  async remove(id: string) {
    this.opportunities.delete(id);
  }

  async newOpportunityNoticeRecipients() {
    return this.subscribers;
  }

  async activeAdministrators() {
    return this.administrators;
  }

  async recipient(accountId: string) {
    return { email: `${accountId}@example.test` };
  }

  winner: SuccessfulProponent | null = null;
  async successfulProponent() {
    return this.winner;
  }
}

function person(id: string) {
  return { id, name: NAMES[id] ?? id };
}

class RecordingTransport implements MailTransport {
  readonly sent: OutgoingMail[] = [];
  failing = false;
  async deliver(mail: OutgoingMail) {
    if (this.failing) throw Object.assign(new Error("refused"), { responseCode: 451 });
    this.sent.push(mail);
  }
}

/** Files only their uploader may read, unless named readable here. */
const readable = new Set(["00000000-0000-4000-8000-00000000f001"]);

function serviceWith() {
  const store = new OpportunitiesInMemory();
  const transport = new RecordingTransport();
  const mailer = new Mailer(settings, transport, vi.fn<MailLog>());
  const files = { mayRead: async (fileId: string) => readable.has(fileId) };
  const service = new CwuOpportunitiesService(store, files, mailer, settings, () => new Date("2026-09-30T19:00:00Z"));
  return { store, transport, service };
}

/** The reasons a refusal is answered with (decision record 0010). */
async function reasonsFor(action: Promise<unknown>): Promise<readonly string[]> {
  try {
    await action;
  } catch (error) {
    return refusalFor(error).body.errors;
  }
  throw new Error("The action was not refused.");
}

/** Lets the messages handed over after an answer go out. */
async function mailSettles() {
  for (let round = 0; round < 10; round += 1) await new Promise((resolve) => setImmediate(resolve));
}

const complete = {
  title: "Build an accessible permit tracker",
  teaser: "A short teaser.",
  remoteOk: true,
  remoteDesc: "Anywhere in Canada.",
  location: "Victoria",
  reward: 45000,
  skills: ["Accessibility"],
  description: "What the work is.",
  proposalDeadline: "2026-10-02",
  assignmentDate: "2026-10-09",
  startDate: "2026-10-19",
  completionDate: "",
};

describe("creating a Code With Us opportunity", () => {
  it("is refused to a vendor and to a visitor, and nothing is created (R-1.7)", async () => {
    const { service, store } = serviceWith();
    await expect(service.create(VENDOR, { ...complete, status: "DRAFT" })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.create(null, { ...complete, status: "DRAFT" })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(store.opportunities.size).toBe(0);
  });

  it("refuses a member of staff who is not an administrator creating one published (R-1.48)", async () => {
    const { service, store } = serviceWith();
    await expect(service.create(STAFF, { ...complete, status: "PUBLISHED" })).rejects.toThrow(ONLY_ADMINISTRATORS_PUBLISH);
    expect(store.opportunities.size).toBe(0);
  });

  it("saves a draft with blank fields, its dates fourteen days on and no completion date (R-1.9)", async () => {
    const { service } = serviceWith();
    const draft = await service.create(STAFF, { title: "Half-written", status: "DRAFT" });
    expect(draft.status).toBe("DRAFT");
    expect(draft.program).toBe("code-with-us");
    expect([draft.proposalDeadline, draft.assignmentDate, draft.startDate]).toEqual(["2026-10-14", "2026-10-14", "2026-10-14"]);
    expect(draft.completionDate).toBe(null);
  });

  it("refuses one submitted for review with problems, naming each field (R-1.10, R-1.12)", async () => {
    const { service } = serviceWith();
    const reasons = await reasonsFor(
      service.create(STAFF, { ...complete, title: "", reward: 80000, skills: [], status: "UNDER_REVIEW" }),
    );
    expect(reasons.map((line) => line.split(":")[0])).toEqual(["title", "reward", "skills"]);
  });

  it("refuses a file the person may not read as an attachment (R-8.22)", async () => {
    const { service } = serviceWith();
    expect(
      await reasonsFor(
        service.create(STAFF, { title: "x", attachments: ["00000000-0000-4000-8000-000000000901"], status: "DRAFT" }),
      ),
    ).toEqual([ATTACHMENT_NOT_READABLE]);
    const created = await service.create(STAFF, { title: "x", attachments: ["00000000-0000-4000-8000-00000000f001"] });
    expect(created.attachments.map((file) => file.id)).toEqual(["00000000-0000-4000-8000-00000000f001"]);
  });
});

describe("reading one", () => {
  it("answers a draft as not found to anyone but its author and administrators (R-1.2)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(STAFF, { title: "Private draft" });
    for (const viewer of [null, VENDOR, OTHER_STAFF]) {
      await expect(service.read(viewer, id)).rejects.toBeInstanceOf(NotFoundException);
    }
    expect((await service.read(ADMIN, id)).title).toBe("Private draft");
  });

  it("names who created and changed it, and gives its history, only to those permitted (R-1.29)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(ADMIN, { ...complete, status: "PUBLISHED" });
    const vendorsView = await service.read(VENDOR, id);
    expect(vendorsView).not.toHaveProperty("createdBy");
    expect(vendorsView).not.toHaveProperty("updatedBy");
    expect(vendorsView).not.toHaveProperty("history");
    const administratorsView = await service.read(ADMIN, id);
    expect(administratorsView.createdBy).toEqual({ id: "admin-1", name: "Ada Admin" });
    expect(administratorsView.history?.length).toBe(1);
  });
});

describe("changing one", () => {
  it("records each change as a new version and an edit in the history, showing the newest (R-1.4)", async () => {
    const { service, store } = serviceWith();
    const { id } = await service.create(ADMIN, { ...complete, status: "PUBLISHED" });
    const changed = await service.change(ADMIN, id, { tag: "edit", value: { ...complete, description: "New words." } });
    expect(changed.description).toBe("New words.");
    expect(changed.history?.[0]).toMatchObject({ event: "EDITED", createdBy: { id: "admin-1", name: "Ada Admin" } });
    expect(store.opportunities.get(id)!.versions.map((version) => version.content.description)).toEqual([
      "What the work is.",
      "New words.",
    ]);
  });

  it("keeps what a change leaves out, so an attachment can be added by its identifier alone", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(STAFF, { ...complete, status: "DRAFT" });
    const changed = await service.change(STAFF, id, { tag: "edit", value: { attachments: ["00000000-0000-4000-8000-00000000f001"] } });
    expect(changed.title).toBe(complete.title);
    expect(changed.attachments).toHaveLength(1);
  });

  it("refuses the author changing it once it is published (R-1.56)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(STAFF, { ...complete, status: "UNDER_REVIEW" });
    await service.change(ADMIN, id, { tag: "publish" });
    await expect(service.change(STAFF, id, { tag: "edit", value: { title: "Mine" } })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe("submitting for review and publishing", () => {
  it("refuses an incomplete draft for review, saying only that it is incomplete (R-1.21)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(STAFF, { title: "Only a title" });
    expect(await reasonsFor(service.change(STAFF, id, { tag: "submitForReview" }))).toEqual([OPPORTUNITY_INCOMPLETE]);
    expect((await service.read(STAFF, id)).status).toBe("DRAFT");
  });

  it("tells every administrator as blind copies, and the author separately (R-1.37, R-6.15)", async () => {
    const { service, transport } = serviceWith();
    const { id } = await service.create(STAFF, { ...complete, status: "DRAFT" });
    const answer = await service.change(STAFF, id, { tag: "submitForReview" });
    expect(answer.status).toBe("UNDER_REVIEW");
    await mailSettles();
    const [toAdministrators, toAuthor] = transport.sent;
    expect(toAdministrators?.to).toEqual(["donotreply@example.test"]);
    expect(toAdministrators?.bcc).toEqual(["admin.one@example.test", "admin.two@example.test"]);
    expect(toAuthor?.to).toEqual(["staff-1@example.test"]);
    expect(toAuthor?.subject).toContain("Your Code With Us Opportunity Has Been Submitted For Review");
  });

  it("refuses a member of staff publishing (R-1.22)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(STAFF, { ...complete, status: "UNDER_REVIEW" });
    await expect(service.change(STAFF, id, { tag: "publish" })).rejects.toThrow(ONLY_ADMINISTRATORS_PUBLISH);
    expect((await service.read(STAFF, id)).status).toBe("UNDER_REVIEW");
  });

  it("records the first publication as the published date (R-1.23)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(STAFF, { ...complete, status: "UNDER_REVIEW" });
    const published = await service.change(ADMIN, id, { tag: "publish" });
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBe(published.history?.[0]?.createdAt);
  });

  it("refuses a change of state the path does not permit, and leaves the state (R-1.20)", async () => {
    const { service } = serviceWith();
    const { id } = await service.create(ADMIN, { ...complete, status: "PUBLISHED" });
    await expect(service.change(ADMIN, id, { tag: "submitForReview" })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.change(ADMIN, id, { tag: "publish" })).rejects.toBeInstanceOf(BadRequestException);
    expect((await service.read(ADMIN, id)).status).toBe("PUBLISHED");
  });

  it("announces a publication in batches of fifty blind copies, and confirms it to the author (R-1.34, R-6.8)", async () => {
    const { service, store, transport } = serviceWith();
    store.subscribers = [
      ...Array.from({ length: 139 }, (_, index) => ({ email: `subscriber.${index}@example.test` })),
      { email: null },
    ];
    const { id } = await service.create(STAFF, { ...complete, status: "UNDER_REVIEW" });
    await mailSettles();
    transport.sent.length = 0;
    await service.change(ADMIN, id, { tag: "publish" });
    await mailSettles();
    const announcements = transport.sent.filter((mail) => mail.subject.includes("A New Code With Us Opportunity"));
    expect(announcements.map((mail) => mail.bcc.length)).toEqual([50, 50, 39]);
    for (const mail of announcements) expect(mail.to).toEqual(["donotreply@example.test"]);
    expect(announcements[0]?.html).toContain("Unsubscribe");
    expect(transport.sent.filter((mail) => mail.subject.includes("Your Code With Us Opportunity Has Been Posted"))).toHaveLength(1);
  });

  it("publishes and says so when no message can be delivered (R-6.2)", async () => {
    const { service, store, transport } = serviceWith();
    store.subscribers = [{ email: "subscriber@example.test" }];
    transport.failing = true;
    const { id } = await service.create(STAFF, { ...complete, status: "UNDER_REVIEW" });
    await expect(service.change(ADMIN, id, { tag: "publish" })).resolves.toMatchObject({ status: "PUBLISHED" });
    await mailSettles();
    expect(transport.sent).toEqual([]);
  });
});

describe("deleting (R-1.53)", () => {
  it("deletes a draft for its author, and refuses the author once it is under review", async () => {
    const { service, store } = serviceWith();
    const draft = await service.create(STAFF, { title: "Draft" });
    await service.remove(STAFF, draft.id);
    expect(store.opportunities.has(draft.id)).toBe(false);

    const underReview = await service.create(STAFF, { ...complete, status: "UNDER_REVIEW" });
    await expect(service.remove(STAFF, underReview.id)).rejects.toBeInstanceOf(UnauthorizedException);
    await service.remove(ADMIN, underReview.id);
    expect(store.opportunities.has(underReview.id)).toBe(false);
  });

  it("refuses everyone once it has been published", async () => {
    const { service, store } = serviceWith();
    const { id } = await service.create(ADMIN, { ...complete, status: "PUBLISHED" });
    await expect(service.remove(ADMIN, id)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(store.opportunities.has(id)).toBe(true);
  });
});
