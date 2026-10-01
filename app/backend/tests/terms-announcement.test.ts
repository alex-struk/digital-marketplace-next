import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { MailLog, Mailer, MailTransport, OutgoingMail } from "../src/mail/mailer";
import { MailSettings } from "../src/mail/settings";
import { termsUpdated } from "../src/mail/notifications/terms-updated";
import { render } from "../src/mail/render";
import {
  ONLY_ADMINISTRATORS_ANNOUNCE,
  TermsAnnouncement,
  TermsStore,
  VendorToTell,
} from "../src/notifications/terms-announcement";

const settings: MailSettings = {
  from: "Digital Marketplace <donotreply@example.test>",
  fromAddress: "donotreply@example.test",
  disabled: false,
  testEnvironment: true,
  serviceOrigin: "http://localhost:4300",
  contactEmail: "digitalmarketplace@example.test",
  smtp: { host: "mail", port: 1025 },
};

interface Vendor extends VendorToTell {
  active: boolean;
  acceptedTermsAt: string | null;
  lastAcceptedTermsAt: string | null;
}

/** Vendors in memory, recording the order things happened in. */
class VendorsInMemory implements TermsStore {
  readonly events: string[] = [];
  constructor(readonly vendors: Vendor[]) {}

  async withdrawVendorAcceptances() {
    const touched = this.vendors.filter((vendor) => vendor.acceptedTermsAt !== null);
    for (const vendor of touched) vendor.acceptedTermsAt = null;
    this.events.push("withdrawn");
    return touched.length;
  }

  unreadable = false;

  async activeVendors() {
    this.events.push("read active vendors");
    if (this.unreadable) throw new Error("connection lost");
    return this.vendors.filter((vendor) => vendor.active).map(({ id, email }) => ({ id, email }));
  }
}

class RecordingTransport implements MailTransport {
  readonly sent: OutgoingMail[] = [];
  readonly unreachable = new Set<string>();
  constructor(private readonly events: string[]) {}
  async deliver(mail: OutgoingMail) {
    if (mail.to.some((address) => this.unreachable.has(address))) {
      throw Object.assign(new Error("refused"), { responseCode: 550 });
    }
    this.events.push(`sent ${mail.to.join(",")}`);
    this.sent.push(mail);
  }
}

const ADMINISTRATOR = { id: "admin", type: "ADMIN" as const };

const vendor = (id: string, email: string | null, active = true): Vendor => ({
  id,
  email,
  active,
  acceptedTermsAt: "2026-09-01T17:30:00.000Z",
  lastAcceptedTermsAt: "2026-09-01T17:30:00.000Z",
});

function announcementWith(vendors: Vendor[]) {
  const store = new VendorsInMemory(vendors);
  const transport = new RecordingTransport(store.events);
  const mailer = new Mailer(settings, transport, vi.fn<MailLog>());
  return { store, transport, announcement: new TermsAnnouncement(store, mailer, settings) };
}

describe("announcing changed terms (R-6.23, R-4.16)", () => {
  it("withdraws every vendor's acceptance, deactivated ones too, and keeps when each last accepted", async () => {
    const { store, announcement } = announcementWith([
      vendor("v1", "one@example.test"),
      vendor("v2", "two@example.test", false),
    ]);

    const answer = await announcement.announce(ADMINISTRATOR);

    expect(answer).toEqual({ tag: "updateTerms", withdrawn: 2 });
    for (const each of store.vendors) {
      expect(each.acceptedTermsAt).toBeNull();
      expect(each.lastAcceptedTermsAt).toBe("2026-09-01T17:30:00.000Z");
    }
  });

  it("sends each active vendor a message of their own, and none to a deactivated one", async () => {
    const { transport, announcement } = announcementWith([
      vendor("v1", "one@example.test"),
      vendor("v2", "two@example.test", false),
      vendor("v3", "three@example.test"),
    ]);

    await announcement.announce(ADMINISTRATOR);
    await vi.waitFor(() => expect(transport.sent).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(transport.sent.map((mail) => mail.to)).toEqual([["one@example.test"], ["three@example.test"]]);
    expect(transport.sent.every((mail) => mail.bcc.length === 0)).toBe(true);
  });

  it("is refused to anybody but an administrator, and changes nothing", async () => {
    for (const viewer of [null, { id: "gov", type: "GOV" as const }, { id: "v1", type: "VENDOR" as const }]) {
      const { store, transport, announcement } = announcementWith([vendor("v1", "one@example.test")]);

      const refusal = announcement.announce(viewer);

      await expect(refusal).rejects.toBeInstanceOf(BadRequestException);
      await expect(refusal).rejects.toThrow(ONLY_ADMINISTRATORS_ANNOUNCE);
      expect(store.vendors[0]?.acceptedTermsAt).not.toBeNull();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(transport.sent).toEqual([]);
    }
  });
});

describe("the answer comes before the messages (R-6.24)", () => {
  it("is given once the acceptances are withdrawn, before any message is sent", async () => {
    const { store, announcement } = announcementWith([vendor("v1", "one@example.test")]);

    await announcement.announce(ADMINISTRATOR);
    store.events.push("answered");
    await vi.waitFor(() => expect(store.events).toContain("sent one@example.test"));

    expect(store.events).toEqual(["withdrawn", "answered", "read active vendors", "sent one@example.test"]);
  });

  it("keeps the withdrawal and the answer when the vendors to tell cannot be read", async () => {
    const { store, transport, announcement } = announcementWith([vendor("v1", "one@example.test")]);
    store.unreadable = true;

    const answer = await announcement.announce(ADMINISTRATOR);
    await vi.waitFor(() => expect(store.events).toContain("read active vendors"));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(answer).toEqual({ tag: "updateTerms", withdrawn: 1 });
    expect(store.vendors[0]?.acceptedTermsAt).toBeNull();
    expect(transport.sent).toEqual([]);
  });
});

describe("a broadcast past vendors it cannot address or reach (R-6.28)", () => {
  it("skips a vendor with no address and goes on past one the mail server refuses", async () => {
    const { transport, announcement } = announcementWith([
      vendor("v1", null),
      vendor("v2", "refused@example.test"),
      vendor("v3", "three@example.test"),
    ]);
    transport.unreachable.add("refused@example.test");

    await announcement.announce(ADMINISTRATOR);
    await vi.waitFor(() => expect(transport.sent).toHaveLength(1));

    expect(transport.sent[0]?.to).toEqual(["three@example.test"]);
  });
});

describe("the changed-terms message (R-6.18, R-6.16)", () => {
  const rendered = render(termsUpdated({ email: "one@example.test" }, settings.serviceOrigin).message, settings);

  it("names all three programs whose proposals need the new terms", () => {
    expect(rendered.text).toContain("Code With Us, Sprint With Us or Team With Us");
    expect(rendered.html).toContain("Code With Us, Sprint With Us or Team With Us");
  });

  it("links to the reader's legal section to read and accept them", () => {
    expect(rendered.text).toContain("http://localhost:4300/users/me?tab=legal");
  });

  it("does not offer to unsubscribe", () => {
    expect(rendered.text).not.toMatch(/unsubscribe/i);
  });
});
