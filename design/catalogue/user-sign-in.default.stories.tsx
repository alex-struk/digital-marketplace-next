import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "@bcgov/design-system-react-components";
import { AccountChoices, PageHeading, PageShell, Paragraph } from "./users.shared";

const ids = {
  sign_in_as_vendor: "user-sign-in__sign_in_as_vendor",
  sign_in_as_public_sector_employee: "user-sign-in__sign_in_as_public_sector_employee",
  go_to_sign_up: "user-sign-in__go_to_sign_up",
  vendor_card: "user-sign-in__vendor_card",
  public_sector_card: "user-sign-in__public_sector_card",
} as const;

function UserSignInDefault() {
  return (
    <PageShell>
      <PageHeading>Sign In</PageHeading>
      <Paragraph>Choose the kind of account you sign in with.</Paragraph>
      <AccountChoices
        ids={ids}
        verb="Sign in"
        vendorAction="sign_in_as_vendor"
        publicSectorAction="sign_in_as_public_sector_employee"
      />
      <Paragraph>
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" data-testid={ids.go_to_sign_up}>
          Sign up
        </Link>
      </Paragraph>
    </PageShell>
  );
}

const meta: Meta<typeof UserSignInDefault> = {
  title: "users/user-sign-in/default",
  component: UserSignInDefault,
  parameters: { layout: "fullscreen", page: "user-sign-in", route: "/sign-in", state: "default" },
};

export default meta;

export const Default: StoryObj<typeof UserSignInDefault> = {};
