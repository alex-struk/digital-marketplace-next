import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import type { Account } from "../api/accounts";
import { PROGRAM_NAMES } from "@rules/opportunities";
import { panelRoleLabel } from "@rules/other-program-content";
import { ListedOpportunity, listAllOpportunities } from "../api/opportunity-list";
import { Loading } from "../app/loading";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { readDate } from "../lib/dates";
import { StatusBadge } from "./opportunity-parts";
import { VendorDashboard } from "./vendor-dashboard";

/**
 * The dashboard, where a returning person lands after signing in (R-4.22), and where the
 * profile-completion page sends a vendor who has agreed to the terms before and every public
 * sector employee (R-4.23).
 *
 * A member of public sector staff sees the opportunities they created, and an administrator every
 * opportunity with who created it (opportunity-dashboard; R-1.3). Each row names the opportunity,
 * links to its manage page, and shows its state, in all three programs. A vendor sees their own
 * proposals and their organizations' (proposal-vendor-dashboard; R-2.24). Below their own, public
 * sector staff and administrators see the opportunities whose evaluation panel they sit on
 * (evaluation-panel-dashboard; R-5.19).
 */
export function DashboardScreen() {
  useScreenTitle("Dashboard");
  return (
    <RequireSignIn title="Dashboard">
      {(account) => (account.type === "VENDOR" ? <VendorDashboard account={account} /> : <OpportunityDashboard account={account} />)}
    </RequireSignIn>
  );
}

type Listed =
  | { readonly kind: "loading" }
  | { readonly kind: "listed"; readonly opportunities: readonly ListedOpportunity[] }
  | { readonly kind: "failed" };

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

/** Which of the listed opportunities the dashboard shows: an administrator all, anyone else their own. */
export function dashboardRows(account: Pick<Account, "id" | "type">, all: readonly ListedOpportunity[]): ListedOpportunity[] {
  const shown = account.type === "ADMIN" ? [...all] : all.filter((opportunity) => opportunity.createdBy?.id === account.id);
  return shown.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** The opportunities whose evaluation panel the person sits on, each with their role on it (R-5.19). */
export function panelRows(account: Pick<Account, "id">, all: readonly ListedOpportunity[]): { opportunity: ListedOpportunity; role: string }[] {
  return all
    .flatMap((opportunity) => {
      const seat = opportunity.evaluationPanel?.find((member) => member.user.id === account.id);
      return seat ? [{ opportunity, role: panelRoleLabel(seat) }] : [];
    })
    .sort((a, b) => b.opportunity.updatedAt.localeCompare(a.opportunity.updatedAt));
}

function OpportunityDashboard({ account }: { account: Account }) {
  const [listed, setListed] = useState<Listed>({ kind: "loading" });
  const administrator = account.type === "ADMIN";

  useEffect(() => {
    let current = true;
    void listAllOpportunities().then((answer) => {
      if (current) setListed(answer.kind === "listed" ? { kind: "listed", opportunities: answer.opportunities } : { kind: "failed" });
    });
    return () => {
      current = false;
    };
  }, []);

  if (listed.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <Loading label="Loading your opportunities…" />
      </Stack>
    );
  }

  const rows = listed.kind === "listed" ? dashboardRows(account, listed.opportunities) : [];
  const seats = listed.kind === "listed" ? panelRows(account, listed.opportunities) : [];
  return (
    <Stack gap="large">
      <Heading level={1}>Dashboard</Heading>
      <div>
        <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">
          Create an opportunity
        </Link>
      </div>
      <nav aria-label="Dashboard sections">
        <Stack as="ul" direction="row" gap="medium">
          <li>
            <Link href="#my-opportunities" data-testid="dashboard-show-my-opportunities">
              {administrator ? "All opportunities" : "My opportunities"}
            </Link>
          </li>
          <li>
            <Link href="#evaluations" data-testid="dashboard-show-evaluations">
              Evaluations
            </Link>
          </li>
        </Stack>
      </nav>
      <Stack as="section" gap="medium" aria-labelledby="dashboard-mine-heading" id="my-opportunities">
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
                  <tr key={`${opportunity.program}-${opportunity.id}`} data-testid="dashboard-opportunity-row">
                    <td style={cell}>
                      <Link
                        href={`/opportunities/${opportunity.program}/${opportunity.id}/edit`}
                        data-testid="dashboard-opportunity-link"
                      >
                        {opportunity.title || "Untitled opportunity"}
                      </Link>
                    </td>
                    <td style={cell}>{PROGRAM_NAMES[opportunity.program]}</td>
                    <td style={cell}>
                      <StatusBadge status={opportunity.status} program={opportunity.program} />
                    </td>
                    <td style={cell}>{readDate(opportunity.updatedAt)?.label ?? ""}</td>
                    {administrator ? <td style={cell}>{opportunity.createdBy?.name ?? ""}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Stack>
      <EvaluationsSection seats={seats} failed={listed.kind === "failed"} />
    </Stack>
  );
}

/**
 * The opportunities whose panel the person sits on, under their own heading, a draft included, each
 * opening its manage page (evaluation-panel-dashboard; R-5.19).
 */
function EvaluationsSection({ seats, failed }: { seats: readonly { opportunity: ListedOpportunity; role: string }[]; failed: boolean }) {
  return (
    <Stack as="section" gap="medium" aria-labelledby="dashboard-evaluations-heading" id="evaluations">
      <Heading level={2} id="dashboard-evaluations-heading">
        Evaluations
      </Heading>
      <Text elementType="p">Opportunities whose evaluation panel you sit on, including drafts that are not yet public.</Text>
      {failed ? null : seats.length === 0 ? (
        <div data-testid="dashboard-empty-panel-message">
          <Text elementType="p">
            You are not on the evaluation panel of any opportunity. When an opportunity's owner adds you to its panel, it is listed here.
          </Text>
        </div>
      ) : (
        <div role="region" aria-labelledby="dashboard-panel-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="dashboard-panel-opportunities-table">
            <caption id="dashboard-panel-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">
                Opportunities you are evaluating
              </Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Title</th>
                <th scope="col" style={cell}>Program</th>
                <th scope="col" style={cell}>Your role</th>
                <th scope="col" style={cell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {seats.map(({ opportunity, role }) => (
                <tr key={`${opportunity.program}-${opportunity.id}`} data-testid="dashboard-panel-opportunity-row">
                  <td style={cell}>
                    <Link href={`/opportunities/${opportunity.program}/${opportunity.id}/edit`} data-testid="dashboard-opportunity-link">
                      {opportunity.title || "Untitled opportunity"}
                    </Link>
                  </td>
                  <td style={cell}>{PROGRAM_NAMES[opportunity.program]}</td>
                  <td style={cell}>{role}</td>
                  <td style={cell}>
                    <StatusBadge status={opportunity.status} program={opportunity.program} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  );
}
