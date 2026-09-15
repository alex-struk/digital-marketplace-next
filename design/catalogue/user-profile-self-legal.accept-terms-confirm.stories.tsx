import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// user-profile-self-legal · accept-terms-confirm — the vendor is asked to agree to the updated terms (R-4.16)
const meta: Meta = { title: "users/user-profile-self-legal/accept-terms-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const AcceptTermsConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Policies, Terms &amp; Agreements</Heading>
      <Button variant="primary" data-testid="legal-accept-updated-terms-button">Review and agree to the updated terms</Button>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Agree to the updated terms and conditions?"
          data-testid="legal-accept-terms-modal"
          buttons={
            <>
              <Button variant="secondary">Not now</Button>
              <Button variant="primary" data-testid="legal-accept-terms-confirm-button">I agree</Button>
            </>
          }
        >
          <Text elementType="p">
            By agreeing, you confirm you have read and agree to the{" "}
            <Link href="/content/terms-and-conditions">Digital Marketplace terms and conditions</Link>. The date and time you agree will be recorded on your account.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
