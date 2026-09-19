import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-panel-dashboard · empty — a public sector employee on no evaluation panel. The Evaluations heading stays,
// with a message in place of the table (R-5.19). The wording is the design's own. My opportunities is trimmed.
const meta: Meta = { title: "evaluation/evaluation-panel-dashboard/empty" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

export const Empty: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Dashboard</Heading>
      <div>
        <Link href="/opportunities/create" isButton buttonVariant="primary" data-testid="dashboard-create-opportunity">Create an opportunity</Link>
      </div>
      <nav aria-label="Dashboard sections">
        <ul style={tabs}>
          <li><Link href="#my-opportunities" data-testid="dashboard-show-my-opportunities">My opportunities</Link></li>
          <li><Link href="#evaluations" data-testid="dashboard-show-evaluations">Evaluations</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="dashboard-mine-heading" id="my-opportunities" style={stack}>
        <Heading level={2} id="dashboard-mine-heading">My opportunities</Heading>
        <Text elementType="p" size="small" color="secondary">
          This section is the opportunities domain's, as in its opportunity-dashboard stories, and is trimmed here.
        </Text>
      </section>
      <section aria-labelledby="dashboard-evaluations-heading" id="evaluations" style={stack}>
        <Heading level={2} id="dashboard-evaluations-heading">Evaluations</Heading>
        <Text elementType="p">Opportunities whose evaluation panel you sit on, including drafts that are not yet public.</Text>
        <div data-testid="dashboard-empty-panel-message">
          <Text elementType="p">
            You are not on the evaluation panel of any opportunity. When an opportunity's owner adds you to its panel, it is
            listed here.
          </Text>
        </div>
      </section>
    </div>
  ),
};
