import type { Meta, StoryObj } from "@storybook/react";
import { InlineAlert } from "@bcgov/design-system-react-components";
import { PageHeading, PageShell } from "./users.shared";

const ids = {
  signed_out_message: "user-sign-out__signed_out_message",
  sign_out_failed_message: "user-sign-out__sign_out_failed_message",
} as const;

// R-4.17: the person is told that signing out failed. The heading says so too, rather than
// repeating "Signed Out" over a message that contradicts it.
function UserSignOutFailed() {
  return (
    <PageShell>
      <PageHeading>Sign Out Failed</PageHeading>
      <div role="alert" data-testid={ids.sign_out_failed_message}>
        <InlineAlert
          variant="danger"
          title="You have not been signed out"
          description="Something went wrong while signing you out. Please try signing out again."
        />
      </div>
    </PageShell>
  );
}

const meta: Meta<typeof UserSignOutFailed> = {
  title: "users/user-sign-out/failed",
  component: UserSignOutFailed,
  parameters: { layout: "fullscreen", page: "user-sign-out", route: "/sign-out", state: "failed" },
};

export default meta;

export const Failed: StoryObj<typeof UserSignOutFailed> = {};
