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

// The signed-in vendor after changed terms were announced (R-4.16).
function UserProfileSelfLegalTermsUpdated() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" addressedAsMe section="legal">
        <LegalSection ids={ids} termsUpdated />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfLegalTermsUpdated> = {
  title: "users/user-profile-self-legal/terms-updated",
  component: UserProfileSelfLegalTermsUpdated,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-legal",
    route: "/users/me?tab=legal",
    state: "terms-updated",
  },
};

export default meta;

export const TermsUpdated: StoryObj<typeof UserProfileSelfLegalTermsUpdated> = {};
