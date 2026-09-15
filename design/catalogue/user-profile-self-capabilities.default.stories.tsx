import type { Meta, StoryObj } from "@storybook/react";
import { CapabilitiesSection, PageShell, ProfileScreen, SAMPLE_VENDOR } from "./users.shared";

const ids = {
  toggle_capability: "user-profile-capabilities__toggle_capability",
  expand_capability_description: "user-profile-capabilities__expand_capability_description",
  capability_row: "user-profile-capabilities__capability_row",
  capability_checked: "user-profile-capabilities__capability_checked",
  capability_description: "user-profile-capabilities__capability_description",
} as const;

// The signed-in vendor's own capabilities, reached through /users/me (R-4.8, R-4.26).
function UserProfileSelfCapabilitiesDefault() {
  return (
    <PageShell>
      <ProfileScreen ids={ids} person={SAMPLE_VENDOR} viewer="own" addressedAsMe section="capabilities">
        <CapabilitiesSection ids={ids} held={["backend-development", "frontend-development"]} />
      </ProfileScreen>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfCapabilitiesDefault> = {
  title: "users/user-profile-self-capabilities/default",
  component: UserProfileSelfCapabilitiesDefault,
  parameters: {
    layout: "fullscreen",
    page: "user-profile-self-capabilities",
    route: "/users/me?tab=capabilities",
    state: "default",
  },
};

export default meta;

export const Default: StoryObj<typeof UserProfileSelfCapabilitiesDefault> = {};
