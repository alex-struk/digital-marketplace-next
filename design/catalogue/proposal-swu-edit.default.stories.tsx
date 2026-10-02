import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-edit · default — the vendor's own submitted proposal, before the deadline. They may edit it or withdraw
// it. There is no Scoresheet tab and no score or rank until the opportunity is awarded or the proposal is passed over
// (R-2.18, R-2.23, R-2.24, R-2.32, R-2.37)
const meta: Meta = { title: "proposals/proposal-swu-edit/default" };
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

const phases = [
  {
    name: "Prototype phase",
    cost: "$300,000",
    team: [
      { member: "Test Vendor", scrum: "Yes", membership: "Active", capabilities: "Agile coaching, User research" },
      { member: "Test Developer One", scrum: "No", membership: "Active", capabilities: "Frontend development, Backend development" },
    ],
  },
  {
    name: "Implementation phase",
    cost: "$850,000",
    team: [
      { member: "Test Vendor", scrum: "Yes", membership: "Active", capabilities: "Agile coaching" },
      { member: "Test Developer One", scrum: "No", membership: "Active", capabilities: "Frontend development, Backend development" },
      { member: "Test Designer", scrum: "No", membership: "Active", capabilities: "User research, Security engineering" },
    ],
  },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us proposal</Text>
          <Heading level={1}>Modernize the licence renewal service</Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Submitted</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Submitted</dt>
            <dd data-testid="proposal-submitted-at">October 10, 2026 at 2:12 p.m.</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000211</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Opportunity ID</dt>
            <dd data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal deadline</dt>
            <dd>October 16, 2026 at 4:00 p.m. Pacific time</dd>
          </Stack>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201">View the opportunity</Link>
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
            {phases.map((phase, i) => (
              <Stack key={phase.name} gap="medium">
                <div role="region" aria-labelledby={`team-caption-${i}`} tabIndex={0} style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <caption id={`team-caption-${i}`} style={{ textAlign: "start" }}>
                      <Text size="small" color="secondary">{phase.name} team</Text>
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" style={cell}>Team member</th>
                        <th scope="col" style={cell}>Scrum master</th>
                        <th scope="col" style={cell}>Membership</th>
                        <th scope="col" style={cell}>Capabilities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phase.team.map((t) => (
                        <tr key={t.member}>
                          <td style={cell}>{t.member}</td>
                          <td style={cell}>{t.scrum}</td>
                          <td style={cell}><span style={badge}>{t.membership}</span></td>
                          <td style={cell}>{t.capabilities}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Text elementType="p">{phase.name} proposed cost: {phase.cost}</Text>
              </Stack>
            ))}
            <Text elementType="p">Total proposed cost: $1,150,000 of the $1,200,000 maximum budget.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-questions">
            <Heading level={3} id="tab-questions">Team questions</Heading>
            <Stack as="ol" gap="medium">
              <li>
                <Stack gap="small">
                  <Text elementType="p">Describe how your team would approach user research for the renewal service.</Text>
                  <Text elementType="p">
                    Response: We would start with the renewal staff and the ten most common reasons a renewal is returned, then test
                    each change with applicants who use assistive technology.
                  </Text>
                </Stack>
              </li>
              <li>
                <Stack gap="small">
                  <Text elementType="p">Describe a time your team replaced a legacy system without interrupting service.</Text>
                  <Text elementType="p">
                    Response: We moved a permit service to a new platform in stages, running both side by side for six weeks.
                  </Text>
                </Stack>
              </li>
            </Stack>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-references">
            <Heading level={3} id="tab-references">References</Heading>
            <Text elementType="p">Test Reference One, test.reference@example.com</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-attachments">
            <Heading level={3} id="tab-attachments">Attachments</Heading>
            <ul>
              <li>
                <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000911?type=blob" data-testid="attachment-download-link">
                  Download Delivery approach.pdf
                </Link>
              </li>
            </ul>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
