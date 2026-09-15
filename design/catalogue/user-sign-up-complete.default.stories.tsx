import type { Meta, StoryObj } from "@storybook/react";
import { CompleteProfileForm, PageShell } from "./users.shared";

// job_title_field is on the surface but has no identifier: a vendor is the only person this
// page admits (R-4.23) and a vendor is never asked for a job title (R-4.28). See DESIGN.md.
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

// A vendor arriving for the first time: details prefilled from the identity provider, the
// agreement box clear, and completion unavailable with the reason stated.
function UserSignUpCompleteDefault() {
  return (
    <PageShell>
      <CompleteProfileForm ids={ids} termsAccepted={false} />
    </PageShell>
  );
}

const meta: Meta<typeof UserSignUpCompleteDefault> = {
  title: "users/user-sign-up-complete/default",
  component: UserSignUpCompleteDefault,
  parameters: { layout: "fullscreen", page: "user-sign-up-complete", route: "/sign-up/complete", state: "default" },
};

export default meta;

export const Default: StoryObj<typeof UserSignUpCompleteDefault> = {};
