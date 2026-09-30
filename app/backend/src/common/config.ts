/**
 * The settings the service reads from its environment, once, at start-up. Nothing else in
 * the service reads `process.env`; it is handed one of these.
 *
 * Every default below is the builder's machine (`app/compose/`), so the service starts with
 * nothing set. A setting that is present and malformed stops the service from starting
 * instead of letting it run misconfigured.
 */
export interface ServiceConfig {
  /** Where the service's own screens are, for links in messages. */
  readonly publicOrigin: string;
  readonly identity: IdentityConfig;
  readonly mail: MailConfig;
}

export interface IdentityConfig {
  /** The realm's issuer, exactly as it appears in the tokens a browser receives. */
  readonly issuer: string;
  /** Where the realm's signing keys are read from, which inside a sandbox is not the issuer's host. */
  readonly jwksUri: string;
  /** The single-page app's client, which every token accepted here was issued to. */
  readonly clientId: string;
}

export interface MailConfig {
  /** R-6.4: one sender for every message, as a display name and an address in angle brackets. */
  readonly from: { readonly name: string; readonly address: string };
  readonly smtp: { readonly host: string; readonly port: number };
  /** R-6.1: when true, nothing the service does sends a message. */
  readonly disabled: boolean;
  /** R-6.3: when true, every message is marked as coming from a test environment. */
  readonly markAsTest: boolean;
}

export class ConfigurationError extends Error {}

export const DEFAULT_SENDER = "Digital Marketplace <donotreply@example.test>";

/**
 * A sender given as `Display Name <address@domain>`, and nothing else (R-6.4). The service
 * refuses to start with any other form, as the old one did.
 */
export function parseSender(value: string): { name: string; address: string } {
  const match = /^\s*([^<>]+?)\s*<\s*([^\s<>@]+@[^\s<>@]+)\s*>\s*$/.exec(value);
  if (!match || !match[1] || !match[2]) {
    throw new ConfigurationError(
      "MAILER_FROM must be a display name followed by an address in angle brackets.",
    );
  }
  return { name: match[1], address: match[2] };
}

function flag(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test((value ?? "").trim());
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): ServiceConfig {
  const issuer = withoutTrailingSlash(
    env.OIDC_ISSUER ?? "http://localhost:8080/realms/digital-marketplace",
  );
  const port = Number(env.SMTP_PORT ?? 1025);
  if (!Number.isInteger(port) || port <= 0) {
    throw new ConfigurationError("SMTP_PORT must be a port number.");
  }
  return {
    publicOrigin: withoutTrailingSlash(env.PUBLIC_ORIGIN ?? "http://localhost:4300"),
    identity: {
      issuer,
      jwksUri: env.OIDC_JWKS_URI ?? `${issuer}/protocol/openid-connect/certs`,
      clientId: env.OIDC_CLIENT_ID ?? "digital-marketplace-app",
    },
    mail: {
      from: parseSender(env.MAILER_FROM ?? DEFAULT_SENDER),
      smtp: { host: env.SMTP_HOST ?? "localhost", port },
      disabled: flag(env.DISABLE_NOTIFICATIONS),
      markAsTest: flag(env.SHOW_TEST_INDICATOR),
    },
  };
}

export const SERVICE_CONFIG = Symbol("ServiceConfig");
