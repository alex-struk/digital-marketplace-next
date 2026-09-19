import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-list-swu · default — the chair, who is also an evaluator, part-way through agreeing scores. Submitting
// is not offered until every proponent has a complete consensus (R-5.13, R-5.29, R-5.34)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";
const proposals = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals";
const chair = "5e0f7a10-2c3d-4e5f-8a9b-000000000402";

const rows = [
  { name: "Proponent 1", status: "Draft: complete", action: "Edit consensus", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000611/team-questions/consensus/${chair}/edit` },
  { name: "Proponent 2", status: "Draft: incomplete", action: "Edit consensus", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000612/team-questions/consensus/${chair}/edit` },
  { name: "Proponent 3", status: "Not started", action: "Start consensus", href: `${proposals}/3b8d6f20-1a2b-4c3d-8e9f-000000000613/team-questions/consensus/create` },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Team questions: consensus</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
        </Text>
      </div>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=instructions`} data-testid="opportunity-tab-instructions">Instructions</Link></li>
          <li><Link href={`${base}?tab=evaluation`} data-testid="opportunity-tab-evaluation">Evaluation</Link></li>
          <li><Link href={`${base}?tab=consensus`} aria-current="page" data-testid="opportunity-tab-consensus">Consensus</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Consensus</Heading>
        <Text elementType="p">
          As chair, record one agreed score and comment for each question of each proponent, drawing on the evaluators' scores.
          You can change a consensus until the consensus scores are finalized.
        </Text>
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
                  <td style={cell}><span style={badge} data-testid="evaluation-consensus-status">{r.status}</span></td>
                  <td style={cell}>
                    <Link href={r.href} aria-label={`${r.action}: ${r.name}`} data-testid="evaluation-open-consensus">{r.action}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={stack}>
          <Text elementType="p" id="submit-hint">
            You can submit once every proponent has a complete consensus: an agreed score and comment for every question.
          </Text>
          <div>
            <Button variant="primary" isDisabled aria-describedby="submit-hint" data-testid="evaluation-submit-consensus">Submit final consensus scores</Button>
          </div>
        </div>
      </section>
    </div>
  ),
};
