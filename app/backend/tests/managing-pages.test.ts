import { describe, expect, it } from "vitest";
import { ContentService, PageViewer } from "../src/content/content.service";
import { AddressInUse, Authorship, Page, PageStore, PageWording } from "../src/content/page";
import { refusalFor } from "../src/common/refusals";
import {
  ADDRESS_IN_USE_REFUSAL,
  NEEDED_PAGE_NOT_REMOVED,
  NEEDED_PAGE_NOT_RENAMED,
  PAGES_ARE_FOR_ADMINISTRATORS,
  readPageLookup,
} from "../src/rules/content";

/**
 * Managing pages, against a store held in memory: who may, what a page must carry, and what
 * each change does to the pages and their versions.
 */

const ADMIN: PageViewer = { id: "00000000-0000-4000-8000-000000000101", type: "ADMIN" };
const OTHER_ADMIN: PageViewer = { id: "00000000-0000-4000-8000-000000000106", type: "ADMIN" };
const STAFF: PageViewer = { id: "00000000-0000-4000-8000-000000000102", type: "GOV" };
const VENDOR: PageViewer = { id: "00000000-0000-4000-8000-000000000201", type: "VENDOR" };

interface Held {
  id: string;
  slug: string;
  fixed: boolean;
  createdAt: string;
  createdBy: string | null;
  versions: { title: string; body: string; createdAt: string; createdBy: string | null }[];
}

class MemoryPages implements PageStore {
  readonly held: Held[] = [];
  private clock = Date.parse("2026-09-01T17:00:00Z");
  private next = 900;

  constructor(pages: Partial<Held>[] = []) {
    for (const page of pages) {
      this.held.push({
        id: page.id ?? this.identifier(),
        slug: page.slug ?? "about-us",
        fixed: page.fixed ?? false,
        createdAt: "2026-01-05T17:00:00.000Z",
        createdBy: page.createdBy ?? null,
        versions: page.versions ?? [
          { title: page.slug ?? "about-us", body: "Initial version", createdAt: "2026-01-05T17:00:00.000Z", createdBy: page.createdBy ?? null },
        ],
      });
    }
  }

  private identifier() {
    this.next += 1;
    return `00000000-0000-4000-8000-000000000${this.next}`;
  }

  private now() {
    this.clock += 60_000;
    return new Date(this.clock).toISOString();
  }

  private asPage(held: Held | undefined): Page | null {
    const current = held?.versions.at(-1);
    if (!held || !current) return null;
    return {
      id: held.id,
      createdAt: held.createdAt,
      updatedAt: current.createdAt,
      slug: held.slug,
      title: current.title,
      body: current.body,
      fixed: held.fixed,
    };
  }

  async findByIdentifier(identifier: string) {
    return this.asPage(this.held.find((page) => page.id === identifier));
  }

  async findByAddress(address: string) {
    return this.asPage(this.held.find((page) => page.slug === address));
  }

  async authorshipOf(pageId: string): Promise<Authorship> {
    const held = this.held.find((page) => page.id === pageId);
    const named = (id: string | null | undefined) => (id ? { id, name: `Person ${id.slice(-3)}` } : null);
    return { createdBy: named(held?.createdBy), updatedBy: named(held?.versions.at(-1)?.createdBy) };
  }

  async list() {
    return this.held.map((page) => this.asPage(page)).filter((page): page is Page => page !== null);
  }

  async create(wording: PageWording) {
    if (this.held.some((page) => page.slug === wording.slug)) throw new AddressInUse(wording.slug);
    const createdAt = this.now();
    const held: Held = {
      id: this.identifier(),
      slug: wording.slug,
      fixed: false,
      createdAt,
      createdBy: wording.author,
      versions: [{ title: wording.title, body: wording.body, createdAt, createdBy: wording.author }],
    };
    this.held.push(held);
    return this.asPage(held) as Page;
  }

  async publish(pageId: string, wording: PageWording) {
    const held = this.held.find((page) => page.id === pageId) as Held;
    if (held.slug !== wording.slug && this.held.some((page) => page.slug === wording.slug)) {
      throw new AddressInUse(wording.slug);
    }
    held.slug = wording.slug;
    held.versions.push({ title: wording.title, body: wording.body, createdAt: this.now(), createdBy: wording.author });
    return this.asPage(held) as Page;
  }

  async remove(pageId: string) {
    const at = this.held.findIndex((page) => page.id === pageId);
    if (at >= 0) this.held.splice(at, 1);
  }
}

const wording = { title: "Hackathon rules", slug: "hackathon-rules", body: "The rules of the hackathon." };

async function refusalOf(attempt: Promise<unknown>) {
  try {
    await attempt;
  } catch (error) {
    return refusalFor(error);
  }
  throw new Error("The request was answered, not refused.");
}

describe("who may manage pages (R-7.5, R-7.10, R-7.16)", () => {
  const someone = [
    ["a visitor", null],
    ["a public sector employee", STAFF],
    ["a vendor", VENDOR],
  ] as const;

  for (const [who, viewer] of someone) {
    it(`refuses ${who} every managing request, in one shape, and changes nothing`, async () => {
      const pages = new MemoryPages([{ slug: "about-us", createdBy: ADMIN.id }, { slug: "about", fixed: true }]);
      const service = new ContentService(pages);
      const before = JSON.stringify(pages.held);

      const refusals = [
        await refusalOf(service.list(viewer)),
        await refusalOf(service.create(viewer, wording)),
        await refusalOf(service.change(viewer, "about-us", { ...wording, slug: "about-us" })),
        await refusalOf(service.remove(viewer, "about-us")),
        // Even a page that does not exist is refused for permission first.
        await refusalOf(service.change(viewer, "nothing-here", wording)),
        await refusalOf(service.remove(viewer, "Not_A_Slug")),
      ];

      for (const refusal of refusals) {
        expect(refusal).toEqual({ status: 401, body: { errors: [PAGES_ARE_FOR_ADMINISTRATORS] } });
      }
      expect(JSON.stringify(pages.held)).toBe(before);
    });
  }

  it("lets anybody read one page, and tells only an administrator who wrote it (R-7.1, R-7.27)", async () => {
    const pages = new MemoryPages([{ slug: "about-us", createdBy: ADMIN.id }]);
    const service = new ContentService(pages);

    const asVendor = await service.readFor(VENDOR, readPageLookup("about-us"));
    const asVisitor = await service.readFor(null, readPageLookup("about-us"));
    const asAdministrator = await service.readFor(ADMIN, readPageLookup("about-us"));

    expect(asVendor).not.toHaveProperty("createdBy");
    expect(asVisitor).not.toHaveProperty("updatedBy");
    expect(asAdministrator).toMatchObject({
      createdBy: { id: ADMIN.id },
      updatedBy: { id: ADMIN.id },
    });
  });
});

describe("the list of pages (R-7.5, R-7.12)", () => {
  it("names every page once, in order of title as a reader compares them", async () => {
    const pages = new MemoryPages([
      { slug: "privacy", fixed: true },
      { slug: "about-us", versions: [{ title: "About us", body: "x", createdAt: "2026-01-05T17:00:00.000Z", createdBy: null }] },
      { slug: "about", fixed: true },
      { slug: "accessibility", fixed: true },
    ]);
    const listed = await new ContentService(pages).list(ADMIN);

    expect(listed.map((page) => page.title)).toEqual(["about", "About us", "accessibility", "privacy"]);
    expect(listed.map((page) => page.fixed)).toEqual([true, false, true, true]);
  });
});

describe("creating a page (R-7.7, R-7.20, R-7.21, R-7.22)", () => {
  it("publishes an ordinary page by its author, readable at its address at once", async () => {
    const pages = new MemoryPages();
    const service = new ContentService(pages);

    const created = await service.create(ADMIN, { ...wording, fixed: true });

    expect(created).toMatchObject({ ...wording, fixed: false, createdBy: { id: ADMIN.id }, updatedBy: { id: ADMIN.id } });
    expect(await service.read(readPageLookup("hackathon-rules"))).toMatchObject(wording);
  });

  it("refuses an empty title and an overlong body, naming each field, and saves nothing", async () => {
    const pages = new MemoryPages();
    const refusal = await refusalOf(
      new ContentService(pages).create(ADMIN, { ...wording, title: "", body: "x".repeat(50_001) }),
    );

    expect(refusal.status).toBe(400);
    expect(refusal.body.errors).toEqual([
      "Title: Enter a title",
      "Body: The body is 50,001 characters long. Shorten it to 50,000 characters or fewer.",
    ]);
    expect(pages.held).toEqual([]);
  });

  it("accepts a title of a hundred characters and a body of fifty thousand", async () => {
    const pages = new MemoryPages();
    await new ContentService(pages).create(ADMIN, { ...wording, title: "t".repeat(100), body: "b".repeat(50_000) });
    expect(pages.held).toHaveLength(1);
  });

  it("refuses a malformed address", async () => {
    for (const slug of ["Hackathon", "hackathon rules", "hackathon_rules", "-hackathon", "hackathon-"]) {
      const refusal = await refusalOf(new ContentService(new MemoryPages()).create(ADMIN, { ...wording, slug }));
      expect(refusal.body.errors).toEqual([
        "Address: Use only lowercase letters and numbers joined by single hyphens, like hackathon-rules",
      ]);
    }
  });

  it("refuses an address another page holds, leaving that page untouched", async () => {
    const pages = new MemoryPages([{ slug: "about", fixed: true }]);
    const before = JSON.stringify(pages.held);
    const refusal = await refusalOf(new ContentService(pages).create(ADMIN, { ...wording, slug: "about" }));

    expect(refusal).toEqual({ status: 400, body: { errors: [ADDRESS_IN_USE_REFUSAL] } });
    expect(JSON.stringify(pages.held)).toBe(before);
  });
});

describe("publishing a change (R-7.8, R-7.24, R-7.27, R-7.28)", () => {
  it("keeps the replaced wording as an earlier version and names the new author", async () => {
    const pages = new MemoryPages([{ slug: "about-us", createdBy: ADMIN.id }]);
    const service = new ContentService(pages);

    const changed = await service.change(OTHER_ADMIN, "about-us", { title: "About us", body: "New wording." });

    expect(changed).toMatchObject({ slug: "about-us", body: "New wording.", createdBy: { id: ADMIN.id }, updatedBy: { id: OTHER_ADMIN.id } });
    expect(changed.updatedAt > changed.createdAt).toBe(true);
    expect(pages.held[0]?.versions.map((version) => version.body)).toEqual(["Initial version", "New wording."]);
  });

  it("lets the second of two administrators silently replace the first's wording", async () => {
    const pages = new MemoryPages([{ slug: "about-us" }]);
    const service = new ContentService(pages);

    await service.change(ADMIN, "about-us", { title: "About us", body: "The first's wording." });
    const second = await service.change(OTHER_ADMIN, "about-us", { title: "About us", body: "The second's wording." });

    expect(second.body).toBe("The second's wording.");
    expect(pages.held[0]?.versions).toHaveLength(3);
  });

  it("moves a renamed page at once and leaves nothing at the old address", async () => {
    const pages = new MemoryPages([{ slug: "about-us" }]);
    const service = new ContentService(pages);

    await service.change(ADMIN, "about-us", { title: "About", slug: "about", body: "Moved." });

    expect(await service.read(readPageLookup("about"))).toMatchObject({ body: "Moved." });
    expect(await service.read(readPageLookup("about-us"))).toBeNull();
  });

  it("refuses a rename to an address another page holds, changing neither", async () => {
    const pages = new MemoryPages([{ slug: "about-us" }, { slug: "about", fixed: true }]);
    const before = JSON.stringify(pages.held);
    const refusal = await refusalOf(
      new ContentService(pages).change(ADMIN, "about-us", { title: "About", slug: "about", body: "Moved." }),
    );

    expect(refusal.body.errors).toEqual([ADDRESS_IN_USE_REFUSAL]);
    expect(JSON.stringify(pages.held)).toBe(before);
  });

  it("names a page by its identifier as well as its address", async () => {
    const pages = new MemoryPages([{ id: "00000000-0000-4000-8000-000000000501", slug: "about-us" }]);
    await new ContentService(pages).change(ADMIN, "00000000-0000-4000-8000-000000000501", { title: "About us", body: "By id." });
    expect(pages.held[0]?.versions.at(-1)?.body).toBe("By id.");
  });

  it("answers not found for a page nobody holds, and malformed for a malformed reference", async () => {
    const service = new ContentService(new MemoryPages());
    expect((await refusalOf(service.change(ADMIN, "nothing-here", wording))).status).toBe(404);
    expect((await refusalOf(service.change(ADMIN, "Not_A_Slug", wording))).status).toBe(400);
  });
});

describe("pages the service needs (R-7.25)", () => {
  it("may be re-worded where they stand", async () => {
    const pages = new MemoryPages([{ slug: "about", fixed: true }]);
    const changed = await new ContentService(pages).change(ADMIN, "about", { title: "About", slug: "about", body: "Written." });
    expect(changed).toMatchObject({ slug: "about", title: "About", body: "Written.", fixed: true });
  });

  it("may not be renamed or removed", async () => {
    const pages = new MemoryPages([{ slug: "about", fixed: true }]);
    const service = new ContentService(pages);
    const before = JSON.stringify(pages.held);

    expect((await refusalOf(service.change(ADMIN, "about", { title: "About", slug: "about-us", body: "Moved." }))).body)
      .toEqual({ errors: [NEEDED_PAGE_NOT_RENAMED] });
    expect((await refusalOf(service.remove(ADMIN, "about"))).body).toEqual({ errors: [NEEDED_PAGE_NOT_REMOVED] });
    expect(JSON.stringify(pages.held)).toBe(before);
  });
});

describe("removing a page (R-7.9)", () => {
  it("removes an ordinary page and every version of it, and its address stops answering", async () => {
    const pages = new MemoryPages([{ slug: "about-us" }, { slug: "about", fixed: true }]);
    const service = new ContentService(pages);
    await service.change(ADMIN, "about-us", { title: "About us", body: "Second." });

    const removed = await service.remove(ADMIN, "about-us");

    expect(removed).toMatchObject({ slug: "about-us", body: "Second." });
    expect(pages.held.map((page) => page.slug)).toEqual(["about"]);
    expect(await service.read(readPageLookup("about-us"))).toBeNull();
  });
});
