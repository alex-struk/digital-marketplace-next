// criterion: @R-6.6 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The label at the foot of a message body is not observable — the mail fixture hands back
// a subject, a snippet, a recipient and an id, and nothing of the body. What is reachable
// is where the offer leads: the surface carries the reader's own notification settings as
// they arrive from an unsubscribe offer, with the confirmation already asked.
test("every message the service sends ends with an offer labelled Unsubscribe, which opens the reader's own notification settings with the unsubscribe confirmation already asked", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  await surface.notificationUnsubscribeLanding.open();

  expect(await surface.notificationUnsubscribeLanding.unsubscribeConfirmation()).toBeTruthy();
  expect(await surface.notificationUnsubscribeLanding.resolvesToSignedInPerson()).toBeTruthy();
});
