import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { useSearch } from "@tanstack/react-router";
import type { TeamProgram } from "@rules/team-proposals";
import type { Account } from "../api/accounts";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { Scoresheet, offeredTeamEvaluationActions, rankLabel } from "@rules/proposal-evaluation";
import { TeamProposal, changeTeamProposal, fetchTeamProposal } from "../api/team-proposals";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { Fact, momentLabel } from "./opportunity-parts";
import { ProposalHistory } from "./proposal-cwu-edit";
import { ProposalStatusBadge } from "./proposal-cwu-form";
import { EvaluationActions } from "./proposal-evaluation-actions";
import { TeamProposalDetails } from "./proposal-team-edit";

/**
 * A Sprint With Us or Team With Us proposal, read-only, at
 * `/opportunities/<program>/:opportunityId/proposals/:proposalId` (proposal-swu-view,
 * proposal-twu-view): who proposed, its state and identifier, and its Proposal and History tabs
 * (`?tab=…`).
 *
 * Whoever may read the proposal sees it, and the service decides who that is: the vendor who wrote
 * it and a vendor who owns or administers its organization (R-2.9, R-2.24); the opportunity's author
 * and administrators once the opportunity has closed, and never a draft (R-2.25). Anybody else, and
 * a proposal reached through another opportunity's address, is shown the missing page. The
 * opportunity's author and administrators award a fully evaluated proposal and disqualify one here
 * (R-1.26, R-2.34); each stage's scores and its tabs are the evaluation stages' own.
 */

type Tab = "proposal" | "history";
const TABS: readonly Tab[] = ["proposal", "history"];
const TAB_NAMES: Readonly<Record<Tab, string>> = { proposal: "Proposal", history: "History" };

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

/**
 * The proposal's scoresheet as staff read it (R-2.30, R-2.31, R-2.32): each stage's score, the
 * weighted total and, once fully evaluated, its rank. The vendor reads theirs here too, and on the
 * manage page's Scoresheet tab, once a decision has been made.
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
          {scoreLabel(scoresheet.questions, "Not scored")}
        </Fact>
        <Fact label={sprint ? "Code challenge" : "Challenge"} testId="proposal-challenge-score">
          {scoreLabel(scoresheet.challenge, "Not scored")}
        </Fact>
        {sprint ? (
          <Fact label="Team scenario" testId="proposal-scenario-score">
            {scoreLabel(scoresheet.scenario, "Not scored")}
          </Fact>
        ) : null}
        <Fact label="Price" testId="proposal-price-score">
          {scoreLabel(scoresheet.price, "Not scored")}
        </Fact>
        <Fact label="Total score" testId="proposal-total-score">
          {scoreLabel(scoresheet.total, "Not yet calculated")}
        </Fact>
        {scoresheet.rank ? (
          <Fact label="Rank" testId="proposal-rank">
            {rankLabel(scoresheet.rank)}
          </Fact>
        ) : null}
      </Stack>
      <Text elementType="p" size="small" color="secondary">
        The total combines each stage's score in the proportions the opportunity states.
      </Text>
    </Stack>
  );
}

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
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const tab: Tab = TABS.includes(search.tab as Tab) ? (search.tab as Tab) : "proposal";
  const opportunityId = proposal.opportunity.id;
  const base = `/opportunities/${program}/${opportunityId}/proposals/${proposal.id}`;
  const vendor = account.type === "VENDOR";
  // Staff manage the opportunity; a vendor reads it, and manages their proposal on its own page.
  const opportunityAddress = vendor ? `/opportunities/${program}/${opportunityId}` : `/opportunities/${program}/${opportunityId}/edit`;

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
        {vendor ?<Link href={`${base}/edit`}>Manage this proposal</Link> : null}
        <Link href={`${base}/export`} data-testid="proposal-export-link">
          Printable copy
        </Link>
      </Stack>
      {/* Staff read a proposal only as the opportunity's author or an administrator, once it has closed. */}
      {!vendor ? (
        <EvaluationActions
          offers={offeredTeamEvaluationActions(program, proposal.status, proposal.opportunity.status)}
          // Each stage's score is entered on the stages' own tabs, not here.
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
          {TABS.map((name) => (
            <li key={name}>
              <Link href={`${base}?tab=${name}`} aria-current={name === tab ? "page" : undefined} data-testid={`proposal-tab-${name}`}>
                {TAB_NAMES[name]}
              </Link>
            </li>
          ))}
        </Stack>
      </nav>
      <Stack as="section" gap="medium" aria-labelledby="tab-heading">
        <Heading level={2} id="tab-heading">
          {TAB_NAMES[tab]}
        </Heading>
        {tab === "proposal" ? <TeamProposalDetails program={program} proposal={proposal} opportunity={opportunity} /> : null}
        {tab === "history" ? <ProposalHistory proposal={proposal} /> : null}
      </Stack>
    </Stack>
  );
}
