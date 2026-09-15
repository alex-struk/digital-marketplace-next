import type { Meta, StoryObj } from "@storybook/react";
import { CapabilitiesSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_capability: "user-profile-capabilities__toggle_capability",
  expand_capability_description: "user-profile-capabilities__expand_capability_description",
  capability_row: "user-profile-capabilities__capability_row",
  capability_checked: "user-profile-capabilities__capability_checked",
  capability_description: "user-profile-capabilities__capability_description",
} as const;

// A vendor's own capabilities, two of them held, every description collapsed (R-4.8).
function UserProfileCapabilitiesDefault() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" section="capabilities">
        <CapabilitiesSection ids={ids} held={["backend-development", "frontend-development"]} />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileCapabilitiesDefault> = {
  title: "users/user-profile-capabilities/default",
  component: UserProfileCapabilitiesDefault,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-capabilities",
    route: "/users/:userId?tab=capabilities",
    state: "default",
  },
};

export default meta;

export const Default: StoryObj<typeof UserProfileCapabilitiesDefault> = {};
