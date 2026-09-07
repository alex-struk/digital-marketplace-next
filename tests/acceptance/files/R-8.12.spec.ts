// criterion: @R-8.12 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The given is an identifier that no stored file carries. The identifier of the seeded
// published Code With Us opportunity is exactly that: well-formed, certainly not a file,
// and taken from the seed rather than invented.
//
// The first clause of the criterion — a file that does exist and the requester may not
// read — is not asserted in either test. Asking for such a file means addressing it by
// identifier, and no observation in the surface returns a stored file's identifier; the
// only way a test reaches a file is by following a download offered on a screen it can
// already open, which is by construction a file it may read.
test("a request for a file that does not exist is answered as not authorized", async ({ surface }) => {
  await surface.signIn(persona.vendor);

  await surface.fileDownload.open({ file: seed.opportunities.publishedCodeWithUs.id });

  expect(await surface.fileDownload.refusedForUnknownFile()).toBeTruthy();
});

test("a request for a file that does not exist is answered as not found when the requester is an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.fileDownload.open({ file: seed.opportunities.publishedCodeWithUs.id });

  expect(await surface.fileDownload.notFoundForAdministrator()).toBeTruthy();
});
