import type { Meta, StoryObj } from "@storybook/react";
import { PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_new_opportunity_notifications: "user-profile-notifications__toggle_new_opportunity_notifications",
  confirm_unsubscribe: "user-profile-notifications__confirm_unsubscribe",
  cancel_unsubscribe: "user-profile-notifications__cancel_unsubscribe",
  new_opportunities_checkbox: "user-profile-notifications__new_opportunities_checkbox",
  notification_email_address: "user-profile-notifications__notification_email_address",
  unsubscribe_modal: "user-profile-notifications__unsubscribe_modal",
} as const;

// An administrator asks for somebody else's notification settings and is shown that person's
// profile section instead (R-4.34). None of this page's identifiers render.
function UserProfileNotificationsNotOffered() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_VENDOR}
        viewer="other"
        showStatus
        adminPermission={{ isSelected: false }}
        activation="deactivate-other"
      />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileNotificationsNotOffered> = {
  title: "users/user-profile-notifications/not-offered",
  component: UserProfileNotificationsNotOffered,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-notifications",
    route: "/users/:userId?tab=notifications",
    state: "not-offered",
  },
};

export default meta;

export const NotOffered: StoryObj<typeof UserProfileNotificationsNotOffered> = {};
