import { Controller, Get, Inject, Logger, Query, Req, Res } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import {
  CodeNotExchanged,
  HANDOVER_COOKIES,
  HANDOVER_LIFETIME_SECONDS,
  PENDING_LIFETIME_SECONDS,
  SignInFlowSettings,
  authorizationAddress,
  cookiesOf,
  decodePending,
  encodePending,
  endIdentityProviderSession,
  exchangeCode,
  hintFor,
  newPendingSignIn,
  pendingCookieName,
} from "../auth/sign-in-flow";
import {
  SESSION_COOKIE,
  SESSION_LIFETIME_SECONDS,
  ServiceSessions,
} from "../auth/service-sessions";
import { TOKEN_VERIFIER, TokenVerifier } from "../auth/token-verifier";
import { landingAfterSignIn, returnPathFrom } from "../rules/sign-in";
import { AccountsService, SignInRefused } from "./accounts.service";

export const SIGN_IN_FLOW = Symbol("SignInFlowSettings");

/** The notice a person is shown when sign-in did not let them in (R-4.1, R-4.4, R-4.6). */
export const SIGN_IN_FAILED = "/notice/authFailure";

const text = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

/**
 * `/auth/sign-in` and `/auth/callback`, the contract's startSignIn and completeSignIn
 * (decision record 0015). Each answers with a redirect, as the contract says; the work is in
 * `auth/sign-in-flow.ts`.
 */
@Controller("auth")
export class SignInController {
  private readonly log = new Logger("sign-in");

  constructor(
    @Inject(SIGN_IN_FLOW) private readonly flow: SignInFlowSettings | null,
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier,
    private readonly accounts: AccountsService,
    private readonly sessions: ServiceSessions,
  ) {}

  /**
   * Begins sign-in: the browser is sent to the identity provider, hinting at the way in
   * `provider` names, and carrying a challenge only this sign-in can answer. The page to come
   * back to is remembered with it (R-4.22).
   */
  @Get("sign-in")
  start(
    @Query("provider") provider: unknown,
    @Query("redirectOnSuccess") redirectOnSuccess: unknown,
    @Res() response: Response,
  ): void {
    if (!this.flow) {
      response.redirect(302, SIGN_IN_FAILED);
      return;
    }
    const pending = newPendingSignIn(returnPathFrom(redirectOnSuccess));
    response.cookie(pendingCookieName(pending.state), encodePending(pending), {
      ...this.cookieOptions("/auth"),
      httpOnly: true,
      maxAge: PENDING_LIFETIME_SECONDS * 1000,
    });
    response.redirect(
      302,
      authorizationAddress(this.flow, pending, hintFor(this.flow, text(provider))),
    );
  }

  /**
   * Completes sign-in. The code is exchanged, the token checked like any other, and the
   * account found — or made, and its holder welcomed, on a first sign-in (R-4.1, R-4.2). The
   * browser is then sent on with its tokens to the page sign-in began from, or to profile
   * completion or the dashboard (R-4.22, R-4.23). Anything that goes wrong on the way ends at
   * the sign-in failure notice, having ended the identity provider's session if one was made,
   * so another sign-in can be tried (R-4.4, R-4.6).
   */
  @Get("callback")
  async complete(
    @Query() query: Record<string, unknown>,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const state = text(query.state);
    const code = text(query.code);
    const pending = state
      ? decodePending(cookiesOf(request.headers.cookie)[pendingCookieName(state)], state)
      : null;
    if (state) response.clearCookie(pendingCookieName(state), this.cookieOptions("/auth"));

    const fail = () => response.redirect(302, SIGN_IN_FAILED);
    const flow = this.flow;
    if (!flow || !code || !pending || text(query.error)) {
      fail();
      return;
    }

    let tokens;
    try {
      tokens = await exchangeCode(flow, code, pending.verifier);
    } catch (error) {
      this.log.warn(error instanceof CodeNotExchanged ? error.message : "The code was not exchanged.");
      fail();
      return;
    }

    try {
      const identity = await this.verifier.verify(tokens.accessToken);
      const { account } = await this.accounts.signIn(identity);
      // The service's own session, for requests the app does not make (decision record 0017).
      // One this browser held before is replaced, not left standing beside it.
      this.sessions.end(cookiesOf(request.headers.cookie)[SESSION_COOKIE]);
      response.cookie(SESSION_COOKIE, this.sessions.begin(identity, tokens.refreshToken), {
        ...this.cookieOptions("/"),
        httpOnly: true,
        maxAge: SESSION_LIFETIME_SECONDS * 1000,
      });
      const handover: CookieOptions = {
        ...this.cookieOptions("/"),
        httpOnly: false,
        maxAge: HANDOVER_LIFETIME_SECONDS * 1000,
      };
      response.cookie(HANDOVER_COOKIES.access, tokens.accessToken, handover);
      response.cookie(HANDOVER_COOKIES.refresh, tokens.refreshToken, handover);
      if (tokens.idToken) response.cookie(HANDOVER_COOKIES.id, tokens.idToken, handover);
      else response.clearCookie(HANDOVER_COOKIES.id, this.cookieOptions("/"));
      response.redirect(302, landingAfterSignIn(account, pending.returnTo));
    } catch (error) {
      if (!(error instanceof SignInRefused)) {
        this.log.warn(`Sign-in could not be completed: ${error instanceof Error ? error.name : "fault"}.`);
      }
      await endIdentityProviderSession(flow, tokens.refreshToken);
      fail();
    }
  }

  private cookieOptions(path: string): CookieOptions {
    return {
      path,
      sameSite: "lax",
      secure: this.flow?.serviceOrigin.startsWith("https:") ?? false,
    };
  }
}
