import { Inject, Injectable, Optional } from "@nestjs/common";
import { CLOCK, Clock, systemClock } from "../common/clock";

/**
 * Identity-provider sessions a person has signed out of (R-4.17).
 *
 * Signing out ends the session at the identity provider, but a token it issued before then
 * is still well signed until it expires. The service remembers each ended session until the
 * last token that could name it has expired, and accepts no token from it in the meantime,
 * so "their session no longer exists" holds here too and not only in the browser.
 *
 * Held in memory: a restarted service forgets, and the tokens it forgot about expire within
 * the realm's token lifetime anyway.
 */
@Injectable()
export class EndedSessions {
  private readonly ended = new Map<string, number>();

  constructor(@Optional() @Inject(CLOCK) private readonly clock: Clock = systemClock) {}

  /** Remember a session as ended until `lastTokenExpiresAt`, in seconds since the epoch. */
  end(sessionId: string, lastTokenExpiresAt: number): void {
    this.forgetExpired();
    const previous = this.ended.get(sessionId) ?? 0;
    this.ended.set(sessionId, Math.max(previous, lastTokenExpiresAt));
  }

  has(sessionId: string): boolean {
    const until = this.ended.get(sessionId);
    if (until === undefined) return false;
    if (until * 1000 < this.clock().getTime()) {
      this.ended.delete(sessionId);
      return false;
    }
    return true;
  }

  private forgetExpired(): void {
    const now = this.clock().getTime();
    for (const [sessionId, until] of this.ended) {
      if (until * 1000 < now) this.ended.delete(sessionId);
    }
  }
}
