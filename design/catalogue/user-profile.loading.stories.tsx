import type { Meta, StoryObj } from "@storybook/react";
import { LoadingStatus, PageHeading, PageShell } from "./users.shared";

// Nothing about the account is shown until it has loaded, including whether the viewer may
// see it at all, so no test ID renders here.
function UserProfileLoading() {
  return (
    <PageShell>
      <PageHeading>User Profile</PageHeading>
      <LoadingStatus>Loading profile…</LoadingStatus>
    </PageShell>
  );
}

const meta: Meta<typeof UserProfileLoading> = {
  title: "users/user-profile/loading",
  component: UserProfileLoading,
  parameters: { layout: "fullscreen", page: "user-profile", route: "/users/:userId", state: "loading" },
};

export default meta;

export const Loading: StoryObj<typeof UserProfileLoading> = {};
