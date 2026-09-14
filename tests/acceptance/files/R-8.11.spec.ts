// criterion: @R-8.11 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// "Its content is not" returned is read as the content appearing in none of what the
// description gives back: the description page names no contents observation of its own, so
// the three values it does return are checked for the uploaded text.
//
// The permission half is read by putting the same file to the same two people both ways: the
// person the file does not name is refused the description exactly as they are refused the
// bytes, and an administrator receives both.
async function storePrivately(surface: Surface, name: string, content: string): Promise<string> {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name, content, readAccess: [] });
  const fileId = await surface.fileUpload.storedFileIdentifier();
  expect(fileId).toBeTruthy();
  return fileId;
}

test("asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored", async ({
  surface,
}) => {
  const name = "R-8.11 described.txt";
  const content = `R-8.11 content that stays out of the description ${Date.now()}`;
  const fileId = await storePrivately(surface, name, content);

  await surface.fileDescription.open({ fileId });

  const identifier = await surface.fileDescription.fileIdentifier();
  const fileName = await surface.fileDescription.fileName();
  const storedDate = await surface.fileDescription.storedDate();

  expect(identifier).toBe(fileId);
  expect(fileName).toBe(name);
  expect(storedDate).toBeTruthy();
  for (const value of [identifier, fileName, storedDate]) {
    expect(value).not.toContain(content);
  }
});

test("a description of a file is given under the same permission rules as the content itself", async ({
  surface,
}) => {
  const content = `R-8.11 same rules ${Date.now()}`;
  const fileId = await storePrivately(surface, "R-8.11 same rules.txt", content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeFalsy();
  expect(await surface.fileDescription.fileIdentifier()).toBe(fileId);
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.fileContents()).toContain(content);
});
