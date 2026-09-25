import { describe, expect, it } from "vitest";
import { ContentService } from "../src/content/content.service";
import { asPage } from "../src/content/prisma-page.store";
import { Page, PageStore } from "../src/content/page";
import { readPageLookup } from "../src/rules/content";

const privacy: Page = {
  id: "00000000-0000-4000-8000-000000000501",
  createdAt: "2026-01-05T17:00:00.000Z",
  updatedAt: "2026-01-07T17:00:00.000Z",
  slug: "privacy",
  title: "Privacy",
  body: "The current wording.",
  fixed: true,
};

function storeOf(options: {
  byIdentifier?: Record<string, Page>;
  byAddress?: Record<string, Page>;
}): PageStore & { asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    async findByIdentifier(identifier) {
      asked.push(`identifier:${identifier}`);
      return options.byIdentifier?.[identifier] ?? null;
    },
    async findByAddress(address) {
      asked.push(`address:${address}`);
      return options.byAddress?.[address] ?? null;
    },
  };
}

describe("reading a page (R-7.1, R-7.2, R-7.4)", () => {
  it("answers with the page held at an address", async () => {
    const store = storeOf({ byAddress: { privacy } });
    const service = new ContentService(store);

    const page = await service.read(readPageLookup("privacy"));

    expect(page).toEqual(privacy);
  });

  it("answers with nothing for an address no page holds (R-7.2)", async () => {
    const service = new ContentService(storeOf({}));

    expect(await service.read(readPageLookup("nothing-here"))).toBeNull();
  });

  it("answers with the same page when its identifier is used (R-7.4)", async () => {
    const store = storeOf({ byIdentifier: { [privacy.id]: privacy } });
    const service = new ContentService(store);

    expect(await service.read(readPageLookup(privacy.id))).toEqual(privacy);
  });

  it("falls back to the address when no page carries the value as an identifier (R-7.4)", async () => {
    // An address may itself be shaped like an identifier. The two lookups are tried in
    // order, identifier first, so such a page is still reachable by its address.
    const shaped = { ...privacy, slug: "00000000-0000-4000-8000-000000000999" };
    const store = storeOf({ byAddress: { [shaped.slug]: shaped } });
    const service = new ContentService(store);

    const page = await service.read(readPageLookup(shaped.slug));

    expect(page).toEqual(shaped);
    expect(store.asked).toEqual([
      `identifier:${shaped.slug}`,
      `address:${shaped.slug}`,
    ]);
  });

  it("looks nothing up for a malformed value (R-7.3)", async () => {
    const store = storeOf({});
    const service = new ContentService(store);

    expect(await service.read(readPageLookup("Not_A_Slug"))).toBeNull();
    expect(store.asked).toEqual([]);
  });
});

describe("what a page answers with (R-7.1)", () => {
  it("carries its title, its body, and its published and updated dates", () => {
    const page = asPage({
      id: privacy.id,
      createdAt: new Date("2026-01-05T17:00:00.000Z"),
      slug: "privacy",
      fixed: true,
      contentVersions: [
        {
          title: "Privacy",
          body: "The third and current version.",
          createdAt: new Date("2026-01-07T17:00:00.000Z"),
        },
      ],
    });

    expect(page).toEqual({
      id: privacy.id,
      createdAt: "2026-01-05T17:00:00.000Z",
      updatedAt: "2026-01-07T17:00:00.000Z",
      slug: "privacy",
      title: "Privacy",
      body: "The third and current version.",
      fixed: true,
    });
  });

  it("takes its wording from the newest version, not the first", () => {
    // The store asks for the newest version only; this is the shape that arrives.
    const page = asPage({
      id: privacy.id,
      createdAt: new Date("2026-01-05T17:00:00.000Z"),
      slug: "about-us",
      fixed: false,
      contentVersions: [
        {
          title: "About us",
          body: "The third and current version of this page.",
          createdAt: new Date("2026-01-07T17:00:00.000Z"),
        },
      ],
    });

    expect(page?.body).toBe("The third and current version of this page.");
    expect(page?.updatedAt).toBe("2026-01-07T17:00:00.000Z");
  });

  it("answers with nothing when no version stands behind the page", () => {
    expect(
      asPage({
        id: privacy.id,
        createdAt: new Date(),
        slug: "privacy",
        fixed: true,
        contentVersions: [],
      }),
    ).toBeNull();
  });
});
