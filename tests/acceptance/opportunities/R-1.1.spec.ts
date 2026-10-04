// criterion: @R-1.1 v3
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity whose proposal deadline has already gone by. No form
// accepts such a deadline, so the seed carries it for each program: the Sprint With Us and
// Team With Us opportunities published thirty days past their deadline, each with three
// submitted proposals and a panel of two evaluators, and the lapsed Code With Us opportunity
// for scoring, whose one proposal is submitted and whose author is users.staffOne (the staff
// account tests/seed/009-code-with-us-stages.sql creates every lapsed Code With Us opportunity
// as). The when is a request the service handles under /status, which the surface names as
// the scheduled transition trigger.
//
// Closure runs inside the service and a screen shows its result only once it has finished,
// so every reading below is repeated until the new state appears rather than taken once. Each
// is made by somebody entitled to see it: an administrator for the opportunity, and each
// proposal's own proponent for that proposal. The third proposal on the Sprint With Us and
// Team With Us opportunities belongs to a proponent no persona signs in as, and no page an
// administrator reads shows a proposal's status, so the two proposals a proponent can read are
// the ones checked there.
//
// A notice may name its readers on any line, and a notice to several people carries them as
// blind copies behind the service's own address as its only visible recipient (R-6.15), so no
// search by a reader's address is used to find it. Every caught message is found through
// caught-message-list and through the catcher's search on the service's own address, opened by
// its identifier, and kept as the announcement when its subject or body names the opportunity
// that closed and its evaluation. A person counts as announced to when their address is among
// that message's visible recipients or its blind copies.
//
// The announcement is looked for as present rather than counted after the catcher is emptied:
// closure may already have run before the test could empty it, since any request under /api
// sets it off.

const statement =
  "A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 60000 };

type Mail = {
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

const accounts = seed.users as unknown as Record<string, { email: string | null }>;

function evaluatorsOf(panel: { members: readonly { user: string; evaluator: boolean }[] }): string[] {
  return panel.members
    .filter((member) => member.evaluator)
    .map((member) => accounts[member.user.replace(/^users\./, "")]?.email)
    .filter((email): email is string => Boolean(email))
    .map((email) => email.toLowerCase());
}

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

// Every address reached, visibly or as a blind copy, by a caught message that announces the
// opportunity with this title as ready for evaluation.
async function announcedTo(surface: Surface, mail: Mail, title: string): Promise<Set<string>> {
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
    const text = [
      await readOrEmpty(() => surface.caughtMessage.subject()),
      await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
      await readOrEmpty(() => surface.caughtMessage.htmlBody()),
    ].join(" ");
    if (!text.includes(title) || !/evaluat/i.test(text)) continue;
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()))) reached.add(address);
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()))) reached.add(address);
  }
  return reached;
}

async function missing(surface: Surface, mail: Mail, title: string, readers: string[]): Promise<string[]> {
  const reached = await announcedTo(surface, mail, title);
  return readers.filter((address) => !reached.has(address));
}

async function close(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

async function codeStatus(surface: Surface): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId: seed.opportunities.cwuLapsedForScoring.id });
  return (await surface.opportunityCwuView.status()).toLowerCase();
}

async function sprintStatus(surface: Surface): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  return (await surface.opportunitySwuView.status()).toLowerCase();
}

async function teamStatus(surface: Surface): Promise<string> {
  await surface.opportunityTwuView.open({ opportunityId: seed.opportunities.closedTeamWithUs.id });
  return (await surface.opportunityTwuView.status()).toLowerCase();
}

// The note closure leaves on the opportunity, read on its History tab as an administrator,
// to whom the tab is shown for every opportunity in all three programs.
const closedNote = "This opportunity has closed.";

async function codeHistory(surface: Surface): Promise<string> {
  await surface.opportunityCwuEdit.open({ opportunityId: seed.opportunities.cwuLapsedForScoring.id });
  return readOrEmpty(() => surface.opportunityCwuEdit.historyTab());
}

async function sprintHistory(surface: Surface): Promise<string> {
  await surface.opportunitySwuEdit.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  return readOrEmpty(() => surface.opportunitySwuEdit.historyTab());
}

async function teamHistory(surface: Surface): Promise<string> {
  await surface.opportunityTwuEdit.open({ opportunityId: seed.opportunities.closedTeamWithUs.id });
  return readOrEmpty(() => surface.opportunityTwuEdit.historyTab());
}

// The first evaluation stage of Sprint With Us is its team questions, evaluated individually,
// and of Team With Us its resource questions, evaluated individually. Every later stage reads
// as the questions' consensus, the code challenge, the team scenario or the challenge.
const laterStage = /consensus|challenge|scenario|processing|award|cancel|publish/;

async function codeProposalStatus(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalCwuEdit.open({ opportunityId: seed.opportunities.cwuLapsedForScoring.id, proposalId });
  return (await surface.proposalCwuEdit.status()).toLowerCase();
}

async function sprintProposalStatus(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalSwuEdit.open({ opportunityId: seed.opportunities.closedSprintWithUs.id, proposalId });
  return (await surface.proposalSwuEdit.status()).toLowerCase();
}

async function teamProposalStatus(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalTwuEdit.open({ opportunityId: seed.opportunities.closedTeamWithUs.id, proposalId });
  return (await surface.proposalTwuEdit.status()).toLowerCase();
}

test(`${statement} (it moves to the first evaluation stage of its program, with the note "${closedNote}")`, async ({
  surface,
}) => {
  await close(surface);
  await surface.signIn(persona.administrator);

  await expect.poll(() => codeStatus(surface), settle).toMatch(/evaluat/);
  expect(await codeStatus(surface)).not.toContain("published");

  await expect.poll(() => sprintStatus(surface), settle).toMatch(/team question/);
  expect(await sprintStatus(surface)).not.toMatch(laterStage);

  await expect.poll(() => teamStatus(surface), settle).toMatch(/resource question/);
  expect(await teamStatus(surface)).not.toMatch(laterStage);

  await expect.poll(() => codeHistory(surface), settle).toContain(closedNote);
  await expect.poll(() => sprintHistory(surface), settle).toContain(closedNote);
  await expect.poll(() => teamHistory(surface), settle).toContain(closedNote);
});

test(`${statement} (every proposal submitted against it moves to review)`, async ({ surface }) => {
  await close(surface);

  await surface.signIn(persona.organizationOwner);
  await expect
    .poll(() => codeProposalStatus(surface, seed.proposals.cwuLapsedForScoringOne.id), settle)
    .toContain("review");
  await expect
    .poll(() => sprintProposalStatus(surface, seed.proposals.sprintWithUsOne.id), settle)
    .toContain("review");
  await expect
    .poll(() => teamProposalStatus(surface, seed.proposals.teamWithUsOne.id), settle)
    .toContain("review");
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await expect
    .poll(() => sprintProposalStatus(surface, seed.proposals.sprintWithUsTwo.id), settle)
    .toContain("review");
  await expect
    .poll(() => teamProposalStatus(surface, seed.proposals.teamWithUsTwo.id), settle)
    .toContain("review");
});

test(`${statement} (a Code With Us opportunity is announced as ready for evaluation to its author)`, async ({
  surface,
  mail,
}) => {
  test.slow();
  const author = [seed.users.staffOne.email.toLowerCase()];

  await close(surface);

  await expect
    .poll(() => missing(surface, mail, seed.opportunities.cwuLapsedForScoring.title, author), {
      ...settle,
      message: "the author not announced to",
    })
    .toEqual([]);
});

test(`${statement} (a Sprint With Us or Team With Us opportunity is announced as ready for evaluation to the evaluators on its panel)`, async ({
  surface,
  mail,
}) => {
  test.slow();
  const sprintEvaluators = evaluatorsOf(seed.evaluation_panels.sprintWithUs);
  const teamEvaluators = evaluatorsOf(seed.evaluation_panels.teamWithUs);
  expect(sprintEvaluators.length).toBeGreaterThanOrEqual(2);
  expect(teamEvaluators.length).toBeGreaterThanOrEqual(2);

  await close(surface);

  await expect
    .poll(() => missing(surface, mail, seed.opportunities.closedSprintWithUs.title, sprintEvaluators), {
      ...settle,
      message: "Sprint With Us panel evaluators not announced to",
    })
    .toEqual([]);
  await expect
    .poll(() => missing(surface, mail, seed.opportunities.closedTeamWithUs.title, teamEvaluators), {
      ...settle,
      message: "Team With Us panel evaluators not announced to",
    })
    .toEqual([]);
});
