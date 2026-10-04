import { useEffect, useState } from "react";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { useNavigate } from "@tanstack/react-router";
import { mayStartProposal } from "@rules/proposals";
import type { TeamProgram } from "@rules/team-proposals";
import { Account, changeOwnAccount } from "../api/accounts";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { ActingFor, fetchOrganizationsActingFor } from "../api/proposals";
import { createTeamProposal, listTeamProposals } from "../api/team-proposals";
import { useGoTo } from "../app/go-to";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { useSession } from "../auth/session";
import { TeamOpportunitySummary, TeamProposalForm, blankTeamValues } from "./proposal-team-form";

const TITLES: Readonly<Record<TeamProgram, string>> = {
  "sprint-with-us": "Create a Sprint With Us proposal",
  "team-with-us": "Create a Team With Us proposal",
};

/**
 * Start a Sprint With Us or Team With Us proposal, at
 * `/opportunities/<program>/:opportunityId/proposals/create` (proposal-swu-create,
 * proposal-twu-create; decision record 0058).
 *
 * Only a vendor who has accepted the service's terms at some point may start one; anyone else is
 * shown the missing page (R-2.1), and so is an opportunity that is not published. A vendor who
 * already holds a proposal on it is taken to that one (R-2.2). A draft is saved whatever it holds
 * (R-2.12); Submit proposal checks the form, asks for both sets of terms and records the service's
 * on the account as it submits (R-2.3, R-2.7).
 */
export function ProposalTeamCreateScreen({ program, opportunityId }: { program: TeamProgram; opportunityId: string }) {
  useScreenTitle(TITLES[program]);
  const session = useSession();
  if (session.status === "starting") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading opportunity…" />
      </Stack>
    );
  }
  if (session.status !== "signed-in" || !mayStartProposal(session.account)) return <NotFound />;
  return <CreateLoader program={program} account={session.account} opportunityId={opportunityId} />;
}

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity; readonly organizations: readonly ActingFor[] };

function CreateLoader({ program, account, opportunityId }: { program: TeamProgram; account: Account; opportunityId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const goTo = useGoTo();

  useEffect(() => {
    let current = true;
    void Promise.all([
      fetchOtherProgramOpportunity(program, opportunityId),
      listTeamProposals(program, opportunityId),
      fetchOrganizationsActingFor(),
    ]).then(([opportunity, held, organizations]) => {
      if (!current) return;
      const existing = held.kind === "listed" ? held.proposals.find((proposal) => proposal.createdBy?.id === account.id) : undefined;
      if (existing) {
        // One proposal per vendor: the one they hold is where they go (R-2.2).
        goTo(`/opportunities/${program}/${opportunityId}/proposals/${existing.id}/edit`);
        return;
      }
      if (opportunity.kind !== "found" || opportunity.opportunity.status !== "PUBLISHED") {
        setLoaded({ kind: "missing" });
        return;
      }
      setLoaded({ kind: "found", opportunity: opportunity.opportunity, organizations });
    });
    return () => {
      current = false;
    };
  }, [program, account.id, opportunityId, goTo]);

  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading opportunity…" />
      </Stack>
    );
  }
  return <Create program={program} account={account} opportunity={loaded.opportunity} organizations={loaded.organizations} />;
}

function Create({
  program,
  account,
  opportunity,
  organizations,
}: {
  program: TeamProgram;
  account: Account;
  opportunity: OtherProgramOpportunity;
  organizations: readonly ActingFor[];
}) {
  const navigate = useNavigate();
  const initial = blankTeamValues(opportunity);
  return (
    <Stack gap="large">
      <Heading level={1}>{TITLES[program]}</Heading>
      <TeamOpportunitySummary program={program} opportunity={opportunity} />
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <TeamProposalForm
        program={program}
        purpose="create"
        opportunity={opportunity}
        organizations={organizations}
        initial={organizations.length === 1 && organizations[0] ? { ...initial, organization: organizations[0].id } : initial}
        headingLevel={2}
        refusalTitle="Your proposal was not created"
        onSend={async (action, content) => {
          if (action === "submit") {
            // Submitting records the acceptance of the service's terms (R-2.3).
            const accepted = await changeOwnAccount(account.id, "acceptTerms");
            if (accepted.kind !== "saved") return { kind: "failed" };
          }
          return createTeamProposal(program, opportunity.id, content, action === "submit" ? "SUBMITTED" : "DRAFT");
        }}
        onSaved={(proposal) => {
          const params = { opportunityId: opportunity.id, proposalId: proposal.id };
          void (program === "sprint-with-us"
            ? navigate({ to: "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/edit", params })
            : navigate({ to: "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/edit", params }));
        }}
        onCancel={() => {
          const params = { opportunityId: opportunity.id };
          void (program === "sprint-with-us"
            ? navigate({ to: "/opportunities/sprint-with-us/$opportunityId", params })
            : navigate({ to: "/opportunities/team-with-us/$opportunityId", params }));
        }}
      />
    </Stack>
  );
}
