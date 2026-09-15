import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "@bcgov/design-system-react-components";
import { AccountChoices, PageHeading, PageShell } from "./users.shared";

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

// A visitor who is not signed in opens /users/me and is sent to sign in, to be returned to
// their profile afterwards (R-4.26, R-4.22). The sign-in choices here are the sign-in page's
// own; they carry no identifiers on this page because the surface gives it none.
function UserProfileSelfSignInRequired() {
  return (
    <PageShell>
      <PageHeading>Sign In</PageHeading>
      <div data-testid={ids.sign_in_required}>
        <InlineAlert
          variant="info"
          title="Sign in to see your profile"
          description="You will be returned to your profile after you sign in."
        />
      </div>
      <AccountChoices verb="Sign in" />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfSignInRequired> = {
  title: "users/user-profile-self/sign-in-required",
  component: UserProfileSelfSignInRequired,
  parameters: { layout: "fullscreen", page: "user-profile-self", route: "/users/me", state: "sign-in-required" },
};

export default meta;

export const SignInRequired: StoryObj<typeof UserProfileSelfSignInRequired> = {};
