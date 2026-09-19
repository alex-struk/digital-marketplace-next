import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-list-swu · not-all-submitted — finalizing was refused because a proponent still under review has no
// submitted consensus. The alert is the same element as the opportunities domain's advance-refused-message (R-5.13)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/not-all-submitted" };
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

const rows = [
  { name: "Proponent 1", status: "Submitted" },
  { name: "Proponent 2", status: "Draft: complete" },
  { name: "Proponent 3", status: "Submitted" },
];

export const NotAllSubmitted: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Team questions: consensus</span></Text>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="primary" data-testid="finalize-consensus-button">Finalize consensus scores</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <Text elementType="p" size="small" color="secondary">
        The tabs are the opportunities domain's, as in its consensus story, and are trimmed here.
      </Text>
      <div tabIndex={-1} data-testid="advance-refused-message">
        <div data-testid="evaluation-not-all-submitted-error">
          <InlineAlert
            variant="danger"
            role="alert"
            title="The consensus scores could not be finalized"
            description="Not all consensuses have been submitted."
          />
        </div>
      </div>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} data-testid="evaluation-proponent-row">
                  <td style={cell}><span data-testid="proposal-proponent-name">{r.name}</span></td>
                  <td style={cell}><span style={badge} data-testid="evaluation-consensus-status">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
