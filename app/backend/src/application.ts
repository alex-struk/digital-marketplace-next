import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json, NextFunction, Request, Response } from "express";
import { middleware as contractValidator } from "express-openapi-validator";
import { AppModule } from "./app.module";
import { bearerTokenCheck } from "./auth/bearer-token";
import { SignedOutSessions } from "./auth/signed-out-sessions";
import { TOKEN_VERIFIER, TokenVerifier } from "./auth/token-verifier";
import { JsonLogger } from "./common/logging";
import { RefusalFilter } from "./common/refusals";
import {
  loadContract,
  withCurrentSession,
  withIdentityProviderCallback,
  withoutTestOnlyRoutes,
} from "./common/contract";

/**
 * The service, assembled. `main.ts` starts it; a test can start the same thing and ask it
 * questions over HTTP, so what is checked is what runs.
 */
export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: new JsonLogger() });

  // A request's body is read before the boundary looks at it, so that what is checked is what
  // the handler will be given.
  app.use(json({ limit: "1mb" }));

  // One boundary layer, reading the contract itself (the stack profile). Every request is
  // checked against spec/contract/openapi.yaml before it reaches a handler: an address the
  // contract does not carry answers as nothing, and so does a parameter it does not name.
  //
  // Answers are not checked against it, because the contract carries no response schemas to
  // check them against. It was recovered from documents that describe statuses and a
  // sentence apiece, so a validator reads "no content declared" as "this answer must be
  // empty" and every correct answer becomes a violation. What the service answers with is
  // decision record 0010's; the day the contract carries those schemas, this comes back on
  // by setting `validateResponses` to true.
  app.use(
    contractValidator({
      apiSpec: withIdentityProviderCallback(
        withCurrentSession(withoutTestOnlyRoutes(loadContract())),
      ) as never,
      validateRequests: true,
      validateResponses: false,
      validateSecurity: false,
    }),
  );

  // Every request under /api has its bearer token checked before a handler sees it (decision
  // record 0004); what the person may then do is their account's business.
  app.use(
    "/api",
    bearerTokenCheck(app.get<TokenVerifier>(TOKEN_VERIFIER), app.get(SignedOutSessions)),
  );

  // One shape for every refusal (decision record 0010): the boundary's own, which are passed
  // on before any handler is reached, and every handler's.
  const refusals = new RefusalFilter();
  app.use(
    (error: unknown, _request: Request, response: Response, next: NextFunction) => {
      if (response.headersSent) return next(error);
      refusals.answer(error, response);
    },
  );
  app.useGlobalFilters(refusals);

  return app;
}
