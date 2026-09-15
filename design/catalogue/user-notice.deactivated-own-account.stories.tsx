import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup, Link } from "@bcgov/design-system-react-components";
import { PageHeading, PageShell, Paragraph } from "./users.shared";

const ids = {
  back_to_home: "user-notice__back_to_home",
  deactivated_own_account_notice: "user-notice__deactivated_own_account_notice",
  sign_in_failed_notice: "user-notice__sign_in_failed_notice",
} as const;

// /notice/deactivatedOwnAccount — R-4.9, R-4.5: shown after a person deactivates their own
// account and is signed out.
function UserNoticeDeactivatedOwnAccount() {
  return (
    <PageShell>
      <PageHeading>Account Deactivated</PageHeading>
      <Paragraph data-testid={ids.deactivated_own_account_notice}>
        You have deactivated your Digital Marketplace account and have been signed out. You can reactivate your account
        at any time by signing in again.
      </Paragraph>
      <ButtonGroup>
        <Link href="/" data-testid={ids.back_to_home}>
          Back to home
        </Link>
      </ButtonGroup>
    </PageShell>
  );
}

const meta: Meta<typeof UserNoticeDeactivatedOwnAccount> = {
  title: "users/user-notice/deactivated-own-account",
  component: UserNoticeDeactivatedOwnAccount,
  parameters: {
    layout: "fullscreen",
    page: "user-notice",
    route: "/notice/deactivatedOwnAccount",
    state: "deactivated-own-account",
  },
};

export default meta;

export const DeactivatedOwnAccount: StoryObj<typeof UserNoticeDeactivatedOwnAccount> = {};
