import type { Meta, StoryObj } from "@storybook/react";
import { CapabilitiesSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_capability: "user-profile-capabilities__toggle_capability",
  expand_capability_description: "user-profile-capabilities__expand_capability_description",
  capability_row: "user-profile-capabilities__capability_row",
  capability_checked: "user-profile-capabilities__capability_checked",
  capability_description: "user-profile-capabilities__capability_description",
} as const;

// One capability's description expanded, on the signed-in vendor's own profile.
function UserProfileSelfCapabilitiesDescriptionExpanded() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" addressedAsMe section="capabilities">
        <CapabilitiesSection
          ids={ids}
          held={["backend-development", "frontend-development"]}
          expanded="agile-coaching"
        />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfCapabilitiesDescriptionExpanded> = {
  title: "users/user-profile-self-capabilities/description-expanded",
  component: UserProfileSelfCapabilitiesDescriptionExpanded,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-capabilities",
    route: "/users/me?tab=capabilities",
    state: "description-expanded",
  },
};

export default meta;

export const DescriptionExpanded: StoryObj<typeof UserProfileSelfCapabilitiesDescriptionExpanded> = {};
