import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-list-swu · ready — every proponent has a complete draft, so the evaluator may submit the whole
// set; there is no way to submit one evaluation on its own (R-5.25, R-5.26)
const meta: Meta = { title: "evaluation/evaluation-individual-list-swu/ready" };
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
const proposals = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals";
const me = "5e0f7a10-2c3d-4e5f-8a9b-000000000402";

const rows = [
  { name: "Proponent 1", status: "Draft: complete", action: "Continue evaluation", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000611/team-questions/evaluations/${me}/edit` },
  { name: "Proponent 2", status: "Draft: complete", action: "Continue evaluation", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000612/team-questions/evaluations/${me}/edit` },
  { name: "Proponent 3", status: "Draft: complete", action: "Continue evaluation", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000613/team-questions/evaluations/${me}/edit` },
];

export const Ready: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
          <Heading level={1}>Modernize the licence renewal service</Heading>
        </Stack>
        <Text elementType="p" size="small" color="secondary">The status and tabs are as in the default story and are trimmed here.</Text>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Evaluation</Heading>
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
              Every evaluation is complete. Your scores for all three proponents are submitted together, and cannot be changed
              afterwards.
            </Text>
            <div>
              <Button variant="primary" aria-describedby="submit-hint" data-testid="evaluation-submit-for-consensus">Submit scores for consensus</Button>
            </div>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
