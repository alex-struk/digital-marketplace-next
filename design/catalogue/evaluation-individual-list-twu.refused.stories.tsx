import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-individual-list-twu · refused — the service found an incomplete evaluation in the set and submitted none of
// it, and says so in its own words. Here the panel's questions changed after the list was loaded (R-5.25, R-5.27 note)
const meta: Meta = { title: "evaluation/evaluation-individual-list-twu/refused" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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
const proposals = "/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals";
const me = "5e0f7a10-2c3d-4e5f-8a9b-000000000402";

const rows = [
  { name: "Proponent 1", status: "Draft: complete", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000621/resource-questions/evaluations/${me}/edit` },
  { name: "Proponent 2", status: "Draft: incomplete", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000622/resource-questions/evaluations/${me}/edit` },
  { name: "Proponent 3", status: "Draft: complete", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000623/resource-questions/evaluations/${me}/edit` },
];

export const Refused: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
      <Heading level={1}>Data platform team</Heading>
      <Text elementType="p" size="small" color="secondary">The status and tabs are as in the default story and are trimmed here.</Text>
      <div tabIndex={-1} data-testid="evaluation-incomplete-error">
        <InlineAlert
          variant="danger"
          role="alert"
          title="Your scores were not submitted"
          description="This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again."
        />
      </div>
      <section aria-labelledby="tab-heading" style={stack}>
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
                    <Link href={r.href} aria-label={`Continue evaluation: ${r.name}`} data-testid="evaluation-open-proponent">Continue evaluation</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={stack}>
          <Text elementType="p" id="submit-hint">
            You can submit once every proponent has a complete evaluation: a score and a comment for every question. Submitted
            scores cannot be changed.
          </Text>
          <div>
            <Button variant="primary" isDisabled aria-describedby="submit-hint" data-testid="evaluation-submit-for-consensus">Submit scores for consensus</Button>
          </div>
        </div>
      </section>
    </div>
  ),
};
