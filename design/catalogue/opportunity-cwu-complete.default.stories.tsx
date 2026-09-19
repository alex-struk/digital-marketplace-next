import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// opportunity-cwu-complete · default — an administrator reads the opportunity, its addenda, its history and every
// proposal as one continuous document (R-1.40)
const meta: Meta = { title: "opportunities/opportunity-cwu-complete/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tight = { display: "grid", gap: "var(--layout-margin-small)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

const proposals = [
  { id: "p1", proponent: "Example Digital Co-operative", status: "Awarded", score: "91.50%" },
  { id: "p2", proponent: "Test Vendor One", status: "Not awarded", score: "84.25%" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us opportunity report</Text>
      <Heading level={1} id="report-title">Build an accessible permit tracker</Heading>
      <article aria-labelledby="report-title" style={stack} data-testid="opportunity-full-report">
        <section aria-labelledby="report-opportunity" style={stack}>
          <Heading level={2} id="report-opportunity">Opportunity</Heading>
          <dl style={facts}>
            <div style={fact}>
              <dt style={term}>Status</dt>
              <dd style={detail}><span style={badge}>Awarded</span></dd>
            </div>
            <div style={fact}>
              <dt style={term}>Reward</dt>
              <dd style={detail}>$45,000</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Proposal deadline</dt>
              <dd style={detail}>October 2, 2026 at 4:00 p.m. Pacific time</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Published</dt>
              <dd style={detail}>September 10, 2026</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Created by</dt>
              <dd style={detail}>Test Public Servant</dd>
            </div>
          </dl>
          <Text elementType="p">
            The ministry runs an online permit application that tells applicants little about where their application
            stands. This opportunity adds a status page that works with a keyboard and a screen reader.
          </Text>
        </section>
        <section aria-labelledby="report-addenda" style={stack}>
          <Heading level={2} id="report-addenda">Addenda</Heading>
          <Text elementType="p">September 20, 2026: The kick-off meeting will be held by video, not in person.</Text>
        </section>
        <section aria-labelledby="report-history" style={stack}>
          <Heading level={2} id="report-history">History</Heading>
          <ul>
            <li>October 30, 2026: Awarded, by Test Administrator</li>
            <li>October 21, 2026: Processing. Moved automatically because all proposals have been evaluated.</li>
            <li>October 2, 2026: Evaluation. This opportunity has closed.</li>
            <li>September 10, 2026: Published, by Test Administrator</li>
          </ul>
        </section>
        <section aria-labelledby="report-proposals" style={stack}>
          <Heading level={2} id="report-proposals">Proposals</Heading>
          {proposals.map((p) => (
            <article key={p.id} aria-labelledby={`report-${p.id}`} style={tight}>
              <Heading level={3} id={`report-${p.id}`}>{p.proponent}</Heading>
              <Text elementType="p">Status: {p.status}. Score: {p.score}.</Text>
              <Text elementType="p">[The proposal as submitted, in full.]</Text>
            </article>
          ))}
        </section>
      </article>
    </div>
  ),
};
