import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import type { Account } from "../api/accounts";
import { CwuOpportunity, listCwuOpportunities } from "../api/opportunities";
import { page, stack } from "../app/layout";
import { Loading } from "../app/loading";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { readDate } from "../lib/dates";
import { StatusBadge } from "./opportunity-parts";

/**
 * The dashboard, where a returning person lands after signing in (R-4.22).
 *
 * A member of public sector staff sees the opportunities they created, and an administrator every
 * opportunity with who created it (opportunity-dashboard; R-1.3). Each row names the opportunity,
 * links to its manage page, and shows its state. Only Code With Us opportunities exist so far; the
 * other programs' rows arrive with the slices that make them. What a vendor or an evaluation panel
 * member sees here belongs to the slices that make proposals and evaluations.
 */
export function DashboardScreen() {
  useScreenTitle("Dashboard");
  return (
    <RequireSignIn title="Dashboard">
      {(account) =>
        account.type === "VENDOR" ? (
          <div style={page}>
            <Heading level={1}>Dashboard</Heading>
            <Text elementType="p">{`You are signed in as ${account.name}.`}</Text>
          </div>
        ) : (
          <OpportunityDashboard account={account} />
        )
      }
    </RequireSignIn>
  );
}

type Listed =
  | { readonly kind: "loading" }
  | { readonly kind: "listed"; readonly opportunities: readonly CwuOpportunity[] }
  | { readonly kind: "failed" };

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

/** Which of the listed opportunities the dashboard shows: an administrator all, anyone else their own. */
export function dashboardRows(account: Pick<Account, "id" | "type">, all: readonly CwuOpportunity[]): CwuOpportunity[] {
  const shown = account.type === "ADMIN" ? [...all] : all.filter((opportunity) => opportunity.createdBy?.id === account.id);
  return shown.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function OpportunityDashboard({ account }: { account: Account }) {
  const [listed, setListed] = useState<Listed>({ kind: "loading" });
  const administrator = account.type === "ADMIN";

  useEffect(() => {
    let current = true;
    void listCwuOpportunities().then((answer) => {
      if (current) setListed(answer.kind === "listed" ? { kind: "listed", opportunities: answer.opportunities } : { kind: "failed" });
    });
    return () => {
      current = false;
    };
  }, []);

  if (listed.kind === "loading") {
    return (
      <div style={page}>
        <Heading level={1}>Dashboard</Heading>
        <Loading label="Loading your opportunities…" />
      </div>
    );
  }

  const rows = listed.kind === "listed" ? dashboardRows(account, listed.opportunities) : [];
  return (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <div>
        <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">
          Create an opportunity
        </Link>
      </div>
      <section aria-labelledby="dashboard-mine-heading" style={stack}>
        <Heading level={2} id="dashboard-mine-heading">
          {administrator ? "All opportunities" : "My opportunities"}
        </Heading>
        {listed.kind === "failed" ? (
          <TitledAlert variant="danger" role="alert" title="Your opportunities could not be loaded">
            <Text elementType="p">Reload the page to try again.</Text>
          </TitledAlert>
        ) : rows.length === 0 ? (
          <Text elementType="p" data-testid="dashboard-empty-message">
            {administrator ? "There are no opportunities yet." : "You have not created any opportunities yet."}
          </Text>
        ) : (
          <div role="region" aria-labelledby="dashboard-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-opportunities-table">
              <caption id="dashboard-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">
                  {administrator ? "Every opportunity in the service, whoever created it" : "Opportunities you created"}
                </Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>Title</th>
                  <th scope="col" style={cell}>Program</th>
                  <th scope="col" style={cell}>Status</th>
                  <th scope="col" style={cell}>Last updated</th>
                  {administrator ? <th scope="col" style={cell}>Created by</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((opportunity) => (
                  <tr key={opportunity.id} data-testid="dashboard-opportunity-row">
                    <td style={cell}>
                      <Link href={`/opportunities/code-with-us/${opportunity.id}/edit`} data-testid="dashboard-opportunity-link">
                        {opportunity.title || "Untitled opportunity"}
                      </Link>
                    </td>
                    <td style={cell}>Code With Us</td>
                    <td style={cell}>
                      <StatusBadge status={opportunity.status} />
                    </td>
                    <td style={cell}>{readDate(opportunity.updatedAt)?.label ?? ""}</td>
                    {administrator ? <td style={cell}>{opportunity.createdBy?.name ?? ""}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
