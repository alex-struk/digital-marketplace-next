import type { Meta, StoryObj } from "@storybook/react";
import { NotFound, PageShell } from "./users.shared";

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

// Somebody who is neither the account's owner nor an administrator opens it (R-4.25). They
// see the ordinary missing page, worded exactly as for an address that does not exist, so
// the refusal does not reveal that the account is there.
function UserProfileNotFound() {
  return (
    <PageShell>
      <NotFound testId={ids.not_found_page} />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileNotFound> = {
  title: "users/user-profile/not-found",
  component: UserProfileNotFound,
  parameters: { layout: "fullscreen", page: "user-profile", route: "/users/:userId", state: "not-found" },
};

export default meta;

export const NotFoundProfile: StoryObj<typeof UserProfileNotFound> = {};
