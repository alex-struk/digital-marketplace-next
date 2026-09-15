import type { Meta, StoryObj } from "@storybook/react";
import { CompleteProfileForm, INVALID_PROFILE_ERRORS, PageShell } from "./users.shared";

const ids = {
  change_avatar: "user-sign-up-complete__change_avatar",
  accept_app_terms: "user-sign-up-complete__accept_app_terms",
  toggle_new_opportunity_notifications: "user-sign-up-complete__toggle_new_opportunity_notifications",
  complete_profile: "user-sign-up-complete__complete_profile",
  idp_username_readonly: "user-sign-up-complete__idp_username_readonly",
  name_field: "user-sign-up-complete__name_field",
  email_field: "user-sign-up-complete__email_field",
  terms_checkbox: "user-sign-up-complete__terms_checkbox",
  complete_disabled_until_terms_accepted: "user-sign-up-complete__complete_disabled_until_terms_accepted",
  field_error: "user-sign-up-complete__field_error",
} as const;

// Submitted with the name cleared and a malformed email address (R-4.27): the profile is not
// completed, the summary lists both problems and each field reports its own.
function UserSignUpCompleteInvalid() {
  return (
    <PageShell>
      <CompleteProfileForm ids={ids} termsAccepted errors={INVALID_PROFILE_ERRORS} />
    </PageShell>
  );
}

const meta: Meta<typeof UserSignUpCompleteInvalid> = {
  title: "users/user-sign-up-complete/invalid",
  component: UserSignUpCompleteInvalid,
  parameters: { layout: "fullscreen", page: "user-sign-up-complete", route: "/sign-up/complete", state: "invalid" },
};

export default meta;

export const Invalid: StoryObj<typeof UserSignUpCompleteInvalid> = {};
