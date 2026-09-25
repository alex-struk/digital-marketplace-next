// criterion: @R-4.21 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Read from the service's answer to the request for the list, not from the screen, since the
// screen withholding the list while the service answers it in full is exactly what the
// criterion rules out. A refusal is read on its own, apart from an empty answer, and nothing a
// refused answer carries may name a registered person's address. persona.publicSectorStaff is
// seed.users.staffOne, a public sector employee who is not an administrator; a vendor and a
// visitor who is not signed in stand for anyone else.

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function askForEveryone(surface: Surface) {
  await surface.userListRequest.open();
  return {
    answered: await readOrEmpty(() => surface.userListRequest.accountsAnswered()),
    refused: await readOrEmpty(() => surface.userListRequest.refusedWhenNotPermitted()),
    status: await readOrEmpty(() => surface.userListRequest.refusalStatus()),
  };
}

function expectRefused(answer: { answered: string; refused: string; status: string }) {
  expect(answer.refused).toBeTruthy();
  expect(answer.status).toBeTruthy();
  expect(answer.answered).not.toContain(seed.users.vendorOne.email!);
  expect(answer.answered).not.toContain(seed.users.administratorOne.email!);
}

test("the list of everyone registered with the service may be read by an administrator", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  const answer = await askForEveryone(surface);

  expect(answer.refused).toBeFalsy();
  expect(answer.answered).toContain(seed.users.vendorOne.email!);
});

test("the list of everyone registered with the service, requested by a public sector employee who is not an administrator, is refused rather than answered", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  expectRefused(await askForEveryone(surface));
});

test("the list of everyone registered with the service, requested by a vendor, is refused rather than answered", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  expectRefused(await askForEveryone(surface));
});

test("the list of everyone registered with the service, requested by a visitor who is not signed in, is refused rather than answered", async ({
  surface,
}) => {
  expectRefused(await askForEveryone(surface));
});
