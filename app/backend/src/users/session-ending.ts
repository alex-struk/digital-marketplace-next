import { Inject, Injectable } from "@nestjs/common";
import type { Response } from "express";
import { IdentifiedRequest } from "../auth/bearer-token";
import { SESSION_COOKIE, ServiceSessions } from "../auth/service-sessions";
import { SignInFlowSettings, cookiesOf, endIdentityProviderSession } from "../auth/sign-in-flow";
import { SignedOutSessions } from "../auth/signed-out-sessions";
import { SIGN_IN_FLOW } from "./sign-in.controller";

/**
 * Ending the session a request was made in: the service's own, so no token it issued is accepted
 * again and its cookie is dropped (decision record 0017), and then the identity provider's
 * (decision record 0018). Signing out does this (R-4.17), and so does deactivating one's own
 * account, which ends the session at once (R-4.9).
 */
@Injectable()
export class SessionEnding {
  constructor(
    private readonly signedOut: SignedOutSessions,
    private readonly sessions: ServiceSessions,
    @Inject(SIGN_IN_FLOW) private readonly flow: SignInFlowSettings | null,
  ) {}

  /** Whether the identity provider's session was ended too. */
  async end(request: IdentifiedRequest, response: Response): Promise<boolean> {
    const identity = request.identity;
    const cookieSession = cookiesOf(request.headers.cookie)[SESSION_COOKIE];
    // Taken before the service's session is ended, which forgets it.
    const refreshToken = identity
      ? this.sessions.refreshTokenFor(cookieSession, identity.sessionId)
      : null;
    if (identity?.sessionId) this.signedOut.end(identity.sessionId, identity.expiresAt);
    this.sessions.end(cookieSession, identity?.sessionId ?? null);
    response.clearCookie(SESSION_COOKIE, { path: "/", sameSite: "lax" });
    // When it cannot be ended from here, the answer says so and the page ends it itself.
    return refreshToken !== null && this.flow !== null
      ? endIdentityProviderSession(this.flow, refreshToken)
      : false;
  }
}
