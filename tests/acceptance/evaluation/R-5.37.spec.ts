// criterion: @R-5.37 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is a Sprint With Us draft made by the public sector employee persona
// (users.staffOne), whose panel already names its creator. The panel is submitted through
// evaluation-panel-request with users.staffTwo added holding neither the evaluator nor the chair
// role, which none of the panel screen's controls can compose.
//
// "Identifying the offending member" is read as the field-level message naming that person —
// their name as their own profile shows it to the administrator, their email address, or their
// account identifier. "Refused" is read as the panel the service holds being the one it held
// before the submission.

const settle = { timeout: 15000 };
const offending = seed.users.staffTwo;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function nameOf(surface: Surface, userId: string): Promise<string> {
  await surface.userProfile.open({ userId });
  return (await readOrEmpty(() => surface.userProfile.nameField())).trim();
}

test("A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  const offendingName = await nameOf(surface, offending.id);
  expect(offendingName).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: "R-5.37 opportunity offered a panel member with no role" });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  const request = surface.evaluationPanelRequest;
  await request.open({ program: "sprint-with-us", opportunityId });
  const before = await readOrEmpty(() => request.panelAsStored());

  try {
    await request.submitPanelWithMemberHoldingNoRole({ member: offending });
  } catch {
    // Read below what the service answered.
  }

  await expect.poll(() => readOrEmpty(() => request.memberWithoutRoleError()), settle).toBeTruthy();
  const message = (await request.memberWithoutRoleError()).toLowerCase();
  expect(
    [offendingName.toLowerCase(), offending.email.toLowerCase(), offending.id.toLowerCase()].some((mark) =>
      message.includes(mark),
    ),
  ).toBe(true);

  await request.open({ program: "sprint-with-us", opportunityId });
  expect(await readOrEmpty(() => request.panelAsStored())).toBe(before);
});
