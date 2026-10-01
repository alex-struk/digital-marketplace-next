import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * Sprint With Us and Team With Us drafts as slice 8 builds them (opportunity-swu-create,
 * opportunity-twu-create, and the manage page a draft lands on; decision record 0035). The service
 * is stood in for; what is checked is what the screens show and what they ask of the service.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000102",
    type: "GOV",
    status: "ACTIVE",
    name: "Casey Placeholder",
    email: "staff.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: null,
    lastAcceptedTermsAt: null,
    idpUsername: "test-gov",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const staff = account({});
const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });
const vendor = account({
  id: "00000000-0000-4000-8000-000000000201",
  type: "VENDOR",
  name: "Alex Placeholder",
  acceptedTermsAt: "2026-01-05T17:00:00.000Z",
  lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
});

function fakeIdentity() {
  return {
    start: vi.fn(() => true),
    signIn: vi.fn(async () => {}),
    endSession: vi.fn(async () => true),
    signOut: vi.fn(async () => {}),
    accessToken: vi.fn(async () => "a-token"),
    forget: vi.fn(),
  } satisfies IdentityClient;
}

const ID = "00000000-0000-4000-8000-000000000901";

const drafted = (program: string, overrides: Record<string, unknown> = {}) => ({
  id: ID,
  program,
  createdAt: "2026-10-01T17:00:00.000Z",
  updatedAt: "2026-10-01T17:00:00.000Z",
  createdBy: { id: staff.id, name: staff.name },
  updatedBy: { id: staff.id, name: staff.name },
  status: "DRAFT",
  publishedAt: null,
  title: "Replace the grant intake forms",
  teaser: "",
  location: "",
  remoteOk: false,
  remoteDesc: "",
  description: "",
  proposalDeadline: "2026-10-15",
  assignmentDate: "2026-10-15",
  subscribed: false,
  ...(program === "sprint-with-us" ? { totalMaxBudget: 0 } : { maxBudget: 0, startDate: "2026-10-15", completionDate: null }),
  ...overrides,
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: url.pathname, body });
      return handler(input.method, url.pathname, body);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  render(<RouterProvider router={router as never} />);
  return router;
}

const field = (testId: string) => screen.getByTestId(testId).querySelector("input, textarea") as HTMLInputElement;

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("creating a Sprint With Us draft (R-1.7, R-1.9, R-1.39)", () => {
  it("saves what the form holds as a draft and lands on its manage page, which shows its identifier", async () => {
    serve((method, path) => {
      if (method === "POST" && path === "/api/opportunities/sprint-with-us") return json(201, drafted("sprint-with-us"));
      if (method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`) return json(200, drafted("sprint-with-us"));
      return json(404, { errors: ["Not here."] });
    });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const router = renderAt("/opportunities/sprint-with-us/create");
    expect(await screen.findByRole("heading", { level: 1, name: "Create a Sprint With Us opportunity" })).toBeTruthy();
    expect(screen.getByTestId("opportunity-submit-for-review")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-start-date-field")).toBeNull();

    fireEvent.change(field("opportunity-title-field"), { target: { value: "Replace the grant intake forms" } });
    fireEvent.change(field("opportunity-deadline-field"), { target: { value: "2030-05-01" } });
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    expect(await screen.findByTestId("opportunity-identifier")).toBeTruthy();
    expect(screen.getByTestId("opportunity-identifier").textContent).toBe(ID);
    expect(router.state.location.pathname).toBe(`/opportunities/sprint-with-us/${ID}/edit`);
    const sent = requests.find((request) => request.method === "POST");
    expect(sent?.body).toMatchObject({
      status: "DRAFT",
      title: "Replace the grant intake forms",
      proposalDeadline: "2030-05-01",
      assignmentDate: "",
      remoteOk: false,
      totalMaxBudget: null,
    });
    expect(screen.getByTestId("opportunity-created-by").textContent).toBe("Casey Placeholder");
  });

  it("tells a member of staff who submits for review that it cannot be done yet, keeping what they entered", async () => {
    serve((method) =>
      method === "POST"
        ? json(501, { errors: ["A Sprint With Us or Team With Us opportunity can be saved only as a draft in this version of the service."] })
        : json(404, { errors: ["Not here."] }),
    );
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    fireEvent.change(field("opportunity-title-field"), { target: { value: "Kept" } });
    fireEvent.click(screen.getByTestId("opportunity-submit-for-review"));
    expect(await screen.findByText(/can be saved only as a draft/)).toBeTruthy();
    expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({ status: "UNDER_REVIEW" });
    expect(field("opportunity-title-field").value).toBe("Kept");
  });

  it("shows anybody but public sector staff the missing page", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/opportunities/sprint-with-us/create");
    expect(await screen.findByRole("heading", { level: 1, name: /not found/i })).toBeTruthy();
    expect(screen.queryByTestId("opportunity-save-draft")).toBeNull();
  });
});

describe("creating a Team With Us draft", () => {
  it("offers its own dates and budget, and an administrator Publish in place of Submit for review", async () => {
    serve((method, path) => {
      if (method === "POST" && path === "/api/opportunities/team-with-us") return json(201, drafted("team-with-us"));
      if (method === "GET" && path === `/api/opportunities/team-with-us/${ID}`) return json(200, drafted("team-with-us"));
      return json(404, { errors: ["Not here."] });
    });
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    expect(await screen.findByTestId("opportunity-start-date-field")).toBeTruthy();
    expect(screen.getByTestId("opportunity-completion-date-field")).toBeTruthy();
    expect(screen.getByTestId("opportunity-publish")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-submit-for-review")).toBeNull();
    expect(screen.getByText("Maximum budget")).toBeTruthy();

    fireEvent.change(field("opportunity-start-date-field"), { target: { value: "2030-06-01" } });
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));
    await screen.findByTestId("opportunity-identifier");
    expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({ status: "DRAFT", startDate: "2030-06-01", maxBudget: null });
  });

  it("has no accessibility violations", async () => {
    serve(() => json(404, { errors: ["Not here."] }));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/team-with-us/create");
    await screen.findByTestId("opportunity-title-field");
    const results = await axe.run(document.body, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe("the manage page a draft lands on", () => {
  it("is shown to nobody but its author and administrators", async () => {
    serve((method, path) =>
      method === "GET" && path === `/api/opportunities/sprint-with-us/${ID}`
        ? json(200, drafted("sprint-with-us", { status: "PUBLISHED", createdBy: undefined, updatedBy: undefined }))
        : json(404, { errors: ["Not here."] }),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/sprint-with-us/${ID}/edit`);
    expect(await screen.findByRole("heading", { level: 1, name: /not found/i })).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId("opportunity-identifier")).toBeNull());
  });
});
