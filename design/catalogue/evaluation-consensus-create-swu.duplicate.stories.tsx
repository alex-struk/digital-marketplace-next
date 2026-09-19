import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-create-swu · duplicate — the chair already recorded a consensus for this proponent and the service
// refuses a second (R-5.29). No wording is given in the spec; this follows R-5.3's (gap 9)
const meta: Meta = { title: "evaluation/evaluation-consensus-create-swu/duplicate" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const Duplicate: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Agree a Sprint With Us consensus</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 3</span></Heading>
      <div tabIndex={-1} data-testid="evaluation-duplicate-consensus-error">
        <InlineAlert
          variant="danger"
          role="alert"
          title="This consensus was not started"
          description="You already have a team question consensus for this proposal."
        />
      </div>
      <div>
        <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3b8d6f20-1a2b-4c3d-8e9f-000000000613/team-questions/consensus/5e0f7a10-2c3d-4e5f-8a9b-000000000402/edit">
          Go to the consensus for Proponent 3
        </Link>
      </div>
      <Text elementType="p" size="small" color="secondary">The form below is as in the default story and is trimmed here.</Text>
    </div>
  ),
};
