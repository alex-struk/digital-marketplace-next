import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { PAGE_SLUGS, PLACEHOLDER_BODY, SERVICE_LEVEL_AGREEMENT_SLUG } = require("../lib/fixed-pages.cjs");
const { seedFiles } = require("../scripts/seed.cjs");

const here = path.dirname(fileURLToPath(import.meta.url));

describe("the pages a fresh installation needs (R-7.12, R-7.18)", () => {
  it("is the twenty-two R-7.12 counts", () => {
    expect(PAGE_SLUGS).toHaveLength(22);
  });

  it("offers the footer's five pages", () => {
    // R-7.19: About, Disclaimer, Privacy, Accessibility and Copyright are linked from
    // every screen, so every one of them has to exist on a fresh installation.
    for (const slug of ["about", "disclaimer", "privacy", "accessibility", "copyright"]) {
      expect(PAGE_SLUGS).toContain(slug);
    }
  });

  it("does not store the service level agreement page, which the service answers itself", () => {
    // R-7.18 is met by the service answering that address (decision record 0026), so the
    // count R-7.12 gives is not pushed to twenty-three.
    expect(PAGE_SLUGS).not.toContain(SERVICE_LEVEL_AGREEMENT_SLUG);
  });

  it("offers the service's own terms and the formatting guidance", () => {
    expect(PAGE_SLUGS).toContain("terms-and-conditions");
    expect(PAGE_SLUGS).toContain("markdown-guide");
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
