// criterion: @R-4.32 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// What the exported file contains — which accounts and which columns — has no observation
// on the user list, so only the choosing rule the criterion states is derived here.
test("at least one kind and one field must be chosen before an administrator may export the contact list", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.userList.open();
  await surface.userList.openExportContactList();

  expect(await surface.userList.exportModal()).toBeTruthy();
  expect(await surface.userList.exportDisabledUntilSelection()).toBeTruthy();

  await surface.userList.cancelExport();
});
