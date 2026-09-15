import type { Meta, StoryObj } from "@storybook/react";
import { LoadingStatus, PageHeading, PageShell } from "./users.shared";

// The signed-in person's own profile before it has loaded. No test ID renders here.
function UserProfileSelfLoading() {
  return (
    <PageShell>
      <PageHeading>User Profile</PageHeading>
      <LoadingStatus>Loading profile…</LoadingStatus>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileSelfLoading> = {
  title: "users/user-profile-self/loading",
  component: UserProfileSelfLoading,
  parameters: { layout: "fullscreen", page: "user-profile-self", route: "/users/me", state: "loading" },
};

export default meta;

export const Loading: StoryObj<typeof UserProfileSelfLoading> = {};
