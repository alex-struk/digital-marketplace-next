import type { Meta, StoryObj } from "@storybook/react";
import { LegalSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  open_app_terms: "user-profile-legal__open_app_terms",
  accept_updated_terms: "user-profile-legal__accept_updated_terms",
  confirm_accept_updated_terms: "user-profile-legal__confirm_accept_updated_terms",
  privacy_policy: "user-profile-legal__privacy_policy",
  app_terms_link: "user-profile-legal__app_terms_link",
  accepted_on_notice: "user-profile-legal__accepted_on_notice",
  terms_updated_warning: "user-profile-legal__terms_updated_warning",
  program_terms_links: "user-profile-legal__program_terms_links",
  accept_updated_terms_modal: "user-profile-legal__accept_updated_terms_modal",
} as const;

// A vendor's legal section with the current terms agreed: privacy policy, the service's terms
// with the date and time agreed, and the three programs' terms (R-4.33).
function UserProfileLegalDefault() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" section="legal">
        <LegalSection ids={ids} termsUpdated={false} />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileLegalDefault> = {
  title: "users/user-profile-legal/default",
  component: UserProfileLegalDefault,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-legal",
    route: "/users/:userId?tab=legal",
    state: "default",
  },
};

export default meta;

export const Default: StoryObj<typeof UserProfileLegalDefault> = {};
