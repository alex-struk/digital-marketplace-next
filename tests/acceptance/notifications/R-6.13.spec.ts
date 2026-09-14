// criterion: @R-6.13 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// The samples are built from invented data rather than any real record, so no address the
// seed holds may appear in what the page renders.
const seededAddresses = Object.values(seed.users)
  .flatMap((user) => (user.email === null ? [] : [user.email]));

test("an administrator can open a single page showing a sample of each message the service sends, with its subject and, where one is written, a one-line summary of who receives it and why", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.notificationEmailReference.open();

  expect(await surface.notificationEmailReference.messageGroupTitle()).toBeTruthy();
  expect(await surface.notificationEmailReference.messageSubject()).toBeTruthy();
  expect(await surface.notificationEmailReference.messageSummary()).toBeTruthy();

  const body = await surface.notificationEmailReference.messageBody();
  expect(body).toBeTruthy();
  for (const address of seededAddresses) {
    expect(body).not.toContain(address);
  }
});
