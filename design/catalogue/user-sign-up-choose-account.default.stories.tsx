import type { Meta, StoryObj } from "@storybook/react";
import { AccountChoices, PageHeading, PageShell, Paragraph } from "./users.shared";

const ids = {
  sign_up_as_vendor: "user-sign-up-choose-account__sign_up_as_vendor",
  sign_up_as_public_sector_employee: "user-sign-up-choose-account__sign_up_as_public_sector_employee",
  vendor_card: "user-sign-up-choose-account__vendor_card",
  public_sector_card: "user-sign-up-choose-account__public_sector_card",
} as const;

function UserSignUpChooseAccountDefault() {
  return (
    <PageShell>
      <PageHeading>Choose Account Type</PageHeading>
      <Paragraph>Your account is created the first time you sign in. Choose the kind of account that fits you.</Paragraph>
      <AccountChoices
        ids={ids}
        verb="Sign up"
        vendorAction="sign_up_as_vendor"
        publicSectorAction="sign_up_as_public_sector_employee"
      />
    </PageShell>
  );
}

const meta: Meta<typeof UserSignUpChooseAccountDefault> = {
  title: "users/user-sign-up-choose-account/default",
  component: UserSignUpChooseAccountDefault,
  parameters: { layout: "fullscreen", page: "user-sign-up-choose-account", route: "/sign-up", state: "default" },
};

export default meta;

export const Default: StoryObj<typeof UserSignUpChooseAccountDefault> = {};
