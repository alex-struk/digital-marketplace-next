// criterion: @R-1.5 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-01
import { test, expect, persona, seed } from "../../fixtures";

// seed.opportunities.publishedCodeWithUs was created by somebody other than the vendor and
// is watched by nobody, so the vendor is a signed-in person viewing an opportunity they did
// not create and do not yet watch. Watching is asked for through opportunity-watch-request,
// which always asks to watch and never toggles, so a second ask really is a second request.
// Whether the person watches is read from what the service reports on the opportunity
// itself. A test that leaves a watch in place stops it when it ends.

const opportunity = seed.opportunities.publishedCodeWithUs;
const program = opportunity.program;
const opportunityId = opportunity.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function isYes(value: string): boolean {
  return !["", "false", "no", "0"].includes(value.trim().toLowerCase());
}

test("any signed-in person may watch an opportunity they did not create, and cannot watch the same opportunity twice", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  const watch = surface.opportunityWatchRequest;

  await watch.open({ program });
  expect(isYes(await readOrEmpty(() => watch.watching()))).toBe(false);

  await watch.watchByRequest({ opportunityId });
  expect(await readOrEmpty(() => watch.requestAccepted())).toBeTruthy();
  expect(isYes(await readOrEmpty(() => watch.watching()))).toBe(true);

  await watch.open({ program });
  await watch.watchByRequest({ opportunityId });
  expect(await readOrEmpty(() => watch.requestAccepted())).toBeFalsy();
  expect(await readOrEmpty(() => watch.refusalReason())).toBe("conflict");
  expect(isYes(await readOrEmpty(() => watch.watching()))).toBe(true);

  await watch.open({ program });
  await watch.stopWatchingByRequest({ opportunityId });
});

test("any signed-in person may stop watching an opportunity they did not create", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  const watch = surface.opportunityWatchRequest;

  await watch.open({ program });
  await watch.watchByRequest({ opportunityId });
  expect(isYes(await readOrEmpty(() => watch.watching()))).toBe(true);

  await watch.open({ program });
  await watch.stopWatchingByRequest({ opportunityId });
  expect(isYes(await readOrEmpty(() => watch.watching()))).toBe(false);
});
