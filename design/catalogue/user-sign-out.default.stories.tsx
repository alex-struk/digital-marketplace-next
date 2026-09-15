import type { Meta, StoryObj } from "@storybook/react";
import { PageHeading, PageShell } from "./users.shared";

const ids = {
  signed_out_message: "user-sign-out__signed_out_message",
  sign_out_failed_message: "user-sign-out__sign_out_failed_message",
} as const;

function UserSignOutDefault() {
  return (
    <PageShell>
      <PageHeading>Signed Out</PageHeading>
      <p role="status" style={{ margin: 0 }} data-testid={ids.signed_out_message}>
        You have successfully signed out. Thank you for using the Digital Marketplace.
      </p>
    </PageShell>
  );
}

const meta: Meta<typeof UserSignOutDefault> = {
  title: "users/user-sign-out/default",
  component: UserSignOutDefault,
  parameters: { layout: "fullscreen", page: "user-sign-out", route: "/sign-out", state: "default" },
};

export default meta;

export const Default: StoryObj<typeof UserSignOutDefault> = {};
