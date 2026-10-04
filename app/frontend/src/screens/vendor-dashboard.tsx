import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { ownsOrAdministers } from "@rules/organizations";
import type { Account } from "../api/accounts";
import { fetchOwnMemberships } from "../api/organizations";
import { CwuProposal, listCwuProposals } from "../api/proposals";
import { Loading } from "../app/loading";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { readDate } from "../lib/dates";
import { ProposalStatusBadge } from "./proposal-cwu-form";

/**
 * The dashboard as a vendor sees it (proposal-vendor-dashboard): the proposals they wrote, and,
 * under a heading of its own, the proposals put forward for organizations they own or administer —
 * never another vendor's (R-2.24). Each list that is empty says so in words; a vendor who owns and
 * administers no organization has no organizations' heading at all. Each row links to the
 * proposal's manage page. Code With Us proposals so far; Sprint With Us and Team With Us arrive
 * with slice 15.
 */

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "failed" }
  | { readonly kind: "listed"; readonly proposals: readonly CwuProposal[]; readonly managed: ReadonlySet<string> };

/** Which of the listed proposals go under which heading. */
export function vendorDashboardRows(
  account: Pick<Account, "id">,
  proposals: readonly CwuProposal[],
  managed: ReadonlySet<string>,
): { mine: CwuProposal[]; organizations: CwuProposal[] } {
  const newestFirst = (a: CwuProposal, b: CwuProposal) => b.updatedAt.localeCompare(a.updatedAt);
  return {
    mine: proposals.filter((proposal) => proposal.createdBy?.id === account.id).sort(newestFirst),
    organizations: proposals
      .filter((proposal) => proposal.proponent.tag === "organization" && managed.has(proposal.proponent.value.id))
      .sort(newestFirst),
  };
}

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const manageAddress = (proposal: CwuProposal) => `/opportunities/code-with-us/${proposal.opportunity.id}/proposals/${proposal.id}/edit`;

export function VendorDashboard({ account }: { account: Account }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });

  useEffect(() => {
    let current = true;
    void Promise.all([listCwuProposals(), fetchOwnMemberships()]).then(([proposals, memberships]) => {
      if (!current) return;
      if (proposals.kind !== "listed") {
        setLoaded({ kind: "failed" });
        return;
      }
      const managed = new Set(
        memberships.kind === "listed"
          ? memberships.memberships.filter((membership) => ownsOrAdministers(membership)).map((membership) => membership.organization.id)
          : [],
      );
      setLoaded({ kind: "listed", proposals: proposals.proposals, managed });
    });
    return () => {
      current = false;
    };
  }, []);

  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <Loading label="Loading your proposals…" />
      </Stack>
    );
  }
  if (loaded.kind === "failed") {
    return (
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <TitledAlert variant="danger" role="alert" title="Your proposals could not be loaded">
          <Text elementType="p">Reload the page to try again.</Text>
        </TitledAlert>
      </Stack>
    );
  }

  const administersAny = loaded.managed.size > 0;
  const { mine, organizations } = vendorDashboardRows(account, loaded.proposals, loaded.managed);
  return (
    <Stack gap="large">
      <Heading level={1}>Dashboard</Heading>
      <nav aria-label="Dashboard sections">
        <Stack as="ul" direction="row" gap="medium">
          <li>
            <Link href="#my-proposals" data-testid="dashboard-show-my-proposals">
              My proposals
            </Link>
          </li>
          {administersAny ? (
            <li>
              <Link href="#organization-proposals" data-testid="dashboard-show-org-proposals">
                My organizations' proposals
              </Link>
            </li>
          ) : null}
        </Stack>
      </nav>
      <Stack as="section" gap="medium" id="my-proposals" tabIndex={-1} aria-labelledby="my-proposals-heading">
        <Heading level={2} id="my-proposals-heading">
          My proposals
        </Heading>
        {mine.length === 0 ? (
          <div data-testid="dashboard-empty-my-proposals">
            <Text elementType="p">
              You have not started any proposals. <Link href="/opportunities">Browse opportunities</Link> to find one to bid on.
            </Text>
          </div>
        ) : (
          <div role="region" aria-labelledby="my-proposals-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-my-proposals-table">
              <caption id="my-proposals-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">
                  Proposals you wrote, most recently updated first
                </Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    Opportunity
                  </th>
                  <th scope="col" style={cell}>
                    Program
                  </th>
                  <th scope="col" style={cell}>
                    Status
                  </th>
                  <th scope="col" style={cell}>
                    Last updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {mine.map((proposal) => (
                  <tr key={proposal.id} data-testid="dashboard-proposal-row">
                    <td style={cell}>
                      <Link href={manageAddress(proposal)} data-testid="dashboard-proposal-link">
                        {proposal.opportunity.title || "Untitled opportunity"}
                      </Link>
                    </td>
                    <td style={cell}>Code With Us</td>
                    <td style={cell}>
                      <ProposalStatusBadge status={proposal.status} />
                    </td>
                    <td style={cell}>{readDate(proposal.updatedAt)?.label ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Stack>
      {administersAny ? (
        <Stack as="section" gap="medium" id="organization-proposals" tabIndex={-1} aria-labelledby="org-proposals-heading">
          <Heading level={2} id="org-proposals-heading">
            My organizations' proposals
          </Heading>
          {organizations.length === 0 ? (
            <div data-testid="dashboard-empty-org-proposals">
              <Text elementType="p">No one has started a proposal for an organization you own or administer.</Text>
            </div>
          ) : (
            <div role="region" aria-labelledby="org-proposals-caption" tabIndex={0} style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-org-proposals-table">
                <caption id="org-proposals-caption" style={{ textAlign: "start" }}>
                  <Text size="small" color="secondary">
                    Proposals written for organizations you own or administer
                  </Text>
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={cell}>
                      Opportunity
                    </th>
                    <th scope="col" style={cell}>
                      Organization
                    </th>
                    <th scope="col" style={cell}>
                      Program
                    </th>
                    <th scope="col" style={cell}>
                      Written by
                    </th>
                    <th scope="col" style={cell}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((proposal) => (
                    <tr key={proposal.id} data-testid="dashboard-proposal-row">
                      <td style={cell}>
                        <Link href={manageAddress(proposal)} data-testid="dashboard-proposal-link">
                          {proposal.opportunity.title || "Untitled opportunity"}
                        </Link>
                      </td>
                      <td style={cell}>{proposal.proponent.tag === "organization" ? proposal.proponent.value.legalName : ""}</td>
                      <td style={cell}>Code With Us</td>
                      <td style={cell}>{proposal.createdBy?.name ?? ""}</td>
                      <td style={cell}>
                        <ProposalStatusBadge status={proposal.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}
