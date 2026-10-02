import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-cwu-view · author — its author, who (with administrators) alone sees who created and last changed it,
// and who is not offered Watch on their own opportunity (R-1.5, R-1.29)
const meta: Meta = { title: "opportunities/opportunity-cwu-view/author" };
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
          <Text elementType="p" size="small" color="secondary">Code With Us opportunity</Text>
          <Heading level={1}>Build an accessible permit tracker</Heading>
        </Stack>
        <Text elementType="p" size="large">Add plain-language status tracking to the online permit application.</Text>
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
            <dt style={term}>Reward</dt>
            <dd data-testid="opportunity-reward">$45,000</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Location</dt>
            <dd>Victoria</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Remote work</dt>
            <dd>Accepted. Work from anywhere in Canada, with one kick-off meeting by video.</dd>
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
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</span>
        </Text>
        <div>
          <Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit" isButton buttonVariant="secondary">
            Manage this opportunity
          </Link>
        </div>
        <Stack as="section" gap="medium" aria-labelledby="view-description">
          <Heading level={2} id="view-description">Description</Heading>
          <Text elementType="p">
            The ministry runs an online permit application that tells applicants little about where their application
            stands. This opportunity adds a status page that works with a keyboard and a screen reader.
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="view-skills">
          <Heading level={2} id="view-skills">Skills</Heading>
          <ul>
            <li>React</li>
            <li>TypeScript</li>
            <li>Accessibility</li>
          </ul>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="view-dates">
          <Heading level={2} id="view-dates">Key dates</Heading>
          <ul>
            <li>Assignment date: October 9, 2026</li>
            <li>Start date: October 19, 2026</li>
            <li>Completion date: January 29, 2027</li>
          </ul>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="view-addenda" data-testid="opportunity-addenda">
          <Heading level={2} id="view-addenda">Addenda</Heading>
          <Stack as="article" gap="small" aria-labelledby="addendum-1">
            <Heading level={3} id="addendum-1">Addendum of September 20, 2026</Heading>
            <Text elementType="p">The kick-off meeting will be held by video, not in person.</Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
