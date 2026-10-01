import { describe, expect, it } from "vitest";
import { refusalFor } from "../src/common/refusals";
import { NOT_YET_OFFERED, refuseCreation } from "../src/opportunities/unbuilt-program-creation.controller";
import { NOT_PERMITTED_TO_CREATE, ONLY_ADMINISTRATORS_PUBLISH, OpportunityViewer } from "../src/rules/opportunities";

const ADMIN: OpportunityViewer = { id: "admin-1", type: "ADMIN" };
const STAFF: OpportunityViewer = { id: "staff-1", type: "GOV" };
const VENDOR: OpportunityViewer = { id: "vendor-1", type: "VENDOR" };

function answer(viewer: OpportunityViewer | null, body: unknown) {
  try {
    refuseCreation(viewer, body);
  } catch (exception) {
    return refusalFor(exception);
  }
  throw new Error("refuseCreation answered without refusing");
}

describe("creating a Sprint With Us or Team With Us opportunity before slice 10 (R-1.48)", () => {
  it("refuses a public sector employee who asks for it published, naming the rule", () => {
    expect(answer(STAFF, { status: "PUBLISHED" })).toEqual({ status: 401, body: { errors: [ONLY_ADMINISTRATORS_PUBLISH] } });
  });

  it("refuses anyone who is not public sector staff", () => {
    expect(answer(VENDOR, { status: "DRAFT" })).toEqual({ status: 401, body: { errors: [NOT_PERMITTED_TO_CREATE] } });
    expect(answer(null, {})).toEqual({ status: 401, body: { errors: [NOT_PERMITTED_TO_CREATE] } });
  });

  it("refuses a state an opportunity cannot be created in", () => {
    expect(answer(ADMIN, { status: "AWARDED" }).status).toBe(400);
  });

  it("says a permitted creation is not offered yet, for staff and administrators alike", () => {
    for (const [viewer, status] of [
      [STAFF, "DRAFT"],
      [STAFF, "UNDER_REVIEW"],
      [ADMIN, "PUBLISHED"],
    ] as const) {
      expect(answer(viewer, { status })).toEqual({ status: 501, body: { errors: [NOT_YET_OFFERED] } });
    }
  });
});
