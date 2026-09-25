import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { middleware as contractValidator } from "express-openapi-validator";
import { AppModule } from "./app.module";
import { JsonLogger } from "./common/logging";
import { RefusalFilter } from "./common/refusals";
import { loadContract, withoutTestOnlyRoutes } from "./common/contract";

/**
 * The service, assembled. `main.ts` starts it; a test can start the same thing and ask it
 * questions over HTTP, so what is checked is what runs.
 */
export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: new JsonLogger() });

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
      apiSpec: withoutTestOnlyRoutes(loadContract()) as never,
      validateRequests: true,
      validateResponses: false,
      validateSecurity: false,
    }),
  );

  // One shape for every refusal (decision record 0010).
  app.useGlobalFilters(new RefusalFilter());

  return app;
}
