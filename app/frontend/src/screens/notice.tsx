import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";

/** The notices the service defines; any other name is not found (surface.yaml, user-notice). */
export type NoticeId = "deactivatedOwnAccount" | "authFailure";

export function isNoticeId(value: string): value is NoticeId {
  return value === "deactivatedOwnAccount" || value === "authFailure";
}

/**
 * Notice (user-notice). `authFailure` is where every refused sign-in lands, and it names no
 * cause: an unrecognised identity, an account an administrator deactivated and an email address
 * another account holds all read the same (R-4.1, R-4.4, R-4.6). `deactivatedOwnAccount`
 * confirms a person's own deactivation (R-4.9).
 */
export function NoticeScreen({ noticeId }: { noticeId: string }) {
  if (!isNoticeId(noticeId)) return <NotFound />;
  return noticeId === "authFailure" ? <SignInFailed /> : <DeactivatedOwnAccount />;
}

function SignInFailed() {
  useScreenTitle("Sign in failed");
  return (
    <Stack gap="large">
      <Stack gap="medium" data-testid="notice-sign-in-failed">
        <Heading level={1}>Sign in failed</Heading>
        <Text elementType="p">We could not sign you in. Please try again.</Text>
      </Stack>
      <Stack direction="row" gap="medium">
        <Link href="/sign-in" isButton buttonVariant="primary">
          Try signing in again
        </Link>
        <Link href="/" isButton buttonVariant="secondary" data-testid="notice-back-to-home">
          Back to home
        </Link>
      </Stack>
    </Stack>
  );
}

function DeactivatedOwnAccount() {
  useScreenTitle("Your account has been deactivated");
  return (
    <Stack gap="large">
      <Stack gap="medium" data-testid="notice-deactivated-own-account">
        <Heading level={1}>Your account has been deactivated</Heading>
        <Text elementType="p">
          You have deactivated your Digital Marketplace account and have been signed out.
        </Text>
        <Text elementType="p">You can reactivate your account at any time by signing in again.</Text>
      </Stack>
      <div>
        <Link href="/" isButton buttonVariant="primary" data-testid="notice-back-to-home">
          Back to home
        </Link>
      </div>
    </Stack>
  );
}
