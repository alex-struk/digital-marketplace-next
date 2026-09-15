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

// The signed-in vendor confirming agreement to the updated terms (R-4.16).
function UserProfileSelfLegalConfirmAcceptTerms() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_VENDOR}
        viewer="own"
        addressedAsMe
        section="legal"
        dialog={<AcceptTermsDialog ids={ids} />}
      >
        <LegalSection ids={ids} termsUpdated />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfLegalConfirmAcceptTerms> = {
  title: "users/user-profile-self-legal/confirm-accept-terms",
  component: UserProfileSelfLegalConfirmAcceptTerms,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-legal",
    route: "/users/me?tab=legal",
    state: "confirm-accept-terms",
  },
};

export default meta;

export const ConfirmAcceptTerms: StoryObj<typeof UserProfileSelfLegalConfirmAcceptTerms> = {};
