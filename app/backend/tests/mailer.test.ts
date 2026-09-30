import { describe, expect, it } from "vitest";
import { ConfigurationError, MailConfig, parseSender, readConfig } from "../src/common/config";
import { htmlToText } from "../src/mail/html-to-text";
import { Envelope, Mailer, Outgoing, Transport } from "../src/mail/mailer";
import type { MessageContent } from "../src/mail/templates";

const ORIGIN = "http://localhost:4300";

function config(overrides: Partial<MailConfig> = {}): MailConfig {
  return {
    from: { name: "Digital Marketplace", address: "donotreply@example.test" },
    smtp: { host: "localhost", port: 1025 },
    disabled: false,
    markAsTest: false,
    ...overrides,
  };
}

class RecordingTransport implements Transport {
  readonly delivered: Envelope[] = [];
  constructor(private readonly refuse: (envelope: Envelope) => boolean = () => false) {}
  async deliver(envelope: Envelope): Promise<void> {
    if (this.refuse(envelope)) throw Object.assign(new Error("refused <someone@example.test>"), { responseCode: 451 });
    this.delivered.push(envelope);
  }
}

const content: MessageContent = {
  subject: "Welcome to the Digital Marketplace",
  title: "Welcome to the Digital Marketplace",
  paragraphs: ["Thank you for creating your account & signing in."],
  callToAction: { text: "Sign in", url: `${ORIGIN}/sign-in` },
};

function message(to: string | null, bcc?: (string | null)[]): Outgoing {
  return { to, bcc, compose: () => content };
}

function mailerWith(transport: Transport, overrides: Partial<MailConfig> = {}) {
  const failures: string[] = [];
  const mailer = new Mailer(config(overrides), ORIGIN, transport, {
    failed: (event, detail) => failures.push(`${event}: ${detail}`),
  });
  return { mailer, failures };
}

describe("the sender (R-6.4)", () => {
  it("is the one configured display name and address, with no reply-to of its own", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport);

    mailer.send([message("vendor.one@example.test")]);
    await mailer.settled();

    expect(transport.delivered).toHaveLength(1);
    expect(transport.delivered[0]?.from).toBe('"Digital Marketplace" <donotreply@example.test>');
    expect(Object.keys(transport.delivered[0] ?? {})).not.toContain("replyTo");
  });

  it("must be a display name followed by an address in angle brackets, or the service does not start", () => {
    expect(parseSender("Digital Marketplace <donotreply@example.test>")).toEqual({
      name: "Digital Marketplace",
      address: "donotreply@example.test",
    });
    expect(() => parseSender("donotreply@example.test")).toThrow(ConfigurationError);
    expect(() => readConfig({ MAILER_FROM: "nobody" })).toThrow(ConfigurationError);
  });

  it("defaults to the configured sender every target uses", () => {
    expect(readConfig({}).mail.from).toEqual({
      name: "Digital Marketplace",
      address: "donotreply@example.test",
    });
  });
});

describe("the two forms of every message (R-6.5)", () => {
  it("sends a formatted form and a plain-text form rendered from it, with the same words and links", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport);

    mailer.send([message("vendor.one@example.test")]);
    await mailer.settled();

    const sent = transport.delivered[0];
    expect(sent?.html).toContain("<h1");
    expect(sent?.html).toContain(`href="${ORIGIN}/sign-in"`);
    expect(sent?.text).toContain("Welcome to the Digital Marketplace");
    expect(sent?.text).toContain("Thank you for creating your account & signing in.");
    expect(sent?.text).toContain(`Sign in (${ORIGIN}/sign-in)`);
    expect(sent?.text).not.toMatch(/<[a-z]/i);
    expect(sent?.text).toBe(htmlToText(sent?.html ?? ""));
  });
});

describe("a test environment's messages (R-6.3)", () => {
  it("are marked as tests in the subject and carry the test logo", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport, { markAsTest: true });

    mailer.send([message("vendor.one@example.test")]);
    await mailer.settled();

    expect(transport.delivered[0]?.subject).toBe("[TEST] Welcome to the Digital Marketplace");
    expect(transport.delivered[0]?.html).toContain(`src="${ORIGIN}/images/logo_test.png"`);
  });

  it("are not marked anywhere else", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport);

    mailer.send([message("vendor.one@example.test")]);
    await mailer.settled();

    expect(transport.delivered[0]?.subject).toBe("Welcome to the Digital Marketplace");
    expect(transport.delivered[0]?.html).toContain(`src="${ORIGIN}/images/logo.png"`);
  });
});

describe("notifications switched off (R-6.1)", () => {
  it("sends nothing, and the caller carries on", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport, { disabled: true });

    expect(() => mailer.send([message("vendor.one@example.test")])).not.toThrow();
    await mailer.settled();

    expect(transport.delivered).toEqual([]);
  });
});

describe("a message that cannot be composed or delivered (R-6.2)", () => {
  it("never fails or holds up the caller, is logged without the address, and is not retried", async () => {
    let attempts = 0;
    const transport = new RecordingTransport(() => {
      attempts += 1;
      return true;
    });
    const { mailer, failures } = mailerWith(transport);

    const returned = (() => {
      mailer.send([message("vendor.one@example.test")]);
      return "answered";
    })();
    expect(returned).toBe("answered");
    expect(attempts).toBe(0);

    await mailer.settled();
    expect(attempts).toBe(1);
    expect(failures).toEqual(["mail-not-sent: 451"]);
    expect(failures.join(" ")).not.toContain("@");
  });

  it("does not stop the messages after it", async () => {
    const transport = new RecordingTransport((envelope) => envelope.to === "first@example.test");
    const { mailer } = mailerWith(transport);
    const broken: Outgoing = {
      to: "broken@example.test",
      compose: () => {
        throw new Error("could not compose");
      },
    };

    mailer.send([message("first@example.test"), broken, message("last@example.test")]);
    await mailer.settled();

    expect(transport.delivered.map((envelope) => envelope.to)).toEqual(["last@example.test"]);
  });
});

describe("a recipient with no address (R-6.28)", () => {
  it("is skipped, and a message left with nobody to go to is never composed", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport);
    let composed = 0;

    mailer.send([
      {
        to: null,
        compose: () => {
          composed += 1;
          return content;
        },
      },
    ]);
    await mailer.settled();

    expect(composed).toBe(0);
    expect(transport.delivered).toEqual([]);
  });

  it("is left out of a message to many, which still reaches everyone else", async () => {
    const transport = new RecordingTransport();
    const { mailer } = mailerWith(transport);

    mailer.send([message(null, ["one@example.test", null, "", "two@example.test"])]);
    await mailer.settled();

    expect(transport.delivered).toHaveLength(1);
    expect(transport.delivered[0]?.to).toBe("one@example.test");
    expect(transport.delivered[0]?.bcc).toEqual(["two@example.test"]);
  });
});

describe("the plain-text rendering", () => {
  it("keeps words and link addresses, drops markup, and decodes entities", () => {
    const text = htmlToText(
      '<html><head><title>x</title></head><body><h1>Title</h1><p>One &amp; two</p><ul><li>First</li><li><a href="https://example.test/a?b=1&amp;c=2">Go</a></li></ul><img src="logo.png" alt="Logo"></body></html>',
    );
    expect(text).toBe("Title\n\nOne & two\n\n- First\n- Go (https://example.test/a?b=1&c=2)\n\nLogo");
  });
});
