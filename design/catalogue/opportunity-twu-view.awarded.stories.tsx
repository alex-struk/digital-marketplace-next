import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-twu-view · awarded — an awarded opportunity names its successful proponent to everyone; their contact
// details and score are withheld from anyone who may not see the proposal's score (R-1.26, R-1.27, R-1.49)
const meta: Meta = { title: "opportunities/opportunity-twu-view/awarded" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const Awarded: StoryObj = {
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
            <dd><span style={badge} data-testid="opportunity-status">Awarded</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal deadline</dt>
            <dd data-testid="opportunity-proposal-deadline">September 11, 2026 at 4:00 p.m. Pacific time</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Maximum budget</dt>
            <dd data-testid="opportunity-max-budget">$900,000</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Published</dt>
            <dd data-testid="opportunity-published-date">August 14, 2026</dd>
          </Stack>
        </Stack>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
        </Text>
        <Stack as="section" gap="medium" aria-labelledby="view-award">
          <Heading level={2} id="view-award">Successful proponent</Heading>
          <Text elementType="p" data-testid="opportunity-successful-proponent">Example Digital Co-operative</Text>
        </Stack>
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Watching sends you an email whenever this opportunity changes.</Text>
          <Checkbox defaultSelected data-testid="opportunity-watch-toggle">Watch this opportunity</Checkbox>
          <div role="status" />
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
            <Heading level={3} id="addendum-1">Addendum of August 25, 2026</Heading>
            <Text elementType="p">Interviews for the challenge will be held by video.</Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
