import type { Meta, StoryObj } from "@storybook/react";
import { PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  edit_profile: "user-profile__edit_profile",
  save_changes: "user-profile__save_changes",
  cancel_editing: "user-profile__cancel_editing",
  change_avatar: "user-profile__change_avatar",
  deactivate_account: "user-profile__deactivate_account",
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
  idp_username_readonly: "user-profile__idp_username_readonly",
  name_field: "user-profile__name_field",
  email_field: "user-profile__email_field",
  job_title_field: "user-profile__job_title_field",
  field_error: "user-profile__field_error",
  activation_modal: "user-profile__activation_modal",
  sign_in_required: "user-profile__sign_in_required",
} as const;

// Every field was valid but the service refused the change — for example an email address
// another vendor already uses (R-4.6). The message is deliberately generic, as the criterion
// records, and the person's entries are kept.
function UserProfileSelfSaveFailed() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" addressedAsMe mode="edit" saveFailed />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfSaveFailed> = {
  title: "users/user-profile-self/save-failed",
  component: UserProfileSelfSaveFailed,
  parameters: { layout: "fullscreen", page: "user-profile-self", route: "/users/me", state: "save-failed" },
};

export default meta;

export const SaveFailed: StoryObj<typeof UserProfileSelfSaveFailed> = {};
