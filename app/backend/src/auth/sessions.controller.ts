import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
} from "@nestjs/common";
import { AccountsService } from "../users/accounts.service";
import type { User } from "../users/user";
import { EndedSessions } from "./ended-sessions";
import { CurrentRequester, Requester, sessionKeyOf } from "./requester";

/**
 * A sign-in session as the service answers with it (decision record 0011): which session it
 * is, and the account signed in, which is absent when nobody is.
 */
export interface Session {
  readonly id: string;
  readonly user?: User;
}

/** The address that stands for whoever is asking. */
export const CURRENT = "current";

@Controller("api/sessions")
export class SessionsController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly ended: EndedSessions,
  ) {}

  /**
   * The service's side of signing in (decision records 0003, 0004). With an accepted token it
   * finds or makes the account the token's identity signs in as, and refuses one that may
   * not sign in; with none it answers with no account at all.
   */
  @Get(":id")
  async read(
    @Param("id") id: string,
    @CurrentRequester() requester: Requester,
  ): Promise<Session> {
    const { claims } = requester;
    if (!claims) return { id: CURRENT };
    if (!isThisSession(id, claims.sessionId)) {
      throw new ForbiddenException("That is not your session.");
    }
    const user = await this.accounts.signIn(claims, requester.account);
    return { id: claims.sessionId ?? CURRENT, user };
  }

  /**
   * Sign out (R-4.17). The browser ends the identity provider's session; the service stops
   * accepting any token from it. Only one's own session can be ended.
   */
  @Delete(":id")
  @HttpCode(200)
  end(
    @Param("id") id: string,
    @CurrentRequester() requester: Requester,
  ): Session {
    const { claims, token } = requester;
    if (!claims || !token) {
      if (id !== CURRENT) throw new ForbiddenException("That is not your session.");
      return { id: CURRENT };
    }
    if (!isThisSession(id, claims.sessionId)) {
      throw new ForbiddenException("That is not your session.");
    }
    this.ended.end(sessionKeyOf(token, claims), claims.expiresAt);
    return { id: claims.sessionId ?? CURRENT };
  }
}

function isThisSession(id: string, sessionId: string | null): boolean {
  return id === CURRENT || (sessionId !== null && id === sessionId);
}
