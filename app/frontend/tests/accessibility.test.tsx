import { render, waitFor, screen } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../src/router";

/**
 * WCAG 2.1 AA applies to every screen (constitution P1, J5). This is the part of it a machine
 * can hold: structure, names, roles and relationships, over the real markup each screen
 * renders. Colour contrast, keyboard operation and reflow are checked against a running
 * browser and are not what this test claims.
 */
async function problemsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    rules: {
      // Needs a browser to measure; nothing here sets a colour.
      "color-contrast": { enabled: false },
    },
  });
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help}`,
  );
}

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

describe("every screen this slice carries", () => {
  it("has nothing to answer for on the home page", async () => {
    const { container } = renderAt("/");
    await waitFor(() => expect(screen.getByTestId("home-page")).toBeTruthy());

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("has nothing to answer for on a learn-more screen", async () => {
    const { container } = renderAt("/learn-more/code-with-us");
    await waitFor(() =>
      expect(screen.getByTestId("service-level-agreement-link")).toBeTruthy(),
    );

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("has nothing to answer for on a page of the service's own prose", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: "00000000-0000-4000-8000-000000000501",
              createdAt: "2020-12-02T17:00:00.000Z",
              updatedAt: "2026-09-14T17:00:00.000Z",
              slug: "privacy",
              title: "Privacy",
              body: [
                "## How we handle your information",
                "",
                "We keep **very little**.",
                "",
                "- One thing",
                "- Another thing",
                "",
                "Raise it through the [accessibility page](/content/accessibility).",
                "",
                "![A placeholder picture](/api/files/00000000-0000-4000-8000-000000000001)",
              ].join("\n"),
              fixed: true,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    const { container } = renderAt("/content/privacy");
    await waitFor(() => expect(screen.getByTestId("content-page")).toBeTruthy());

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);

  it("has nothing to answer for on the not-found screen", async () => {
    const { container } = renderAt("/no-such-address");
    await waitFor(() => expect(screen.getByTestId("not-found-page")).toBeTruthy());

    expect(await problemsIn(container)).toEqual([]);
  }, 30_000);
});
