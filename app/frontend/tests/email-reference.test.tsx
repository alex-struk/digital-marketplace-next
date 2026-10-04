import { render, screen, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { ReferenceGroup } from "../src/api/notifications";
import type { IdentityClient } from "../src/auth/identity-client";
import { resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * The administrator's notification reference (notification-email-reference): the service answers
 * the samples; the screen lays them out and refuses anybody else. The service is stood in for.
 */

function account(overrides: Partial<Account>): Account {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    type: "ADMIN",
    status: "ACTIVE",
    name: "Robin Placeholder",
    email: "admin.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: null,
    acceptedTermsAt: null,
    lastAcceptedTermsAt: null,
    idpUsername: "test-admin",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

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

const GROUPS: ReferenceGroup[] = [
  {
    id: "cwu-published",
    event: "A Code With Us opportunity is published",
    messages: [
      {
        id: "cwu-published-subscribers",
        recipient: "To everyone who asked to be emailed about new opportunities",
        subject: "[TEST] A New Code With Us Opportunity Has Been Posted",
        summary: "Sent in batches of up to fifty.",
        title: "A new Code With Us opportunity has been posted",
        body: [
          { kind: "paragraph", content: ["A new Code With Us opportunity has been posted on the Digital Marketplace."] },
          { kind: "action", label: "View the opportunity", href: "http://localhost:4300/opportunities/code-with-us/x" },
        ],
        footer: {
          kind: "paragraph",
          content: [
            "You are receiving this email because you asked to be told about new opportunities. ",
            { text: "Unsubscribe", href: "http://localhost:4300/users/me?tab=notifications&unsubscribe" },
          ],
        },
      },
    ],
  },
  {
    id: "terms-updated",
    event: "The terms and conditions are updated",
    messages: [
      {
        id: "terms-updated-vendors",
        recipient: "To every active vendor",
        subject: "[TEST] The Digital Marketplace terms and conditions have changed",
        title: "Please review the updated terms and conditions",
        body: [{ kind: "paragraph", content: ["The terms have been updated."] }],
        footer: {
          kind: "paragraph",
          content: [{ text: "Manage your notification settings", href: "http://localhost:4300/users/me?tab=notifications" }],
        },
      },
    ],
  },
];

const asked: string[] = [];

function serve(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      asked.push(new URL(input.url).pathname);
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    }),
  );
}

function renderAt(address: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [address] }) });
  return render(<RouterProvider router={router as never} />);
}

beforeEach(() => {
  asked.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the notification reference (R-6.13)", () => {
  it("shows each message under the event that sends it, with its subject, its summary where written, and its body", async () => {
    serve(200, { groups: GROUPS });
    resetSessionForTests({ status: "signed-in", account: account({}) }, fakeIdentity());
    renderAt("/admin/email-notification-reference");

    const page = await screen.findByTestId("email-reference-page");
    await within(page).findAllByTestId("email-reference-body");
    expect(asked).toEqual(["/admin/email-notification-reference"]);
    expect(screen.getByRole("heading", { level: 1, name: "Email Notification Reference" })).toBeTruthy();
    expect(screen.getAllByTestId("email-reference-group-title").map((title) => title.textContent)).toEqual([
      "A Code With Us opportunity is published",
      "The terms and conditions are updated",
    ]);
    expect(screen.getAllByTestId("email-reference-subject").map((subject) => subject.textContent)).toEqual([
      "[TEST] A New Code With Us Opportunity Has Been Posted",
      "[TEST] The Digital Marketplace terms and conditions have changed",
    ]);
    // The second message has no summary written, so its row is left out rather than shown empty.
    expect(screen.getAllByTestId("email-reference-summary").map((summary) => summary.textContent)).toEqual([
      "Sent in batches of up to fifty.",
    ]);
    const [announcement] = screen.getAllByTestId("email-reference-body");
    expect(within(announcement!).getByText("A new Code With Us opportunity has been posted")).toBeTruthy();
    expect(within(announcement!).getByRole("link", { name: "View the opportunity" }).getAttribute("href")).toBe(
      "http://localhost:4300/opportunities/code-with-us/x",
    );
    // An in-page list of every event leads to each section.
    const contents = screen.getByRole("navigation", { name: "Events that send email" });
    expect(within(contents).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["#cwu-published", "#terms-updated"]);
  });

  it("ends each body as the message ends: Unsubscribe where the choice governs it, the settings link elsewhere (R-6.6, R-6.16)", async () => {
    serve(200, { groups: GROUPS });
    resetSessionForTests({ status: "signed-in", account: account({}) }, fakeIdentity());
    renderAt("/admin/email-notification-reference");

    const [announcement, terms] = await screen.findAllByTestId("email-reference-body");
    const links = (body: HTMLElement) => within(body).getAllByRole("link");
    const lastOf = (body: HTMLElement) => links(body)[links(body).length - 1]!;
    expect(lastOf(announcement!).textContent).toBe("Unsubscribe");
    expect(lastOf(announcement!).getAttribute("href")).toBe("http://localhost:4300/users/me?tab=notifications&unsubscribe");
    expect(lastOf(terms!).textContent).toBe("Manage your notification settings");
    expect(within(terms!).queryByRole("link", { name: "Unsubscribe" })).toBeNull();
  });

  it("is the missing page for anybody but an administrator, and nothing is asked of the service", async () => {
    serve(200, { groups: GROUPS });
    for (const who of [account({ type: "VENDOR" }), account({ type: "GOV" })]) {
      resetSessionForTests({ status: "signed-in", account: who }, fakeIdentity());
      const view = renderAt("/admin/email-notification-reference");
      await screen.findByTestId("not-found-page");
      expect(screen.queryByTestId("email-reference-page")).toBeNull();
      view.unmount();
    }
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    renderAt("/admin/email-notification-reference");
    await screen.findByTestId("not-found-page");
    expect(asked).toEqual([]);
  });

  it("asks for the samples past the browser's cache, which holds the page at the same address (decision record 0068)", async () => {
    const modes: RequestCache[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: Request) => {
        modes.push(input.cache);
        expect(input.headers.get("accept")).toBe("application/json");
        return new Response(JSON.stringify({ groups: GROUPS }), { status: 200, headers: { "content-type": "application/json" } });
      }),
    );
    resetSessionForTests({ status: "signed-in", account: account({}) }, fakeIdentity());
    renderAt("/admin/email-notification-reference");

    await screen.findAllByTestId("email-reference-body");
    expect(modes).toEqual(["no-store"]);
  });

  it("is the missing page when the service refuses it", async () => {
    serve(404, { errors: ["Not found."] });
    resetSessionForTests({ status: "signed-in", account: account({}) }, fakeIdentity());
    renderAt("/admin/email-notification-reference");
    await screen.findByTestId("not-found-page");
  });
});
