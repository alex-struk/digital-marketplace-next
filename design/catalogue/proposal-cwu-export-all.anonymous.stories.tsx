import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-export-all · anonymous — the same document with "Name proponents anonymously" ticked: each proponent is
// named "Proponent 1", "Proponent 2" and so on, and their names and contact details are withheld (R-2.38)
const meta: Meta = { title: "proposals/proposal-cwu-export-all/anonymous" };
export default meta;

const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

const proposals = [
  {
    id: "export-item-1",
    proponent: "Proponent 1",
    status: "Under review",
    submitted: "September 15, 2026",
    text: "I will add a status page to the permit application that shows each stage in plain language.",
  },
  {
    id: "export-item-2",
    proponent: "Proponent 2",
    status: "Under review",
    submitted: "September 14, 2026",
    text: "Our team will rebuild the permit status view as an accessible, plain-language timeline.",
  },
];

export const Anonymous: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Export all Code With Us proposals</Text>
          <Heading level={1}>Build an accessible permit tracker</Heading>
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
                    <dd>{p.status}</dd>
                  </Stack>
                  <Stack gap="small">
                    <dt style={term}>Submitted</dt>
                    <dd>{p.submitted}</dd>
                  </Stack>
                </Stack>
                <Text elementType="p">The proponent's name and contact details are withheld in this document.</Text>
                <Heading level={3}>Proposal</Heading>
                <Text elementType="p">{p.text}</Text>
              </Stack>
            </article>
          ))}
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
