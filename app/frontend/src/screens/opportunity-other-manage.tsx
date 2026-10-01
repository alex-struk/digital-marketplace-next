import { useEffect, useState } from "react";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PROGRAM_NAMES, mayManageOpportunity } from "@rules/opportunities";
import type { OtherProgram } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { facts, page, row } from "../app/layout";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { Fact, StatusBadge, dayLabel, deadlineLabel } from "./opportunity-parts";

/**
 * Where a Sprint With Us or Team With Us opportunity lands once it is created, at
 * `/opportunities/<program>/<id>/edit`, as far as slice 8 builds it (decision record 0035): its
 * title, state, identifier, key facts and, as R-1.29 allows, who made it. The manage page's tabs
 * and actions are slice 10's. Only its author and administrators reach it; anybody else is shown
 * the missing page (R-1.30).
 */
type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity };

const TITLES: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "Manage a Sprint With Us opportunity",
  "team-with-us": "Manage a Team With Us opportunity",
};

export function OpportunityOtherManageScreen({ program, opportunityId }: { program: OtherProgram; opportunityId: string }) {
  useScreenTitle(TITLES[program]);
  return (
    <RequireSignIn title={TITLES[program]} loadingLabel="Loading opportunity…">
      {(account) => <ManageLoader program={program} account={account} opportunityId={opportunityId} />}
    </RequireSignIn>
  );
}

function ManageLoader({ program, account, opportunityId }: { program: OtherProgram; account: Account; opportunityId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    void fetchOtherProgramOpportunity(program, opportunityId).then((answer) => {
      if (current) setLoaded(answer.kind === "found" ? answer : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [program, opportunityId]);

  if (loaded.kind === "loading") {
    return (
      <div style={page}>
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading opportunity…" />
      </div>
    );
  }
  const opportunity = loaded.kind === "found" ? loaded.opportunity : null;
  if (!opportunity || !mayManageOpportunity(account, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null })) {
    return <NotFound />;
  }
  return (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">
        {TITLES[program]}
      </Text>
      <Heading level={1}>{opportunity.title || "Untitled opportunity"}</Heading>
      <div style={row}>
        <Text elementType="p">
          Status: <StatusBadge status={opportunity.status} />
        </Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">{opportunity.id}</span>
        </Text>
      </div>
      <dl style={facts}>
        <Fact label="Program">{PROGRAM_NAMES[program]}</Fact>
        <Fact label="Proposal deadline">{deadlineLabel(opportunity.proposalDeadline)}</Fact>
        <Fact label="Assignment date">{dayLabel(opportunity.assignmentDate)}</Fact>
        <Fact label={opportunity.value.term}>
          {opportunity.value.amount > 0 ? `$${opportunity.value.amount.toLocaleString("en-CA")}` : "Not entered"}
        </Fact>
        {opportunity.createdBy !== undefined ? (
          <Fact label="Created by" testId="opportunity-created-by">
            {opportunity.createdBy?.name ?? ""}
          </Fact>
        ) : null}
        {opportunity.updatedBy !== undefined ? (
          <Fact label="Last changed by" testId="opportunity-last-changed-by">
            {opportunity.updatedBy?.name ?? ""}
          </Fact>
        ) : null}
      </dl>
      <Text elementType="p">
        The rest of this opportunity — what makes it a {PROGRAM_NAMES[program]} opportunity, and putting it forward for review
        or publication — cannot be managed here yet.
      </Text>
    </div>
  );
}
