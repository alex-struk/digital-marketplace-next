import { describe, expect, it } from "vitest";
import {
  isPageAddress,
  isPageIdentifier,
  readPageLookup,
} from "../src/rules/content";

describe("a page's address (R-7.21)", () => {
  it("accepts lowercase letters and digits in hyphen-separated groups", () => {
    expect(isPageAddress("privacy")).toBe(true);
    expect(isPageAddress("about-us")).toBe(true);
    expect(isPageAddress("sprint-with-us-terms-and-conditions")).toBe(true);
    expect(isPageAddress("page2")).toBe(true);
  });

  it("refuses capitals, spaces, underscores and stray hyphens", () => {
    expect(isPageAddress("Not_A_Slug")).toBe(false);
    expect(isPageAddress("About")).toBe(false);
    expect(isPageAddress("about us")).toBe(false);
    expect(isPageAddress("-about")).toBe(false);
    expect(isPageAddress("about-")).toBe(false);
    expect(isPageAddress("about--us")).toBe(false);
    expect(isPageAddress("")).toBe(false);
  });
});

describe("reading one value as identifier or address (R-7.3, R-7.4)", () => {
  it("reads an identifier as an identifier", () => {
    const lookup = readPageLookup("00000000-0000-4000-8000-000000000501");
    expect(lookup.kind).toBe("identifier");
    expect(isPageIdentifier("00000000-0000-4000-8000-000000000501")).toBe(true);
  });

  it("reads an ordinary address as an address", () => {
    expect(readPageLookup("privacy").kind).toBe("address");
  });

  it("calls a value that is neither malformed rather than not found (R-7.3)", () => {
    expect(readPageLookup("Not_A_Slug").kind).toBe("malformed");
    expect(readPageLookup("nothing here").kind).toBe("malformed");
  });

  it("does not mistake an address for an identifier because it has hyphens", () => {
    expect(isPageIdentifier("about-us")).toBe(false);
  });
});
