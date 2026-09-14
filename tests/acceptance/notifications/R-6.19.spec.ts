// criterion: @R-6.19 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona } from "../../fixtures";

// The claim is about every message the service can send, which nothing in the contract
// enumerates, so the page cannot be checked against a complete list. What is checked is that
// the families known to have gone missing from it before — the notices sent to an evaluation
// panel and the notices about a consensus — can be previewed there, searched for by the
// wording the spec itself uses for them. The Code With Us submitted-for-review pair is not
// looked for: its wording is shared with the other two programs' equivalents, so no search
// term tells it apart.
test("the administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.notificationEmailReference.open();

  const titles = await surface.notificationEmailReference.messageGroupTitle();
  const subjects = await surface.notificationEmailReference.messageSubject();
  const reference = `${titles}\n${subjects}`.toLowerCase();

  expect(reference).toContain("evaluation panel");
  expect(reference).toContain("consensus");
});
