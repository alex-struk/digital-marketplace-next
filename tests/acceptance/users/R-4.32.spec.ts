// criterion: @R-4.32 v1
// provenance: blind, spec@1c3743e9fb53c29de89a28045222abab29c5e27e, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// What the exported spreadsheet holds — the active accounts, the administrator's label, the
// organization's legal name, the deactivated account's absence — is not asserted, because no
// observation returns the document the export hands back. observables.yaml names the
// contact-list export and its document contents, but user-list offers only the modal, the
// two kinds of tick and the unavailable control, so the clause a test can settle is what must
// be chosen before the export can be asked for.
//
// Nothing on user-list reports which kinds and fields are ticked, and each choice is a toggle,
// so what is chosen when the choices open is established from the export control itself
// rather than assumed. Four readings are taken: as opened, with the vendor kind toggled, with
// only the email field toggled, and with both toggled. Unavailable, unavailable, unavailable,
// then available is the only pattern under which the choices opened with no kind and no field
// ticked: available with both toggled means a kind and a field are then chosen; unavailable
// with only the field toggled then means no kind was ticked at opening; and unavailable with
// only the kind toggled then means no field was.
test("at least one kind and one field must be chosen before an administrator may export the contact list", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userList.open();
  await surface.userList.openExportContactList();
  expect(await surface.userList.exportModal()).toBeTruthy();

  // Nothing chosen: export is unavailable.
  expect(await surface.userList.exportDisabledUntilSelection()).toBeTruthy();

  // A kind but no field: still unavailable.
  await surface.userList.toggleExportUserType({ userType: "vendor" });
  expect(await surface.userList.exportDisabledUntilSelection()).toBeTruthy();

  // A field but no kind: still unavailable.
  await surface.userList.toggleExportUserType({ userType: "vendor" });
  await surface.userList.toggleExportField({ field: "email address" });
  expect(await surface.userList.exportDisabledUntilSelection()).toBeTruthy();

  // One kind and one field: export becomes available.
  await surface.userList.toggleExportUserType({ userType: "vendor" });
  expect(await surface.userList.exportDisabledUntilSelection()).toBeFalsy();

  await surface.userList.cancelExport();
});
