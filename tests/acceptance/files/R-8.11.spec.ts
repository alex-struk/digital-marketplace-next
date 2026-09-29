// criterion: @R-8.11 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// The file is the seeded one only its uploader stored, so the description can be checked
// against the identifier and name the seed gives it.
//
// "Under the same permission rules as the content itself" is read as one comparison per
// person: for the same file and the same person, the description is refused exactly when the
// content is. The people are the uploader, a vendor the file names nowhere, and an
// administrator, so the comparison is made across different grounds for reading it. Which of
// them is permitted is not asserted here — only that both requests get the same answer — and
// the content's bytes are never read.
const file = seed.stored_files.privateOfFileUploader;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function refusals(surface: Surface, who: Persona): Promise<{ description: boolean; content: boolean }> {
  await surface.signIn(who);

  await surface.fileDescription.open({ fileId: file.id });
  const description = Boolean(await readOrEmpty(() => surface.fileDescription.refusedWhenNotPermitted()));

  await surface.fileDownload.open({ fileId: file.id });
  await surface.fileDownload.downloadFile();
  const content = Boolean(await readOrEmpty(() => surface.fileDownload.refusedWhenNotPermitted()));

  await surface.signOut();
  return { description, content };
}

test("asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.fileDescription.open({ fileId: file.id });

  const identifier = await surface.fileDescription.fileIdentifier();
  const name = await surface.fileDescription.fileName();
  const storedDate = await surface.fileDescription.storedDate();

  expect(identifier).toBe(file.id);
  expect(name).toBe(file.name);
  expect(storedDate).toBeTruthy();
  for (const value of [identifier, name, storedDate]) {
    expect(value).not.toContain(file.contents);
  }
});

test("a description of a file is given under the same permission rules as the content itself", async ({
  surface,
}) => {
  for (const [label, who] of [
    ["the file's uploader", persona.fileUploader],
    ["a vendor the file does not name", persona.vendor],
    ["an administrator", persona.administrator],
  ] as const) {
    const refused = await refusals(surface, who);
    expect(refused.description, `description refused for ${label} exactly when the content is`).toBe(
      refused.content,
    );
  }
});
