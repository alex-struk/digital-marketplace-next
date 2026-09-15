import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup, Link } from "@bcgov/design-system-react-components";
import { PageHeading, PageShell, Paragraph } from "./users.shared";

const ids = {
  back_to_home: "user-notice__back_to_home",
  deactivated_own_account_notice: "user-notice__deactivated_own_account_notice",
  sign_in_failed_notice: "user-notice__sign_in_failed_notice",
} as const;

// /notice/authFailure — R-4.1, R-4.4, R-4.6: every refused sign-in lands here, and the notice
// deliberately does not say why.
function UserNoticeDefault() {
  return (
    <PageShell>
      <PageHeading>Sign In Failed</PageHeading>
      <Paragraph data-testid={ids.sign_in_failed_notice}>
        Something went wrong and you could not be signed in. Please try again.
      </Paragraph>
      <ButtonGroup>
        <Link href="/" data-testid={ids.back_to_home}>
          Back to home
        </Link>
      </ButtonGroup>
    </PageShell>
  );
}

const meta: Meta<typeof UserNoticeDefault> = {
  title: "users/user-notice/default",
  component: UserNoticeDefault,
  parameters: { layout: "fullscreen", page: "user-notice", route: "/notice/authFailure", state: "default" },
};

export default meta;

export const Default: StoryObj<typeof UserNoticeDefault> = {};
