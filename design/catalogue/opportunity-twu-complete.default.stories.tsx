import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-twu-complete · default — an administrator reads the opportunity, its addenda, its history and every
// proposal as one continuous document (R-1.40); proponents are named because the opportunity has been awarded
const meta: Meta = { title: "opportunities/opportunity-twu-complete/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
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
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Team With Us opportunity report</Text>
          <Heading level={1} id="report-title">Data platform team</Heading>
        </Stack>
        <Stack as="article" gap="large" aria-labelledby="report-title" data-testid="opportunity-full-report">
          <Stack as="section" gap="medium" aria-labelledby="report-opportunity">
            <Heading level={2} id="report-opportunity">Opportunity</Heading>
            <Stack as="dl" direction="row" gap="medium">
              <Stack gap="small">
                <dt style={term}>Status</dt>
                <dd><span style={badge}>Awarded</span></dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Maximum budget</dt>
                <dd>$900,000</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Proposal deadline</dt>
                <dd>September 11, 2026 at 4:00 p.m. Pacific time</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Published</dt>
                <dd>August 14, 2026</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Created by</dt>
                <dd>Test Public Servant</dd>
              </Stack>
            </Stack>
            <Text elementType="p">Resources: full stack developer, 100% of full time; data professional, 50% of full time.</Text>
            <Text elementType="p">Scoring weights: resource questions 30%, challenge 40%, price 30%.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="report-addenda">
            <Heading level={2} id="report-addenda">Addenda</Heading>
            <Text elementType="p">August 25, 2026: Interviews for the challenge will be held by video.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="report-history">
            <Heading level={2} id="report-history">History</Heading>
            <ul>
              <li>October 20, 2026: Awarded, by Test Administrator</li>
              <li>October 13, 2026: Processing. Moved automatically because all proposals have been evaluated.</li>
              <li>September 28, 2026: Challenge. Consensus scores finalized.</li>
              <li>September 11, 2026: Resource questions: individual evaluation. This opportunity has closed.</li>
              <li>August 14, 2026: Published, by Test Administrator</li>
            </ul>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="report-proposals">
            <Heading level={2} id="report-proposals">Proposals</Heading>
            {proposals.map((p) => (
              <Stack as="article" gap="small" key={p.id} aria-labelledby={`report-${p.id}`}>
                <Heading level={3} id={`report-${p.id}`}>{p.proponent}</Heading>
                <Text elementType="p">Status: {p.status}. Total score: {p.score}.</Text>
                <Text elementType="p">[The proposal as submitted, with its scores at each stage.]</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
