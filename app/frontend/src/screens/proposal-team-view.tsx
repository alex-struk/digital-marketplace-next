import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { useSearch } from "@tanstack/react-router";
import type { TeamProgram } from "@rules/team-proposals";
import { Scoresheet, offeredTeamEvaluationActions } from "@rules/proposal-evaluation";
import { STAGE_SCORES, StageOffers, StageScoreTag, WRONG_STAGE, hasReachedStage, offeredStageActions } from "@rules/team-evaluation";
import { statusLabel, type OpportunityStatus } from "@rules/opportunities";
import type { Account } from "../api/accounts";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { TeamProposal, TeamProposalSaveAnswer, changeTeamProposal, fetchTeamProposal } from "../api/team-proposals";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { Fact, momentLabel } from "./opportunity-parts";
import { ProposalHistory } from "./proposal-cwu-edit";
import { ProposalStatusBadge } from "./proposal-cwu-form";
import { EvaluationActions, EvaluationAnswer, ScoreDialog } from "./proposal-evaluation-actions";
import { TeamProposalDetails } from "./proposal-team-edit";

/**
 * A Sprint With Us or Team With Us proposal, read-only, at
 * `/opportunities/<program>/:opportunityId/proposals/:proposalId` (proposal-swu-view,
 * proposal-twu-view): who proposed, its state and identifier, its scores, and its tabs (`?tab=…`) —
 * the proposal, its answers to the questions, each stage after the questions (the code challenge and
 * team scenario, or the challenge), and its history.
 *
 * Whoever may read the proposal sees it, and the service decides who that is: the vendor who wrote
 * it and a vendor who owns or administers its organization (R-2.9, R-2.24); the opportunity's author
 * and administrators once the opportunity has closed, and never a draft (R-2.25). Anybody else, and
 * a proposal reached through another opportunity's address, is shown the missing page. The
 * opportunity's author and administrators enter each stage's score on that stage's tab, only once the
 * opportunity stands at the stage and the proposal is in it (R-2.28), screen a Sprint With Us proponent
 * in to or out of the team scenario, award a fully evaluated proposal and disqualify one (R-1.26,
 * R-2.34).
 */

type Tab = "proposal" | "teamQuestions" | "codeChallenge" | "teamScenario" | "resourceQuestions" | "challenge" | "history";
const TABS: Readonly<Record<TeamProgram, readonly Tab[]>> = {
  "sprint-with-us": ["proposal", "teamQuestions", "codeChallenge", "teamScenario", "history"],
  "team-with-us": ["proposal", "resourceQuestions", "challenge", "history"],
};
const TAB_NAMES: Readonly<Record<Tab, string>> = {
  proposal: "Proposal",
  teamQuestions: "Team questions",
  codeChallenge: "Code challenge",
  teamScenario: "Team scenario",
  resourceQuestions: "Resource questions",
  challenge: "Challenge",
  history: "History",
};
const TAB_TEST_IDS: Readonly<Record<Tab, string>> = {
  proposal: "proposal-tab-proposal",
  teamQuestions: "proposal-tab-team-questions",
  codeChallenge: "proposal-tab-code-challenge",
  teamScenario: "proposal-tab-team-scenario",
  resourceQuestions: "proposal-tab-resource-questions",
  challenge: "proposal-tab-challenge",
  history: "proposal-tab-history",
};

const TITLES: Readonly<Record<TeamProgram, string>> = {
  "sprint-with-us": "Sprint With Us proposal",
  "team-with-us": "Team With Us proposal",
};

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "found"; readonly proposal: TeamProposal; readonly opportunity: OtherProgramOpportunity };

export function ProposalTeamViewScreen({ program, opportunityId, proposalId }: { program: TeamProgram; opportunityId: string; proposalId: string }) {
  useScreenTitle(TITLES[program]);
  return (
    <RequireSignIn title={TITLES[program]} loadingLabel="Loading proposal…">
      {(account) => <ViewLoader program={program} account={account} opportunityId={opportunityId} proposalId={proposalId} />}
    </RequireSignIn>
  );
}

function ViewLoader({ program, account, opportunityId, proposalId }: { program: TeamProgram; account: Account; opportunityId: string; proposalId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    void Promise.all([fetchTeamProposal(program, proposalId), fetchOtherProgramOpportunity(program, opportunityId)]).then(([answer, opportunity]) => {
      if (!current) return;
      setLoaded(
        answer.kind === "found" && opportunity.kind === "found"
          ? { kind: "found", proposal: answer.proposal, opportunity: opportunity.opportunity }
          : { kind: "missing" },
      );
    });
    return () => {
      current = false;
    };
  }, [program, proposalId, opportunityId]);

  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading proposal…" />
      </Stack>
    );
  }
  // A draft is never shown to staff, whatever the service sends (R-2.25).
  if (loaded.proposal.opportunity.id !== opportunityId.toLowerCase() || (account.type !== "VENDOR" && loaded.proposal.status === "DRAFT")) return <NotFound />;
  return <View program={program} account={account} proposal={loaded.proposal} opportunity={loaded.opportunity} />;
}

/** The name the proposal is put forward under: its organization's. */
export function teamProponentName(proposal: TeamProposal): string {
  return proposal.organization?.legalName.trim() || "Proponent not named yet";
}

const scoreLabel = (value: number | null, missing: string) => (value === null ? missing : `${value}%`);

/** A place in words, as the proposal page shows its rank: "1st", "2nd", "3rd", "4th" (R-2.31). */
export function ordinal(place: number): string {
  const tens = place % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[place % 10] ?? "th";
  return `${place}${suffix}`;
}

/**
 * The proposal's scoresheet as it is read on this page (R-2.30, R-2.31, R-2.32): each stage's score,
 * the weighted total and, once fully evaluated, its place among the others that are.
 */
export function TeamScores({ program, scoresheet }: { program: TeamProgram; scoresheet: Scoresheet }) {
  const sprint = program === "sprint-with-us";
  return (
    <Stack as="section" gap="medium" aria-labelledby="scores-heading">
      <Heading level={2} id="scores-heading">
        Scores
      </Heading>
      <Stack as="dl" direction="row" gap="medium">
        <Fact label={sprint ? "Team questions" : "Resource questions"} testId="proposal-questions-score">
          {scoreLabel(scoresheet.questions, "Not yet scored")}
        </Fact>
        <Fact label={sprint ? "Code challenge" : "Challenge"} testId="proposal-challenge-score">
          {scoreLabel(scoresheet.challenge, "Not yet scored")}
        </Fact>
        {sprint ? (
          <Fact label="Team scenario" testId="proposal-scenario-score">
            {scoreLabel(scoresheet.scenario, "Not yet scored")}
          </Fact>
        ) : null}
        <Fact label="Price" testId="proposal-price-score">
          {scoreLabel(scoresheet.price, "Not yet calculated")}
        </Fact>
        <Fact label="Total score" testId="proposal-total-score">
          {scoreLabel(scoresheet.total, "Not yet calculated")}
        </Fact>
        {scoresheet.rank ? (
          <Fact label="Rank" testId="proposal-rank">
            {ordinal(scoresheet.rank.rank)}
          </Fact>
        ) : null}
      </Stack>
      <Text elementType="p" size="small" color="secondary">
        {`The total combines each stage's score in the proportions the opportunity states. The price score is this proposal's share of the lowest bid still in contention.${
          scoresheet.rank ? ` The rank is among the ${scoresheet.rank.of} fully evaluated ${scoresheet.rank.of === 1 ? "proposal" : "proposals"}.` : ""
        }`}
      </Text>
    </Stack>
  );
}

/** Which stage each stage tab is about. */
const STAGE_OF_TAB: Readonly<Partial<Record<Tab, StageScoreTag>>> = {
  codeChallenge: "scoreCodeChallenge",
  teamScenario: "scoreTeamScenario",
  challenge: "scoreChallenge",
};

/** The test ID of each stage's score button (proposal-swu-view, proposal-twu-view). */
const SCORE_TEST_IDS: Readonly<Record<StageScoreTag, string>> = {
  scoreCodeChallenge: "proposal-score-code-challenge",
  scoreTeamScenario: "proposal-score-team-scenario",
  scoreChallenge: "proposal-score-challenge",
};

const capitalized = (words: string) => `${words.charAt(0).toUpperCase()}${words.slice(1)}`;

/**
 * What a stage tab says, as the proposal and the opportunity stand (R-2.28): which stage the
 * opportunity is at, and — when the score is not offered — when this proposal can be scored.
 */
export function stageTabSentence(
  program: TeamProgram,
  stage: StageScoreTag,
  proposalStatus: string,
  opportunityStatus: string,
  offered: boolean,
): string {
  const rule = STAGE_SCORES[stage];
  const at = `This opportunity is at the ${statusLabel(opportunityStatus as OpportunityStatus, program).toLowerCase()} stage.`;
  if (offered) {
    if (stage === "scoreCodeChallenge") return "This opportunity is at the code challenge stage.";
    return `This opportunity is at the ${rule.name} stage. When the last ${rule.name} score is entered, each proposal's price score is calculated.`;
  }
  if (!hasReachedStage(opportunityStatus, rule.opportunity)) {
    return `${at} This proposal can be scored once the opportunity has reached the ${rule.name}.`;
  }
  if (opportunityStatus !== rule.opportunity) return `The ${rule.name} is over.`;
  if (rule.proposalIn.includes(proposalStatus)) return at;
  return `${at} This proposal was not carried into the ${rule.name}.`;
}

function StageTabContent({
  program,
  stage,
  proposal,
  offers,
  busy,
  onScore,
  onScreen,
}: {
  program: TeamProgram;
  stage: StageScoreTag;
  proposal: TeamProposal;
  offers: StageOffers | null;
  busy: boolean;
  onScore: (stage: StageScoreTag) => void;
  onScreen: (tag: "screenInToTeamScenario" | "screenOutFromTeamScenario") => void;
}) {
  const rule = STAGE_SCORES[stage];
  const offered = offers ? offers[stage] : false;
  const score = proposal.scoresheet ? (rule.score === "scenario" ? proposal.scoresheet.scenario : proposal.scoresheet.challenge) : null;
  const codeChallenge = stage === "scoreCodeChallenge";
  const screenedIn = ["UNDER_REVIEW_TEAM_SCENARIO", "EVALUATED_TEAM_SCENARIO"].includes(proposal.status);
  const screening = codeChallenge && offers ? { in: offers.screenIn, out: offers.screenOut } : { in: false, out: false };
  return (
    <>
      <Text elementType="p">{stageTabSentence(program, stage, proposal.status, proposal.opportunity.status, offered || screening.in || screening.out)}</Text>
      <Stack as="dl" direction="row" gap="medium">
        <Fact label={`${capitalized(rule.name)} score`}>{proposal.scoresheet ? scoreLabel(score, "Not yet scored") : "Not shown"}</Fact>
        {codeChallenge ? <Fact label="Screened in to the team scenario">{screenedIn ? "Yes" : "No"}</Fact> : null}
      </Stack>
      {offered || screening.in || screening.out ? (
        <ButtonGroup ariaLabel={`${capitalized(rule.name)} actions`}>
          {offered ? (
            <Button variant="primary" isDisabled={busy} onPress={() => onScore(stage)} data-testid={SCORE_TEST_IDS[stage]}>
              {`Enter ${rule.name} score`}
            </Button>
          ) : null}
          {screening.in ? (
            <Button variant="secondary" isDisabled={busy} onPress={() => onScreen("screenInToTeamScenario")} data-testid="proposal-screen-in">
              Screen in to team scenario
            </Button>
          ) : null}
          {screening.out ? (
            <Button variant="secondary" isDisabled={busy} onPress={() => onScreen("screenOutFromTeamScenario")} data-testid="proposal-screen-out">
              Screen out from team scenario
            </Button>
          ) : null}
        </ButtonGroup>
      ) : null}
    </>
  );
}

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

/** The proposal's answers to the opportunity's questions, each beside its question. */
function QuestionsTabContent({ program, proposal, opportunity }: { program: TeamProgram; proposal: TeamProposal; opportunity: OtherProgramOpportunity }) {
  const sprint = program === "sprint-with-us";
  const base = `/opportunities/${program}/${opportunity.id}/edit?tab=consensus`;
  return (
    <>
      <Text elementType="p">
        Question scores are agreed by the evaluation panel on the opportunity's <Link href={base}>Consensus tab</Link>. Only proposals
        meeting every question's minimum score move on to the {sprint ? "code challenge" : "challenge"}.
      </Text>
      <div role="region" aria-labelledby="questions-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption id="questions-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">
              Responses to the {sprint ? "team" : "resource"} questions
            </Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>
                Question
              </th>
              <th scope="col" style={cell}>
                Response
              </th>
            </tr>
          </thead>
          <tbody>
            {opportunity.questions.map((question, order) => (
              <tr key={order}>
                <td style={cell}>{`${order + 1}. ${question.question}`}</td>
                <td style={cell}>{proposal.responses.find((response) => response.order === order)?.response ?? "Not answered"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const DONE_SCORE: Readonly<Record<StageScoreTag, string>> = {
  scoreCodeChallenge: "The code challenge score has been entered.",
  scoreTeamScenario: "The team scenario score has been entered.",
  scoreChallenge: "The challenge score has been entered.",
};

function View({
  program,
  account,
  proposal: initial,
  opportunity,
}: {
  program: TeamProgram;
  account: Account;
  proposal: TeamProposal;
  opportunity: OtherProgramOpportunity;
}) {
  const [proposal, setProposal] = useState(initial);
  const [done, setDone] = useState<string | null>(null);
  const [scoring, setScoring] = useState<StageScoreTag | null>(null);
  const [busy, setBusy] = useState(false);
  // A stage action refused because the opportunity stands at another stage (R-2.28), or for any other reason.
  const [wrongStage, setWrongStage] = useState(false);
  const [refusal, setRefusal] = useState<readonly string[] | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const tabs = TABS[program];
  const tab: Tab = tabs.includes(search.tab as Tab) ? (search.tab as Tab) : "proposal";
  const opportunityId = proposal.opportunity.id;
  const base = `/opportunities/${program}/${opportunityId}/proposals/${proposal.id}`;
  const vendor = account.type === "VENDOR";
  // Staff manage the opportunity; a vendor reads it, and manages their proposal on its own page.
  const opportunityAddress = vendor ? `/opportunities/${program}/${opportunityId}` : `/opportunities/${program}/${opportunityId}/edit`;
  const stageOffers = vendor ? null : offeredStageActions(program, proposal.status, proposal.opportunity.status);

  useEffect(() => {
    if (wrongStage || refusal) alertRef.current?.focus();
  }, [wrongStage, refusal]);

  /** What a stage action came back with: the proposal as it now stands, or why it was refused. */
  function settle(answer: TeamProposalSaveAnswer, text: string): void {
    if (answer.kind === "saved") {
      setProposal(answer.proposal);
      setDone(text);
      setWrongStage(false);
      setRefusal(null);
      return;
    }
    setDone(null);
    const reasons = answer.kind === "refused" ? answer.reasons : ["The service could not do that. Try again."];
    setWrongStage(reasons.includes(WRONG_STAGE));
    setRefusal(reasons.includes(WRONG_STAGE) ? null : reasons);
  }

  async function score(value: number): Promise<EvaluationAnswer<TeamProposal>> {
    if (!scoring) return { kind: "failed" };
    setBusy(true);
    const answer = await changeTeamProposal(program, proposal.id, scoring, value);
    setBusy(false);
    // A refusal about the score itself is said at the field; anything else closes the dialog.
    if (!(answer.kind === "refused" && answer.reasons.some((reason) => reason.startsWith("score: ")))) {
      settle(answer, DONE_SCORE[scoring]);
      setScoring(null);
    }
    return answer.kind === "saved" ? { kind: "saved", proposal: answer.proposal } : answer.kind === "refused" ? { kind: "refused", reasons: answer.reasons } : { kind: "failed" };
  }

  async function screen(tag: "screenInToTeamScenario" | "screenOutFromTeamScenario") {
    if (busy) return;
    setBusy(true);
    const answer = await changeTeamProposal(program, proposal.id, tag);
    setBusy(false);
    settle(
      answer,
      tag === "screenInToTeamScenario" ? "The proposal has been screened in to the team scenario." : "The proposal has been screened out of the team scenario.",
    );
  }

  const stage = STAGE_OF_TAB[tab];
  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {TITLES[program]}
        </Text>
        <Heading level={1}>
          <span data-testid="proposal-proponent-name">{teamProponentName(proposal)}</span>
        </Heading>
      </Stack>
      <Stack as="dl" direction="row" gap="medium">
        <Fact label="Opportunity">
          <Link href={opportunityAddress}>{proposal.opportunity.title || "Untitled opportunity"}</Link>
        </Fact>
        <Fact label="Status">
          <ProposalStatusBadge status={proposal.status} />
        </Fact>
        {proposal.submittedAt && proposal.status !== "DRAFT" ? (
          <Fact label="Submitted" testId="proposal-submitted-at">
            {momentLabel(proposal.submittedAt)}
          </Fact>
        ) : null}
        <Fact label="Proposal ID" testId="proposal-identifier">
          {proposal.id}
        </Fact>
      </Stack>
      {/* The service sends the scoresheet to staff, and to the vendor once a decision has been made (R-2.32). */}
      {proposal.scoresheet && (!vendor || proposal.status === "AWARDED" || proposal.status === "NOT_AWARDED") ? (
        <TeamScores program={program} scoresheet={proposal.scoresheet} />
      ) : null}
      <Stack direction="row" align="center" gap="medium">
        {vendor ? <Link href={`${base}/edit`}>Manage this proposal</Link> : null}
        <Link href={`${base}/export`} data-testid="proposal-export-link">
          Printable copy
        </Link>
      </Stack>
      {/* Staff read a proposal only as the opportunity's author or an administrator, once it has closed. */}
      {!vendor ? (
        <EvaluationActions
          offers={offeredTeamEvaluationActions(program, proposal.status, proposal.opportunity.status)}
          // Each stage's score is entered on its own tab, not here.
          change={async (tag, value) =>
            tag === "score" ? { kind: "failed" } : changeTeamProposal(program, proposal.id, tag, typeof value === "string" ? value : undefined)
          }
          onChanged={(changed, text) => {
            setProposal(changed);
            setDone(text);
          }}
        />
      ) : null}
      <div role="status">{done ? <Text elementType="p">{done}</Text> : null}</div>
      <nav aria-label="Proposal sections">
        <Stack as="ul" direction="row" gap="medium">
          {tabs.map((name) => (
            <li key={name}>
              <Link href={`${base}?tab=${name}`} aria-current={name === tab ? "page" : undefined} data-testid={TAB_TEST_IDS[name]}>
                {TAB_NAMES[name]}
              </Link>
            </li>
          ))}
        </Stack>
      </nav>
      {wrongStage ? (
        <div tabIndex={-1} ref={alertRef} data-testid="proposal-wrong-stage-error">
          <InlineAlert variant="danger" title="That score was not entered" role="alert">
            <Text elementType="p">{WRONG_STAGE}</Text>
          </InlineAlert>
        </div>
      ) : null}
      {refusal ? (
        <div tabIndex={-1} ref={alertRef} data-testid="proposal-refused-message">
          <TitledAlert variant="danger" role="alert" title="That was not done">
            {refusal.map((reason) => (
              <Text elementType="p" key={reason}>
                {reason}
              </Text>
            ))}
          </TitledAlert>
        </div>
      ) : null}
      <Stack as="section" gap="medium" aria-labelledby="tab-heading">
        <Heading level={2} id="tab-heading">
          {TAB_NAMES[tab]}
        </Heading>
        {tab === "proposal" ? <TeamProposalDetails program={program} proposal={proposal} opportunity={opportunity} /> : null}
        {tab === "teamQuestions" || tab === "resourceQuestions" ? <QuestionsTabContent program={program} proposal={proposal} opportunity={opportunity} /> : null}
        {stage ? (
          <StageTabContent
            program={program}
            stage={stage}
            proposal={proposal}
            offers={stageOffers}
            busy={busy}
            onScore={(next) => setScoring(next)}
            onScreen={(tag) => void screen(tag)}
          />
        ) : null}
        {tab === "history" ? <ProposalHistory proposal={proposal} /> : null}
      </Stack>
      <ScoreDialog
        isOpen={scoring !== null}
        isSending={busy}
        onCancel={() => setScoring(null)}
        onConfirm={score}
        title={scoring ? `Enter ${STAGE_SCORES[scoring].name} score` : "Enter score"}
        label={scoring ? `${capitalized(STAGE_SCORES[scoring].name)} score (%)` : "Score (%)"}
        explanation="The score is recorded in the proposal's history."
      />
    </Stack>
  );
}
