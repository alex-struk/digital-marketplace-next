import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-twu-export-one · anonymous — the opportunity's author opens the printable copy while the proposal is still
// under review on its resource questions, so the proponent is named only as "Proponent 1" and the organization is
// withheld. Once the proposal reaches the challenge the staff copy names the organization (R-2.5, R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-export-one/anonymous" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

export const Anonymous: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={row}>
        <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311">
          Back to the proposal
        </Link>
        <Button variant="secondary">Print</Button>
      </div>
      <article aria-labelledby="export-title" style={stack} data-testid="proposal-export-document">
        <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
        <Heading level={1} id="export-title">Data platform team</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Proponent</dt>
            <dd style={detail} data-testid="proposal-proponent-name">Proponent 1</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Status</dt>
            <dd style={detail}>Under review: resource questions</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Proposal ID</dt>
            <dd style={detail}>3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
          </div>
        </dl>
        <Text elementType="p">The proponent's name is withheld from evaluators until the proposal reaches the challenge.</Text>
        <Text elementType="p" size="small" color="secondary">
          The Team, Resource questions and Attachments sections follow as in the default story, with the organization
          withheld. They are trimmed here.
        </Text>
      </article>
    </div>
  ),
};
