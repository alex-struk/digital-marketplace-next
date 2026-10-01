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
import { Account } from "./account";
import { AccountsService } from "./accounts.service";
import { SessionEnding } from "./session-ending";

/**
 * A session as the service answers with it (decision record 0011): the identity provider's
 * session the token belongs to, and the account signed in with it. A visitor's session names
 * neither.
 */
export interface Session {
  readonly id: string | null;
  readonly user: Account | null;
}

/**
 * A session once signed out of: nobody in it, and whether the identity provider's session was
 * ended too (decision record 0018).
 */
export interface SignedOut extends Session {
  readonly identityProviderSignedOut: boolean;
}

/** The address that stands for whoever is asking (decision record 0011). */
export const CURRENT = "current";

@Controller("api/sessions")
export class SessionsController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly ending: SessionEnding,
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
   * Signing out (R-4.17). The session is ended here, so no token it issued is accepted again,
   * and then at the identity provider; the single-page app ends it there itself only when the
   * answer says the service could not. A person may end only their own session.
   */
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Req() request: IdentifiedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignedOut> {
    this.mustBeOwn(id, request);
    const identity = request.identity;
    // The service's own session ends, whichever way the request was identified (decision
    // record 0017), and then the identity provider's, so the person is signed out of both by
    // this one request (R-4.17; decision record 0018).
    const identityProviderSignedOut = await this.ending.end(request, response);
    return { id: identity?.sessionId ?? null, user: null, identityProviderSignedOut };
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
