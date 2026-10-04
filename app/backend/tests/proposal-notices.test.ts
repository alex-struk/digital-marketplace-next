import { describe, expect, it, vi } from "vitest";
import { Mailer } from "../src/mail/mailer";
import { Envelope, addressedToEach } from "../src/mail/message";
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
  it.each(PROGRAMS)("in %s, tells the vendor and each administrator in a message addressed to them alone", async (program) => {
    const { notices, sent } = setUp();
    const subject = { program, opportunityId: "o-1", opportunityTitle: "Build a tracker", proposalId: "p-1" };
    notices.withdrawn({ subject, vendor: "vendor" }, "Northern Pines Digital Ltd.");
    await vi.waitFor(() => expect(sent).toHaveLength(3));
    expect(sent.map((envelope) => envelope.to)).toEqual([["vendor@example.test"], ["admin.one@example.test"], ["admin.two@example.test"]]);
    expect(sent.every((envelope) => !envelope.bcc || envelope.bcc.length === 0)).toBe(true);
    expect(sent[1]!.message.body.some((block) => block.kind === "paragraph" && block.content.join("").includes("Northern Pines Digital Ltd."))).toBe(true);
  });
});

describe("one message to each of several people", () => {
  it("addresses each copy to one reader, skipping a missing address and a repeated one", () => {
    const message = { kind: "k", subject: "s", title: "t", body: [] };
    expect(addressedToEach(["a@example.test", null, "A@example.test", "b@example.test"], message)).toEqual([
      { to: ["a@example.test"], message },
      { to: ["b@example.test"], message },
    ]);
  });
});
