import type { Meta, StoryObj } from "@storybook/react";
import { PageShell, ProfileScreen, SAMPLE_PUBLIC_SERVANT } from "./users.shared";

const ids = {
  toggle_capability: "user-profile-capabilities__toggle_capability",
  expand_capability_description: "user-profile-capabilities__expand_capability_description",
  capability_row: "user-profile-capabilities__capability_row",
  capability_checked: "user-profile-capabilities__capability_checked",
  capability_description: "user-profile-capabilities__capability_description",
} as const;

// A public sector employee asks for capabilities on their own profile. Their profile offers
// no such section, so the profile section is shown instead (R-4.34).
function UserProfileSelfCapabilitiesNotOffered() {
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

const meta: Meta<typeof UserProfileSelfCapabilitiesNotOffered> = {
  title: "users/user-profile-self-capabilities/not-offered",
  component: UserProfileSelfCapabilitiesNotOffered,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-capabilities",
    route: "/users/me?tab=capabilities",
    state: "not-offered",
  },
};

export default meta;

export const NotOffered: StoryObj<typeof UserProfileSelfCapabilitiesNotOffered> = {};
