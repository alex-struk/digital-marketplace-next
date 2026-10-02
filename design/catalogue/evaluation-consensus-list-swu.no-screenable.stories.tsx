import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-consensus-list-swu · no-screenable — finalizing was refused because no proponent met every minimum score. The
// message names the Code Challenge, the stage that follows on Sprint With Us (R-5.10)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/no-screenable" };
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

const rows = ["Proponent 1", "Proponent 2", "Proponent 3"];

export const NoScreenable: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
          <Heading level={1}>Modernize the licence renewal service</Heading>
        </Stack>
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
          <div data-testid="evaluation-no-screenable-error">
            <InlineAlert
              variant="danger"
              role="alert"
              title="The consensus scores could not be finalized"
              description="You must have at least one proponent that can be screened into the Code Challenge."
            />
          </div>
        </div>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
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
                {rows.map((name) => (
                  <tr key={name} data-testid="evaluation-proponent-row">
                    <td style={cell}><span data-testid="proposal-proponent-name">{name}</span></td>
                    <td style={cell}><span style={badge} data-testid="evaluation-consensus-status">Submitted</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
