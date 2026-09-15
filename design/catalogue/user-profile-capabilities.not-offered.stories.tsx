import type { Meta, StoryObj } from "@storybook/react";
import { PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_capability: "user-profile-capabilities__toggle_capability",
  expand_capability_description: "user-profile-capabilities__expand_capability_description",
  capability_row: "user-profile-capabilities__capability_row",
  capability_checked: "user-profile-capabilities__capability_checked",
  capability_description: "user-profile-capabilities__capability_description",
} as const;

// An administrator asks for a vendor's capabilities. Somebody else's profile offers the
// profile section alone, and a section it does not offer silently shows the profile section
// (R-4.34), so the administrator is given no capability control at all (R-4.8). None of this
// page's identifiers render.
function UserProfileCapabilitiesNotOffered() {
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

const meta: Meta<typeof UserProfileCapabilitiesNotOffered> = {
  title: "users/user-profile-capabilities/not-offered",
  component: UserProfileCapabilitiesNotOffered,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-capabilities",
    route: "/users/:userId?tab=capabilities",
    state: "not-offered",
  },
};

export default meta;

export const NotOffered: StoryObj<typeof UserProfileCapabilitiesNotOffered> = {};
