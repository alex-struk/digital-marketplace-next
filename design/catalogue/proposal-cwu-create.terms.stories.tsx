import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Checkbox, Dialog, Form, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-create · terms — Submit proposal was pressed. The dialog asks for the program's terms and the service's
// terms, and its Submit proposal button stays disabled until both boxes are ticked. Submitting records the acceptance
// (R-2.3)
const meta: Meta = { title: "proposals/proposal-cwu-create/terms" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const dialogBody = { display: "grid", gap: "var(--layout-margin-medium)", padding: "var(--layout-padding-large)" } as const;

export const Terms: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Code With Us proposal</Heading>
      <Text elementType="p" size="small" color="secondary">
        The opportunity summary and the completed form are as in the default story and are trimmed here.
      </Text>
      <Form validationBehavior="aria" style={stack}>
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="tertiary" data-testid="proposal-cancel">Cancel</Button>
          <Button variant="secondary" data-testid="proposal-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="proposal-submit">Submit proposal</Button>
        </ButtonGroup>
      </Form>
      <Modal isOpen isDismissable>
        <Dialog isCloseable data-testid="proposal-terms-dialog">
          <div style={dialogBody}>
            <Heading level={2} slot="title">Submit your proposal</Heading>
            <Text elementType="p">
              To submit, accept the Code With Us terms and conditions and the Digital Marketplace terms and conditions. Your
              acceptance is recorded when you submit.
            </Text>
            <Text elementType="p">
              Read the <Link href="/content/code-with-us-terms-and-conditions">Code With Us terms and conditions</Link> and
              the <Link href="/content/terms-and-conditions">Digital Marketplace terms and conditions</Link>.
            </Text>
            <Checkbox isRequired data-testid="proposal-accept-program-terms">I accept the Code With Us terms and conditions</Checkbox>
            <Checkbox isRequired data-testid="proposal-accept-app-terms">I accept the Digital Marketplace terms and conditions</Checkbox>
            <Text id="proposal-terms-hint" elementType="p" size="small" color="secondary">Tick both boxes to submit.</Text>
            <ButtonGroup ariaLabel="Submit choices">
              <Button variant="secondary" data-testid="proposal-dialog-cancel">Cancel</Button>
              <Button variant="primary" isDisabled aria-describedby="proposal-terms-hint" data-testid="proposal-submit-confirm">
                Submit proposal
              </Button>
            </ButtonGroup>
          </div>
        </Dialog>
      </Modal>
    </div>
  ),
};
