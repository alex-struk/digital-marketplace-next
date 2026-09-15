import type { Meta, StoryObj } from "@storybook/react";
import { AcceptTermsDialog, LegalSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

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

// The vendor chose to review and agree, and is asked to confirm; agreeing records a fresh
// acceptance date (R-4.16).
function UserProfileLegalConfirmAcceptTerms() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_VENDOR}
        viewer="own"
        section="legal"
        dialog={<AcceptTermsDialog ids={ids} />}
      >
        <LegalSection ids={ids} termsUpdated />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileLegalConfirmAcceptTerms> = {
  title: "users/user-profile-legal/confirm-accept-terms",
  component: UserProfileLegalConfirmAcceptTerms,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-legal",
    route: "/users/:userId?tab=legal",
    state: "confirm-accept-terms",
  },
};

export default meta;

export const ConfirmAcceptTerms: StoryObj<typeof UserProfileLegalConfirmAcceptTerms> = {};
