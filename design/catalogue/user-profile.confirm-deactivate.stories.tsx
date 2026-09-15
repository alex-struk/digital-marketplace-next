import type { Meta, StoryObj } from "@storybook/react";
import { ActivationDialog, PageShell, ProfileScreen, SAMPLE_PUBLIC_SERVANT } from "./users.shared";

const ids = {
  edit_profile: "user-profile__edit_profile",
  save_changes: "user-profile__save_changes",
  cancel_editing: "user-profile__cancel_editing",
  change_avatar: "user-profile__change_avatar",
  toggle_admin_permission: "user-profile__toggle_admin_permission",
  deactivate_account: "user-profile__deactivate_account",
  reactivate_account: "user-profile__reactivate_account",
  confirm_activation_change: "user-profile__confirm_activation_change",
  cancel_activation_change: "user-profile__cancel_activation_change",
  user_identifier: "user-profile__user_identifier",
  profile_tab: "user-profile__profile_tab",
  capabilities_tab: "user-profile__capabilities_tab",
  notifications_tab: "user-profile__notifications_tab",
  legal_tab: "user-profile__legal_tab",
  organizations_tab: "user-profile__organizations_tab",
  status_badge: "user-profile__status_badge",
  account_type: "user-profile__account_type",
  permissions_label: "user-profile__permissions_label",
  admin_checkbox: "user-profile__admin_checkbox",
  idp_username_readonly: "user-profile__idp_username_readonly",
  name_field: "user-profile__name_field",
  email_field: "user-profile__email_field",
  job_title_field: "user-profile__job_title_field",
  field_error: "user-profile__field_error",
  activation_modal: "user-profile__activation_modal",
  not_found_page: "user-profile__not_found_page",
} as const;

// An administrator chose to deactivate somebody else's account and is asked to confirm (R-4.30).
function UserProfileConfirmDeactivate() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_PUBLIC_SERVANT}
        viewer="other"
        showStatus
        adminPermission={{ isSelected: false }}
        activation="deactivate-other"
        dialog={<ActivationDialog ids={ids} kind="deactivate-other" />}
      />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileConfirmDeactivate> = {
  title: "users/user-profile/confirm-deactivate",
  component: UserProfileConfirmDeactivate,
  parameters: { layout: "fullscreen", page: "user-profile", route: "/users/:userId", state: "confirm-deactivate" },
};

export default meta;

export const ConfirmDeactivate: StoryObj<typeof UserProfileConfirmDeactivate> = {};
