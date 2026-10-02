import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-view · default — the opportunity's author, after closing, while the resource questions are under review.
// The proponent is shown only by its anonymous name, and every stage score is still to come. Disqualify is offered at
// every stage (R-2.5, R-2.25, R-2.34, R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-view/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311";

const team = [
  { resource: "Full stack developer, 100% of full time", member: "Test Developer One", rate: "$150.00" },
  { resource: "Data professional, 50% of full time", member: "Test Developer Two", rate: "$140.00" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 1</span></Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Opportunity</dt>
            <dd><Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit">Data platform team</Link></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Under review: resource questions</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Submitted</dt>
            <dd>September 15, 2026 at 2:12 p.m.</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">Scores</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Resource questions</dt>
              <dd data-testid="proposal-questions-score">Not yet scored</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Challenge</dt>
              <dd data-testid="proposal-challenge-score">Not yet scored</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Price</dt>
              <dd data-testid="proposal-price-score">Not yet calculated</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Total</dt>
              <dd data-testid="proposal-total-score">Not yet calculated</dd>
            </Stack>
          </Stack>
        </Stack>
        <div>
          <Link href={`${base}/export`} data-testid="proposal-export-link">Printable copy</Link>
        </div>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}?tab=resourceQuestions`} data-testid="proposal-tab-resource-questions">Resource questions</Link></li>
            <li><Link href={`${base}?tab=challenge`} data-testid="proposal-tab-challenge">Challenge</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Proposal</Heading>
          <Stack as="section" gap="medium" aria-labelledby="tab-organization">
            <Heading level={3} id="tab-organization">Organization</Heading>
            <Text elementType="p">Withheld from evaluators until the proposal reaches the challenge.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-team">
            <Heading level={3} id="tab-team">Team</Heading>
            <div role="region" aria-labelledby="team-caption" tabIndex={0} style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <caption id="team-caption" style={{ textAlign: "start" }}>
                  <Text size="small" color="secondary">Team members, by the resource each is named against</Text>
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={cell}>Resource</th>
                    <th scope="col" style={cell}>Team member</th>
                    <th scope="col" style={cell}>Hourly rate</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((t) => (
                    <tr key={t.member}>
                      <td style={cell}>{t.resource}</td>
                      <td style={cell}>{t.member}</td>
                      <td style={cell}>{t.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Text elementType="p">Bid: $220.00 an hour, each rate weighted by its resource's target allocation.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-attachments">
            <Heading level={3} id="tab-attachments">Attachments</Heading>
            <ul>
              <li>
                <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000921?type=blob" data-testid="attachment-download-link">
                  Download Team profiles.pdf
                </Link>
              </li>
            </ul>
          </Stack>
          <Text elementType="p" size="small" color="secondary">
            The responses to the resource questions are on the Resource questions tab.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
