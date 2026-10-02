import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-dashboard · empty — a public sector employee who has created nothing yet; the wording is not set by any criterion
const meta: Meta = { title: "opportunities/opportunity-dashboard/empty" };
export default meta;

export const Empty: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <div>
          <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">Create an opportunity</Link>
        </div>
        <Stack as="section" gap="medium" aria-labelledby="dashboard-mine-heading">
          <Heading level={2} id="dashboard-mine-heading">My opportunities</Heading>
          <Text elementType="p" data-testid="dashboard-empty-message">You have not created any opportunities yet.</Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
