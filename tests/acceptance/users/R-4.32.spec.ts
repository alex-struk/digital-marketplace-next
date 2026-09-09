// criterion: @R-4.32 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona } from "../../fixtures";

// What the exported spreadsheet holds — the active accounts, the administrator's label, the
// organization's legal name, the deactivated account's absence — is not asserted, because
// no observation returns the document the export hands back. user-list names the modal, the
// two kinds of tick and the unavailable control, and nothing else, so the clause a test can
// settle is the one about what must be chosen before the export can be asked for.
//
// The modal is read as it opens, before anything is ticked, which is what makes the first
// reading below the state the criterion describes.
test("at least one kind and one field must be chosen before an administrator may export the contact list", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userList.open();
  await surface.userList.openExportContactList();

  expect(await surface.userList.exportModal()).toBeTruthy();
  expect(await surface.userList.exportDisabledUntilSelection()).toBeTruthy();

  await surface.userList.toggleExportUserType({ userType: "vendor" });
  expect(await surface.userList.exportDisabledUntilSelection()).toBeTruthy();

  await surface.userList.toggleExportField({ field: "email address" });
  expect(await surface.userList.exportDisabledUntilSelection()).toBeFalsy();

  await surface.userList.cancelExport();
});
