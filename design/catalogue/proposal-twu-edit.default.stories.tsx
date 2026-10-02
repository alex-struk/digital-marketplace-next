import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-edit · default — the vendor's own submitted proposal, before the deadline. They may edit it or withdraw
// it. There is no Scoresheet tab and no score or rank until the opportunity is awarded or the proposal is passed over
// (R-2.20, R-2.23, R-2.24, R-2.30, R-2.32, R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-edit/default" };
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
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us proposal</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Submitted</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Submitted</dt>
            <dd data-testid="proposal-submitted-at">September 15, 2026 at 2:12 p.m.</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Opportunity ID</dt>
            <dd data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal deadline</dt>
            <dd>October 2, 2026 at 4:00 p.m. Pacific time</dd>
          </Stack>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301">View the opportunity</Link>
          <Link href={`${base}/export`} data-testid="proposal-export-link">Printable copy</Link>
        </Stack>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="secondary" data-testid="proposal-edit-button">Edit</Button>
            <Button variant="secondary" danger data-testid="proposal-withdraw-button">Withdraw</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}/edit?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}/edit?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Proposal</Heading>
          <Stack as="section" gap="medium" aria-labelledby="tab-organization">
            <Heading level={3} id="tab-organization">Organization</Heading>
            <Text elementType="p">Example Digital Ltd.</Text>
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
            <Text elementType="p">Estimated cost over the contract: $412,500 of the $900,000 maximum budget.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-questions">
            <Heading level={3} id="tab-questions">Resource questions</Heading>
            <Stack as="ol" gap="medium">
              <li>
                <Stack gap="small">
                  <Text elementType="p">Describe your experience building data pipelines for health data.</Text>
                  <Text elementType="p">
                    Response: Our team has built and run the ingestion pipelines for two provincial registries, with privacy reviews
                    at each release.
                  </Text>
                </Stack>
              </li>
            </Stack>
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
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
