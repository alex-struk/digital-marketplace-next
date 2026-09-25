import { AddressInfo } from "node:net";
import { createServer, Server } from "node:http";
import { resolve } from "node:path";
import express from "express";
import { middleware as contractValidator } from "express-openapi-validator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadContract, withoutTestOnlyRoutes } from "../src/common/contract";
import { refusalFor } from "../src/common/refusals";

/**
 * The boundary: every request is checked against the recovered contract before it reaches a
 * handler, and nothing answers at an address the contract does not describe.
 */
const CONTRACT = resolve(__dirname, "../../../spec/contract/openapi.yaml");

let server: Server;
let origin: string;

beforeAll(async () => {
  const app = express();
  app.use(
    contractValidator({
      apiSpec: withoutTestOnlyRoutes(loadContract(CONTRACT)) as never,
      validateRequests: true,
      validateResponses: false,
      validateSecurity: false,
    }),
  );
  app.get("/status", (_request, response) => {
    response.type("text/plain").send("OK");
  });
  app.get("/api/content/:id", (request, response) => {
    response.json({ asked: request.params.id });
  });
  app.get("/api/counters", (_request, response) => {
    response.json({});
  });
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      const { status, body } = refusalFor(error);
      response.status(status).json(body);
    },
  );

  server = createServer(app);
  await new Promise<void>((ready) => server.listen(0, "127.0.0.1", ready));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((closed) => server.close(() => closed()));
});

describe("the contract at the boundary", () => {
  it("lets a request the contract describes through", async () => {
    const answer = await fetch(`${origin}/api/content/privacy`);

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ asked: "privacy" });
  });

  it("lets the status route through, and it needs no session", async () => {
    const answer = await fetch(`${origin}/status`);

    expect(answer.status).toBe(200);
    expect(await answer.text()).toBe("OK");
  });

  it("answers nothing at an address the contract does not describe", async () => {
    const answer = await fetch(`${origin}/api/not-a-resource`);

    expect(answer.status).toBe(404);
  });

  it("answers nothing at the sign-in routes that exist only for tests (J3)", async () => {
    const answer = await fetch(`${origin}/auth/createsessionadmin`);

    expect(answer.status).toBe(404);
  });

  it("refuses a method the contract does not give an address", async () => {
    const answer = await fetch(`${origin}/status`, { method: "DELETE" });

    expect(answer.status).toBeGreaterThanOrEqual(400);
  });

  it("refuses a query parameter the contract does not name", async () => {
    // /api/counters names "counters"; anything else is not part of the surface.
    const answer = await fetch(`${origin}/api/counters?made-up=1`);

    expect(answer.status).toBe(400);
    expect(await answer.json()).toHaveProperty("errors");
  });
});
