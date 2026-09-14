// criterion: @R-8.23 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// A name of 256 characters, one over the limit, sent to the address that stores a file. The
// message is asserted by the length it names rather than by its wording.
//
// The second clause — an upload carrying no usable name failing instead as the service fault
// R-8.4 describes — is not asserted. R-8.4 is superseded by R-8.18, so a test holding the
// service to that fault could only contradict its replacement; and no action on the upload
// address sends a submission without a name in any case.
test("an upload whose name is longer than 255 characters is refused as a bad request, and the person is told the file name must be between 1 and 255 characters long", async ({
  surface,
}) => {
  const name = `${"n".repeat(252)}.pdf`;
  expect(name).toHaveLength(256);

  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name,
    content: `R-8.23 over-long name ${Date.now()}`,
    readAccess: [{ tag: "any" }],
  });

  expect(await surface.fileUpload.refusedForFileNameLength()).toContain("255");
  expect(await surface.fileUpload.serviceFault()).toBeFalsy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});
