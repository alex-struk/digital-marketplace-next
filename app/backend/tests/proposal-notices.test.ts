import { describe, expect, it, vi } from "vitest";
import { Mailer } from "../src/mail/mailer";
import { Envelope, blindCopiedToStaff } from "../src/mail/message";
import { ProposalNotices, ProposalRecipients } from "../src/proposals/proposal-notices";
import { PROGRAMS } from "../src/rules/opportunities";

/** The people a proposal's notices go to, in memory. */
const recipients: ProposalRecipients = {
  address: async (id) => (id === "vendor" ? "vendor@example.test" : null),
  administrators: async () => ["admin.one@example.test", null, "admin.two@example.test"],
};

function setUp() {
  const sent: Envelope[] = [];
  const mailer = { sendEach: (envelopes: readonly Envelope[]) => sent.push(...envelopes) } as unknown as Mailer;
  const notices = new ProposalNotices(recipients, mailer, { serviceOrigin: "http://localhost:4300", batchSize: 50 });
  return { notices, sent };
}

describe("the withdrawal notice (R-2.36)", () => {
  it.each(PROGRAMS)("in %s, tells the vendor in a message of their own and the administrators as blind copies", async (program) => {
    const { notices, sent } = setUp();
    const subject = { program, opportunityId: "o-1", opportunityTitle: "Build a tracker", proposalId: "p-1" };
    notices.withdrawn({ subject, vendor: "vendor" }, "Northern Pines Digital Ltd.");
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[0]!.to).toEqual(["vendor@example.test"]);
    expect(sent[1]!.to).toEqual([]);
    expect(sent[1]!.bcc).toEqual(["admin.one@example.test", "admin.two@example.test"]);
    expect(sent[1]!.message.body.some((block) => block.kind === "paragraph" && block.content.join("").includes("Northern Pines Digital Ltd."))).toBe(true);
  });
});

describe("a notice to a named group of staff (R-6.15)", () => {
  it("carries the group as blind copies with nobody visible, skipping a missing address and a repeated one", () => {
    const message = { kind: "k", subject: "s", title: "t", body: [] };
    expect(blindCopiedToStaff(["a@example.test", null, "A@example.test", "b@example.test"], message)).toEqual([
      { to: [], bcc: ["a@example.test", "b@example.test"], message },
    ]);
  });

  it("splits a large group into batches of the configured size", () => {
    const message = { kind: "k", subject: "s", title: "t", body: [] };
    const people = ["a", "b", "c"].map((name) => `${name}@example.test`);
    expect(blindCopiedToStaff(people, message, 2).map((envelope) => envelope.bcc)).toEqual([
      ["a@example.test", "b@example.test"],
      ["c@example.test"],
    ]);
  });

  it("sends nothing when nobody has an address", () => {
    expect(blindCopiedToStaff([null, undefined, " "], { kind: "k", subject: "s", title: "t", body: [] })).toEqual([]);
  });
});
