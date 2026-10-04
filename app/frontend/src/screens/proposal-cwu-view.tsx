import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { useSearch } from "@tanstack/react-router";
import type { Account } from "../api/accounts";
import { CwuProposal, fetchCwuProposal } from "../api/proposals";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { Fact, momentLabel } from "./opportunity-parts";
import { ProposalDetails, ProposalHistory } from "./proposal-cwu-edit";
import { ProposalStatusBadge } from "./proposal-cwu-form";

/**
 * A Code With Us proposal, read-only, at
 * `/opportunities/code-with-us/:opportunityId/proposals/:proposalId` (proposal-cwu-view): who
 * proposed, its state, its score once there is one, and its Proposal and History tabs (`?tab=…`).
 *
 * Whoever may read the proposal sees it, and the service decides who that is: the vendor who wrote
 * it and a vendor who owns or administers its organization, never another vendor (R-2.24); the
 * opportunity's author and administrators once the opportunity has closed, and never a draft
 * (R-2.25). Anybody else, and a proposal on another opportunity's address, is shown the missing
 * page. Entering a score, awarding and disqualifying are the evaluation's, and are not offered here.
 */

type Tab = "proposal" | "history";
const TABS: readonly Tab[] = ["proposal", "history"];
const TAB_NAMES: Readonly<Record<Tab, string>> = { proposal: "Proposal", history: "History" };

type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly proposal: CwuProposal };

export function ProposalCwuViewScreen({ opportunityId, proposalId }: { opportunityId: string; proposalId: string }) {
  useScreenTitle("Code With Us proposal");
  return (
    <RequireSignIn title="Code With Us proposal" loadingLabel="Loading proposal…">
      {(account) => <ViewLoader account={account} opportunityId={opportunityId} proposalId={proposalId} />}
    </RequireSignIn>
  );
}

function ViewLoader({ account, opportunityId, proposalId }: { account: Account; opportunityId: string; proposalId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    void fetchCwuProposal(proposalId).then((answer) => {
      if (current) setLoaded(answer.kind === "found" ? { kind: "found", proposal: answer.proposal } : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [proposalId]);

  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>Code With Us proposal</Heading>
        <Loading label="Loading proposal…" />
      </Stack>
    );
  }
  if (loaded.proposal.opportunity.id !== opportunityId.toLowerCase()) return <NotFound />;
  return <View account={account} proposal={loaded.proposal} />;
}

/** The name the proposal is put forward under: the organization's, or the individual's own. */
export function proponentName(proposal: CwuProposal): string {
  const name = proposal.proponent.value.legalName;
  return name.trim() === "" ? "Proponent not named yet" : name;
}

function View({ account, proposal }: { account: Account; proposal: CwuProposal }) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const tab: Tab = TABS.includes(search.tab as Tab) ? (search.tab as Tab) : "proposal";
  const opportunityId = proposal.opportunity.id;
  const base = `/opportunities/code-with-us/${opportunityId}/proposals/${proposal.id}`;
  const vendor = account.type === "VENDOR";
  // Staff manage the opportunity; a vendor reads it, and manages their proposal on its own page.
  const opportunityAddress = vendor ? `/opportunities/code-with-us/${opportunityId}` : `/opportunities/code-with-us/${opportunityId}/edit`;

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          Code With Us proposal
        </Text>
        <Heading level={1}>
          <span data-testid="proposal-proponent-name">{proponentName(proposal)}</span>
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
      {/* The score is shown to whoever the service gives it to: staff, and the vendor once decided (R-2.32). */}
      {"score" in proposal ? (
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">
            Score
          </Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Fact label="Score" testId="proposal-score">
              {typeof proposal.score === "number" ? `${proposal.score}%` : "Not yet scored"}
            </Fact>
          </Stack>
        </Stack>
      ) : null}
      <Stack direction="row" align="center" gap="medium">
        {vendor ? <Link href={`${base}/edit`}>Manage this proposal</Link> : null}
        <Link href={`${base}/export`} data-testid="proposal-export-link">
          Printable copy
        </Link>
      </Stack>
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
        {tab === "proposal" ? <ProposalDetails proposal={proposal} showResult={false} /> : null}
        {tab === "history" ? <ProposalHistory proposal={proposal} /> : null}
      </Stack>
    </Stack>
  );
}
