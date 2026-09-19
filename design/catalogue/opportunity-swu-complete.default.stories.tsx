import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";

// opportunity-swu-complete · default — an administrator reads the opportunity, its addenda, its history and every
// proposal as one continuous document (R-1.40); proponents are named because the opportunity has been awarded
const meta: Meta = { title: "opportunities/opportunity-swu-complete/default" };
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
  { id: "p1", proponent: "Example Digital Co-operative", status: "Awarded", score: "88.40%" },
  { id: "p2", proponent: "Sample Software Ltd.", status: "Not awarded", score: "81.10%" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Sprint With Us opportunity report</Text>
      <Heading level={1} id="report-title">Modernize the licence renewal service</Heading>
      <article aria-labelledby="report-title" style={stack} data-testid="opportunity-full-report">
        <section aria-labelledby="report-opportunity" style={stack}>
          <Heading level={2} id="report-opportunity">Opportunity</Heading>
          <dl style={facts}>
            <div style={fact}>
              <dt style={term}>Status</dt>
              <dd style={detail}><span style={badge}>Awarded</span></dd>
            </div>
            <div style={fact}>
              <dt style={term}>Total maximum budget</dt>
              <dd style={detail}>$1,200,000</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Proposal deadline</dt>
              <dd style={detail}>October 16, 2026 at 4:00 p.m. Pacific time</dd>
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
          <Text elementType="p">Phases: prototype, November 2, 2026 to January 29, 2027; implementation, February 1, 2027 to September 30, 2027.</Text>
          <Text elementType="p">Scoring weights: team questions 30%, code challenge 30%, team scenario 20%, price 20%.</Text>
        </section>
        <section aria-labelledby="report-addenda" style={stack}>
          <Heading level={2} id="report-addenda">Addenda</Heading>
          <Text elementType="p">September 20, 2026: The kick-off meeting will be held by video, not in person.</Text>
        </section>
        <section aria-labelledby="report-history" style={stack}>
          <Heading level={2} id="report-history">History</Heading>
          <ul>
            <li>December 4, 2026: Awarded, by Test Administrator</li>
            <li>November 27, 2026: Processing. Moved automatically because all proposals have been evaluated.</li>
            <li>November 13, 2026: Team scenario, by Test Public Servant</li>
            <li>November 2, 2026: Code challenge. Consensus scores finalized.</li>
            <li>October 16, 2026: Team questions: individual evaluation. This opportunity has closed.</li>
            <li>September 10, 2026: Published, by Test Administrator</li>
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
