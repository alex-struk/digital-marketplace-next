import { describe, expect, it, vi } from "vitest";
import { MailLog, Mailer, MailTransport, OutgoingMail, RecipientStanding } from "../src/mail/mailer";
import { Envelope, Message, blindCopiedToStaff } from "../src/mail/message";
import { renderHtml, renderText, render } from "../src/mail/render";
import { mailSettingsFrom, parseSender, MailSettings } from "../src/mail/settings";
import { welcome } from "../src/mail/notifications/welcome";

const settings: MailSettings = {
  from: "Digital Marketplace <donotreply@example.test>",
  fromAddress: "donotreply@example.test",
  disabled: false,
  testEnvironment: true,
  serviceOrigin: "http://localhost:4300",
  contactEmail: "digitalmarketplace@example.test",
  smtp: { host: "mail", port: 1025 },
};

const message: Message = {
  kind: "sample",
  subject: "A sample & a test",
  title: "A <sample> message",
  body: [
    {
      kind: "paragraph",
      content: ["Read ", { text: "the terms", href: "http://localhost:4300/content/terms-and-conditions" }, " first."],
    },
    { kind: "action", label: "Sign in", href: "http://localhost:4300/sign-in" },
  ],
};

class RecordingTransport implements MailTransport {
  readonly sent: OutgoingMail[] = [];
  failWith: unknown = null;
  async deliver(mail: OutgoingMail): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(mail);
  }
}

function mailerWith(overrides: Partial<MailSettings> = {}) {
  const transport = new RecordingTransport();
  const log = vi.fn<MailLog>();
  const mailer = new Mailer({ ...settings, ...overrides }, transport, log);
  return { mailer, transport, log };
}

const envelope = (to: (string | null)[], bcc?: (string | null)[]): Envelope => ({
  to,
  bcc,
  message,
});

describe("the configured sender (R-6.4)", () => {
  it("is a display name followed by one address in angle brackets", () => {
    expect(parseSender("Digital Marketplace <DoNotReply@example.test>")).toEqual({
      name: "Digital Marketplace",
      address: "donotreply@example.test",
    });
  });

  it("stops the service starting when it is anything else", () => {
    for (const bad of ["donotreply@example.test", "<donotreply@example.test>", "Name <not-an-address>", "Name"]) {
      expect(() => parseSender(bad), bad).toThrow(/MAILER_FROM/);
      expect(() => mailSettingsFrom({ MAILER_FROM: bad }), bad).toThrow(/MAILER_FROM/);
    }
  });

  it("is what every message comes from, with no reply-to of its own", async () => {
    const { mailer, transport } = mailerWith();

    await mailer.deliver(envelope(["vendor.one@example.test"]));

    expect(transport.sent[0]?.from).toBe("Digital Marketplace <donotreply@example.test>");
    expect(transport.sent[0]).not.toHaveProperty("replyTo");
  });
});

describe("a notice to a panel's chair and an opportunity's owner (R-6.15)", () => {
  it("is visibly addressed to the service alone and carries them as blind copies", async () => {
    const { mailer, transport } = mailerWith();
    const [batch] = blindCopiedToStaff(["chair@example.test", "owner@example.test"], { kind: "k", subject: "s", title: "t", body: [] });
    await mailer.deliver(batch!);
    expect(transport.sent[0]?.to).toEqual(["donotreply@example.test"]);
    expect(transport.sent[0]?.bcc).toEqual(["chair@example.test", "owner@example.test"]);
  });
});

describe("the environment switches (R-6.1, R-6.3)", () => {
  it("are read from the environment once", () => {
    const read = mailSettingsFrom({
      DISABLE_NOTIFICATIONS: "1",
      SHOW_TEST_INDICATOR: "true",
      SERVICE_ORIGIN: "http://localhost:4300/",
    });
    expect(read.disabled).toBe(true);
    expect(read.testEnvironment).toBe(true);
    expect(read.serviceOrigin).toBe("http://localhost:4300");
    expect(read.from).toBe("Digital Marketplace <donotreply@example.test>");

    const plain = mailSettingsFrom({});
    expect(plain.disabled).toBe(false);
    expect(plain.testEnvironment).toBe(false);
  });

  it("send nothing at all when notifications are switched off", async () => {
    const { mailer, transport } = mailerWith({ disabled: true });

    expect(await mailer.deliver(envelope(["vendor.one@example.test"]))).toBe("switched-off");
    expect(transport.sent).toEqual([]);
  });

  it("mark a test environment's subject and use the test variant of the logo", () => {
    const rendered = render(message, settings);

    expect(rendered.subject).toBe("[TEST] A sample & a test");
    expect(rendered.html).toContain('src="http://localhost:4300/images/logo_test.png"');
  });

  it("leave a real environment's messages unmarked", () => {
    const rendered = render(message, { ...settings, testEnvironment: false });

    expect(rendered.subject).toBe("A sample & a test");
    expect(rendered.html).toContain('src="http://localhost:4300/images/logo.png"');
  });
});

describe("the two forms of a message (R-6.5)", () => {
  it("carry the same words and the same links", () => {
    const html = renderHtml(message, settings);
    const text = renderText(message, settings);

    for (const words of ["A <sample> message", "Read ", "the terms", " first.", "Sign in"]) {
      expect(text).toContain(words);
    }
    expect(html).toContain("A &lt;sample&gt; message");
    for (const link of [
      "http://localhost:4300/content/terms-and-conditions",
      "http://localhost:4300/sign-in",
    ]) {
      expect(html).toContain(`href="${link}"`);
      expect(text).toContain(link);
    }
  });

  it("are both handed to the mail server", async () => {
    const { mailer, transport } = mailerWith();

    await mailer.deliver(envelope(["vendor.one@example.test"]));

    expect(transport.sent[0]?.html).toContain("<h1");
    expect(transport.sent[0]?.text).toContain("Sign in: http://localhost:4300/sign-in");
  });
});

describe("recipients (R-6.28)", () => {
  it("are skipped when they hold no address, and nothing is sent when that leaves nobody", async () => {
    const { mailer, transport, log } = mailerWith();

    expect(await mailer.deliver(envelope([null, "  "]))).toBe("no-recipient");
    expect(transport.sent).toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ event: "mail-skipped-no-address" }));
  });

  it("without an address are left out of a batch that still goes to the rest", async () => {
    const { mailer, transport } = mailerWith();

    await mailer.deliver(envelope([], ["a@example.test", null, "b@example.test"]));

    expect(transport.sent[0]?.bcc).toEqual(["a@example.test", "b@example.test"]);
    // A batch of blind copies is visibly addressed to the service itself.
    expect(transport.sent[0]?.to).toEqual(["donotreply@example.test"]);
  });

  it("who cannot be reached do not stop the next message", async () => {
    const transport = new RecordingTransport();
    const deliver = vi
      .spyOn(transport, "deliver")
      .mockRejectedValueOnce(Object.assign(new Error("refused"), { responseCode: 451 }));
    const log = vi.fn<MailLog>();
    const mailer = new Mailer(settings, transport, log);

    mailer.sendEach([envelope(["first@example.test"]), envelope([null]), envelope(["third@example.test"])]);
    await vi.waitFor(() => expect(deliver).toHaveBeenCalledTimes(2));

    expect(transport.sent.map((mail) => mail.to)).toEqual([["third@example.test"]]);
  });
});

describe("a message that cannot be delivered (R-6.2)", () => {
  it("is written to the log, without an address, and never thrown", async () => {
    const { mailer, transport, log } = mailerWith();
    transport.failWith = Object.assign(new Error("connect ECONNREFUSED vendor.one@example.test"), {
      code: "ESOCKET",
    });

    expect(await mailer.deliver(envelope(["vendor.one@example.test"]))).toBe("not-delivered");
    expect(log).toHaveBeenCalledWith({
      level: "error",
      event: "mail-not-delivered",
      kind: "sample",
      reason: "ESOCKET",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain("example.test");
  });

  it("does not hold up the action that sent it", async () => {
    const { mailer, transport } = mailerWith();
    let release: () => void = () => {};
    vi.spyOn(transport, "deliver").mockReturnValue(new Promise<void>((resolve) => (release = resolve)));

    const started = Date.now();
    mailer.send(envelope(["vendor.one@example.test"]));
    expect(Date.now() - started).toBeLessThan(50);
    release();
  });

  it("is tried once and only once", async () => {
    const { mailer, transport } = mailerWith();
    const deliver = vi.spyOn(transport, "deliver").mockRejectedValue(new Error("down"));

    mailer.send(envelope(["vendor.one@example.test"]));
    await vi.waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(deliver).toHaveBeenCalledTimes(1);
  });
});

describe("the welcome message (R-4.2)", () => {
  it("welcomes the person and offers a way back to sign in", () => {
    const { to, message: welcoming } = welcome({ email: "first.vendor@example.test" }, "http://localhost:4300");

    expect(to).toEqual(["first.vendor@example.test"]);
    expect(welcoming.subject).toMatch(/Welcome/);
    expect(welcoming.body).toContainEqual({
      kind: "action",
      label: "Sign in",
      href: "http://localhost:4300/sign-in",
    });
  });

  it("is sent to nobody when no address is known", async () => {
    const { mailer, transport } = mailerWith();

    expect(await mailer.deliver(welcome({ email: null }, "http://localhost:4300"))).toBe("no-recipient");
    expect(transport.sent).toEqual([]);
  });
});

describe("an address held only by a deactivated account (R-6.17)", () => {
  const deactivated: RecipientStanding = {
    deactivatedOnly: async (addresses) =>
      new Set(addresses.map((address) => address.toLowerCase()).filter((address) => address.startsWith("gone"))),
  };

  function guardedMailer(standing: RecipientStanding = deactivated) {
    const transport = new RecordingTransport();
    const log = vi.fn<MailLog>();
    return { mailer: new Mailer(settings, transport, log, standing), transport, log };
  }

  it("is taken out of a batch as the message goes, and the rest still receive it", async () => {
    const { mailer, transport } = guardedMailer();

    await mailer.deliver(envelope([], ["vendor.one@example.test", "Gone.Watcher@example.test", "proponent.two@example.test"]));

    expect(transport.sent).toHaveLength(1);
    expect(transport.sent[0]?.bcc).toEqual(["vendor.one@example.test", "proponent.two@example.test"]);
  });

  it("is sent nothing when it was the only recipient", async () => {
    const { mailer, transport } = guardedMailer();

    expect(await mailer.deliver(envelope(["gone.watcher@example.test"]))).toBe("no-recipient");
    expect(transport.sent).toEqual([]);
  });

  it("still receives the notice that its account has been deactivated (R-4.9, R-4.30)", async () => {
    const { mailer, transport } = guardedMailer();
    for (const kind of ["deactivated-own-account", "deactivated-by-administrator"]) {
      await mailer.deliver({ to: ["gone.watcher@example.test"], message: { ...message, kind } });
    }

    expect(transport.sent.map((mail) => mail.to)).toEqual([["gone.watcher@example.test"], ["gone.watcher@example.test"]]);
  });

  it("is never guessed at: when the accounts cannot be read the message is not sent, and only the log knows", async () => {
    const failing: RecipientStanding = { deactivatedOnly: async () => Promise.reject(new Error("down")) };
    const { mailer, transport, log } = guardedMailer(failing);

    expect(await mailer.deliver(envelope(["vendor.one@example.test"]))).toBe("not-delivered");
    expect(transport.sent).toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ event: "mail-not-delivered" }));
  });
});
