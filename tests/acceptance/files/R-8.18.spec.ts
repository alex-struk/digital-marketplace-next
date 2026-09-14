// criterion: @R-8.18 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// Each malformed submission is sent straight to the address that stores a file, since no
// control would ever assemble one. "Refused as a bad request" is read as the answer not being
// a fault of the service and nothing being stored; for the read-access case the refusal also
// names what was wrong, through the observation that reports a refusal for read access.
//
// Three parts of the criterion are not asserted. No observation names what was wrong with a
// submission that carries no file part — the upload address reports refusals for size, name
// length and read access only. Whether anything was written to the service's error log is not
// an observable at all; the answer not being a fault is as near as the surface comes. And the
// working copy being removed whether the upload succeeds or fails is on the service's own
// machine, which nothing reads (see R-8.16 in not-testable.yaml).
test("a submission carrying no file part is refused as a bad request rather than as a fault of the service", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileWithNoFilePart({
    name: "R-8.18 nothing attached.pdf",
    readAccess: [{ tag: "any" }],
  });

  expect(await surface.fileUpload.serviceFault()).toBeFalsy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});

test("a submission carrying read-access information that is not well-formed is refused as a bad request naming what was wrong with it, rather than as a fault of the service", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileWithMalformedReadAccess({
    name: "R-8.18 malformed read access.pdf",
    content: `R-8.18 malformed read access ${Date.now()}`,
    readAccess: "{ this is not well-formed",
  });

  expect(await surface.fileUpload.refusedForReadAccess()).toBeTruthy();
  expect(await surface.fileUpload.serviceFault()).toBeFalsy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});
