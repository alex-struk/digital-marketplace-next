import type { NextFunction, Request, Response } from "express";
import { Identity } from "./identity";
import { SignedOutSessions } from "./signed-out-sessions";
import { TokenVerifier } from "./token-verifier";

/** A request, once its bearer token has been looked at. */
export interface IdentifiedRequest extends Request {
  /** Whose token came with the request, or null for a visitor who sent none. */
  identity?: Identity | null;
}

function bearerTokenOf(request: Request): string | null | undefined {
  const header = request.headers.authorization;
  if (header === undefined) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match ? (match[1] as string) : undefined;
}

/**
 * Every request under `/api` has its bearer token checked before any handler sees it
 * (decision record 0004). A request with no token is a visitor's and goes on as one; a token
 * that is not good — forged, expired, from another realm, for another client, or from a
 * session the person has signed out of — is refused, in the one shape every refusal takes
 * (decision record 0010), rather than quietly treated as a visitor's.
 *
 * What the person may do is not decided here. That is the account's kind and status as the
 * service records them (decision record 0001, departure 2), looked up by whoever handles the
 * request.
 */
export function bearerTokenCheck(
  verifier: TokenVerifier,
  signedOut: SignedOutSessions,
) {
  return async (request: IdentifiedRequest, response: Response, next: NextFunction) => {
    const token = bearerTokenOf(request);
    if (token === null) {
      request.identity = null;
      next();
      return;
    }
    const refuse = (reason: string) => {
      response
        .status(401)
        .set("WWW-Authenticate", 'Bearer error="invalid_token"')
        .json({ errors: [reason] });
    };
    if (token === undefined) {
      refuse("Sign in to do that.");
      return;
    }
    try {
      const identity = await verifier.verify(token);
      if (signedOut.hasEnded(identity.sessionId)) {
        refuse("You have signed out. Sign in again to do that.");
        return;
      }
      request.identity = identity;
      next();
    } catch {
      refuse("Sign in to do that.");
    }
  };
}
