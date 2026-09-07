// criterion: @R-6.13 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("an administrator can open a single page showing a sample of each message the service sends, with its subject and, where one is written, a one-line summary of who receives it and why", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.notificationEmailReference.open();

  // Grouped and titled by the event that sends it, each sample rendered as a recipient
  // would receive it, each with its subject; a summary is written for some of them.
  expect(await surface.notificationEmailReference.messageGroupTitle()).toBeTruthy();
  expect(await surface.notificationEmailReference.messageSubject()).toBeTruthy();
  expect(await surface.notificationEmailReference.messageBody()).toBeTruthy();
  expect(await surface.notificationEmailReference.messageSummary()).toBeTruthy();
});
