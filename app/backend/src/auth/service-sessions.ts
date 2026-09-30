import { randomUUID } from "node:crypto";
import { Identity } from "./identity";

/**
 * The service's own sessions, carried by the browser in an `HttpOnly` cookie (decision record
 * 0017).
 *
 * The single-page app presents a bearer token on every request it makes. A request the app did
 * not make — an address followed or fetched by the browser itself, as the old service's
 * cookie session allowed — carries no token, and without this would be answered as a
 * visitor's even though the person signed in a moment ago. Completing sign-in therefore also
 * begins one of these, and a request with no bearer token is answered for whoever it names.
 *
 * A session stands for the identity the token checked at sign-in named. It lasts as long as
 * the identity provider's own sessions may (ten hours, Keycloak's default), and ends when the
 * person signs out (R-4.17), together with every other session begun from the same identity
 * provider session. It keeps the refresh token sign-in was completed with, so that signing out
 * can end the identity provider's session from here (decision record 0018).
 *
 * Held in memory, like the sessions signed out of: a sandbox runs one instance of the service.
 */
export const SESSION_COOKIE = "dm-session";

export const SESSION_LIFETIME_SECONDS = 10 * 60 * 60;

interface Held {
  readonly identity: Identity;
  readonly until: number;
  /**
   * The refresh token sign-in was completed with. Signing out presents it to the identity
   * provider, so the service ends that session itself rather than leaving it to the page.
   */
  readonly refreshToken: string | null;
}

export class ServiceSessions {
  private readonly held = new Map<string, Held>();

  constructor(
    private readonly now: () => number = () => Date.now() / 1000,
    private readonly lifetime: number = SESSION_LIFETIME_SECONDS,
    private readonly newId: () => string = randomUUID,
  ) {}

  /** Begins a session for the person a checked token named; its identifier goes in the cookie. */
  begin(identity: Identity, refreshToken: string | null = null): string {
    this.forgetExpired();
    const id = this.newId();
    this.held.set(id, { identity, until: this.now() + this.lifetime, refreshToken });
    return id;
  }

  /**
   * The refresh token to end the identity provider's session with: the one this cookie's
   * session was begun with, or else one kept for the same identity-provider session.
   */
  refreshTokenFor(
    id: string | null | undefined,
    identityProviderSession: string | null = null,
  ): string | null {
    const own = id ? this.held.get(id) : undefined;
    if (own?.refreshToken) return own.refreshToken;
    const session = own?.identity.sessionId ?? identityProviderSession;
    if (!session) return null;
    for (const held of this.held.values()) {
      if (held.identity.sessionId === session && held.refreshToken) return held.refreshToken;
    }
    return null;
  }

  /** Whose session this is, or null for one never begun, ended, or run out. */
  find(id: string | null | undefined): Identity | null {
    if (!id) return null;
    const held = this.held.get(id);
    if (!held) return null;
    if (held.until <= this.now()) {
      this.held.delete(id);
      return null;
    }
    return held.identity;
  }

  /** Ends one session, and every other begun from the same identity-provider session. */
  end(id: string | null | undefined, identityProviderSession: string | null = null): void {
    const sessionOfId = id ? this.held.get(id)?.identity.sessionId ?? null : null;
    if (id) this.held.delete(id);
    for (const ended of [identityProviderSession, sessionOfId]) {
      if (!ended) continue;
      for (const [other, held] of this.held) {
        if (held.identity.sessionId === ended) this.held.delete(other);
      }
    }
  }

  private forgetExpired(): void {
    const now = this.now();
    for (const [id, held] of this.held) {
      if (held.until <= now) this.held.delete(id);
    }
  }
}
