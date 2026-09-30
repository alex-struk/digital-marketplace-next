/**
 * How this installation sends mail, read once at start-up (R-6.1, R-6.3, R-6.4).
 */
export interface MailSettings {
  /** The one sender every message comes from, as "Display name <address>" (R-6.4). */
  readonly from: string;
  /** The sender's address alone, used as the visible recipient of a blind-copied batch. */
  readonly fromAddress: string;
  /** Nothing is sent at all when this is on (R-6.1). */
  readonly disabled: boolean;
  /** Every message is marked as coming from a test environment when this is on (R-6.3). */
  readonly testEnvironment: boolean;
  /** Where the service is reached, for the links and the logo in a message. */
  readonly serviceOrigin: string;
  readonly smtp: { readonly host: string; readonly port: number };
}

/** What the sandbox is configured with when nothing is said (spec/contract/observables.yaml). */
export const DEFAULT_SENDER = "Digital Marketplace <donotreply@example.test>";

/** The mark a test environment puts at the start of every subject (R-6.3). */
export const TEST_SUBJECT_PREFIX = "[TEST] ";

const SENDER_PATTERN = /^\s*([^<>]*[^<>\s])\s*<\s*([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)\s*>\s*$/;

/**
 * The configured sender must be a display name followed by one address in angle brackets.
 * The service refuses to start with anything else (R-6.4), rather than sending mail whose
 * sender a reader cannot recognise.
 */
export function parseSender(value: string): { name: string; address: string } {
  const match = SENDER_PATTERN.exec(value);
  if (!match) {
    throw new Error(
      'MAILER_FROM must be a display name followed by an address in angle brackets, like "Digital Marketplace <donotreply@example.test>".',
    );
  }
  return { name: match[1] as string, address: (match[2] as string).toLowerCase() };
}

function isOn(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

export function mailSettingsFrom(env: NodeJS.ProcessEnv): MailSettings {
  const sender = parseSender(env.MAILER_FROM?.trim() || DEFAULT_SENDER);
  const origin = (env.SERVICE_ORIGIN?.trim() || "http://localhost:4300").replace(/\/+$/, "");
  return {
    from: `${sender.name} <${sender.address}>`,
    fromAddress: sender.address,
    disabled: isOn(env.DISABLE_NOTIFICATIONS),
    testEnvironment: isOn(env.SHOW_TEST_INDICATOR),
    serviceOrigin: origin,
    smtp: {
      host: env.SMTP_HOST?.trim() || "localhost",
      port: Number(env.SMTP_PORT ?? 1025),
    },
  };
}
