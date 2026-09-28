// criterion: @R-2.35 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — a proposal submitted, reviewed and scored — is the first proposal on the seeded
// Sprint With Us opportunity that has moved on from consensus to the code challenge: it was
// submitted, its questions were reviewed and given agreed scores, and it now waits for its
// code challenge score. The administrator, who chairs its panel and is entitled to see its
// history, then does two things to it in turn: enters a code challenge score of 63, and
// disqualifies it with a written reason. The first is a score entry, the second a change of
// state carrying a note, and each is found in the history by what the test itself put there —
// the score by its value, the change of state by its note — rather than by whatever label the
// service gives it.
//
// The history is read before and after. What the two entries add is read as a difference, so
// that whatever the seeded history already holds does not count:
//   who   — the administrator's name, read off their own profile, appears at least twice more;
//   when  — the current year appears at least twice more, the two entries being made today;
//   note  — the disqualification's reason appears;
//   newest first — the reason, from the later entry, stands ahead of the score, from the
//   earlier one.

const opportunityId = seed.opportunities.swuPastConsensus.id;
const where = { opportunityId, proposalId: seed.proposals.swuPastConsensusOne.id };
const reason = "R-2.35 the proponent's named team is no longer available.";
const scoreEntered = /(?<![\d.,])63(?:\.0+)?(?![\d]|[.,]\d)/;

function occurrences(text: string, part: string): number {
  return part ? text.split(part).length - 1 : 0;
}

async function historyOf(surface: Surface): Promise<string> {
  await surface.proposalSwuView.open(where);
  return surface.proposalSwuView.historyTab();
}

test("every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given", async ({
  surface,
}) => {
  test.setTimeout(180000);
  await surface.signIn(persona.administrator);

  await surface.userProfileSelf.open();
  const administratorName = (await surface.userProfileSelf.nameField()).trim();
  expect(administratorName, "the administrator's own name").toBeTruthy();
  const year = String(new Date().getFullYear());

  const before = await historyOf(surface);

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.scoreCodeChallenge({ score: 63 });

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.disqualifyProposal({ reason });

  const after = await historyOf(surface);

  // The note given with the change of state, and the score entered.
  expect(after, "the disqualification's note").toContain(reason);
  expect(after, "the code challenge score entered").toMatch(scoreEntered);

  // Who did each, and when.
  expect(
    occurrences(after, administratorName) - occurrences(before, administratorName),
    "the administrator named as the author of both new entries",
  ).toBeGreaterThanOrEqual(2);
  expect(
    occurrences(after, year) - occurrences(before, year),
    "a time given for both new entries",
  ).toBeGreaterThanOrEqual(2);

  // Newest first: the later entry stands ahead of the earlier one.
  const scoreAt = after.search(scoreEntered);
  expect(after.indexOf(reason)).toBeLessThan(scoreAt);
});
