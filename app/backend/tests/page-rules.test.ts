import { describe, expect, it } from "vitest";
import {
  bodyProblem,
  comparePagesByTitle,
  mayManagePages,
  pageProblems,
  refusalLineFor,
  slugProblem,
  titleProblem,
} from "../src/rules/content";
import { embeddedImageReference, resolveEmbeddedFile } from "../src/rules/files";

describe("what a page must carry (R-7.20, R-7.21)", () => {
  it("wants a title of one to a hundred characters", () => {
    expect(titleProblem("")?.message).toBe("Enter a title");
    expect(titleProblem("   ")?.message).toBe("Enter a title");
    expect(titleProblem("t".repeat(100))).toBeNull();
    expect(titleProblem("t".repeat(101))?.message).toBe(
      "The title is 101 characters long. Shorten it to 100 characters or fewer.",
    );
  });

  it("wants a body of one to fifty thousand characters", () => {
    expect(bodyProblem("")?.summary).toBe("enter a body");
    expect(bodyProblem("b".repeat(50_000))).toBeNull();
    expect(bodyProblem("b".repeat(50_012))?.message).toBe(
      "The body is 50,012 characters long. Shorten it to 50,000 characters or fewer.",
    );
  });

  it("wants a well-formed address", () => {
    expect(slugProblem("")?.message).toBe("Enter an address");
    expect(slugProblem("Hackathon_Rules")?.summary).toBe(
      "use only lowercase letters and numbers joined by single hyphens",
    );
    expect(slugProblem("hackathon-rules")).toBeNull();
  });

  it("names every failing field, in the form's order", () => {
    const problems = pageProblems({ title: "", slug: "Bad Slug", body: "" });
    expect(problems.map((problem) => problem.field)).toEqual(["title", "slug", "body"]);
    expect(refusalLineFor(problems[0]!)).toBe("Title: Enter a title");
  });
});

describe("who may manage pages (R-7.10)", () => {
  it("is an administrator alone", () => {
    expect(mayManagePages({ type: "ADMIN" })).toBe(true);
    expect(mayManagePages({ type: "GOV" })).toBe(false);
    expect(mayManagePages({ type: "VENDOR" })).toBe(false);
    expect(mayManagePages(null)).toBe(false);
  });
});

describe("the list's order (R-7.5)", () => {
  it("is by title as a reader compares them, then by address", () => {
    const pages = [
      { title: "privacy", slug: "privacy" },
      { title: "About us", slug: "about-us" },
      { title: "about", slug: "about" },
      { title: "Same", slug: "b-same" },
      { title: "Same", slug: "a-same" },
    ];
    expect([...pages].sort(comparePagesByTitle).map((page) => page.slug)).toEqual([
      "about",
      "about-us",
      "privacy",
      "a-same",
      "b-same",
    ]);
  });
});

describe("an image placed into formatted text (R-8.29)", () => {
  const fileId = "5b2e0c3a-8d41-4f6e-a1c2-000000000806";

  it("is referred to by a marker, never by a web address", () => {
    const reference = embeddedImageReference(fileId);
    expect(reference).toBe(`![Describe this image](@file/${fileId})`);
    expect(reference).not.toContain("/api/");
  });

  it("is resolved to the file's address only when displayed", () => {
    expect(resolveEmbeddedFile(`@file/${fileId}`)).toBe(`/api/files/${fileId}?type=blob`);
  });

  it("leaves a marker that names no file identifier, and any other address, as written", () => {
    expect(resolveEmbeddedFile("@file/not-an-identifier")).toBe("@file/not-an-identifier");
    expect(resolveEmbeddedFile("https://example.test/map.png")).toBe("https://example.test/map.png");
  });
});
