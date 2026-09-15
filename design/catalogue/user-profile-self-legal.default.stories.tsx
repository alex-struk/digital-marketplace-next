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

// The signed-in vendor's own legal section, reached through /users/me (R-4.33, R-4.26).
function UserProfileSelfLegalDefault() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" addressedAsMe section="legal">
        <LegalSection ids={ids} termsUpdated={false} />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfLegalDefault> = {
  title: "users/user-profile-self-legal/default",
  component: UserProfileSelfLegalDefault,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-legal",
    route: "/users/me?tab=legal",
    state: "default",
  },
};

export default meta;

export const Default: StoryObj<typeof UserProfileSelfLegalDefault> = {};
