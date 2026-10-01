import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADDRESS_IN_USE_REFUSAL } from "@rules/content";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

// A multipart upload cannot be made through this test document's fetch, so storing an inserted
// image is stood in for here; what it sends is the same as a profile picture's, readable by
// anyone (R-8.29).
const uploads = vi.hoisted(() => ({ store: vi.fn() }));
vi.mock("../src/api/files", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/api/files")>()),
  uploadEmbeddedImage: (file: File) => uploads.store(file),
}));

/**
 * An administrator managing the service's pages, as the screens do it (content-list,
 * content-create, content-edit, file-embedded-image). The service is stood in for; what is
 * checked is what the screens show and what they ask of the service.
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

const page = (overrides: Record<string, unknown>) => ({
  id: "00000000-0000-4000-8000-000000000501",
  createdAt: "2026-01-05T17:00:00.000Z",
  updatedAt: "2026-01-07T17:00:00.000Z",
  slug: "about-us",
  title: "About us",
  body: "The current wording.",
  fixed: false,
  createdBy: { id: administrator.id, name: "Robin Placeholder" },
  updatedBy: { id: "00000000-0000-4000-8000-000000000106", name: "Morgan Placeholder" },
  ...overrides,
});

const about = page({
  id: "00000000-0000-4000-8000-000000000551",
  slug: "about",
  title: "about",
  body: "Initial version",
  fixed: true,
  createdAt: "2020-12-02T17:00:00.000Z",
  updatedAt: "2020-12-02T17:00:00.000Z",
  createdBy: null,
  updatedBy: null,
});
const aboutUs = page({});
const privacy = page({ id: "00000000-0000-4000-8000-000000000559", slug: "privacy", title: "privacy", fixed: true });

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

const input = (testId: string) =>
  screen.getByTestId(testId).querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;

function type(testId: string, value: string) {
  const field = input(testId);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

beforeEach(() => {
  requests.length = 0;
  uploads.store.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the content area, for anyone but an administrator (R-7.6)", () => {
  for (const [who, session] of [
    ["a vendor", { status: "signed-in", account: vendor }],
    ["a public sector employee", { status: "signed-in", account: staff }],
    ["a visitor", { status: "visitor" }],
  ] as const) {
    it(`is the missing page on every managing screen for ${who}, and nothing is asked`, async () => {
      serve(() => json(200, []));
      for (const address of ["/content", "/content/create", "/content/about/edit"]) {
        resetSessionForTests(session as never, fakeIdentity());
        const view = renderAt(address);
        await screen.findByTestId("not-found-page");
        view.unmount();
      }
      expect(requests).toEqual([]);
    });
  }

  it("is offered in the navigation to an administrator alone", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const view = renderAt("/dashboard");
    expect((await screen.findByRole("link", { name: "Content" })).getAttribute("href")).toBe("/content");
    view.unmount();

    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/dashboard");
    await screen.findByRole("link", { name: "My profile" });
    expect(screen.queryByRole("link", { name: "Content" })).toBeNull();
  });
});

describe("the list of pages (R-7.5, R-7.12)", () => {
  it("names every page in order of title, with its address, whether the service needs it, and its dates", async () => {
    serve(() => json(200, [privacy, aboutUs, about]));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content");

    const table = await screen.findByTestId("content-list-table");
    const titles = within(table).getAllByTestId("content-list-title-link");
    expect(titles.map((link) => link.textContent)).toEqual(["about", "About us", "privacy"]);
    expect(titles[0]?.getAttribute("href")).toBe("/content/about/edit");
    const addresses = within(table).getAllByTestId("content-list-address-link");
    expect(addresses.map((link) => link.getAttribute("href"))).toEqual(["/content/about", "/content/about-us", "/content/privacy"]);
    expect(within(table).getAllByTestId("content-list-fixed").map((cell) => cell.textContent)).toEqual(["Yes", "No", "Yes"]);
    const created = within(table).getAllByTestId("content-list-created");
    expect(created[1]?.getAttribute("datetime")).toBe("2026-01-05");
    expect(within(table).getAllByTestId("content-list-updated")[1]?.textContent).toBe("January 7, 2026");
    expect(screen.getByTestId("content-create-link").getAttribute("href")).toBe("/content/create");
    expect(requests.map((request) => request.address)).toEqual(["/api/content"]);
  });

  it("is the missing page when the service refuses it", async () => {
    serve(() => json(401, { errors: ["Only an administrator may manage pages."] }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content");
    await screen.findByTestId("not-found-page");
  });
});

describe("creating a page (R-7.7, R-7.20, R-7.21, R-7.22)", () => {
  it("keeps Publish page unavailable until every field is valid, and says why", async () => {
    serve(() => json(200, []));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/create");

    const publish = (await screen.findByTestId("content-publish-button")) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
    expect(screen.getByTestId("content-slug-rule").textContent).toContain("Use lowercase letters and numbers");

    type("content-title-field", "");
    type("content-slug-field", "Hackathon_Rules");
    type("content-body-field", "The rules.");
    const problems = screen.getAllByTestId("field-error").map((item) => item.textContent);
    expect(problems).toEqual([
      "Title: enter a title",
      "Address: use only lowercase letters and numbers joined by single hyphens",
    ]);
    expect(screen.getByTestId("content-resulting-address").textContent).toBe("Public address: shown once the address is valid.");
    expect(publish.disabled).toBe(true);

    type("content-title-field", "Hackathon rules");
    type("content-slug-field", "hackathon-rules");
    type("content-body-field", "b".repeat(50_001));
    expect(screen.getAllByTestId("field-error").map((item) => item.textContent)).toEqual([
      "Body: shorten it to 50,000 characters or fewer",
    ]);
    expect(screen.getByTestId("content-body-field").textContent).toContain(
      "The body is 50,001 characters long. Shorten it to 50,000 characters or fewer.",
    );
    expect(publish.disabled).toBe(true);

    type("content-body-field", "The rules.");
    expect(screen.queryAllByTestId("field-error")).toEqual([]);
    expect(screen.getByTestId("content-resulting-address").textContent).toMatch(/\/content\/hackathon-rules$/);
    expect(publish.disabled).toBe(false);
    expect(requests).toEqual([]);
  });

  it("asks to confirm, publishes, and opens the new page's managing screen saying so", async () => {
    const created = page({
      id: "00000000-0000-4000-8000-000000000901",
      slug: "hackathon-rules",
      title: "Hackathon rules",
      body: "The rules.",
      updatedBy: { id: administrator.id, name: "Robin Placeholder" },
    });
    serve((method) => (method === "POST" ? json(201, created) : json(200, created)));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/create");

    await screen.findByTestId("content-publish-button");
    type("content-title-field", "Hackathon rules");
    type("content-slug-field", "hackathon-rules");
    type("content-body-field", "The rules.");
    fireEvent.click(screen.getByTestId("content-publish-button"));
    const dialog = await screen.findByTestId("content-publish-dialog");
    expect(dialog.textContent).toContain("/content/hackathon-rules");
    expect(requests).toEqual([]);

    fireEvent.click(within(dialog).getByTestId("content-publish-confirm"));
    const success = await screen.findByTestId("content-published-success");
    expect(success.textContent).toContain("/content/hackathon-rules");
    expect(requests[0]).toEqual({
      method: "POST",
      address: "/api/content",
      body: { title: "Hackathon rules", slug: "hackathon-rules", body: "The rules." },
    });
    expect(screen.getByTestId("content-page-address").getAttribute("href")).toBe("/content/hackathon-rules");
  });

  it("reports an address already in use, keeping everything typed", async () => {
    serve(() => json(400, { errors: [ADDRESS_IN_USE_REFUSAL] }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/create");

    await screen.findByTestId("content-publish-button");
    type("content-title-field", "About the service");
    type("content-slug-field", "about");
    type("content-body-field", "Words.");
    fireEvent.click(screen.getByTestId("content-publish-button"));
    fireEvent.click(within(await screen.findByTestId("content-publish-dialog")).getByTestId("content-publish-confirm"));

    const error = await screen.findByTestId("content-duplicate-slug-error");
    expect(error.textContent).toContain("/content/about");
    expect(screen.getByTestId("content-slug-field").textContent).toContain("Another page already uses this address.");
    expect(input("content-title-field").value).toBe("About the service");
    expect(input("content-body-field").value).toBe("Words.");
  });
});

describe("a page's managing screen (R-7.23, R-7.25, R-7.27)", () => {
  it("names both people for an ordinary page, linked to their profiles, and offers removal", async () => {
    serve(() => json(200, aboutUs));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/about-us/edit");

    const publishedBy = await screen.findByTestId("content-published-by");
    expect(publishedBy.textContent).toBe("Robin Placeholder");
    expect(publishedBy.getAttribute("href")).toBe(`/users/${administrator.id}`);
    expect(screen.getByTestId("content-updated-by").getAttribute("href")).toBe("/users/00000000-0000-4000-8000-000000000106");
    expect(screen.getByTestId("content-published-date").getAttribute("datetime")).toBe("2026-01-05T17:00:00.000Z");
    expect(screen.getByTestId("content-published-date").textContent).toBe("January 5, 2026 at 5:00 p.m.");
    expect(screen.getByTestId("content-delete-button")).toBeTruthy();
    expect(screen.queryByTestId("content-fixed-page-warning")).toBeNull();
    expect(screen.queryByTestId("content-version-history")).toBeNull();
    expect(input("content-body-field").value).toBe("The current wording.");
  });

  it("names the service for a page nobody wrote, warns that the service needs it, and offers no removal", async () => {
    serve(() => json(200, about));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/about/edit");

    expect((await screen.findByTestId("content-published-by")).textContent).toBe("System");
    expect(screen.getByTestId("content-updated-by").getAttribute("href")).toBeNull();
    expect(screen.getByTestId("content-fixed-page-warning").textContent).toContain("/content/about");
    expect(screen.queryByTestId("content-delete-button")).toBeNull();

    fireEvent.click(screen.getByTestId("content-edit-button"));
    expect(input("content-slug-field").readOnly).toBe(true);
    expect(screen.queryByTestId("content-slug-rule")).toBeNull();
    expect(screen.getByTestId("content-fixed-page-warning")).toBeTruthy();
  });

  it("is the missing page for an address no page holds", async () => {
    serve(() => json(404, { errors: ["No page is held at that address."] }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/nothing-here/edit");
    await screen.findByTestId("not-found-page");
  });
});

describe("publishing a change (R-7.8, R-7.24)", () => {
  it("publishes the new wording against the page's identifier and says so", async () => {
    const changed = page({ body: "New wording.", updatedAt: "2026-09-30T17:00:00.000Z", updatedBy: { id: administrator.id, name: "Robin Placeholder" } });
    serve((method) => (method === "PUT" ? json(200, changed) : json(200, aboutUs)));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/about-us/edit");

    fireEvent.click(await screen.findByTestId("content-edit-button"));
    expect(input("content-body-field").value).toBe("The current wording.");
    type("content-body-field", "New wording.");
    fireEvent.click(screen.getByTestId("content-publish-changes-button"));
    const dialog = await screen.findByTestId("content-publish-changes-dialog");
    fireEvent.click(within(dialog).getByTestId("content-publish-changes-confirm"));

    await screen.findByTestId("content-changes-published-success");
    expect(requests.at(-1)).toEqual({
      method: "PUT",
      address: `/api/content/${aboutUs.id}`,
      body: { title: "About us", slug: "about-us", body: "New wording." },
    });
    // The updated date is the moment of the change, not only its day (R-7.8).
    expect(screen.getByTestId("content-updated-date").getAttribute("datetime")).toBe("2026-09-30T17:00:00.000Z");
    expect(screen.getByTestId("content-updated-date").textContent).toBe("September 30, 2026 at 5:00 p.m.");
    expect(screen.getByTestId("content-updated-by").textContent).toBe("Robin Placeholder");
  });

  it("follows a renamed page to its new address", async () => {
    const moved = page({ slug: "about-the-service" });
    serve((method) => (method === "PUT" ? json(200, moved) : json(200, aboutUs)));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { router } = renderAt("/content/about-us/edit");

    fireEvent.click(await screen.findByTestId("content-edit-button"));
    expect(screen.getByTestId("content-slug-field").textContent).toContain("Changing the address moves the page at once.");
    type("content-slug-field", "about-the-service");
    fireEvent.click(screen.getByTestId("content-publish-changes-button"));
    fireEvent.click(within(await screen.findByTestId("content-publish-changes-dialog")).getByTestId("content-publish-changes-confirm"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/content/about-the-service/edit"));
    expect((await screen.findByTestId("content-page-address")).getAttribute("href")).toBe("/content/about-the-service");
    expect(screen.getByTestId("content-changes-published-success")).toBeTruthy();
  });

  it("returns to the page as it was when cancelled, publishing nothing", async () => {
    serve(() => json(200, aboutUs));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/about-us/edit");

    fireEvent.click(await screen.findByTestId("content-edit-button"));
    type("content-body-field", "Something else.");
    fireEvent.click(screen.getByTestId("content-cancel-button"));
    expect(input("content-body-field").value).toBe("The current wording.");
    expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  });
});

describe("removing a page (R-7.9)", () => {
  it("asks once, removes it, and returns to the list saying so", async () => {
    serve((method, path) =>
      method === "DELETE" ? json(200, aboutUs) : path === "/api/content" ? json(200, [about]) : json(200, aboutUs),
    );
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const { router } = renderAt("/content/about-us/edit");

    fireEvent.click(await screen.findByTestId("content-delete-button"));
    const dialog = await screen.findByTestId("content-delete-dialog");
    expect(dialog.textContent).toContain("This cannot be undone.");
    fireEvent.click(within(dialog).getByTestId("content-delete-confirm"));

    const removed = await screen.findByTestId("content-deleted-success");
    expect(removed.textContent).toContain("/content/about-us");
    expect(router.state.location.pathname).toBe("/content");
    expect(requests.find((request) => request.method === "DELETE")?.address).toBe(`/api/content/${aboutUs.id}`);
  });
});

describe("inserting an image into the body (R-7.26, R-8.29)", () => {
  const png = () =>
    new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])], "harbour-map.png", { type: "image/png" });

  async function editing() {
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/content/about-us/edit");
    fireEvent.click(await screen.findByTestId("content-edit-button"));
    expect(screen.getByTestId("image-file-rule").textContent).toContain("JPEG or PNG image, up to 10 MB");
    return screen.getByTestId("content-body-image-button").closest("[role=toolbar]")?.querySelector("input[type=file]") as HTMLInputElement;
  }

  it("opens the file chooser, offering JPEG and PNG, when Insert image is pressed", async () => {
    serve(() => json(200, aboutUs));
    const chooser = await editing();
    expect(chooser.accept).toBe("image/jpeg,image/png");
    const opened = vi.fn();
    chooser.addEventListener("click", opened);

    fireEvent.click(screen.getByTestId("content-body-image-button"));

    expect(opened).toHaveBeenCalledTimes(1);
  });

  it("stores the image and puts a reference to it at the cursor", async () => {
    serve(() => json(200, aboutUs));
    uploads.store.mockResolvedValue({ kind: "stored", id: "5b2e0c3a-8d41-4f6e-a1c2-000000000806" });
    const chooser = await editing();
    const body = input("content-body-field");
    body.setSelectionRange(0, 0);

    await act(async () => {
      fireEvent.change(chooser, { target: { files: [png()] } });
    });

    await waitFor(() =>
      expect(input("content-body-field").value).toBe(
        "![Describe this image](@file/5b2e0c3a-8d41-4f6e-a1c2-000000000806)\n\nThe current wording.",
      ),
    );
    expect(uploads.store).toHaveBeenCalledTimes(1);
    expect((uploads.store.mock.calls[0]?.[0] as File).name).toBe("harbour-map.png");
  });

  it("refuses an image over the limit before sending it, leaving the body as it was", async () => {
    serve(() => json(200, aboutUs));
    const chooser = await editing();
    const large = png();
    Object.defineProperty(large, "size", { value: 13 * 1024 * 1024 });

    await act(async () => {
      fireEvent.change(chooser, { target: { files: [large] } });
    });

    const error = await screen.findByTestId("embedded-image-error");
    expect(error.textContent).toContain("harbour-map.png could not be inserted");
    expect(error.textContent).toContain("Nothing was added to the body.");
    expect(input("content-body-field").value).toBe("The current wording.");
    expect(uploads.store).not.toHaveBeenCalled();
  });

  it("names the service's refusal and leaves the body as it was", async () => {
    serve(() => json(200, aboutUs));
    uploads.store.mockResolvedValue({ kind: "refused", reasons: ["The file is larger than 10 MB. Upload a file of 10 MB or smaller."] });
    const chooser = await editing();

    await act(async () => {
      fireEvent.change(chooser, { target: { files: [png()] } });
    });

    expect((await screen.findByTestId("embedded-image-error")).textContent).toContain("The file is larger than 10 MB.");
    expect(input("content-body-field").value).toBe("The current wording.");
  });
});

describe("the content screens' structure, names and roles (constitution P1, J5)", () => {
  async function problemsIn(container: HTMLElement): Promise<string[]> {
    const results = await axe.run(container, {
      resultTypes: ["violations"],
      rules: { "color-contrast": { enabled: false } },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  }

  it("have nothing to answer for on the list, the create form and the managing screen", async () => {
    serve((_method, path) => (path === "/api/content" ? json(200, [about, aboutUs]) : json(200, aboutUs)));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    for (const address of ["/content", "/content/create", "/content/about-us/edit"]) {
      const { container, unmount } = renderAt(address);
      await screen.findByRole("heading", { level: 1, name: /Content Management|Create a New Page|About us/ });
      expect(await problemsIn(container)).toEqual([]);
      unmount();
    }
  });
});
