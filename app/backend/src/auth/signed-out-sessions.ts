/**
 * Identity-provider sessions a person has signed out of (R-4.17).
 *
 * Signing out ends the session at the identity provider, but an access token it had already
 * issued stays well formed until it expires. The service remembers the sessions signed out of
 * until the last of their tokens would have expired, and refuses those tokens meanwhile, so
 * that nothing the person held before signing out still works afterwards.
 *
 * Held in memory: a sandbox runs one instance of the service. A service run as several
 * instances would need this shared between them.
 */
export class SignedOutSessions {
  private readonly ended = new Map<string, number>();

  constructor(private readonly now: () => number = () => Date.now() / 1000) {}

  end(sessionId: string, until: number): void {
    const existing = this.ended.get(sessionId) ?? 0;
    this.ended.set(sessionId, Math.max(existing, until));
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
