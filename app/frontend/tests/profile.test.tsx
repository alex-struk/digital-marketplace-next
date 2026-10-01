import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { File as NodeFile } from "node:buffer";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "../src/api/accounts";
import type { IdentityClient } from "../src/auth/identity-client";
import { currentSession, resetSessionForTests } from "../src/auth/session";
import { routeTree } from "../src/router";

/**
 * The profile and its sections, as the screens use them (user-profile, user-profile-self, the
 * section pages and notification-unsubscribe-landing). The service and the identity provider
 * are stood in for; what is checked is what the screens show and ask of the service.
 */

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    type: "VENDOR",
    status: "ACTIVE",
    name: "Alex Placeholder",
    email: "vendor.one@example.test",
    jobTitle: null,
    avatarImageFile: null,
    notificationsOn: "2026-01-05T17:00:00.000Z",
    acceptedTermsAt: "2026-01-05T17:00:00.000Z",
    lastAcceptedTermsAt: "2026-01-05T17:00:00.000Z",
    idpUsername: "test-vendor-1",
    capabilities: [],
    deactivatedOn: null,
    deactivatedBy: null,
    ...overrides,
  };
}

const vendor = account();
const staff = account({
  id: "00000000-0000-4000-8000-000000000102",
  type: "GOV",
  name: "Casey Placeholder",
  email: "staff.one@example.test",
  jobTitle: "Procurement officer",
  idpUsername: "test-gov",
  acceptedTermsAt: null,
  lastAcceptedTermsAt: null,
});
const administrator = account({
  id: "00000000-0000-4000-8000-000000000101",
  type: "ADMIN",
  name: "Robin Placeholder",
  idpUsername: "test-admin",
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

type Handler = (request: Request) => Promise<Response> | Response;
const requests: { method: string; path: string; body: unknown }[] = [];

function serve(handler: Handler) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request) => {
      const type = input.headers.get("content-type") ?? "";
      let body: unknown;
      if (type.includes("application/json")) body = JSON.parse(await input.clone().text());
      else if (type.includes("multipart/form-data")) body = "multipart";
      requests.push({ method: input.method, path: new URL(input.url).pathname, body });
      return handler(input);
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

const textbox = (testId: string) => within(screen.getByTestId(testId)).getByRole("textbox") as HTMLInputElement;
const checkbox = (element: HTMLElement) => within(element).getByRole("checkbox") as HTMLInputElement;

/**
 * A file as a person chooses it. The test document's own File and FormData cannot be sent by
 * the runtime's fetch, which a browser's can, so the runtime's own are used for an upload.
 */
function picture(content: BlobPart[], name: string, type: string): File {
  return new NodeFile(content as never, name, { type }) as unknown as File;
}

/** The first bytes of a PNG and of a JPEG, which is all the picker reads of a chosen file. */
const PNG_START = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
const JPEG_START = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

function choosePicture(container: HTMLElement, file: File) {
  const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

let RuntimeFormData: typeof FormData;

beforeAll(async () => {
  const form = await new Response("a=1", {
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }).formData();
  RuntimeFormData = form.constructor as typeof FormData;
});

beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal("FormData", RuntimeFormData);
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSessionForTests();
});

describe("the sections a profile offers (R-4.34, R-4.33)", () => {
  it("are all five on a vendor's own profile, and two on a public sector employee's", async () => {
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const own = renderAt("/users/me");
    await screen.findByRole("heading", { level: 1, name: "User Profile" });
    for (const name of ["profile", "capabilities", "organizations", "notifications", "legal"]) {
      expect(screen.getByTestId(`profile-tab-${name}`), name).toBeTruthy();
    }
    own.unmount();

    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/users/me?tab=capabilities");
    await screen.findByRole("heading", { level: 1, name: "User Profile" });
    expect(screen.queryByTestId("profile-tab-capabilities")).toBeNull();
    expect(screen.getByTestId("profile-tab-notifications")).toBeTruthy();
    expect(screen.getByTestId("profile-permissions-label").textContent).toContain("do not have administrator");
  });

  it("is the profile section alone, read-only, when an administrator opens somebody else's (R-4.25, R-4.18)", async () => {
    serve(() => json(200, vendor));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt(`/users/${vendor.id}?tab=capabilities`);

    expect((await screen.findByTestId("profile-user-identifier")).textContent).toBe(vendor.id);
    expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([`GET /api/users/${vendor.id}`]);
    expect(screen.queryByRole("navigation", { name: "Profile sections" })).toBeNull();
    expect(screen.queryByTestId("profile-edit-button")).toBeNull();
    expect(screen.queryByTestId("capability-checkbox")).toBeNull();
    expect(screen.getByTestId("profile-status-badge").textContent).toBe("Active");
    expect(textbox("name-field").readOnly).toBe(true);
    // Whose profile it is reads in words, not only inside the read-only fields.
    const main = screen.getByRole("heading", { level: 1 }).parentElement as HTMLElement;
    expect(main.textContent).toContain(vendor.name);
    expect(main.textContent).toContain(vendor.email);
    // The administrator's own powers are offered, and nothing else (R-4.18).
    expect(main.textContent).toContain("Deactivate account");
    expect(screen.getByTestId("profile-admin-checkbox").textContent).toContain("Administrator");
    expect(screen.queryByTestId("profile-reactivate-button")).toBeNull();
  });

  it("offers reactivation only for an account an administrator deactivated (R-4.18)", async () => {
    serve(() => json(200, { ...vendor, status: "INACTIVE_ADMIN" }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    const first = renderAt(`/users/${vendor.id}`);
    expect(await screen.findByTestId("profile-reactivate-button")).toBeTruthy();
    expect(screen.queryByTestId("profile-deactivate-button")).toBeNull();
    first.unmount();

    serve(() => json(200, { ...vendor, status: "INACTIVE_USER" }));
    renderAt(`/users/${vendor.id}`);
    await screen.findByText(/They reactivate it by signing in again/);
    expect(screen.queryByTestId("profile-reactivate-button")).toBeNull();
  });

  it("is the missing page, asked of nobody, when anyone else opens somebody else's (R-4.25)", async () => {
    serve(() => json(200, staff));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt(`/users/${staff.id}`);

    await screen.findByTestId("not-found-page");
    expect(requests).toEqual([]);
  });

  it("is the missing page when the service refuses an administrator", async () => {
    serve(() => json(404, { errors: ["No account is held at that address."] }));
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/users/00000000-0000-4000-8000-00000000ffff");

    await screen.findByTestId("not-found-page");
  });
});

describe("editing one's own details (R-4.18, R-4.27, R-4.28, R-4.6)", () => {
  it("asks a vendor for no job title, and a public sector employee for one", async () => {
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const own = renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));
    expect(screen.getByTestId("name-field")).toBeTruthy();
    expect(screen.queryByTestId("job-title-field")).toBeNull();
    own.unmount();

    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));
    expect(textbox("job-title-field").value).toBe("Procurement officer");
  });

  it("reports each invalid field and saves nothing", async () => {
    serve(() => json(500, {}));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    fireEvent.change(textbox("name-field"), { target: { value: "" } });
    fireEvent.change(textbox("email-field"), { target: { value: "vendor1-at-example" } });
    fireEvent.click(screen.getByTestId("profile-save-button"));

    await waitFor(() => expect(screen.getAllByTestId("field-error")).toHaveLength(2));
    expect(requests).toEqual([]);
  });

  it("keeps a name of 101 characters as typed, and reports it rather than cutting it short", async () => {
    serve(() => json(200, vendor));
    resetSessionForTests({ status: "signed-in", account: staff }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    expect(textbox("name-field").maxLength).toBe(-1);
    expect(textbox("job-title-field").maxLength).toBe(-1);
    fireEvent.change(textbox("name-field"), { target: { value: "n".repeat(101) } });
    fireEvent.click(screen.getByTestId("profile-save-button"));

    const error = await screen.findByTestId("field-error");
    expect(error.textContent).toContain("Name");
    expect(textbox("name-field").value).toHaveLength(101);
    expect(requests).toEqual([]);
  });

  it("saves the new details and shows them", async () => {
    const renamed = { ...vendor, name: "Alex Renamed", email: "alex@example.test" };
    serve(() => json(200, renamed));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    fireEvent.change(textbox("name-field"), { target: { value: "Alex Renamed" } });
    fireEvent.change(textbox("email-field"), { target: { value: "Alex@Example.test" } });
    fireEvent.click(screen.getByTestId("profile-save-button"));

    await waitFor(() => expect(textbox("name-field").readOnly).toBe(true));
    expect(textbox("name-field").value).toBe("Alex Renamed");
    const main = screen.getByRole("heading", { level: 1 }).parentElement as HTMLElement;
    expect(main.textContent).toContain("Alex Renamed");
    expect(main.textContent).toContain("alex@example.test");
    expect(requests).toEqual([
      {
        method: "PUT",
        path: `/api/users/${vendor.id}`,
        body: { tag: "updateProfile", value: { name: "Alex Renamed", email: "alex@example.test" } },
      },
    ]);
  });

  it("keeps the form open, naming no cause, when the service refuses the save", async () => {
    serve(() => json(400, { errors: ["Your profile could not be saved."] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));
    fireEvent.change(textbox("email-field"), { target: { value: "taken@example.test" } });
    fireEvent.click(screen.getByTestId("profile-save-button"));

    await screen.findByText("Your changes could not be saved");
    expect(textbox("email-field").value).toBe("taken@example.test");
  });
});

describe("the profile picture (file-image-picker; R-8.17, R-8.28, R-8.30)", () => {
  it("states the rule before a file is chosen, and offers only JPEG and PNG", async () => {
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    expect(screen.getByTestId("image-file-rule").textContent).toContain("A JPEG or PNG image, up to 10 MB");
    expect(screen.getByTestId("change-avatar").getAttribute("aria-describedby")).toBe("image-file-rule");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe("image/jpeg,image/png");
  });

  it("opens the file chooser when the button is pressed", async () => {
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const opened = vi.fn();
    input.addEventListener("click", opened);
    fireEvent.click(screen.getByTestId("change-avatar"));
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it("turns down a picture whose name does not end in .jpg, .jpeg or .png, and stores nothing", async () => {
    serve(() => json(200, vendor));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    choosePicture(container, picture(["GIF89a"], "portrait.gif", "image/gif"));
    expect((await screen.findByTestId("image-rejected-error")).textContent).toContain(
      "portrait.gif cannot be used as a profile picture",
    );
    expect(requests).toEqual([]);
  });

  it("keeps the form open with the refusal in view when saved while a picture is turned down (R-8.30)", async () => {
    serve(() => json(200, vendor));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    choosePicture(container, picture(["GIF89a"], "portrait.gif", "image/gif"));
    const refusal = await screen.findByTestId("image-rejected-error");
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.click(screen.getByTestId("profile-save-button"));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("image-rejected-error")));
    expect(screen.getByTestId("image-rejected-error")).toBe(refusal);
    expect(refusal.textContent).toContain("portrait.gif cannot be used as a profile picture");
    expect(screen.getByTestId("profile-save-button")).toBeTruthy();
    expect(screen.queryByText("Your profile has been saved.")).toBeNull();
    expect(requests).toEqual([]);
  });

  it("turns down, when it is chosen, a .png whose content is not an image, and stores nothing (R-8.21)", async () => {
    serve(() => json(200, vendor));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    choosePicture(container, picture(["this is plain text, not a picture"], "portrait.png", "image/png"));
    const refusal = await screen.findByTestId("image-rejected-error");
    expect(refusal.textContent).toContain("portrait.png cannot be used as a profile picture");
    expect(refusal.textContent).toContain("not a JPEG or PNG image");
    expect(screen.queryByTestId("profile-image-preview")).toBeNull();
    expect(requests).toEqual([]);
  });

  it("stores a chosen picture when the profile is saved, and shows it from where it is stored", async () => {
    const pictureId = "5b2e0c3a-8d41-4f6e-a1c2-000000000805";
    serve((request) =>
      new URL(request.url).pathname === "/api/avatars"
        ? json(201, { id: pictureId, name: "harbour.png", createdAt: "2026-09-30T00:00:00.000Z", fileBlob: "f" })
        : json(200, { ...vendor, avatarImageFile: pictureId }),
    );
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    choosePicture(container, picture([PNG_START], "harbour.png", "image/png"));
    await screen.findByText("harbour.png is ready. Save your changes to use it as your profile picture.");
    fireEvent.click(screen.getByTestId("profile-save-button"));

    const image = (await screen.findByTestId("profile-image")) as HTMLImageElement;
    expect(image.getAttribute("src")).toBe(`/api/files/${pictureId}?type=blob`);
    expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([
      "POST /api/avatars",
      `PUT /api/users/${vendor.id}`,
    ]);
    expect(requests[1]?.body).toEqual({
      tag: "updateProfile",
      value: { name: vendor.name, email: vendor.email, avatarImageFile: pictureId },
    });
  });

  it("shows the service's refusal of a picture where it was chosen (R-8.21)", async () => {
    serve(() => json(400, { errors: ["A profile picture or logo must be a JPEG or PNG image. This file's content is neither."] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    const { container } = renderAt("/users/me");
    fireEvent.click(await screen.findByTestId("profile-edit-button"));

    // Its first bytes are a JPEG's, so the picker lets it through; the service decodes the rest.
    choosePicture(container, picture([JPEG_START, "and then not a picture"], "portrait.png", "image/png"));
    await screen.findByText("portrait.png is ready. Save your changes to use it as your profile picture.");
    fireEvent.click(screen.getByTestId("profile-save-button"));

    const refusal = await screen.findByTestId("image-rejected-error");
    expect(refusal.textContent).toContain("portrait.png cannot be used as a profile picture");
    expect(refusal.textContent).toContain("Your current picture has been kept.");
    expect(requests.map(({ path }) => path)).toEqual(["/api/avatars"]);
  });
});

describe("capabilities (R-4.8)", () => {
  it("are saved as each is ticked, from the service's own list", async () => {
    serve(() => json(200, { ...vendor, capabilities: ["Backend Development"] }));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me?tab=capabilities");

    await screen.findByRole("heading", { level: 1, name: "Capabilities" });
    const rows = screen.getAllByTestId("capability-row");
    expect(rows).toHaveLength(9);
    const backend = rows.find((row) => row.textContent?.includes("Backend Development")) as HTMLElement;
    fireEvent.click(checkbox(backend));

    await waitFor(() =>
      expect(requests).toEqual([
        { method: "PUT", path: `/api/users/${vendor.id}`, body: { tag: "updateCapabilities", value: ["Backend Development"] } },
      ]),
    );
    expect(checkbox(backend).checked).toBe(true);
  });

  it("each carry a description a person can expand", async () => {
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me?tab=capabilities");
    const toggle = (await screen.findAllByTestId("capability-description-toggle"))[0] as HTMLElement;

    expect(screen.queryByTestId("capability-description")).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByTestId("capability-description").textContent).not.toBe("");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("the notice choice and unsubscribing (R-4.29, R-6.6, R-6.7)", () => {
  it("asks before stopping, naming the signed-in person's address, on arrival from a message", async () => {
    serve(() => json(200, { ...staff, notificationsOn: null }));
    resetSessionForTests(
      { status: "signed-in", account: { ...staff, notificationsOn: "2026-01-05T17:00:00.000Z" } },
      fakeIdentity(),
    );
    renderAt("/users/me?tab=notifications&unsubscribe");

    const question = await screen.findByTestId("unsubscribe-modal");
    expect(within(question).getByTestId("unsubscribe-confirmation-address").textContent).toBe(staff.email);
    expect(screen.getByTestId("notifications-email-address").textContent).toContain(staff.email);
    expect(requests).toEqual([]);

    fireEvent.click(screen.getByTestId("unsubscribe-confirm-button"));
    await waitFor(() => expect(screen.queryByTestId("unsubscribe-modal")).toBeNull());
    expect(requests).toEqual([
      { method: "PUT", path: `/api/users/${staff.id}`, body: { tag: "updateNotifications", value: false } },
    ]);
    expect(checkbox(screen.getByTestId("notifications-new-opportunities-checkbox")).checked).toBe(false);
  });

  it("changes nothing when the person keeps receiving them", async () => {
    serve(() => json(200, vendor));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me?tab=notifications&unsubscribe=");

    fireEvent.click(await screen.findByTestId("unsubscribe-cancel-button"));
    await waitFor(() => expect(screen.queryByTestId("unsubscribe-modal")).toBeNull());
    expect(requests).toEqual([]);
  });

  it("turns notices on and off at once from the profile, asking nothing", async () => {
    const off = { ...vendor, notificationsOn: null };
    serve((request) => request.clone().json().then((body: { value: boolean }) => json(200, body.value ? vendor : off)));
    resetSessionForTests({ status: "signed-in", account: off }, fakeIdentity());
    renderAt("/users/me?tab=notifications");

    const box = await screen.findByTestId("notifications-new-opportunities-checkbox");
    fireEvent.click(checkbox(box));
    await waitFor(() => expect(checkbox(box).checked).toBe(true));
    await waitFor(() => expect(requests).toHaveLength(1));

    fireEvent.click(checkbox(box));
    expect(checkbox(box).checked).toBe(false);
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(screen.queryByTestId("unsubscribe-modal")).toBeNull();
    expect(requests.map(({ body }) => body)).toEqual([
      { tag: "updateNotifications", value: true },
      { tag: "updateNotifications", value: false },
    ]);
    await waitFor(() => expect(checkbox(box).checked).toBe(false));
  });

  it("ticks the box the moment it is pressed, and unticks it if the service refuses", async () => {
    let answer: (response: Response) => void = () => {};
    serve(() => new Promise<Response>((resolve) => (answer = resolve)));
    resetSessionForTests({ status: "signed-in", account: { ...vendor, notificationsOn: null } }, fakeIdentity());
    renderAt("/users/me?tab=notifications");

    const box = await screen.findByTestId("notifications-new-opportunities-checkbox");
    fireEvent.click(checkbox(box));
    expect(checkbox(box).checked).toBe(true);

    await waitFor(() => expect(requests).toHaveLength(1));
    await act(async () => answer(json(500, {})));
    await screen.findByText("Your choice could not be saved");
    expect(checkbox(box).checked).toBe(false);
  });

  it("unticks the box as soon as stopping is confirmed, before the service answers", async () => {
    let answer: (response: Response) => void = () => {};
    serve(() => new Promise<Response>((resolve) => (answer = resolve)));
    resetSessionForTests({ status: "signed-in", account: vendor }, fakeIdentity());
    renderAt("/users/me?tab=notifications&unsubscribe");

    const box = await screen.findByTestId("notifications-new-opportunities-checkbox");
    // While the question is open the page behind it is hidden from assistive technology, so
    // the box is read directly rather than by its role.
    const input = box.querySelector("input") as HTMLInputElement;
    expect(input.checked).toBe(true);
    fireEvent.click(await screen.findByTestId("unsubscribe-confirm-button"));
    expect(input.checked).toBe(false);

    await waitFor(() => expect(requests).toHaveLength(1));
    await act(async () => answer(json(200, { ...vendor, notificationsOn: null })));
    expect(input.checked).toBe(false);
    expect(requests.map(({ body }) => body)).toEqual([{ tag: "updateNotifications", value: false }]);
  });

  it("sends a visitor to sign in first, to come back with the question asked", async () => {
    resetSessionForTests({ status: "visitor" }, fakeIdentity());
    const { router } = renderAt("/users/me?tab=notifications&unsubscribe");

    const notice = await screen.findByTestId("sign-in-required");
    expect(notice.textContent).toContain("Sign in to unsubscribe");
    expect(router.state.location.href).toContain("redirectOnSuccess=");
    expect(decodeURIComponent(router.state.location.href)).toContain("unsubscribe");
  });
});

describe("deactivating one's own account (R-4.9)", () => {
  it("asks first, then signs the person out and shows the notice", async () => {
    const identity = fakeIdentity();
    serve(() => json(200, { ...vendor, status: "INACTIVE_USER", identityProviderSignedOut: true }));
    resetSessionForTests({ status: "signed-in", account: vendor }, identity);
    const { router } = renderAt("/users/me");

    fireEvent.click(await screen.findByTestId("profile-deactivate-button"));
    expect(await screen.findByTestId("activation-modal")).toBeTruthy();
    expect(requests).toEqual([]);
    await act(async () => {
      fireEvent.click(screen.getByTestId("activation-confirm-button"));
    });

    await screen.findByTestId("notice-deactivated-own-account");
    expect(router.state.location.pathname).toBe("/notice/deactivatedOwnAccount");
    expect(requests.map(({ method, path }) => `${method} ${path}`)).toEqual([`DELETE /api/users/${vendor.id}`]);
    expect(identity.forget).toHaveBeenCalled();
    expect(currentSession()).toEqual({ status: "visitor" });
  });

  it("is not offered to an administrator on their own profile (R-4.31)", async () => {
    resetSessionForTests({ status: "signed-in", account: administrator }, fakeIdentity());
    renderAt("/users/me");

    await screen.findByTestId("profile-edit-button");
    expect(screen.queryByTestId("profile-deactivate-button")).toBeNull();
  });
});
