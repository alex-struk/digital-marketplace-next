// criterion: @R-5.27 v2
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded closed Sprint With Us opportunity carries two evaluators, three proponents and
// four questions, which is the shape the criterion describes. Both evaluators score every
// proponent and submit, and the second submission is the one that brings the count to
// twenty-four. The chair is users.administratorOne (evaluation_panels.sprintWithUs) and the
// opportunity's owner is users.staffOne, who created it; both also sit on the panel as its
// two evaluators.
//
// The move itself is read from the opportunity's status naming consensus.
//
// The catcher is emptied, and read back as empty and still empty a moment later, immediately
// before the second evaluator submits, so that what is caught afterwards follows that
// submission.
//
// A notice may name its readers on any line, and a notice to several people carries them as
// blind copies behind the service's own address, so no search by visible recipient is used to
// find it. Every caught message is found through caught-message-list (and through the
// catcher's search on the service's own address), opened by its identifier, and a person
// counts as told when their address is among that message's visible recipients or its blind
// copies.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function addressesIn(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [])];
}

function identifiersIn(listing: string): string[] {
  try {
    const parsed = JSON.parse(listing);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Not JSON; read as a plain list below.
  }
  return listing
    .split(/[\s,;[\]"']+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

async function caughtCount(surface: Surface): Promise<number> {
  await surface.caughtMessageList.open();
  const count = Number.parseInt((await readOrEmpty(() => surface.caughtMessageList.messageCount())).trim(), 10);
  return Number.isNaN(count) ? -1 : count;
}

async function emptyCatcher(surface: Surface, mail: Mail): Promise<void> {
  let last = -1;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await mail.clear();
    await expect.poll(() => caughtCount(surface), settle).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    last = await caughtCount(surface);
    if (last === 0) return;
  }
  throw new Error(`the catcher could not be read back as empty before the last scores were submitted; last count ${last}`);
}

// Every address any caught message reached, visibly or as a blind copy.
async function everyoneReached(surface: Surface, mail: Mail): Promise<Set<string>> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const { ID } of await mail.messagesTo(serviceAddress)) ids.add(ID);
  const reached = new Set<string>();
  for (const messageId of ids) {
    try {
      await surface.caughtMessage.open({ messageId });
    } catch {
      continue;
    }
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()))) reached.add(address);
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()))) reached.add(address);
  }
  return reached;
}

async function scoreEveryProponent(
  surface: Surface,
  forOpportunity: string = opportunityId,
  ofProposals: string[] = proposals,
): Promise<void> {
  for (const proposalId of ofProposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId: forOpportunity, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
}

test("An opportunity moves from individual evaluation to consensus by itself once the submitted individual scores number one per question per proponent per evaluator, counted against the panel and the questions of the opportunity's most recent version but only over the proponents named in the submission that triggers the check, and the chair and the opportunity's owner are then told it is ready.", async ({
  surface,
  mail,
}) => {
  test.slow();
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  await emptyCatcher(surface, mail);

  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  await surface.opportunitySwuView.open({ opportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("consensus");

  const chairAndOwner = [seed.users.administratorOne.email, seed.users.staffOne.email].map((address) =>
    address.toLowerCase(),
  );
  await expect
    .poll(async () => {
      const reached = await everyoneReached(surface, mail);
      return chairAndOwner.filter((address) => !reached.has(address));
    }, { ...settle, message: "the chair or owner not told the opportunity is ready for consensus" })
    .toEqual([]);
});

// The most recent version decides the count. The seeded closed Team With Us opportunity is
// used here so this test and the one above do not share an opportunity. Once the application
// has closed it, its owner (users.staffOne, signed in as persona.publicSectorStaff) seats
// users.staffPanelEvaluator as a third evaluator through evaluation-panel-twu, which saves
// the panel as a new version. Questions cannot change at this stage, so the panel is the
// version change. The two seeded evaluators then score every proponent and submit, the
// twenty-four submissions that moved the first version on, and the opportunity must still
// be in individual evaluation because the newest panel is waiting on a third evaluator.

const twuOpportunityId = seed.opportunities.closedTeamWithUs.id;
const twuProposals = [
  seed.proposals.teamWithUsOne.id,
  seed.proposals.teamWithUsTwo.id,
  seed.proposals.teamWithUsThree.id,
];

async function scoreAndSubmitEveryTwuProponent(surface: Surface): Promise<void> {
  for (const proposalId of twuProposals) {
    await surface.evaluationIndividualCreateTwu.open({ opportunityId: twuOpportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityId: twuOpportunityId });
  const whileDrafts = await readOrEmpty(() => surface.evaluationIndividualListTwu.evaluationStatus());
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();
  // The submission must have gone through, or the opportunity staying put would prove nothing.
  expect(await readOrEmpty(() => surface.evaluationIndividualListTwu.incompleteEvaluationError())).toBeFalsy();
  await expect
    .poll(async () => {
      await surface.evaluationIndividualListTwu.open({ opportunityId: twuOpportunityId });
      return readOrEmpty(() => surface.evaluationIndividualListTwu.evaluationStatus());
    }, settle)
    .not.toBe(whileDrafts);
}

test("counted against the panel and the questions of the opportunity's most recent version: changing the panel during individual evaluation changes how many submissions are awaited", async ({
  surface,
}) => {
  test.slow();
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelTwu.open({ opportunityId: twuOpportunityId });
  await surface.evaluationPanelTwu.startEditing();
  await surface.evaluationPanelTwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelTwu.saveEvaluationPanel();
  expect(await readOrEmpty(() => surface.evaluationPanelTwu.minimumMembersError())).toBeFalsy();
  expect(await readOrEmpty(() => surface.evaluationPanelTwu.missingChairError())).toBeFalsy();

  await scoreAndSubmitEveryTwuProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreAndSubmitEveryTwuProponent(surface);

  // Give an automatic move time to land before reading that it did not.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await surface.opportunityTwuView.open({ opportunityId: twuOpportunityId });
  expect((await surface.opportunityTwuView.status()).toLowerCase()).not.toContain("consensus");
});

// Counted only over the proponents named in the submission that triggers the check.
// opportunities.swuSubmissionNamesTwoOfThree is in individual evaluation with three
// proponents and four questions, and its panel is users.staffOne and users.administratorOne
// (the chair); users.staffOne is also the owner. The administrator's scores for
// proposals.swuNamedOne and proposals.swuNamedTwo are already submitted, users.staffOne holds
// complete drafts of the same two, and nobody has begun proposals.swuLeftOut. The government
// account sends a submission naming only the first two. Counted over those two the scores
// are complete; counted over all three they would not be, so the opportunity moving to
// consensus, and the chair and the owner being told, shows the count was taken over the
// named proponents only.

const namedOpportunityId = seed.opportunities.swuSubmissionNamesTwoOfThree.id;

function isYes(value: string): boolean {
  return !["", "false", "no", "0"].includes(value.trim().toLowerCase());
}

test("but only over the proponents named in the submission that triggers the check: a submission naming two of three proponents, completing the scores of those two, moves the opportunity to consensus and the chair and the owner are told, although the third has no scores at all", async ({
  surface,
  mail,
}) => {
  test.slow();
  await surface.signIn(persona.evaluationPanelEvaluator);

  const submission = surface.evaluationIndividualSubmissionRequestSwu;
  await submission.open({ opportunityId: namedOpportunityId });
  expect((await readOrEmpty(() => submission.storedStatus())).toUpperCase()).toBe("EVAL_QUESTIONS_INDIVIDUAL");

  await emptyCatcher(surface, mail);

  await submission.open({ opportunityId: namedOpportunityId });
  await submission.submitScoresForConsensusNaming({
    proposals: [seed.proposals.swuNamedOne.id, seed.proposals.swuNamedTwo.id],
  });
  expect(
    isYes(await readOrEmpty(() => submission.requestAccepted())),
    `the submission naming two proponents should be accepted (refusal: ${await readOrEmpty(() => submission.refusalMessages())})`,
  ).toBe(true);

  await expect
    .poll(async () => {
      await submission.open({ opportunityId: namedOpportunityId });
      return (await readOrEmpty(() => submission.storedStatus())).toUpperCase();
    }, settle)
    .toBe("EVAL_QUESTIONS_CONSENSUS");

  const chairAndOwner = [seed.users.administratorOne.email, seed.users.staffOne.email].map((address) =>
    address.toLowerCase(),
  );
  await expect
    .poll(async () => {
      const reached = await everyoneReached(surface, mail);
      return chairAndOwner.filter((address) => !reached.has(address));
    }, { ...settle, message: "the chair or owner not told the opportunity is ready for consensus" })
    .toEqual([]);
});

// The most recent version decides the count, seen through to the move itself.
// opportunities.swuNewestVersionSeatsThirdEvaluator is in individual evaluation with three
// proponents and four questions. Its first version seats users.staffOne and
// users.administratorOne (the chair) as evaluators; its newest version also seats
// users.staffPanelEvaluator, whose scores for every proponent are already submitted. The
// owner is users.staffOne. The government account scoring and submitting brings the count to
// twenty-four, all that the first version would have needed, and the opportunity must stay
// in individual evaluation; the administrator scoring and submitting brings it to the newest
// version's thirty-six, and only then does it move to consensus and are the chair and the
// owner told.

const newestOpportunityId = seed.opportunities.swuNewestVersionSeatsThirdEvaluator.id;
const newestProposals = [
  seed.proposals.swuThirdEvaluatorOne.id,
  seed.proposals.swuThirdEvaluatorTwo.id,
  seed.proposals.swuThirdEvaluatorThree.id,
];

async function submitNewestAndConfirmAccepted(surface: Surface): Promise<void> {
  await surface.evaluationIndividualListSwu.open({ opportunityId: newestOpportunityId });
  const whileDrafts = await readOrEmpty(() => surface.evaluationIndividualListSwu.evaluationStatus());
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  // The submission must have gone through, or the opportunity staying put would prove nothing.
  expect(await readOrEmpty(() => surface.evaluationIndividualListSwu.incompleteEvaluationError())).toBeFalsy();
  await expect
    .poll(async () => {
      await surface.evaluationIndividualListSwu.open({ opportunityId: newestOpportunityId });
      return readOrEmpty(() => surface.evaluationIndividualListSwu.evaluationStatus());
    }, settle)
    .not.toBe(whileDrafts);
}

test("counted against the panel and the questions of the opportunity's most recent version: the opportunity moves to consensus, and the chair and the owner are told, only once the newest version's panel has submitted, not when the first version's would have", async ({
  surface,
  mail,
}) => {
  test.slow();
  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface, newestOpportunityId, newestProposals);
  await submitNewestAndConfirmAccepted(surface);

  // Twenty-four of thirty-six: the first version's whole count, not the newest version's.
  // Give an automatic move time to land before reading that it did not.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await surface.opportunitySwuView.open({ opportunityId: newestOpportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).not.toContain("consensus");
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface, newestOpportunityId, newestProposals);

  await emptyCatcher(surface, mail);

  await surface.evaluationIndividualListSwu.open({ opportunityId: newestOpportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();

  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ opportunityId: newestOpportunityId });
      return (await surface.opportunitySwuView.status()).toLowerCase();
    }, settle)
    .toContain("consensus");

  const chairAndOwner = [seed.users.administratorOne.email, seed.users.staffOne.email].map((address) =>
    address.toLowerCase(),
  );
  await expect
    .poll(async () => {
      const reached = await everyoneReached(surface, mail);
      return chairAndOwner.filter((address) => !reached.has(address));
    }, { ...settle, message: "the chair or owner not told the opportunity is ready for consensus" })
    .toEqual([]);
});
