// criterion: @R-6.6 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona } from "../../fixtures";

// Where the offer stands in any one delivered message is not observable: the mail fixture
// returns a subject, a snippet, a visible recipient and an identifier, and nothing of the
// body. What is read instead is the label on the samples the reference page renders as a
// recipient would receive them, and the place the offer leads — the reader's own
// notification settings, arriving with the confirmation already asked. That the offer
// stands at the end of every message, rather than somewhere in some of them, is not asserted.
test("every message the service sends ends with an offer labelled Unsubscribe, which opens the reader's own notification settings with the unsubscribe confirmation already asked", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.notificationEmailReference.open();
  expect(await surface.notificationEmailReference.messageBody()).toContain("Unsubscribe");
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.notificationUnsubscribeLanding.open();
  expect(await surface.notificationUnsubscribeLanding.unsubscribeConfirmation()).toBeTruthy();
  expect(await surface.notificationUnsubscribeLanding.resolvesToSignedInPerson()).toBeTruthy();
});
