import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { accountKindForIdentity, accountKindsForIdentity } from "../rules/users";
import { USER_STORE, UserStore } from "../users/user";
import { EndedSessions } from "./ended-sessions";
import {
  ANONYMOUS,
  attachRequester,
  Requester,
  sessionKeyOf,
  tokenOf,
} from "./requester";
import { TOKEN_VERIFIER, TokenVerifier } from "./token-verifier";

/**
 * Runs in front of every route. It checks the bearer token the request carries and loads
 * the account the token signs in as, so each handler reads who is asking from one place.
 *
 * It never refuses anything itself: a request with no token, or a token this service does
 * not accept, is simply anonymous, and each route decides what an anonymous request may do.
 * A page of the service's prose needs nobody (R-7.1); an account change needs its owner.
 */
@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokens: TokenVerifier,
    @Inject(USER_STORE) private readonly users: UserStore,
    private readonly ended: EndedSessions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    attachRequester(request, await this.resolve(request));
    return true;
  }

  async resolve(request: Pick<Request, "headers">): Promise<Requester> {
    const token = tokenOf(request);
    if (!token) return ANONYMOUS;
    const claims = await this.tokens.verify(token);
    if (!claims) return ANONYMOUS;
    if (this.ended.has(sessionKeyOf(token, claims))) return ANONYMOUS;
    const kind = accountKindForIdentity(claims.identityProvider);
    const account = kind
      ? await this.users.findByIdentity(claims.username, accountKindsForIdentity(kind))
      : null;
    return { token, claims, account };
  }
}
