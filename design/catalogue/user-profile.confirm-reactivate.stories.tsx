import type { Meta, StoryObj } from "@storybook/react";
import { ActivationDialog, PageShell, ProfileScreen, SAMPLE_INACTIVE_VENDOR } from "./users.shared";

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

// An administrator chose to reactivate an account an administrator deactivated and is asked
// to confirm (R-4.19, R-4.20).
function UserProfileConfirmReactivate() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_INACTIVE_VENDOR}
        viewer="other"
        showStatus
        status="Inactive"
        adminPermission={{ isSelected: false }}
        activation="reactivate"
        dialog={<ActivationDialog ids={ids} kind="reactivate" />}
      />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileConfirmReactivate> = {
  title: "users/user-profile/confirm-reactivate",
  component: UserProfileConfirmReactivate,
  parameters: { layout: "fullscreen", page: "user-profile", route: "/users/:userId", state: "confirm-reactivate" },
};

export default meta;

export const ConfirmReactivate: StoryObj<typeof UserProfileConfirmReactivate> = {};
