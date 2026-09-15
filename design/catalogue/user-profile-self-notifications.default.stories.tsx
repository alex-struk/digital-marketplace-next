import type { Meta, StoryObj } from "@storybook/react";
import { NotificationsSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_new_opportunity_notifications: "user-profile-notifications__toggle_new_opportunity_notifications",
  confirm_unsubscribe: "user-profile-notifications__confirm_unsubscribe",
  cancel_unsubscribe: "user-profile-notifications__cancel_unsubscribe",
  new_opportunities_checkbox: "user-profile-notifications__new_opportunities_checkbox",
  notification_email_address: "user-profile-notifications__notification_email_address",
  unsubscribe_modal: "user-profile-notifications__unsubscribe_modal",
} as const;

// The signed-in person's own notification settings, reached through /users/me (R-4.29, R-4.26).
function UserProfileSelfNotificationsDefault() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" addressedAsMe section="notifications">
        <NotificationsSection ids={ids} email={SAMPLE_VENDOR.email} isSelected />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfNotificationsDefault> = {
  title: "users/user-profile-self-notifications/default",
  component: UserProfileSelfNotificationsDefault,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-notifications",
    route: "/users/me?tab=notifications",
    state: "default",
  },
};

export default meta;

export const Default: StoryObj<typeof UserProfileSelfNotificationsDefault> = {};
