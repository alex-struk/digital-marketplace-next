import { useEffect, useRef, useState } from "react";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { Stack } from "../app/page-layout";
import { Loading } from "../app/loading";
import { useScreenTitle } from "../app/screen-title";
import { type SignOutOutcome, signOut, useSession } from "../auth/session";

/**
 * Signed Out (user-sign-out). Opening it signs the person out of the service and of the
 * identity provider, and says so only once both have ended the session; if the service could
 * not be told, the person is told that instead and may still be signed in (R-4.17). When the
 * identity provider has to be visited to end its session, it sends the browser back here, to
 * a visitor; the service is asked again, finds nothing left to end, and the person is told it
 * is done.
 */
export function SignOutScreen() {
  const session = useSession();
  const [outcome, setOutcome] = useState<SignOutOutcome | null>(null);
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current || session.status === "starting") return;
    asked.current = true;
    void signOut().then(setOutcome);
  }, [session.status]);

  const failed = outcome === "failed";
  const done = outcome === "signed-out";
  useScreenTitle(failed ? "Sign Out Failed" : done ? "Signed Out" : "Signing Out");

  if (failed) {
    return (
      <Stack gap="large">
        <Heading level={1}>Sign Out Failed</Heading>
        <div data-testid="sign-out-failed">
          <InlineAlert
            variant="danger"
            role="alert"
            title="We could not sign you out"
            description="You may still be signed in. Try signing out again."
          />
        </div>
      </Stack>
    );
  }

  if (!done) {
    return (
      <Stack gap="large">
        <Heading level={1}>Signing Out</Heading>
        <Loading label="Signing you out…" />
      </Stack>
    );
  }

  return (
    <Stack gap="large">
      <Heading level={1}>Signed Out</Heading>
      <div data-testid="sign-out-success">
        <InlineAlert variant="success" role="status" title="You have successfully signed out" />
      </div>
      <Text elementType="p">
        <Link href="/sign-in">Sign in again</Link>
      </Text>
    </Stack>
  );
}
