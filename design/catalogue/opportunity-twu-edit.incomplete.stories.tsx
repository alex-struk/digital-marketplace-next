import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-twu-edit · incomplete — the author submitted an incomplete draft for review and is told it is
// incomplete, not which field is missing (R-1.21)
const meta: Meta = { title: "opportunities/opportunity-twu-edit/incomplete" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit";

export const Incomplete: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Draft</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
          </Text>
        </Stack>
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
          <Button variant="primary" data-testid="opportunity-submit-for-review">Submit for review</Button>
          <Button variant="secondary" danger data-testid="opportunity-delete-button">Delete</Button>
        </ButtonGroup>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=summary`} aria-current="page" data-testid="opportunity-tab-summary">Summary</Link></li>
            <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
            <li><Link href={`${base}?tab=evaluationPanel`} data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
          </Stack>
        </nav>
        <div tabIndex={-1} data-testid="opportunity-incomplete-message">
          <InlineAlert
            variant="danger"
            title="This opportunity is incomplete"
            description="It could not be submitted for review. Edit the opportunity, complete and save the form, and then submit it again."
            role="alert"
          />
        </div>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Summary</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Proposal deadline</dt>
              <dd>October 2, 2026 at 4:00 p.m. Pacific time</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Maximum budget</dt>
              <dd>Not entered</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Published</dt>
              <dd>Not yet published</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Created by</dt>
              <dd data-testid="opportunity-created-by">Test Public Servant</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Last changed by</dt>
              <dd data-testid="opportunity-last-changed-by">Test Public Servant</dd>
            </Stack>
          </Stack>
          <Text elementType="p" size="small" color="secondary">
            Views, watchers and proposals are counted once the opportunity is published.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
