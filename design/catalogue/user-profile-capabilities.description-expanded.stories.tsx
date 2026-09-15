import type { Meta, StoryObj } from "@storybook/react";
import { CapabilitiesSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_capability: "user-profile-capabilities__toggle_capability",
  expand_capability_description: "user-profile-capabilities__expand_capability_description",
  capability_row: "user-profile-capabilities__capability_row",
  capability_checked: "user-profile-capabilities__capability_checked",
  capability_description: "user-profile-capabilities__capability_description",
} as const;

// One capability's description expanded before choosing it (R-4.8).
function UserProfileCapabilitiesDescriptionExpanded() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" section="capabilities">
        <CapabilitiesSection
          ids={ids}
          held={["backend-development", "frontend-development"]}
          expanded="agile-coaching"
        />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileCapabilitiesDescriptionExpanded> = {
  title: "users/user-profile-capabilities/description-expanded",
  component: UserProfileCapabilitiesDescriptionExpanded,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-capabilities",
    route: "/users/:userId?tab=capabilities",
    state: "description-expanded",
  },
};

export default meta;

export const DescriptionExpanded: StoryObj<typeof UserProfileCapabilitiesDescriptionExpanded> = {};
