import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-export-all · default — public sector staff or an administrator takes away every submitted proposal of a
// closed opportunity in one document, with the proponents named. Drafts are never included (R-2.25, R-2.38)
const meta: Meta = { title: "proposals/proposal-cwu-export-all/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

const proposals = [
  {
    id: "export-item-1",
    proponent: "Test Vendor",
    status: "Under review",
    submitted: "September 15, 2026",
    text: "I will add a status page to the permit application that shows each stage in plain language.",
  },
  {
    id: "export-item-2",
    proponent: "Example Digital Ltd.",
    status: "Under review",
    submitted: "September 14, 2026",
    text: "Our team will rebuild the permit status view as an accessible, plain-language timeline.",
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Export all Code With Us proposals</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <Text elementType="p">Every submitted proposal you are entitled to see, in one document. Drafts are never included.</Text>
      <div style={row}>
        <Checkbox data-testid="proposal-export-anonymous-toggle">Name proponents anonymously</Checkbox>
        <Button variant="secondary">Print</Button>
      </div>
      <div style={stack} data-testid="proposal-export-document">
        {proposals.map((p) => (
          <article key={p.id} aria-labelledby={p.id} style={panel} data-testid="proposal-export-item">
            <Heading level={2} id={p.id}><span data-testid="proposal-proponent-name">{p.proponent}</span></Heading>
            <dl style={facts}>
              <div style={fact}>
                <dt style={term}>Status</dt>
                <dd style={detail}>{p.status}</dd>
              </div>
              <div style={fact}>
                <dt style={term}>Submitted</dt>
                <dd style={detail}>{p.submitted}</dd>
              </div>
            </dl>
            <Heading level={3}>Proposal</Heading>
            <Text elementType="p">{p.text}</Text>
            <Text elementType="p" size="small" color="secondary">
              The proponent's details, additional comments and attachments follow, as in proposal-cwu-export-one. They are
              trimmed here.
            </Text>
          </article>
        ))}
      </div>
    </div>
  ),
};
