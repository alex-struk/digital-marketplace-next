import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadContract,
  withLocalServer,
  withoutTestOnlyRoutes,
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
