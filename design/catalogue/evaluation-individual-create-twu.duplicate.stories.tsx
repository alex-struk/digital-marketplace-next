import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-individual-create-twu · duplicate — the evaluator already holds an evaluation of this proponent, and the
// service refuses a second in its own words, with "resource question" in place of "team question" (R-5.3)
const meta: Meta = { title: "evaluation/evaluation-individual-create-twu/duplicate" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const Duplicate: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Evaluate a Team With Us proponent</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 2</span></Heading>
      <div tabIndex={-1} data-testid="evaluation-duplicate-error">
        <InlineAlert
          variant="danger"
          role="alert"
          title="This evaluation was not started"
          description="You already have a resource question evaluation for this proposal."
        />
      </div>
      <div>
        <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3b8d6f20-1a2b-4c3d-8e9f-000000000622/resource-questions/evaluations/5e0f7a10-2c3d-4e5f-8a9b-000000000402/edit">
          Go to your evaluation of Proponent 2
        </Link>
      </div>
      <Text elementType="p" size="small" color="secondary">The form below is as in the default story and is trimmed here.</Text>
    </div>
  ),
};
