import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublishedPage } from "../src/screens/content-view";
import { answerFor, readPage } from "../src/api/content";
import { NotFound } from "../src/app/not-found";

const privacy = {
  id: "00000000-0000-4000-8000-000000000501",
  createdAt: "2020-12-02T17:00:00.000Z",
  updatedAt: "2026-09-14T17:00:00.000Z",
  slug: "privacy",
  title: "Privacy",
  body: "## How we handle your information\n\nWe keep very little.",
  fixed: true,
};

describe("a page at its own address (R-7.1)", () => {
  it("shows its title, its body and both of its dates", () => {
    render(<PublishedPage page={privacy} />);

    expect(screen.getByTestId("content-page-title").textContent).toBe("Privacy");
    expect(screen.getByTestId("content-published-date").getAttribute("datetime")).toBe(
      "2020-12-02",
    );
    expect(screen.getByTestId("content-published-date").textContent).toBe(
      "December 2, 2020",
    );
    expect(screen.getByTestId("content-updated-date").getAttribute("datetime")).toBe(
      "2026-09-14",
    );
    expect(screen.getByTestId("content-page-body").textContent).toContain(
      "We keep very little.",
    );
    expect(screen.getByTestId("content-page-address").textContent).toBe(
      "/content/privacy",
    );
  });

  it("is the article a test reads when the address answers", () => {
    render(<PublishedPage page={privacy} />);
    expect(screen.getByTestId("content-page")).toBeTruthy();
  });
});

describe("an address that does not answer (R-7.2, R-7.3)", () => {
  it("is the not-found screen, and carries no page", () => {
    render(<NotFound />);

    expect(screen.getByTestId("not-found-page")).toBeTruthy();
    expect(screen.queryByTestId("content-page")).toBeNull();
  });

  it("reads an address no page holds as nothing to show", () => {
    expect(answerFor(404, { errors: ["No page is held at that address."] })).toEqual({
      kind: "missing",
    });
  });

  it("reads a malformed address the same way on the screen", () => {
    // The service answers the two differently; a person sees one screen for both.
    expect(answerFor(400, { errors: ["That is not well formed."] })).toEqual({
      kind: "missing",
    });
  });

  it("reads an answer that is not a page as nothing to show", () => {
    expect(answerFor(200, { nothing: "useful" })).toEqual({ kind: "missing" });
    expect(readPage(null)).toBeNull();
    expect(readPage({ id: 1 })).toBeNull();
  });

  it("reads a page the service answered with", () => {
    expect(answerFor(200, privacy)).toEqual({ kind: "found", page: privacy });
  });
});
