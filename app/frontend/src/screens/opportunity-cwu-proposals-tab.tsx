import { useEffect, useState } from "react";
import { Link, Text } from "@bcgov/design-system-react-components";
import type { Program } from "@rules/opportunities";
import { CwuProposal, listCwuProposals } from "../api/proposals";
import { TeamProposal, listTeamProposals } from "../api/team-proposals";
import { Loading } from "../app/loading";
import { TitledAlert } from "../app/titled-alert";
import { deadlineLabel, momentLabel } from "./opportunity-parts";
import { ProposalStatusBadge } from "./proposal-cwu-form";
import { proponentName } from "./proposal-cwu-view";

/**
 * The Proposals tab of an opportunity's manage page (`?tab=proposals`), in all three programs. The
 * service answers its author and administrators with the proposals put forward once the
 * opportunity has closed, and refuses them until then (R-1.31, R-2.25); the tab says which. A draft
 * is never listed, whatever the service sends. Each proposal opens on its program's read-only page
 * (proposal-cwu-view, proposal-swu-view, proposal-twu-view).
 */

/** One proposal as the tab lists it. */
export interface ListedProposal {
  readonly id: string;
  readonly status: string;
  readonly name: string;
  readonly submittedAt: string | null;
}

type Listed =
  | { readonly kind: "loading" }
  | { readonly kind: "listed"; readonly proposals: readonly ListedProposal[] }
  | { readonly kind: "refused" }
  | { readonly kind: "failed" };

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

function listedFromCwu(proposal: CwuProposal): ListedProposal {
  return { id: proposal.id, status: proposal.status, name: proponentName(proposal), submittedAt: proposal.submittedAt };
}

function listedFromTeam(proposal: TeamProposal): ListedProposal {
  return { id: proposal.id, status: proposal.status, name: proposal.organization?.legalName ?? "Proponent not named yet", submittedAt: proposal.submittedAt };
}

async function listFor(program: Program, opportunityId: string): Promise<Listed> {
  if (program === "code-with-us") {
    const answer = await listCwuProposals(opportunityId);
    return answer.kind === "listed" ? { kind: "listed", proposals: answer.proposals.map(listedFromCwu) } : { kind: answer.kind };
  }
  const answer = await listTeamProposals(program, opportunityId);
  return answer.kind === "listed" ? { kind: "listed", proposals: answer.proposals.map(listedFromTeam) } : { kind: answer.kind };
}

export function ProposalsTab({
  program = "code-with-us",
  opportunity,
}: {
  program?: Program;
  opportunity: { readonly id: string; readonly proposalDeadline: string };
}) {
  const [listed, setListed] = useState<Listed>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    void listFor(program, opportunity.id).then((answer) => {
      if (current) setListed(answer);
    });
    return () => {
      current = false;
    };
  }, [program, opportunity.id]);

  if (listed.kind === "loading") return <Loading label="Loading proposals…" />;
  if (listed.kind === "refused") {
    return (
      <div data-testid="opportunity-proposals-withheld-message">
        <TitledAlert variant="info" title="Proposals are not shown until the opportunity closes">
          <Text elementType="p">
            {`The proposals submitted to this opportunity can be read once it has closed to proposals, at ${deadlineLabel(
              opportunity.proposalDeadline,
            )}.`}
          </Text>
        </TitledAlert>
      </div>
    );
  }
  if (listed.kind === "failed") {
    return (
      <TitledAlert variant="danger" role="alert" title="The proposals could not be loaded">
        <Text elementType="p">Reload the page to try again.</Text>
      </TitledAlert>
    );
  }
  const shown = putForward(listed.proposals);
  if (shown.length === 0) {
    return (
      <Text elementType="p" data-testid="opportunity-proposals-empty">
        No proposals were submitted to this opportunity.
      </Text>
    );
  }
  return (
    <div role="region" aria-labelledby="proposals-caption" tabIndex={0} style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="opportunity-proposals-table">
        <caption id="proposals-caption" style={{ textAlign: "start" }}>
          <Text size="small" color="secondary">
            Every proposal submitted to this opportunity
          </Text>
        </caption>
        <thead>
          <tr>
            <th scope="col" style={cell}>
              Proponent
            </th>
            <th scope="col" style={cell}>
              Status
            </th>
            <th scope="col" style={cell}>
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((proposal) => (
            <tr key={proposal.id} data-testid="opportunity-proposal-row">
              <td style={cell}>
                <Link href={`/opportunities/${program}/${opportunity.id}/proposals/${proposal.id}`} data-testid="opportunity-proposal-link">
                  <span data-testid="proposal-proponent-name">{proposal.name}</span>
                </Link>
              </td>
              <td style={cell}>
                <ProposalStatusBadge status={proposal.status} />
              </td>
              <td style={cell}>{proposal.submittedAt ? momentLabel(proposal.submittedAt) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What staff may see of an opportunity's proposals: never a draft (R-2.25). */
export function putForward<T extends { readonly status: string }>(proposals: readonly T[]): readonly T[] {
  return proposals.filter((proposal) => proposal.status !== "DRAFT");
}
