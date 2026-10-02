import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// opportunity-swu-complete · default — an administrator reads the opportunity, its addenda, its history and every
// proposal as one continuous document (R-1.40); proponents are named because the opportunity has been awarded
const meta: Meta = { title: "opportunities/opportunity-swu-complete/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
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
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Sprint With Us opportunity report</Text>
          <Heading level={1} id="report-title">Modernize the licence renewal service</Heading>
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
                <dt style={term}>Total maximum budget</dt>
                <dd>$1,200,000</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Proposal deadline</dt>
                <dd>October 16, 2026 at 4:00 p.m. Pacific time</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Published</dt>
                <dd>September 10, 2026</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Created by</dt>
                <dd>Test Public Servant</dd>
              </Stack>
            </Stack>
            <Text elementType="p">Phases: prototype, November 2, 2026 to January 29, 2027; implementation, February 1, 2027 to September 30, 2027.</Text>
            <Text elementType="p">Scoring weights: team questions 30%, code challenge 30%, team scenario 20%, price 20%.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="report-addenda">
            <Heading level={2} id="report-addenda">Addenda</Heading>
            <Text elementType="p">September 20, 2026: The kick-off meeting will be held by video, not in person.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="report-history">
            <Heading level={2} id="report-history">History</Heading>
            <ul>
              <li>December 4, 2026: Awarded, by Test Administrator</li>
              <li>November 27, 2026: Processing. Moved automatically because all proposals have been evaluated.</li>
              <li>November 13, 2026: Team scenario, by Test Public Servant</li>
              <li>November 2, 2026: Code challenge. Consensus scores finalized.</li>
              <li>October 16, 2026: Team questions: individual evaluation. This opportunity has closed.</li>
              <li>September 10, 2026: Published, by Test Administrator</li>
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
