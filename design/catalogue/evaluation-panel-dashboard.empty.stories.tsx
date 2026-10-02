import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-panel-dashboard · empty — a public sector employee on no evaluation panel. The Evaluations heading stays,
// with a message in place of the table (R-5.19). The wording is the design's own. My opportunities is trimmed.
const meta: Meta = { title: "evaluation/evaluation-panel-dashboard/empty" };
export default meta;

export const Empty: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <div>
          <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">Create an opportunity</Link>
        </div>
        <nav aria-label="Dashboard sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="#my-opportunities" data-testid="dashboard-show-my-opportunities">My opportunities</Link></li>
            <li><Link href="#evaluations" data-testid="dashboard-show-evaluations">Evaluations</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="dashboard-mine-heading" id="my-opportunities">
          <Heading level={2} id="dashboard-mine-heading">My opportunities</Heading>
          <Text elementType="p" size="small" color="secondary">
            This section is the opportunities domain's, as in its opportunity-dashboard stories, and is trimmed here.
          </Text>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="dashboard-evaluations-heading" id="evaluations">
          <Heading level={2} id="dashboard-evaluations-heading">Evaluations</Heading>
          <Text elementType="p">Opportunities whose evaluation panel you sit on, including drafts that are not yet public.</Text>
          <div data-testid="dashboard-empty-panel-message">
            <Text elementType="p">
              You are not on the evaluation panel of any opportunity. When an opportunity's owner adds you to its panel, it is
              listed here.
            </Text>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
