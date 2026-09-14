// criterion: @R-8.24 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The plain upload action is the one that states no read access, and it is given none here;
// the unrecognised kind is a well-formed statement naming a kind the service does not know.
//
// The last clause — read-access information that is not well-formed data at all failing as
// the service fault R-8.4 describes — is not asserted. R-8.4 is superseded by R-8.18, which
// requires that same submission to be refused as a bad request instead (see R-8.18's test), so
// a test for the fault could only contradict the replacement.
test("an upload that carries no read-access statement is refused as a bad request reporting that the information provided was invalid, and no file is stored", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFile({
    name: "R-8.24 no read access.pdf",
    content: `R-8.24 no read access ${Date.now()}`,
  });

  expect(await surface.fileUpload.refusedForReadAccess()).toBeTruthy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});

test("an upload whose read-access statement names a kind of access the service does not recognise is refused as a bad request reporting that the information provided was invalid, and no file is stored", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileWithUnrecognisedReadAccess({
    name: "R-8.24 unrecognised read access.pdf",
    content: `R-8.24 unrecognised read access ${Date.now()}`,
    readAccess: [{ tag: "everyone-in-the-building" }],
  });

  expect(await surface.fileUpload.refusedForReadAccess()).toBeTruthy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});
