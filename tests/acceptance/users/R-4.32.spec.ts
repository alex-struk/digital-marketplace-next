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
// so the test never assumes what is ticked when the choices open. It finds the empty state
// from the export control's availability alone, then checks the rule from there.
//
// Export is available only when at least one kind and one field are ticked. Sweeping every
// combination of kind toggles while the fields stay put, export is unavailable at exactly the
// one combination that leaves no kind ticked — or at every combination, if no field is ticked.
// Doing that sweep under two different field toggles, at most one of which can leave no field
// ticked, the combination unavailable under both is the one that leaves no kind ticked. The
// same sweep over field toggles, under two different kind toggles, finds the combination that
// leaves no field ticked. Applying both puts the choices where nothing is ticked.

const KINDS = ["public sector employee", "vendor"];
const FIELDS = ["first name", "last name", "email address", "organization name"];

test("at least one kind and one field must be chosen before an administrator may export the contact list", async ({
  surface,
}) => {
  const list = surface.userList;
  await surface.signIn(persona.administrator);
  await list.open();
  await list.openExportContactList();
  expect(await list.exportModal()).toBeTruthy();

  // Toggles applied since the choices opened, as one bit per kind and one bit per field.
  let kindMask = 0;
  let fieldMask = 0;

  const exportUnavailable = async () => Boolean(await list.exportDisabledUntilSelection());

  const setKindMask = async (mask: number) => {
    for (let i = 0; i < KINDS.length; i++) {
      if (((kindMask ^ mask) >> i) & 1) {
        await list.toggleExportUserType({ userType: KINDS[i] });
        kindMask ^= 1 << i;
      }
    }
  };

  const setFieldMask = async (mask: number) => {
    for (let i = 0; i < FIELDS.length; i++) {
      if (((fieldMask ^ mask) >> i) & 1) {
        await list.toggleExportField({ field: FIELDS[i] });
        fieldMask ^= 1 << i;
      }
    }
  };

  // Every combination of toggles on one axis, visited one toggle at a time; returns the
  // combinations under which export is unavailable.
  const sweep = async (count: number, setMask: (mask: number) => Promise<void>) => {
    const unavailable: number[] = [];
    for (let step = 0; step < 1 << count; step++) {
      const mask = step ^ (step >> 1);
      await setMask(mask);
      if (await exportUnavailable()) unavailable.push(mask);
    }
    await setMask(0);
    return unavailable;
  };

  const vendorBit = 1 << KINDS.indexOf("vendor");
  const emailBit = 1 << FIELDS.indexOf("email address");

  const kindsUnavailableAsOpened = await sweep(KINDS.length, setKindMask);
  await setFieldMask(emailBit);
  const kindsUnavailableWithEmailToggled = await sweep(KINDS.length, setKindMask);
  await setFieldMask(0);
  const noKindTicked = kindsUnavailableAsOpened.filter((m) => kindsUnavailableWithEmailToggled.includes(m));
  expect(noKindTicked).toHaveLength(1);

  const fieldsUnavailableAsOpened = await sweep(FIELDS.length, setFieldMask);
  await setKindMask(vendorBit);
  const fieldsUnavailableWithVendorToggled = await sweep(FIELDS.length, setFieldMask);
  await setKindMask(0);
  const noFieldTicked = fieldsUnavailableAsOpened.filter((m) => fieldsUnavailableWithVendorToggled.includes(m));
  expect(noFieldTicked).toHaveLength(1);

  // Nothing ticked from here on.
  await setKindMask(noKindTicked[0]);
  await setFieldMask(noFieldTicked[0]);

  // A kind but no field: unavailable.
  await list.toggleExportUserType({ userType: "vendor" });
  expect(await list.exportDisabledUntilSelection()).toBeTruthy();

  // A field but no kind: unavailable.
  await list.toggleExportUserType({ userType: "vendor" });
  await list.toggleExportField({ field: "email address" });
  expect(await list.exportDisabledUntilSelection()).toBeTruthy();

  // One kind and one field: export becomes available.
  await list.toggleExportUserType({ userType: "vendor" });
  expect(await list.exportDisabledUntilSelection()).toBeFalsy();

  await list.cancelExport();
});
