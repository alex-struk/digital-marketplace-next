import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// opportunity-twu-complete · default — an administrator reads the opportunity, its addenda, its history and every
// proposal as one continuous document (R-1.40); proponents are named because the opportunity has been awarded
const meta: Meta = { title: "opportunities/opportunity-twu-complete/default" };
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
  { id: "p1", proponent: "Example Digital Co-operative", status: "Awarded", score: "86.00%" },
  { id: "p2", proponent: "Sample Software Ltd.", status: "Not awarded", score: "79.75%" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Team With Us opportunity report</Text>
      <Heading level={1} id="report-title">Data platform team</Heading>
      <article aria-labelledby="report-title" style={stack} data-testid="opportunity-full-report">
        <section aria-labelledby="report-opportunity" style={stack}>
          <Heading level={2} id="report-opportunity">Opportunity</Heading>
          <dl style={facts}>
            <div style={fact}>
              <dt style={term}>Status</dt>
              <dd style={detail}><span style={badge}>Awarded</span></dd>
            </div>
            <div style={fact}>
              <dt style={term}>Maximum budget</dt>
              <dd style={detail}>$900,000</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Proposal deadline</dt>
              <dd style={detail}>September 11, 2026 at 4:00 p.m. Pacific time</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Published</dt>
              <dd style={detail}>August 14, 2026</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Created by</dt>
              <dd style={detail}>Test Public Servant</dd>
            </div>
          </dl>
          <Text elementType="p">Resources: full stack developer, 100% of full time; data professional, 50% of full time.</Text>
          <Text elementType="p">Scoring weights: resource questions 30%, challenge 40%, price 30%.</Text>
        </section>
        <section aria-labelledby="report-addenda" style={stack}>
          <Heading level={2} id="report-addenda">Addenda</Heading>
          <Text elementType="p">August 25, 2026: Interviews for the challenge will be held by video.</Text>
        </section>
        <section aria-labelledby="report-history" style={stack}>
          <Heading level={2} id="report-history">History</Heading>
          <ul>
            <li>October 20, 2026: Awarded, by Test Administrator</li>
            <li>October 13, 2026: Processing. Moved automatically because all proposals have been evaluated.</li>
            <li>September 28, 2026: Challenge. Consensus scores finalized.</li>
            <li>September 11, 2026: Resource questions: individual evaluation. This opportunity has closed.</li>
            <li>August 14, 2026: Published, by Test Administrator</li>
          </ul>
        </section>
        <section aria-labelledby="report-proposals" style={stack}>
          <Heading level={2} id="report-proposals">Proposals</Heading>
          {proposals.map((p) => (
            <article key={p.id} aria-labelledby={`report-${p.id}`} style={tight}>
              <Heading level={3} id={`report-${p.id}`}>{p.proponent}</Heading>
              <Text elementType="p">Status: {p.status}. Total score: {p.score}.</Text>
              <Text elementType="p">[The proposal as submitted, with its scores at each stage.]</Text>
            </article>
          ))}
        </section>
      </article>
    </div>
  ),
};
