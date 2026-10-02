import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-list-twu · default — an evaluator part-way through: one proponent complete, one incomplete, one
// not started. Submission is not offered until every proponent has a complete evaluation (R-5.25, R-5.35)
const meta: Meta = { title: "evaluation/evaluation-individual-list-twu/default" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit";
const proposals = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals";
const me = "5e0f7a10-2c3d-4e5f-8a9b-000000000402";

// Ordered by anonymous name (R-5.35). Illustrative identifiers.
const rows = [
  { name: "Proponent 1", status: "Draft: complete", action: "Continue evaluation", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000621/resource-questions/evaluations/${me}/edit` },
  { name: "Proponent 2", status: "Draft: incomplete", action: "Continue evaluation", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000622/resource-questions/evaluations/${me}/edit` },
  { name: "Proponent 3", status: "Not started", action: "Start evaluation", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000623/resource-questions/evaluations/create` },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
          <Heading level={1}>Data platform team</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Resource questions: individual evaluation</span></Text>
          <Text elementType="p" size="small" color="secondary">
            Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
          </Text>
        </Stack>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=instructions`} data-testid="opportunity-tab-instructions">Instructions</Link></li>
            <li><Link href={`${base}?tab=evaluation`} aria-current="page" data-testid="opportunity-tab-evaluation">Evaluation</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Evaluation</Heading>
          <Text elementType="p">
            Score every proponent's resource questions on your own. Proponents are listed by their anonymous names. Nobody else on
            the panel sees your scores until the consensus stage.
          </Text>
          <div role="region" aria-labelledby="evaluations-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="evaluation-individual-table">
              <caption id="evaluations-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">Your evaluations, by anonymous proponent name</Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>Proponent</th>
                  <th scope="col" style={cell}>Your evaluation</th>
                  <th scope="col" style={cell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} data-testid="evaluation-proponent-row">
                    <td style={cell}><span data-testid="proposal-proponent-name">{r.name}</span></td>
                    <td style={cell}><span style={badge} data-testid="evaluation-status">{r.status}</span></td>
                    <td style={cell}>
                      <Link href={r.href} aria-label={`${r.action}: ${r.name}`} data-testid="evaluation-open-proponent">{r.action}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Stack gap="medium">
            <Text elementType="p" id="submit-hint">
              You can submit once every proponent has a complete evaluation: a score and a comment for every question. Submitted
              scores cannot be changed.
            </Text>
            <div>
              <Button variant="primary" isDisabled aria-describedby="submit-hint" data-testid="evaluation-submit-for-consensus">Submit scores for consensus</Button>
            </div>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
