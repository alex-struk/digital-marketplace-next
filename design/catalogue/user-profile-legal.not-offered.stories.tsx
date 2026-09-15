import type { Meta, StoryObj } from "@storybook/react";
import { PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

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

// An administrator asks for a vendor's legal section. Nobody but the vendor is shown it, and
// the administrator sees the profile section instead (R-4.33, R-4.34, R-4.16's note that
// nobody may accept terms on somebody else's behalf).
function UserProfileLegalNotOffered() {
  return (
    <PageShell>
      <ProfileScreen
        ids={ids}
        person={SAMPLE_VENDOR}
        viewer="other"
        showStatus
        adminPermission={{ isSelected: false }}
        activation="deactivate-other"
      />
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileLegalNotOffered> = {
  title: "users/user-profile-legal/not-offered",
  component: UserProfileLegalNotOffered,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-legal",
    route: "/users/:userId?tab=legal",
    state: "not-offered",
  },
};

export default meta;

export const NotOffered: StoryObj<typeof UserProfileLegalNotOffered> = {};
