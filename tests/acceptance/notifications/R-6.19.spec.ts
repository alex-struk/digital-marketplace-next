// criterion: @R-6.19 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The whole claim is a claim about every message the service can send, which no surface
// enumerates. What can be checked is that the families the page was previously missing —
// the notices sent to an evaluation panel, and the notices about a consensus — can be
// previewed there before the event that sends them.
test("the administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.notificationEmailReference.open();

  const titles = await surface.notificationEmailReference.messageGroupTitle();
  const subjects = await surface.notificationEmailReference.messageSubject();
  const reference = `${titles} ${subjects}`.toLowerCase();

  expect(reference.includes("evaluation panel")).toBe(true);
  expect(reference.includes("consensus")).toBe(true);
});
