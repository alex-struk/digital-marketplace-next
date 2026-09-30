import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { IdentifiedRequest } from "../auth/bearer-token";
import { SESSION_COOKIE, ServiceSessions } from "../auth/service-sessions";
import { cookiesOf } from "../auth/sign-in-flow";
import { SignedOutSessions } from "../auth/signed-out-sessions";
import { Account } from "./account";
import { AccountsService } from "./accounts.service";

/**
 * A session as the service answers with it (decision record 0011): the identity provider's
 * session the token belongs to, and the account signed in with it. A visitor's session names
 * neither.
 */
export interface Session {
  readonly id: string | null;
  readonly user: Account | null;
}

/** The address that stands for whoever is asking (decision record 0011). */
export const CURRENT = "current";

@Controller("api/sessions")
export class SessionsController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly signedOut: SignedOutSessions,
    private readonly sessions: ServiceSessions,
  ) {}

  /**
   * The asker's own session. Reading it is how the single-page app completes sign-in: the
   * account is made on a person's first sign-in and found on every later one (R-4.1), and an
   * account that may not sign in is refused (R-4.4). A visitor gets a session with nobody in
   * it.
   */
  @Get(":id")
  async read(@Param("id") id: string, @Req() request: IdentifiedRequest): Promise<Session> {
    this.mustBeOwn(id, request);
    const identity = request.identity;
    if (!identity) return { id: null, user: null };
    const { account } = await this.accounts.signIn(identity);
    return { id: identity.sessionId, user: account };
  }

  /**
   * Signing out of the service (R-4.17). The session is ended here, so no token it issued is
   * accepted again; the single-page app then ends it at the identity provider. A person may
   * end only their own session.
   */
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Req() request: IdentifiedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Session> {
    this.mustBeOwn(id, request);
    const identity = request.identity;
    if (identity?.sessionId) this.signedOut.end(identity.sessionId, identity.expiresAt);
    // The service's own session ends with it, whichever way the request was identified
    // (decision record 0017), and the browser is told to drop its cookie.
    this.sessions.end(
      cookiesOf(request.headers.cookie)[SESSION_COOKIE],
      identity?.sessionId ?? null,
    );
    response.clearCookie(SESSION_COOKIE, { path: "/", sameSite: "lax" });
    return { id: identity?.sessionId ?? null, user: null };
  }

  /** "current", or the asker's own session by its identifier; anybody else's is refused. */
  private mustBeOwn(id: string, request: IdentifiedRequest): void {
    if (id === CURRENT) return;
    if (request.identity?.sessionId && request.identity.sessionId === id) return;
    if (request.identity) {
      throw new ForbiddenException("You may only use your own session.");
    }
    throw new NotFoundException("No session is held at that address.");
  }
}
