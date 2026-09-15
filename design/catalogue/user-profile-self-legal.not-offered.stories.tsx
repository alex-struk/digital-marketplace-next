import type { Meta, StoryObj } from "@storybook/react";
import { PageShell, ProfileScreen, SAMPLE_PUBLIC_SERVANT } from "./users.shared";

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

// A public sector employee asks for the legal section on their own profile and is shown
// their profile section instead (R-4.33).
function UserProfileSelfLegalNotOffered() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_PUBLIC_SERVANT}
        viewer="own"
        addressedAsMe
        activation="deactivate-own"
      />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfLegalNotOffered> = {
  title: "users/user-profile-self-legal/not-offered",
  component: UserProfileSelfLegalNotOffered,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-legal",
    route: "/users/me?tab=legal",
    state: "not-offered",
  },
};

export default meta;

export const NotOffered: StoryObj<typeof UserProfileSelfLegalNotOffered> = {};
