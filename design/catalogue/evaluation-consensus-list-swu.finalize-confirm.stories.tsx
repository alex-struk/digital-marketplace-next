import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, ButtonGroup, Heading, Modal, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-list-swu · finalize-confirm — an administrator pressed Finalize consensus scores in the shared action
// bar and is asked to confirm. The opportunity's owner is offered the same button (R-5.14, R-5.32, R-5.33)
const meta: Meta = { title: "evaluation/evaluation-consensus-list-swu/finalize-confirm" };
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

const rows = ["Proponent 1", "Proponent 2", "Proponent 3"];

export const FinalizeConfirm: StoryObj = {
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
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Consensus</Heading>
        <Text elementType="p">
          The chair records one agreed score for each proponent. Finalizing records the agreed scores against each proponent and
          moves up to four proponents who met every minimum score into the code challenge. It cannot be undone.
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
      </section>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Finalize the consensus scores?"
          data-testid="evaluation-finalize-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="evaluation-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="evaluation-finalize-confirm">Finalize consensus scores</Button>
            </>
          }
        >
          <Text elementType="p">
            The agreed scores are recorded against each proponent. Up to four of the highest-scoring proponents who met every
            minimum score move into the code challenge, and the opportunity moves with them. The chair and the opportunity's
            owner are told. This cannot be undone.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
