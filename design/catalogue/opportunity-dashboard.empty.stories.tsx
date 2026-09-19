import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-dashboard · empty — a public sector employee who has created nothing yet; the wording is not set by any criterion
const meta: Meta = { title: "opportunities/opportunity-dashboard/empty" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;

export const Empty: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <div>
        <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">Create an opportunity</Link>
      </div>
      <section aria-labelledby="dashboard-mine-heading" style={stack}>
        <Heading level={2} id="dashboard-mine-heading">My opportunities</Heading>
        <Text elementType="p" data-testid="dashboard-empty-message">You have not created any opportunities yet.</Text>
      </section>
    </div>
  ),
};
