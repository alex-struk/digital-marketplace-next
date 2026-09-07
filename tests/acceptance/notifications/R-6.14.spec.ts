// criterion: @R-6.14 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Of the twelve messages the criterion says are absent, two families can be looked for
// without ambiguity: every notice sent to an evaluation panel, and every notice about a
// consensus. Both are absent in both programs, so nothing else on the page should name
// them. The Code With Us submitted-for-review pair is not looked for here, because the
// equivalent messages of the other two programs are on the page and share its wording.
test("the reference page does not show every message the service can send: twelve of them appear nowhere on it", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.notificationEmailReference.open();

  const titles = await surface.notificationEmailReference.messageGroupTitle();
  const subjects = await surface.notificationEmailReference.messageSubject();
  const reference = `${titles} ${subjects}`.toLowerCase();

  expect(reference.includes("evaluation panel")).toBe(false);
  expect(reference.includes("consensus")).toBe(false);
});
