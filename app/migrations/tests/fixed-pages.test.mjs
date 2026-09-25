import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { PAGE_SLUGS, PLACEHOLDER_BODY, PAGES_NOT_CREATED } = require("../lib/fixed-pages.cjs");
const { seedFiles } = require("../scripts/seed.cjs");

const here = path.dirname(fileURLToPath(import.meta.url));

describe("the pages a fresh installation needs (R-7.12, R-7.18)", () => {
  it("offers the footer's five pages", () => {
    // R-7.19: About, Disclaimer, Privacy, Accessibility and Copyright are linked from
    // every screen, so every one of them has to exist on a fresh installation.
    for (const slug of ["about", "disclaimer", "privacy", "accessibility", "copyright"]) {
      expect(PAGE_SLUGS).toContain(slug);
    }
  });

  it("offers the service level agreement page", () => {
    // R-7.18: the five places that link to it resolve on a fresh installation.
    expect(PAGE_SLUGS).toContain("service-level-agreement");
  });

  it("offers the service's own terms and the formatting guidance", () => {
    expect(PAGE_SLUGS).toContain("terms-and-conditions");
    expect(PAGE_SLUGS).toContain("markdown-guide");
  });

  it("creates none of the seven pages nothing links to", () => {
    for (const slug of PAGES_NOT_CREATED) {
      expect(PAGE_SLUGS).not.toContain(slug);
    }
  });

  it("names every address only once", () => {
    expect(new Set(PAGE_SLUGS).size).toBe(PAGE_SLUGS.length);
  });

  it("uses addresses the service itself would accept (R-7.21)", () => {
    // Lowercase letters and digits in hyphen-separated groups: a needed page has to be
    // reachable at /content/<address> like any other.
    for (const slug of PAGE_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("titles each page by its own address until somebody writes it", () => {
    expect(PLACEHOLDER_BODY).toBe("Initial version");
  });
});

describe("the seed", () => {
  it("applies the acceptance suite's files in ascending name order", () => {
    const directory = path.resolve(here, "../../../tests/seed");
    const files = seedFiles(directory);
    expect(files.length).toBeGreaterThan(0);
    expect(files).toEqual([...files].sort());
    expect(files).toEqual(readdirSync(directory).filter((n) => n.endsWith(".sql")).sort());
  });
});
