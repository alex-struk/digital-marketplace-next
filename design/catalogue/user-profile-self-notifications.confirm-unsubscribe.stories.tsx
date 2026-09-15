import type { Meta, StoryObj } from "@storybook/react";
import { NotificationsSection, PageShell, ProfileScreen, SAMPLE_VENDOR, UnsubscribeDialog } from "./users.shared";

const ids = {
  toggle_new_opportunity_notifications: "user-profile-notifications__toggle_new_opportunity_notifications",
  confirm_unsubscribe: "user-profile-notifications__confirm_unsubscribe",
  cancel_unsubscribe: "user-profile-notifications__cancel_unsubscribe",
  new_opportunities_checkbox: "user-profile-notifications__new_opportunities_checkbox",
  notification_email_address: "user-profile-notifications__notification_email_address",
  unsubscribe_modal: "user-profile-notifications__unsubscribe_modal",
} as const;

// The unsubscribe confirmation on the signed-in person's own settings (R-4.29).
function UserProfileSelfNotificationsConfirmUnsubscribe() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_VENDOR}
        viewer="own"
        addressedAsMe
        section="notifications"
        dialog={<UnsubscribeDialog ids={ids} email={SAMPLE_VENDOR.email} />}
      >
        <NotificationsSection ids={ids} email={SAMPLE_VENDOR.email} isSelected />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfNotificationsConfirmUnsubscribe> = {
  title: "users/user-profile-self-notifications/confirm-unsubscribe",
  component: UserProfileSelfNotificationsConfirmUnsubscribe,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-notifications",
    route: "/users/me?tab=notifications",
    state: "confirm-unsubscribe",
  },
};

export default meta;

export const ConfirmUnsubscribe: StoryObj<typeof UserProfileSelfNotificationsConfirmUnsubscribe> = {};
