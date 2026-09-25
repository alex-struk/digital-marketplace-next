import { render, screen, waitFor } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../src/router";

function renderAt(address: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [address] }),
  });
  return render(<RouterProvider router={router as never} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function answerWith(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

describe("every screen carries the banner and the footer (R-7.19)", () => {
  it("does so on the home page, signed out", async () => {
    renderAt("/");

    await waitFor(() => expect(screen.getByTestId("home-page")).toBeTruthy());
    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByTestId("site-footer")).toBeTruthy();
    expect(screen.getByTestId("footer-privacy-link").getAttribute("href")).toBe(
      "/content/privacy",
    );
  });

  it("does so on a page of the service's own prose", async () => {
    answerWith(200, {
      id: "00000000-0000-4000-8000-000000000501",
      createdAt: "2020-12-02T17:00:00.000Z",
      updatedAt: "2020-12-02T17:00:00.000Z",
      slug: "privacy",
      title: "privacy",
      body: "Initial version",
      fixed: true,
    });

    renderAt("/content/privacy");

    await waitFor(() => expect(screen.getByTestId("content-page")).toBeTruthy());
    expect(screen.getByTestId("content-page-title").textContent).toBe("privacy");
    expect(screen.getByTestId("content-page-body").textContent).toContain(
      "Initial version",
    );
    expect(screen.getByTestId("site-footer")).toBeTruthy();
  });

  it("does so on the not-found screen", async () => {
    renderAt("/no-such-address");

    await waitFor(() => expect(screen.getByTestId("not-found-page")).toBeTruthy());
    expect(screen.getByTestId("site-footer")).toBeTruthy();
  });
});

describe("moving from one screen to another", () => {
  it("takes the reader to the new screen's heading, and renames the window", async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={router as never} />);
    await waitFor(() => expect(screen.getByTestId("home-page")).toBeTruthy());
    expect(document.title).toBe("Digital Marketplace");

    await router.navigate({
      to: "/learn-more/$program",
      params: { program: "team-with-us" },
    });

    await waitFor(() => expect(document.title).toBe("Team With Us"));
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe("Team With Us"),
    );
  });
});

describe("the addresses the application answers for", () => {
  it("shows the not-found screen for an address no page holds (R-7.2)", async () => {
    answerWith(404, { errors: ["No page is held at that address."] });

    renderAt("/content/nothing-here");

    await waitFor(() => expect(screen.getByTestId("not-found-page")).toBeTruthy());
    expect(screen.queryByTestId("content-page")).toBeNull();
  });

  it("shows the same screen for an address that is not well formed (R-7.3)", async () => {
    answerWith(400, { errors: ["That is not a well-formed page address."] });

    renderAt("/content/Not_A_Slug");

    await waitFor(() => expect(screen.getByTestId("not-found-page")).toBeTruthy());
    expect(screen.queryByTestId("content-page")).toBeNull();
  });

  it("offers the service level agreement from each learn-more screen (R-7.18)", async () => {
    renderAt("/learn-more/sprint-with-us");

    await waitFor(() =>
      expect(screen.getByTestId("service-level-agreement-link")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("service-level-agreement-link").getAttribute("href"),
    ).toBe("/content/service-level-agreement");
  });

  it("shows the not-found screen for a program the service does not run", async () => {
    renderAt("/learn-more/fortnight-with-us");

    await waitFor(() => expect(screen.getByTestId("not-found-page")).toBeTruthy());
  });
});
