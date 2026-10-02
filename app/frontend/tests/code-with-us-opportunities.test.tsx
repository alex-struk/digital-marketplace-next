import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPPORTUNITY_INCOMPLETE } from "@rules/opportunities";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

// A multipart upload cannot be made through this test document's fetch, so storing an attachment
// is stood in for here, and what the screen asks to store is recorded.
const uploads = vi.hoisted(() => ({ store: vi.fn() }));
vi.mock("../src/api/opportunities", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/api/opportunities")>()),
  uploadAttachment: (file: File, name: string) => uploads.store(file, name),
}));

/**
 * Making, managing and reading a Code With Us opportunity, as the screens do it
 * (opportunity-program-select, opportunity-cwu-create, opportunity-cwu-edit, opportunity-cwu-view,
 * file-attachment-control). The service is stood in for; what is checked is what the screens show
 * and what they ask of the service.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Alex Placeholder",
    email: "vendor.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    // Agreed to the terms, so the profile is complete and no screen sends them to finish it.
    acceptedTermsAt: "2026-01-05T17:00:00.000Z",
    lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
    idpUsername: "test-vendor-1",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const administrator = account({ id: "00000000-0000-4000-8000-000000000101", type: "ADMIN", name: "Robin Placeholder" });
const staff = account({ id: "00000000-0000-4000-8000-000000000102", type: "GOV", name: "Casey Placeholder" });
const vendor = account({});

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

const ID = "00000000-0000-4000-8000-000000000701";

const opportunity = (overrides: Record<string, unknown> = {}) => ({
  id: ID,
  program: "code-with-us",
  createdAt: "2026-09-30T17:00:00.000Z",
  updatedAt: "2026-09-30T17:00:00.000Z",
  createdBy: { id: staff.id, name: "Casey Placeholder" },
  updatedBy: { id: staff.id, name: "Casey Placeholder" },
  status: "DRAFT",
  publishedAt: null,
  title: "Build an accessible permit tracker",
  teaser: "A short teaser.",
  remoteOk: true,
  remoteDesc: "Anywhere in Canada.",
  location: "Victoria",
  reward: 45000,
  skills: ["Accessibility"],
  description: "What the work is.",
  proposalDeadline: "2030-06-01",
  assignmentDate: "2030-06-15",
  startDate: "2030-07-01",
  completionDate: null,
  attachments: [],
  addenda: [],
  history: [
    { createdAt: "2026-09-30T17:00:00.000Z", createdBy: { id: staff.id, name: "Casey Placeholder" }, status: "DRAFT", event: null, note: null },
  ],
  ...overrides,
});

const requests: { method: string; address: string; body: unknown }[] = [];

function serve(handler: (method: string, path: string, body: unknown) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? JSON.parse(await input.clone().text()) : undefined;
      const url = new URL(input.url);
      requests.push({ method: input.method, address: `${url.pathname}${url.search}`, body });
      return handler(input.method, url.pathname, body);
    }),
  );
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  const view = render(<RouterProvider router={router as never} />);
  return { ...view, router };
}

const field = (testId: string) =>
  screen.getByTestId(testId).querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;

function type(testId: string, value: string) {
  fireEvent.change(field(testId), { target: { value } });
}

function choose(file: File) {
  const chooser = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(chooser, { target: { files: [file] } });
}

function fileOfSize(name: string, size: number) {
  const file = new File(["content"], name);
  Object.defineProperty(file, "size", { value: size });
  return file;
}

beforeEach(() => {
  requests.length = 0;
  uploads.store.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the dashboard's opportunities (R-1.3, R-1.9)", () => {
  const others = { id: "00000000-0000-4000-8000-000000000103", name: "Jordan Placeholder" };
  const listing = [
    opportunity({ id: "00000000-0000-4000-8000-000000000801", title: "My draft", updatedAt: "2026-09-29T17:00:00.000Z" }),
    opportunity({ id: "00000000-0000-4000-8000-000000000802", title: "My newer one", status: "UNDER_REVIEW", updatedAt: "2026-09-30T17:00:00.000Z" }),
    // Somebody else's published opportunity, as the list answers it to anyone but its author.
    { ...opportunity({ id: "00000000-0000-4000-8000-000000000803", title: "Theirs", status: "PUBLISHED" }), createdBy: undefined, updatedBy: undefined },
  ];

  it("lists a member of staff's own opportunities, newest first, each with its status and a link to manage it", async () => {
    serve((_method, path) => (path === "/api/opportunities/code-with-us" ? json(200, listing) : json(404, {})));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/dashboard");
    const table = await screen.findByTestId("dashboard-opportunities-table");
    const rows = within(table).getAllByTestId("dashboard-opportunity-row");
    expect(rows.map((row) => within(row).getByTestId("dashboard-opportunity-link").textContent)).toEqual(["My newer one", "My draft"]);
    expect(rows.map((row) => within(row).getByTestId("opportunity-status").textContent)).toEqual(["Under review", "Draft"]);
    expect(within(rows[1]!).getByTestId("dashboard-opportunity-link").getAttribute("href")).toBe(
      "/opportunities/code-with-us/00000000-0000-4000-8000-000000000801/edit",
    );
    expect(screen.getByTestId("dashboard-create-opportunity")).toBeTruthy();
  });

  it("lists every opportunity in every program to an administrator, with who created it", async () => {
    const all = [...listing.slice(0, 2), { ...listing[2]!, createdBy: others, updatedBy: others }];
    const sprint = {
      id: "00000000-0000-4000-8000-000000000804",
      program: "sprint-with-us",
      createdAt: "2026-09-01T17:00:00.000Z",
      updatedAt: "2026-09-01T17:00:00.000Z",
      createdBy: others,
      status: "EVAL_CC",
      title: "A sprint",
      location: "Kamloops",
      remoteOk: false,
      proposalDeadline: "2026-08-01",
      totalMaxBudget: 500000,
      subscribed: false,
    };
    serve((_method, path) =>
      path === "/api/opportunities/code-with-us"
        ? json(200, all)
        : path === "/api/opportunities/sprint-with-us"
          ? json(200, [sprint])
          : json(200, []),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/dashboard");
    const table = await screen.findByTestId("dashboard-opportunities-table");
    const rows = within(table).getAllByTestId("dashboard-opportunity-row");
    expect(rows).toHaveLength(4);
    expect(within(table).getAllByText("Jordan Placeholder")).toHaveLength(2);
    const sprintRow = rows.find((row) => within(row).queryByText("A sprint"))!;
    expect(within(sprintRow).getByText("Sprint With Us")).toBeTruthy();
    expect(within(sprintRow).getByTestId("dashboard-opportunity-link").getAttribute("href")).toBe(
      "/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000804/edit",
    );
  });

  it("says so when a member of staff has created nothing yet", async () => {
    serve(() => json(200, [listing[2]]));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/dashboard");
    expect((await screen.findByTestId("dashboard-empty-message")).textContent).toBe("You have not created any opportunities yet.");
    expect(screen.queryByTestId("dashboard-opportunities-table")).toBeNull();
  });
});

describe("choosing a program (R-1.7, R-1.8)", () => {
  it("offers public sector staff the three programs, each with its maximum budget", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/create");
    expect(await screen.findAllByTestId("program-card")).toHaveLength(3);
    expect(screen.getAllByTestId("program-max-budget").map((budget) => budget.textContent)).toEqual([
      "Up to $70,000",
      "Up to $5,000,000",
      "No upper limit",
    ]);
    expect(screen.getByTestId("program-choose-code-with-us").getAttribute("href")).toBe("/opportunities/code-with-us/create");
    expect(screen.getByText(/cannot be changed once the opportunity is created/)).toBeTruthy();
  });

  it("links every program card and every create form to the service level agreement (R-7.18)", async () => {
    serve(() => json(200, []));
    const expected: [string, number][] = [
      ["/opportunities/create", 3],
      ["/opportunities/code-with-us/create", 1],
      ["/opportunities/sprint-with-us/create", 1],
      ["/opportunities/team-with-us/create", 1],
    ];
    for (const [address, count] of expected) {
      resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
      const view = renderAt(address);
      const links = await screen.findAllByTestId("service-level-agreement-link");
      expect(links).toHaveLength(count);
      for (const link of links) expect(link.getAttribute("href")).toBe("/content/service-level-agreement");
      view.unmount();
    }
  });

  for (const [who, session] of [
    ["a vendor", { status: "signed-in", account: vendor }],
    ["a visitor", { status: "visitor" }],
  ] as const) {
    it(`is the missing page, with the create form, for ${who}`, async () => {
      serve(() => json(200, []));
      for (const address of ["/opportunities/create", "/opportunities/code-with-us/create"]) {
        resetSessionForTests(session as never, fakeIdentity());
        const view = renderAt(address);
        await screen.findByTestId("not-found-page");
        view.unmount();
      }
      expect(requests).toEqual([]);
    });
  }
});

describe("creating a Code With Us opportunity", () => {
  it("offers a public sector employee Save draft and Submit for review, and an administrator Publish instead (R-1.22, R-1.48)", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const view = renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("opportunity-save-draft");
    expect(screen.getByTestId("opportunity-submit-for-review")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-publish")).toBeNull();
    view.unmount();

    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("opportunity-publish");
    expect(screen.queryByTestId("opportunity-submit-for-review")).toBeNull();
  });

  it("saves a draft with whatever it holds, dates as typed, and lands on its manage page (R-1.9)", async () => {
    serve((method) => (method === "POST" ? json(201, opportunity()) : json(200, opportunity())));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const { router } = renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("opportunity-save-draft");
    type("opportunity-title-field", "Half-written");
    type("opportunity-deadline-field", "2000-01-01");
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/opportunities/code-with-us/${ID}/edit`));
    const created = requests.find((request) => request.method === "POST");
    expect(created?.address).toBe("/api/opportunities/code-with-us");
    expect(created?.body).toMatchObject({ status: "DRAFT", title: "Half-written", proposalDeadline: "2000-01-01", reward: null });
    expect((await screen.findByTestId("opportunity-identifier")).textContent).toBe(ID);
  });

  it("checks a submission for review first, naming each problem and sending nothing (R-1.10 to R-1.12)", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("opportunity-submit-for-review");
    fireEvent.click(screen.getByTestId("opportunity-submit-for-review"));

    const problems = await screen.findAllByTestId("field-error");
    const named = problems.map((problem) => problem.textContent ?? "");
    for (const label of ["Title", "Location", "Reward", "Skills", "Description", "Proposal deadline"]) {
      expect(named.some((line) => line.startsWith(`${label}:`))).toBe(true);
    }
    // Remote work is answered from the start: No, until Yes is chosen (R-1.11).
    expect(named.some((line) => line.startsWith("Remote work:"))).toBe(false);
    expect(requests.filter((request) => request.method === "POST")).toEqual([]);
  });

  it("keeps a title, teaser or description over its limit as typed and refuses it naming the field (R-1.10)", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("opportunity-submit-for-review");
    for (const testId of ["opportunity-title-field", "opportunity-teaser-field", "opportunity-description-field"]) {
      expect(field(testId).hasAttribute("maxlength")).toBe(false);
    }
    type("opportunity-title-field", "t".repeat(201));
    type("opportunity-teaser-field", "t".repeat(501));
    fireEvent.click(screen.getByTestId("opportunity-submit-for-review"));

    const named = (await screen.findAllByTestId("field-error")).map((problem) => problem.textContent ?? "");
    expect(named).toContain("Title: enter a title of up to 200 characters.");
    expect(named).toContain("Teaser: enter a teaser of up to 500 characters.");
    expect(field("opportunity-title-field").value).toHaveLength(201);
    expect(requests.filter((request) => request.method === "POST")).toEqual([]);
  });

  it("asks whether remote work is acceptable as the stories' Yes / No choice, starting on No (R-1.11)", async () => {
    serve((method) => (method === "POST" ? json(201, opportunity()) : json(200, opportunity())));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    const { router } = renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("opportunity-save-draft");
    const group = screen.getByRole("radiogroup", { name: /^Is remote work acceptable\?/ });
    const no = within(group).getByRole("radio", { name: "No" }) as HTMLInputElement;
    const yes = within(group).getByRole("radio", { name: "Yes" }) as HTMLInputElement;
    expect(no.checked).toBe(true);
    fireEvent.click(yes);
    expect(yes.checked).toBe(true);
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/opportunities/code-with-us/${ID}/edit`));
    expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({ status: "DRAFT", remoteOk: true });
  });
});

describe("the attachment control (R-8.17, R-8.19, R-8.27)", () => {
  it("states the size limit before a file is chosen, and the trigger points at it", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    const rule = await screen.findByTestId("attachment-size-limit");
    expect(rule.textContent).toBe("Any type of file, up to 10 MB each.");
    expect(screen.getByTestId("attachment-add-button").getAttribute("aria-describedby")).toBe("attachment-size-limit");
  });

  it("refuses a file over the limit where it was chosen, naming the limit, and saves nothing", async () => {
    serve(() => json(201, opportunity()));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("attachment-add-button");
    choose(fileOfSize("site-survey.pdf", 12.4 * 1024 * 1024));

    const refusal = await screen.findByTestId("attachment-size-error");
    expect(refusal.textContent).toContain("site-survey.pdf is too large to attach");
    expect(refusal.textContent).toContain("10 MB");
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));
    await waitFor(() => expect(uploads.store).not.toHaveBeenCalled());
    expect(requests.filter((request) => request.method === "POST")).toEqual([]);
  });

  it("stores a chosen file at once, with no read access, and offers it at its own address before the form is saved (R-8.19)", async () => {
    const stored = { id: "00000000-0000-4000-8000-000000000990", name: "scan0001.pdf" };
    serve((method) => (method === "POST" ? json(201, opportunity({ attachments: [stored] })) : json(200, opportunity())));
    uploads.store.mockResolvedValue({ kind: "stored", attachment: stored });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("attachment-add-button");
    choose(new File(["pdf"], "scan0001.pdf"));

    const link = await screen.findByTestId("attachment-download-link");
    expect(link.getAttribute("href")).toBe(`/api/files/${stored.id}?type=blob`);
    expect(uploads.store.mock.calls[0]?.[1]).toBe("scan0001.pdf");
    expect(screen.getByTestId("attachment-new-row").textContent).toContain("It is attached to the opportunity when you save it.");
    // Nothing is attached to anything until there is an opportunity to attach it to.
    expect(requests.filter((request) => request.method === "POST")).toEqual([]);

    fireEvent.click(screen.getByTestId("opportunity-save-draft"));
    await waitFor(() => expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({ attachments: [stored.id] }));
    expect(uploads.store).toHaveBeenCalledTimes(1);
  });

  it("shows the name a renamed attachment will have, ending restored, and stores it under that name when saved (R-8.27)", async () => {
    serve((method) => (method === "POST" ? json(201, opportunity()) : json(200, opportunity())));
    uploads.store
      .mockResolvedValueOnce({ kind: "stored", attachment: { id: "00000000-0000-4000-8000-000000000989", name: "scan0001.pdf" } })
      .mockResolvedValueOnce({ kind: "stored", attachment: { id: "00000000-0000-4000-8000-000000000990", name: "Statement of work.pdf" } });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("attachment-add-button");
    choose(new File(["pdf"], "scan0001.pdf"));
    await screen.findByTestId("attachment-download-link");

    type("attachment-name-field", "Statement of work");
    expect(screen.getByTestId("attachment-resulting-name").textContent).toBe("Will be saved as: Statement of work.pdf");
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    await waitFor(() => expect(uploads.store).toHaveBeenCalledTimes(2));
    expect(uploads.store.mock.calls[1]?.[1]).toBe("Statement of work.pdf");
    await waitFor(() => expect(requests.find((request) => request.method === "POST")?.body).toMatchObject({
      attachments: ["00000000-0000-4000-8000-000000000990"],
    }));
  });

  it("marks a name over 255 characters against its attachment, and stores nothing under it (R-8.23)", async () => {
    serve(() => json(201, opportunity()));
    uploads.store.mockResolvedValue({ kind: "stored", attachment: { id: "00000000-0000-4000-8000-000000000989", name: "scan0001.pdf" } });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/opportunities/code-with-us/create");
    await screen.findByTestId("attachment-add-button");
    choose(new File(["pdf"], "scan0001.pdf"));
    type("attachment-name-field", "x".repeat(260));
    fireEvent.click(screen.getByTestId("opportunity-save-draft"));

    await waitFor(() => expect(screen.getByTestId("attachment-name-field").textContent).toContain("between 1 and 255 characters"));
    expect(uploads.store.mock.calls.map((call) => call[1])).toEqual(["scan0001.pdf"]);
    expect(requests.filter((request) => request.method === "POST")).toEqual([]);
  });
});

describe("managing a Code With Us opportunity", () => {
  it("offers a draft's author Edit, Submit for review and Delete, with no counts and no Addenda tab (R-1.22, R-1.30, R-1.53)", async () => {
    serve(() => json(200, opportunity()));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit`);
    await screen.findByTestId("opportunity-edit-button");
    expect(screen.getByTestId("opportunity-submit-for-review")).toBeTruthy();
    expect(screen.getByTestId("opportunity-delete-button")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-publish")).toBeNull();
    expect(screen.getByTestId("opportunity-status").textContent).toBe("Draft");
    expect(screen.getByTestId("opportunity-created-by").textContent).toBe("Casey Placeholder");
    expect(screen.queryByTestId("opportunity-tab-addenda")).toBeNull();
    expect(screen.getByText("Views, watchers and proposals are counted once the opportunity is published.")).toBeTruthy();
  });

  it("tells the author an incomplete draft is incomplete, and not which field (R-1.21)", async () => {
    serve((method) => (method === "PUT" ? json(400, { errors: [OPPORTUNITY_INCOMPLETE] }) : json(200, opportunity())));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit`);
    fireEvent.click(await screen.findByTestId("opportunity-submit-for-review"));

    const message = await screen.findByTestId("opportunity-incomplete-message");
    expect(message.textContent).toContain("This opportunity is incomplete");
    expect(message.textContent).toContain("complete and save the form");
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "submitForReview" });
  });

  it("offers Submit for review on the Opportunity tab too, and says there that an incomplete draft is incomplete (R-1.21)", async () => {
    serve((method) => (method === "PUT" ? json(400, { errors: [OPPORTUNITY_INCOMPLETE] }) : json(200, opportunity({ location: "" }))));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=opportunity`);
    await screen.findByTestId("opportunity-save-changes");
    expect(screen.queryByTestId("opportunity-edit-button")).toBeNull();
    fireEvent.click(screen.getByTestId("opportunity-submit-for-review"));

    const message = await screen.findByTestId("opportunity-incomplete-message");
    const section = screen.getByRole("region", { name: "Opportunity" });
    expect(section.contains(message)).toBe(true);
    expect(within(section).getByRole("alert").textContent).toMatch(/incomplete/);
    expect(message.textContent).not.toMatch(/Location/);
  });

  it("attaches a file chosen on a draft's Opportunity tab at once, keeping what is being typed, and offers it at its own address (R-8.19, R-8.25)", async () => {
    const stored = { id: "00000000-0000-4000-8000-000000000990", name: "Statement of work.pdf" };
    serve((method) =>
      method === "PUT" ? json(200, opportunity({ attachments: [stored], updatedAt: "2026-09-30T19:00:00.000Z" })) : json(200, opportunity()),
    );
    uploads.store.mockResolvedValue({ kind: "stored", attachment: stored });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=opportunity`);
    await screen.findByTestId("attachment-add-button");
    type("opportunity-title-field", "A title being typed");
    choose(new File(["pdf"], "Statement of work.pdf"));

    const link = await screen.findByTestId("attachment-download-link");
    expect(link.getAttribute("href")).toBe(`/api/files/${stored.id}?type=blob`);
    await waitFor(() =>
      expect(requests.filter((request) => request.method === "PUT").map((request) => request.body)).toEqual([
        { tag: "edit", value: { attachments: [stored.id] } },
      ]),
    );
    expect(screen.getByTestId("attachment-new-row").textContent).toContain("attached to this opportunity");
    expect(field("opportunity-title-field").value).toBe("A title being typed");
  });

  it("detaches a new attachment at once when it is removed from a saved opportunity", async () => {
    const kept = { id: "00000000-0000-4000-8000-000000000980", name: "Current permit screens.png" };
    const stored = { id: "00000000-0000-4000-8000-000000000990", name: "Statement of work.pdf" };
    serve((method) => json(200, opportunity({ attachments: method === "PUT" ? [kept, stored] : [kept] })));
    uploads.store.mockResolvedValue({ kind: "stored", attachment: stored });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=opportunity`);
    await screen.findByTestId("attachment-add-button");
    choose(new File(["pdf"], "Statement of work.pdf"));
    await waitFor(() => expect(screen.getAllByTestId("attachment-download-link")).toHaveLength(2));
    fireEvent.click(within(screen.getByTestId("attachment-new-row")).getByTestId("attachment-remove-button"));

    await waitFor(() =>
      expect(requests.filter((request) => request.method === "PUT").map((request) => request.body)).toEqual([
        { tag: "edit", value: { attachments: [kept.id, stored.id] } },
        { tag: "edit", value: { attachments: [kept.id] } },
      ]),
    );
    expect(screen.queryByTestId("attachment-new-row")).toBeNull();
  });

  it("says why a file could not be attached when the service refuses it", async () => {
    const stored = { id: "00000000-0000-4000-8000-000000000990", name: "Statement of work.pdf" };
    serve((method) => (method === "PUT" ? json(400, { errors: ["attachments: You may not attach that file."] }) : json(200, opportunity())));
    uploads.store.mockResolvedValue({ kind: "stored", attachment: stored });
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=opportunity`);
    await screen.findByTestId("attachment-add-button");
    choose(new File(["pdf"], "Statement of work.pdf"));

    const row = await screen.findByTestId("attachment-new-row");
    await waitFor(() => expect(row.textContent).toContain("You may not attach that file."));
    expect(screen.queryByTestId("attachment-download-link")).toBeNull();
  });

  it("offers an administrator Publish and Delete under review, and publishes after confirming (R-1.22, R-1.53)", async () => {
    const underReview = opportunity({ status: "UNDER_REVIEW" });
    serve((method) =>
      method === "PUT" ? json(200, { ...underReview, status: "PUBLISHED", publishedAt: "2026-09-30T18:00:00.000Z" }) : json(200, underReview),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit`);
    fireEvent.click(await screen.findByTestId("opportunity-publish"));
    expect(screen.getByTestId("opportunity-delete-button")).toBeTruthy();
    fireEvent.click(await screen.findByTestId("opportunity-publish-confirm"));

    await waitFor(() => expect(screen.getByTestId("opportunity-status").textContent).toBe("Published"));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "publish" });
  });

  it("offers an administrator Publish on a draft too, with no Submit for review, and publishes it (R-1.22)", async () => {
    const draft = opportunity();
    serve((method) =>
      method === "PUT" ? json(200, { ...draft, status: "PUBLISHED", publishedAt: "2026-09-30T18:00:00.000Z" }) : json(200, draft),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit`);
    fireEvent.click(await screen.findByTestId("opportunity-publish"));
    expect(screen.getByTestId("opportunity-edit-button")).toBeTruthy();
    expect(screen.getByTestId("opportunity-delete-button")).toBeTruthy();
    expect(screen.queryByTestId("opportunity-submit-for-review")).toBeNull();
    fireEvent.click(await screen.findByTestId("opportunity-publish-confirm"));

    await waitFor(() => expect(screen.getByTestId("opportunity-status").textContent).toBe("Published"));
    expect(requests.find((request) => request.method === "PUT")?.body).toEqual({ tag: "publish" });
  });

  it("shows the opportunity's dates in its form on the Opportunity tab, read-only to an author once it is published (R-1.56)", async () => {
    serve(() => json(200, opportunity({ status: "PUBLISHED", completionDate: "2030-09-01" })));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=opportunity`);
    await screen.findByTestId("opportunity-deadline-field");
    expect(field("opportunity-deadline-field").value).toBe("2030-06-01");
    expect(field("opportunity-completion-date-field").value).toBe("2030-09-01");
    expect(field("opportunity-title-field").readOnly).toBe(true);
    expect(screen.getByTestId("attachment-size-limit").textContent).toContain("up to 10 MB each");
    expect(screen.queryByTestId("attachment-add-button")).toBeNull();
    expect(screen.queryByTestId("opportunity-save-changes")).toBeNull();
    expect(screen.queryByTestId("opportunity-edit-button")).toBeNull();
  });

  it("saves a change as a new version and stays on the Opportunity tab (R-1.4)", async () => {
    const published = opportunity({ status: "PUBLISHED" });
    serve((method, _path, body) =>
      method === "PUT"
        ? json(200, { ...published, description: (body as { value: { description: string } }).value.description, updatedAt: "2026-09-30T19:00:00.000Z" })
        : json(200, published),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=opportunity`);
    await screen.findByTestId("opportunity-save-changes");
    type("opportunity-description-field", "New words.");
    fireEvent.click(screen.getByTestId("opportunity-save-changes"));

    await screen.findByText("Your changes have been saved.");
    expect(requests.find((request) => request.method === "PUT")?.body).toMatchObject({ tag: "edit", value: { description: "New words." } });
  });

  it("lists the history, newest first, with who did what", async () => {
    serve(() =>
      json(
        200,
        opportunity({
          status: "UNDER_REVIEW",
          history: [
            { createdAt: "2026-09-30T18:00:00.000Z", createdBy: { id: staff.id, name: "Casey Placeholder" }, status: "UNDER_REVIEW", event: null, note: null },
            { createdAt: "2026-09-30T17:30:00.000Z", createdBy: { id: staff.id, name: "Casey Placeholder" }, status: null, event: "EDITED", note: null },
            { createdAt: "2026-09-30T17:00:00.000Z", createdBy: { id: staff.id, name: "Casey Placeholder" }, status: "DRAFT", event: null, note: null },
          ],
        }),
      ),
    );
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit?tab=history`);
    const table = await screen.findByRole("table");
    const entries = within(table).getAllByRole("row").slice(1).map((row) => row.children[1]?.textContent);
    expect(entries).toEqual(["Submitted for review", "Edited", "Draft"]);
  });

  it("is the missing page to a vendor", async () => {
    serve(() => json(200, opportunity({ status: "PUBLISHED", createdBy: undefined, updatedBy: undefined, history: undefined })));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}/edit`);
    await screen.findByTestId("not-found-page");
  });
});

describe("what a machine can check of WCAG 2.1 AA on these screens (P1)", () => {
  async function problemsIn(container: HTMLElement): Promise<string[]> {
    const results = await axe.run(container, {
      resultTypes: ["violations"],
      // Needs a browser to measure; nothing here sets a colour.
      rules: { "color-contrast": { enabled: false } },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  }

  for (const [screenName, address, ready, who] of [
    ["the program chooser", "/opportunities/create", "program-card", staff],
    ["the create form", "/opportunities/code-with-us/create", "attachment-add-button", staff],
    ["the manage page", `/opportunities/code-with-us/${ID}/edit`, "opportunity-edit-button", staff],
    ["the Opportunity tab", `/opportunities/code-with-us/${ID}/edit?tab=opportunity`, "opportunity-save-changes", staff],
    ["the History tab", `/opportunities/code-with-us/${ID}/edit?tab=history`, "opportunity-tab-history", staff],
    ["the public view", `/opportunities/code-with-us/${ID}`, "opportunity-identifier", vendor],
  ] as const) {
    it(`has nothing to answer for on ${screenName}`, async () => {
      serve(() => json(200, opportunity()));
      resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
      const { container } = renderAt(address);
      await screen.findAllByTestId(ready);
      expect(await problemsIn(container)).toEqual([]);
    }, 30_000);
  }

  it("has nothing to answer for on the dashboard's table", async () => {
    serve(() => json(200, [opportunity()]));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { container } = renderAt("/dashboard");
    await screen.findByTestId("dashboard-opportunities-table");
    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);
});

describe("reading a Code With Us opportunity", () => {
  it("shows a vendor its facts and its first publication date, without who created or changed it (R-1.23, R-1.29)", async () => {
    const { createdBy: _c, updatedBy: _u, history: _h, ...asAVendorReadsIt } = opportunity({
      status: "PUBLISHED",
      publishedAt: "2026-01-05T18:00:00.000Z",
    });
    serve(() => json(200, asAVendorReadsIt));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}`);
    expect((await screen.findByTestId("opportunity-identifier")).textContent).toBe(ID);
    expect(screen.getByTestId("opportunity-status").textContent).toBe("Published");
    expect(screen.getByTestId("opportunity-published-date").textContent).toBe("January 5, 2026");
    expect(screen.getByTestId("opportunity-reward").textContent).toBe("$45,000");
    expect(screen.getByTestId("opportunity-proposal-deadline").textContent).toBe("June 1, 2030 at 4:00 p.m. Pacific time");
    expect(screen.queryByTestId("opportunity-created-by")).toBeNull();
    expect(screen.queryByTestId("opportunity-last-changed-by")).toBeNull();
  });

  it("names who created and changed it to its author, with the way to manage it", async () => {
    serve(() => json(200, opportunity({ status: "PUBLISHED" })));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}`);
    expect((await screen.findByTestId("opportunity-created-by")).textContent).toBe("Casey Placeholder");
    expect(screen.getByRole("link", { name: "Manage this opportunity" }).getAttribute("href")).toBe(`/opportunities/code-with-us/${ID}/edit`);
  });

  it("lists its attachments as links to their own addresses", async () => {
    serve(() =>
      json(200, opportunity({ status: "PUBLISHED", attachments: [{ id: "00000000-0000-4000-8000-000000000990", name: "Statement of work.pdf" }] })),
    );
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}`);
    const link = await screen.findByTestId("attachment-download-link");
    expect(link.getAttribute("href")).toBe("/api/files/00000000-0000-4000-8000-000000000990?type=blob");
    expect(screen.queryByTestId("attachment-remove-button")).toBeNull();
  });

  it("is the missing page when the service has none to show (R-1.2)", async () => {
    serve(() => json(404, { errors: ["No opportunity is held at that address."] }));
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt(`/opportunities/code-with-us/${ID}`);
    await screen.findByTestId("not-found-page");
  });
});
