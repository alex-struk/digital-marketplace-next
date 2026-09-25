// criterion: @R-7.12 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The pages the service needs are the seed's content handles marked fixed; every one of them
// is opened by its own handle, as a visitor, and read. The list is then read by an
// administrator: it holds the service's own pages plus the ordinary pages the seed adds
// (the content handles not marked fixed), so the service's own count is the list's count
// less those. "Initial version" and "twenty-two" are the criterion's own words.
const contentPages = Object.values(seed.content) as Array<{ slug: string; fixed: boolean }>;
const servicePages = contentPages.filter((record) => record.fixed);
const ordinaryPages = contentPages.filter((record) => !record.fixed);

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("a fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it", async ({
  surface,
}) => {
  expect(servicePages.length).toBe(22);

  for (const record of servicePages) {
    await surface.contentView.open({ slug: record.slug });
    expect(await readOrEmpty(() => surface.contentView.notFoundForUnknownAddress()), record.slug).toBeFalsy();
    expect((await surface.contentView.pageTitle()).trim(), record.slug).toBe(record.slug);
    expect(await surface.contentView.pageBody(), record.slug).toContain("Initial version");
  }

  await surface.signIn(persona.administrator);
  await surface.contentList.open();

  const listed = Number((await surface.contentList.pageCount()).trim());
  expect(listed - ordinaryPages.length).toBe(22);
  expect(await surface.contentList.pageIsFixed()).toBeTruthy();
});
