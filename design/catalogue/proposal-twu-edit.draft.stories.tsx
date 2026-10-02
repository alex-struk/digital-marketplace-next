import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-edit · draft — the vendor's draft. It may be edited, submitted or deleted, and it has no submitted time.
// Only a draft offers Delete (R-2.4, R-2.12)
const meta: Meta = { title: "proposals/proposal-twu-edit/draft" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311";

export const Draft: StoryObj = {
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
            <dd><span style={badge} data-testid="proposal-status">Draft</span></dd>
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
            <Button variant="primary" data-testid="proposal-submit">Submit proposal</Button>
            <Button variant="secondary" danger data-testid="proposal-delete-button">Delete</Button>
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
          <Text elementType="p" size="small" color="secondary">
            The proposal is shown as in the default story, with any blank field shown as "Not entered yet". It is trimmed here.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
