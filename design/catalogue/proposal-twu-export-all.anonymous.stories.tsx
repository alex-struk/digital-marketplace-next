import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-export-all · anonymous — the same document with "Name proponents anonymously" ticked: each proponent is
// named by its anonymous name and the organization is withheld (R-2.5, R-2.38)
const meta: Meta = { title: "proposals/proposal-twu-export-all/anonymous" };
export default meta;

const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

const proposals = [
  { id: "export-item-1", proponent: "Proponent 1", submitted: "September 15, 2026", bid: "$220.00 an hour" },
  { id: "export-item-2", proponent: "Proponent 2", submitted: "September 14, 2026", bid: "$235.00 an hour" },
];

export const Anonymous: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Export all Team With Us proposals</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Text elementType="p">Every submitted proposal you are entitled to see, in one document. Drafts are never included.</Text>
        <Stack direction="row" align="center" gap="medium">
          <Checkbox defaultSelected data-testid="proposal-export-anonymous-toggle">Name proponents anonymously</Checkbox>
          <Button variant="secondary">Print</Button>
        </Stack>
        <Stack gap="medium" data-testid="proposal-export-document">
          {proposals.map((p) => (
            <article key={p.id} aria-labelledby={p.id} style={panel} data-testid="proposal-export-item">
              <Stack gap="medium">
                <Heading level={2} id={p.id}><span data-testid="proposal-proponent-name">{p.proponent}</span></Heading>
                <Stack as="dl" direction="row" gap="medium">
                  <Stack gap="small">
                    <dt style={term}>Status</dt>
                    <dd>Under review: resource questions</dd>
                  </Stack>
                  <Stack gap="small">
                    <dt style={term}>Submitted</dt>
                    <dd>{p.submitted}</dd>
                  </Stack>
                  <Stack gap="small">
                    <dt style={term}>Bid</dt>
                    <dd>{p.bid}</dd>
                  </Stack>
                </Stack>
                <Text elementType="p">The organization is withheld in this document.</Text>
              </Stack>
            </article>
          ))}
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
