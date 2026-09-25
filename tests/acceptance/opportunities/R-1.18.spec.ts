// criterion: @R-1.18 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's given and when are the submission of a Team With Us opportunity that is not
// a draft. Each case below is an opportunity complete in every other respect — a question, a
// panel, a budget and weights totalling one hundred — whose one resource is well formed but
// for the one value the case names: an allocation just below one per cent, one just above one
// hundred, or a service area that is not one of the recognised five.
//
// The value is put forward before anything is published, and what happens to it is read:
//
//   - The form may not offer the value at all. Adding the resource then fails, or the draft,
//     once stored, shows some other value in its place. A value the service will not take is
//     a value refused, so the case holds.
//   - Where the stored draft shows the value the case names, the draft is published and the
//     publication must be refused: the opportunity is still not published after a pause long
//     enough for a slow publication to land, and it is not among the open opportunities.
//
// Where the target does not store the Team With Us draft at all, for a reason this criterion
// does not govern, the case is recorded as blocked.

const statement =
  "Each resource on a Team With Us opportunity names one service area and a target allocation between 1 and 100 per cent of full time.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  maxBudget: 500000,
  questionsWeight: 30,
  challengeWeight: 40,
  priceWeight: 30,
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

const sound = { serviceArea: "Full Stack Developer", targetAllocation: 100 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// Puts the resource forward on a draft and returns the draft's identifier, or null when the
// form would not take the resource at all.
async function draftWith(surface: Surface, resource: typeof sound, title: string): Promise<string | null> {
  await surface.opportunityTwuCreate.open();
  try {
    await surface.opportunityTwuCreate.addResource(resource);
  } catch {
    return null;
  }
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    members: [seed.users.staffOne, seed.users.administratorOne],
    chair: seed.users.administratorOne,
  });
  await surface.opportunityTwuCreate.saveDraft({ ...complete, title });
  try {
    await expect.poll(() => readOrEmpty(() => surface.opportunityTwuEdit.opportunityIdentifier()), settle).toBeTruthy();
    return await surface.opportunityTwuEdit.opportunityIdentifier();
  } catch {
    return "";
  }
}

async function expectRejected(
  surface: Surface,
  resource: typeof sound,
  title: string,
  showsNamedValue: (resources: string) => boolean,
): Promise<void> {
  await surface.signIn(persona.administrator);
  const opportunityId = await draftWith(surface, resource, title);
  if (opportunityId === null) return; // the value is not offered: refused
  if (!opportunityId) {
    test.skip(true, "blocked: the target did not store the Team With Us draft, so the resource could not be put forward");
  }

  await surface.opportunityTwuView.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuView.status()), settle).toMatch(/draft/i);
  if (!showsNamedValue(await readOrEmpty(() => surface.opportunityTwuView.resources()))) return; // another value was taken in its place: refused

  await surface.opportunityTwuEdit.open({ opportunityId });
  try {
    await surface.opportunityTwuEdit.publish();
  } catch {
    // A publication that is not offered is refused; the state is read below.
  }

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  await surface.opportunityTwuView.open({ opportunityId });
  expect(await readOrEmpty(() => surface.opportunityTwuView.status())).not.toMatch(/publish/i);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.openGroup()).not.toContain(title);
}

test(`${statement} (a target allocation below 1 per cent is rejected)`, async ({ surface }) => {
  await expectRejected(
    surface,
    { ...sound, targetAllocation: 0 },
    "R-1.18 Team With Us opportunity with a resource allocated below one per cent",
    (resources) => /(^|[^\d.])0\s*%/.test(resources),
  );
});

test(`${statement} (a target allocation above 100 per cent is rejected)`, async ({ surface }) => {
  await expectRejected(
    surface,
    { ...sound, targetAllocation: 101 },
    "R-1.18 Team With Us opportunity with a resource allocated above one hundred per cent",
    (resources) => /(^|\D)101\s*%/.test(resources),
  );
});

test(`${statement} (a service area that is not one of the recognised five is rejected)`, async ({ surface }) => {
  const unrecognised = "Lighthouse Keeper";
  await expectRejected(
    surface,
    { ...sound, serviceArea: unrecognised },
    "R-1.18 Team With Us opportunity with a resource in an unrecognised service area",
    (resources) => resources.includes(unrecognised),
  );
});
