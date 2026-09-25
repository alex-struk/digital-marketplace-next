// criterion: @R-7.25 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// seed.content.servicePageDisclaimer is one of the pages the service needs. Its managing
// screen is read for the warning, the locked address and the withheld removal; its title and
// body are changed through that screen; and a rename and a removal are asked for as requests
// (content-request), which is the "other way" the criterion names. After the refused requests
// the page still answers at its own address.
const record = seed.content.servicePageDisclaimer;
const stamp = Date.now().toString(36);

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("a page the service itself depends on may have its title and body changed", async ({ surface }) => {
  const title = `Disclaimer rewritten ${stamp}`;
  const body = `Wording an administrator wrote for the disclaimer ${stamp}.`;

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: record.slug });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editTitle({ title });
  await surface.contentEdit.editBody({ body });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  await surface.contentView.open({ slug: record.slug });
  expect(await surface.contentView.pageTitle()).toBe(title);
  expect(await surface.contentView.pageBody()).toContain(body);
});

test("a page the service itself depends on may not be renamed or removed, and its managing screen says so", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: record.slug });

  expect(await surface.contentEdit.fixedPageWarning()).toBeTruthy();
  expect(await surface.contentEdit.deleteWithheldForFixedPage()).toBeTruthy();

  await surface.contentEdit.startEditing();
  expect(await surface.contentEdit.slugLockedForFixedPage()).toBeTruthy();
});

test("a request to rename or remove a page the service itself depends on, made another way, is refused", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.contentRequest.open({ slug: record.slug });
  await surface.contentRequest.renamePageByRequest({ slug: `moved-disclaimer-${stamp}` });
  expect(await readOrEmpty(() => surface.contentRequest.requestAccepted())).toBeFalsy();
  expect(await readOrEmpty(() => surface.contentRequest.refusalStatus())).toBeTruthy();

  await surface.contentRequest.open({ slug: record.slug });
  await surface.contentRequest.removePageByRequest();
  expect(await readOrEmpty(() => surface.contentRequest.requestAccepted())).toBeFalsy();
  expect(await readOrEmpty(() => surface.contentRequest.refusalStatus())).toBeTruthy();

  await surface.contentView.open({ slug: record.slug });
  expect(await readOrEmpty(() => surface.contentView.notFoundForUnknownAddress())).toBeFalsy();
  expect(await surface.contentView.pageTitle()).toBeTruthy();

  await surface.contentView.open({ slug: `moved-disclaimer-${stamp}` });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});
