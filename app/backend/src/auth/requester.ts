import { createHash } from "node:crypto";
import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import type { AccountKind } from "../rules/users";
import type { User } from "../users/user";
import type { Claims } from "./token-verifier";

/**
 * Who is asking, worked out once per request from the bearer token and the account it
 * belongs to (decision records 0001 and 0004).
 *
 * `claims` is what an accepted token says; `account` is the stored account it signs in as,
 * or null when there is none yet. Authorization reads the account's kind and status from
 * the service's own data, never from the token.
 */
export interface Requester {
  readonly token: string | null;
  readonly claims: Claims | null;
  readonly account: User | null;
}

export const ANONYMOUS: Requester = { token: null, claims: null, account: null };

/** Where the single-page app also puts the bearer token, for requests it cannot add a header to. */
export const TOKEN_COOKIE = "dm_access_token";

/** The bearer token a request carries: the Authorization header first, then the cookie. */
export function tokenOf(request: Pick<Request, "headers">): string | null {
  const header = request.headers.authorization;
  if (typeof header === "string") {
    const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
    if (match?.[1]) return match[1];
  }
  const cookies = request.headers.cookie;
  if (typeof cookies === "string") {
    for (const pair of cookies.split(";")) {
      const at = pair.indexOf("=");
      if (at < 0) continue;
      if (pair.slice(0, at).trim() !== TOKEN_COOKIE) continue;
      const value = decodeURIComponent(pair.slice(at + 1).trim());
      if (value.length > 0) return value;
    }
  }
  return null;
}

/** What names a sign-in session for sign-out: the identity provider's own, or the token itself. */
export function sessionKeyOf(token: string, claims: Claims): string {
  return claims.sessionId ?? createHash("sha256").update(token).digest("hex");
}

const REQUESTER = Symbol("requester");

type WithRequester = Request & { [REQUESTER]?: Requester };

export function attachRequester(request: Request, requester: Requester): void {
  (request as WithRequester)[REQUESTER] = requester;
}

export function requesterOf(request: Request): Requester {
  return (request as WithRequester)[REQUESTER] ?? ANONYMOUS;
}

/** The requester, in a handler's parameters. */
export const CurrentRequester = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Requester =>
    requesterOf(context.switchToHttp().getRequest<Request>()),
);

/**
 * The signed-in person's account, for a route that needs one. A request with no accepted
 * token, or whose account is not active, is refused as not signed in.
 */
export function signedInAccount(requester: Requester): User {
  const account = requester.account;
  if (!account || account.status !== "ACTIVE") {
    throw new UnauthorizedException("Sign in to do this.");
  }
  return account;
}

/** The signed-in person's account, if it is one of the given kinds; refused otherwise. */
export function accountOfKind(
  requester: Requester,
  kinds: readonly AccountKind[],
): User {
  const account = signedInAccount(requester);
  if (!kinds.includes(account.type)) {
    throw new ForbiddenException("You do not have permission to do this.");
  }
  return account;
}
