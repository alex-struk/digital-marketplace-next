import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Checkbox, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// user-profile-notifications · unsubscribe-confirm — arrived from a message's unsubscribe link; nothing changes until confirmed (R-4.29)
const meta: Meta = { title: "users/user-profile-notifications/unsubscribe-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const UnsubscribeConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Notifications</Heading>
      <Text elementType="p" data-testid="notifications-email-address">
        Notifications are sent to vendor1@example.com. If this address is wrong, <Link href={base}>correct it on your profile</Link>.
      </Text>
      <Checkbox defaultSelected data-testid="notifications-new-opportunities-checkbox">
        Email me when new opportunities are posted
      </Checkbox>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="warning"
          title="Stop emails about new opportunities?"
          data-testid="unsubscribe-modal"
          buttons={
            <>
              <Button variant="secondary" data-testid="unsubscribe-cancel-button">Keep receiving them</Button>
              <Button variant="primary" data-testid="unsubscribe-confirm-button">Unsubscribe</Button>
            </>
          }
        >
          <Text elementType="p">vendor1@example.com will no longer be emailed when new opportunities are posted.</Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
