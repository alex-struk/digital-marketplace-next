import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadContract,
  withCurrentSession,
  withLocalServer,
  withoutTestOnlyRoutes,
  withResponsesAsWritten,
} from "../src/common/contract";
import { refusalFor } from "../src/common/refusals";
import { BadRequestException, NotFoundException } from "@nestjs/common";

const CONTRACT = resolve(__dirname, "../../../spec/contract/openapi.yaml");

describe("the contract the boundary validates against", () => {
  it("is the recovered contract itself", () => {
    const contract = loadContract(CONTRACT);
    const paths = contract.paths as Record<string, unknown>;

    expect(paths["/api/content/{id}"]).toBeDefined();
    expect(paths["/status"]).toBeDefined();
  });

  it("is matched at this service's own origin", () => {
    // The contract's server is a template variable, because the address a target answers on
    // is the target's own.
    expect(withLocalServer({ servers: [{ url: "{base_url}" }] })).toEqual({
      servers: [{ url: "/" }],
    });
  });

  it("reads a one-line response description with a comma in it as the one sentence it is", () => {
    const repaired = withResponsesAsWritten({
      paths: {
        "/x": {
          post: {
            responses: {
              "400": { description: "Refused", "answered with the reasons.": null },
              "200": { description: "Fine." },
            },
          },
        },
      },
    }) as { paths: Record<string, { post: { responses: Record<string, unknown> } }> };

    expect(repaired.paths["/x"]?.post.responses).toEqual({
      "400": { description: "Refused, answered with the reasons." },
      "200": { description: "Fine." },
    });
  });

  it("is a contract the boundary validator can read, with no stray response members", () => {
    const contract = loadContract(CONTRACT);
    const allowed = new Set(["description", "headers", "content", "links", "$ref"]);
    const strays: string[] = [];
    for (const [path, operations] of Object.entries(contract.paths as Record<string, any>)) {
      for (const [method, operation] of Object.entries(operations as Record<string, any>)) {
        for (const [status, response] of Object.entries(operation?.responses ?? {})) {
          for (const key of Object.keys(response as object)) {
            if (!allowed.has(key)) strays.push(`${method} ${path} ${status} ${key}`);
          }
        }
      }
    }
    expect(strays).toEqual([]);
  });

  it("lets the current session be asked for by the word 'current' (decision record 0011)", () => {
    const contract = withCurrentSession(loadContract(CONTRACT));
    const sessions = (contract.paths as Record<string, any>)["/api/sessions/{id}"];

    for (const method of ["get", "delete"]) {
      expect(sessions[method].parameters).toEqual([
        expect.objectContaining({
          name: "id",
          in: "path",
          schema: {
            anyOf: [
              { type: "string", format: "uuid" },
              { type: "string", const: "current" },
            ],
          },
        }),
      ]);
    }
    // Every other identifier is still an identifier.
    expect((contract.paths as Record<string, any>)["/api/users/{id}"].get.parameters).toEqual([
      { $ref: "#/components/parameters/PathId" },
    ]);
  });

  it("offers none of the three sign-in routes that exist only for tests (J3)", () => {
    const contract = withoutTestOnlyRoutes(loadContract(CONTRACT));
    const paths = contract.paths as Record<string, unknown>;

    expect(paths["/auth/createsessionadmin"]).toBeUndefined();
    expect(paths["/auth/createsessiongov"]).toBeUndefined();
    expect(paths["/auth/createsessionvendor/{id}"]).toBeUndefined();
    expect(paths["/auth/sign-in"]).toBeDefined();
  });
});

describe("the one shape every refusal takes", () => {
  it("gives a malformed page request its reason (R-7.3)", () => {
    expect(refusalFor(new BadRequestException("Not well formed."))).toEqual({
      status: 400,
      body: { errors: ["Not well formed."] },
    });
  });

  it("gives a page nobody holds the same shape (R-7.2)", () => {
    expect(refusalFor(new NotFoundException("No page there."))).toEqual({
      status: 404,
      body: { errors: ["No page there."] },
    });
  });

  it("gives the boundary validator's own refusal that shape too", () => {
    expect(
      refusalFor({
        status: 400,
        message: "request/params must match",
        errors: [{ path: "/params/id", message: "must match pattern" }],
      }),
    ).toEqual({
      status: 400,
      body: { errors: ["/params/id must match pattern"] },
    });
  });

  it("says nothing about a fault beyond that there was one", () => {
    expect(refusalFor(new Error("connect ECONNREFUSED 10.0.0.1:5432"))).toEqual({
      status: 500,
      body: { errors: ["The service could not answer."] },
    });
  });
});
