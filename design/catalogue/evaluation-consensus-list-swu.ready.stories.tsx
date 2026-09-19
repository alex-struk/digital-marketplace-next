import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-list-swu · ready — every proponent has a complete consensus, so the chair may submit them
// (R-5.13, R-5.31)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/ready" };
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
const proposals = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals";
const chair = "5e0f7a10-2c3d-4e5f-8a9b-000000000402";

const rows = [
  { name: "Proponent 1", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000611/team-questions/consensus/${chair}/edit` },
  { name: "Proponent 2", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000612/team-questions/consensus/${chair}/edit` },
  { name: "Proponent 3", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000613/team-questions/consensus/${chair}/edit` },
];

export const Ready: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p" size="small" color="secondary">The status and tabs are as in the default story and are trimmed here.</Text>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Consensus</Heading>
        <div role="region" aria-labelledby="consensus-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="evaluation-consensus-table">
            <caption id="consensus-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Agreed scores, by anonymous proponent name</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Proponent</th>
                <th scope="col" style={cell}>Consensus</th>
                <th scope="col" style={cell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} data-testid="evaluation-proponent-row">
                  <td style={cell}><span data-testid="proposal-proponent-name">{r.name}</span></td>
                  <td style={cell}><span style={badge} data-testid="evaluation-consensus-status">Draft: complete</span></td>
                  <td style={cell}>
                    <Link href={r.href} aria-label={`Edit consensus: ${r.name}`} data-testid="evaluation-open-consensus">Edit consensus</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={stack}>
          <Text elementType="p" id="submit-hint">
            Every proponent has a complete consensus. When you submit, the opportunity's owner and every administrator are told.
          </Text>
          <div>
            <Button variant="primary" aria-describedby="submit-hint" data-testid="evaluation-submit-consensus">Submit final consensus scores</Button>
          </div>
        </div>
      </section>
    </div>
  ),
};
