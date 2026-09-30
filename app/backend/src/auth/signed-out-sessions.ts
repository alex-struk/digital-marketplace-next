/**
 * Identity-provider sessions a person has signed out of (R-4.17).
 *
 * Signing out ends the session at the identity provider, but an access token it had already
 * issued stays well formed until it expires. The service remembers the sessions signed out of
 * until the last of their tokens would have expired, and refuses those tokens meanwhile, so
 * that nothing the person held before signing out still works afterwards.
 *
 * The token signed out with is not always the last one the session issued: another tab may
 * have renewed its own a moment later. Once the identity provider has ended the session it
 * issues no more, so every token it did issue runs out within one token lifetime of signing
 * out. A session is remembered for at least that long.
 *
 * Held in memory: a sandbox runs one instance of the service. A service run as several
 * instances would need this shared between them.
 */
export class SignedOutSessions {
  private readonly ended = new Map<string, number>();

  constructor(
    private readonly now: () => number = () => Date.now() / 1000,
    /**
     * The longest an access token is good for, in seconds. The sandbox realm issues them for
     * five minutes; an hour covers any realm configured more generously.
     */
    private readonly longestTokenLifetime: number = 3600,
  ) {}

  end(sessionId: string, until: number): void {
    const existing = this.ended.get(sessionId) ?? 0;
    this.ended.set(sessionId, Math.max(existing, until, this.now() + this.longestTokenLifetime));
    this.forgetExpired();
  }

  hasEnded(sessionId: string | null): boolean {
    if (!sessionId) return false;
    const until = this.ended.get(sessionId);
    if (until === undefined) return false;
    if (until < this.now()) {
      this.ended.delete(sessionId);
      return false;
    }
    return true;
  }

  private forgetExpired(): void {
    const now = this.now();
    for (const [sessionId, until] of this.ended) {
      if (until < now) this.ended.delete(sessionId);
    }
  }
}
