import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { page, row, stack } from "../app/layout";
import { NotFound } from "../app/not-found";
import { useScreenTitle } from "../app/screen-title";

/** The two notices the service defines; any other name is a page that does not exist. */
export type NoticeId = "authFailure" | "deactivatedOwnAccount";

export function isNoticeId(value: string): value is NoticeId {
  return value === "authFailure" || value === "deactivatedOwnAccount";
}

/** `/notice/:noticeId` — user-notice · default, sign-in-failed, not-found. */
export function NoticeScreen({ noticeId }: { readonly noticeId: string }) {
  if (!isNoticeId(noticeId)) return <NotFound />;
  return noticeId === "authFailure" ? <SignInFailed /> : <DeactivatedOwnAccount />;
}

/** A sign-in that did not let the person in, whatever the reason (R-4.4, R-4.1, R-4.6). */
function SignInFailed() {
  useScreenTitle("Notice");
  return (
    <div style={page}>
      <div style={stack} data-testid="notice-sign-in-failed">
        <Heading level={1}>Sign in failed</Heading>
        <Text elementType="p">We could not sign you in. Please try again.</Text>
      </div>
      <div style={row}>
        <Link href="/sign-in" isButton buttonVariant="primary">
          Try signing in again
        </Link>
        <Link href="/" isButton buttonVariant="secondary" data-testid="notice-back-to-home">
          Back to home
        </Link>
      </div>
    </div>
  );
}

/** Where a person lands after deactivating their own account (R-4.9, R-4.5). */
function DeactivatedOwnAccount() {
  useScreenTitle("Notice");
  return (
    <div style={page}>
      <div style={stack} data-testid="notice-deactivated-own-account">
        <Heading level={1}>Your account has been deactivated</Heading>
        <Text elementType="p">
          You have deactivated your Digital Marketplace account and have been signed out.
        </Text>
        <Text elementType="p">You can reactivate your account at any time by signing in again.</Text>
      </div>
      <div>
        <Link href="/" isButton buttonVariant="primary" data-testid="notice-back-to-home">
          Back to home
        </Link>
      </div>
    </div>
  );
}
