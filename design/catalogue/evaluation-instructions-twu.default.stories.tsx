import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-instructions-twu · default — an evaluator reads the Team With Us evaluation instructions, which are site
// content an administrator edits. Only an evaluator is offered this tab and the Evaluation tab (R-5.34)
const meta: Meta = { title: "evaluation/evaluation-instructions-twu/default" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit";

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Resource questions: individual evaluation</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
          </Text>
        </Stack>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=instructions`} aria-current="page" data-testid="opportunity-tab-instructions">Instructions</Link></li>
            <li><Link href={`${base}?tab=evaluation`} data-testid="opportunity-tab-evaluation">Evaluation</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Instructions</Heading>
          <Text elementType="p" size="small" color="secondary">
            Illustrative text. The instructions are the Team With Us evaluation instructions page of the site's content, which an
            administrator maintains. The spec does not carry their wording.
          </Text>
          <Stack gap="medium" data-testid="evaluation-instructions-body">
            <Heading level={3}>Scoring on your own</Heading>
            <Text elementType="p">
              Score each proponent's response to each resource question on your own, without discussing it with the rest of the
              panel. Nobody else on the panel sees your scores until the consensus stage.
            </Text>
            <Heading level={3}>Scores and comments</Heading>
            <Text elementType="p">
              Give each question a score between 0 and its maximum, with up to two decimal places, and a comment that explains it.
            </Text>
            <Heading level={3}>Submitting</Heading>
            <Text elementType="p">
              When every proponent has a complete evaluation, submit your scores for consensus from the Evaluation tab. Submitted
              scores cannot be changed.
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
