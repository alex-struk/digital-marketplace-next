// criterion: @R-8.1 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// persona.fileUploader is a vendor holding no role, no organization membership and no
// administrator right, so an upload that succeeds for them is an upload that turned on
// nothing but being signed in. The seeded published Code With Us opportunity is used
// because it is the only opportunity a vendor can reach by a handle the seed carries.
//
// The withheld half — a visitor who is not signed in being refused — is not asserted.
// Every control in the surface that submits a file sits behind a form only a signed-in
// person can open, and no observation anywhere reports an upload refused as not
// permitted, so a signed-out attempt can be neither made nor read.
test("any person who is signed in may upload a file", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);

  await surface.proposalCwuCreate.open({ opportunity: seed.opportunities.publishedCodeWithUs.id });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.addAttachment({ file: "quote.pdf" });
  await surface.proposalCwuCreate.saveDraft();

  expect(await surface.fileAttachmentControl.existingAttachmentRow()).toContain("quote.pdf");
});
