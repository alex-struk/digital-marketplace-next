import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-twu-view · author — its author, who (with administrators) alone sees who created and last changed it,
// and who is not offered Watch on their own opportunity (R-1.5, R-1.29)
const meta: Meta = { title: "opportunities/opportunity-twu-view/author" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const Author: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Team With Us opportunity</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Text elementType="p" size="large">Add two specialists to the ministry's data platform team for a year.</Text>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="opportunity-status">Published</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal deadline</dt>
            <dd data-testid="opportunity-proposal-deadline">October 2, 2026 at 4:00 p.m. Pacific time</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Maximum budget</dt>
            <dd data-testid="opportunity-max-budget">$900,000</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Location</dt>
            <dd>Victoria</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Published</dt>
            <dd data-testid="opportunity-published-date">September 10, 2026</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Created by</dt>
            <dd data-testid="opportunity-created-by">Test Public Servant</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Last changed by</dt>
            <dd data-testid="opportunity-last-changed-by">Test Administrator</dd>
          </Stack>
        </Stack>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
        </Text>
        <div>
          <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit" isButton buttonVariant="secondary">
            Manage this opportunity
          </Link>
        </div>
        <Stack as="section" gap="medium" aria-labelledby="view-description">
          <Heading level={2} id="view-description">Description</Heading>
          <Text elementType="p">
            The data platform team publishes open data for the ministry. Two specialists will join it for a year to move
            its pipelines to the new platform.
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="view-resources" data-testid="opportunity-resources">
          <Heading level={2} id="view-resources">Resources</Heading>
          <ul>
            <li>Full stack developer: 100% of full time</li>
            <li>Data professional: 50% of full time</li>
          </ul>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="view-addenda" data-testid="opportunity-addenda">
          <Heading level={2} id="view-addenda">Addenda</Heading>
          <Stack as="article" gap="small" aria-labelledby="addendum-1">
            <Heading level={3} id="addendum-1">Addendum of September 20, 2026</Heading>
            <Text elementType="p">Interviews for the challenge will be held by video.</Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
