import { useEffect, useRef, useState } from "react";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { page } from "../app/layout";
import { Loading } from "../app/loading";
import { useScreenTitle } from "../app/screen-title";
import {
  type SignOutOutcome,
  signOut,
  signOutAtStartOutcome,
  signOutAtStartUnderWay,
  useSession,
} from "../auth/session";

/**
 * Signed Out (user-sign-out). Opening it signs the person out of the service and of the
 * identity provider, and says so only once both have ended the session; if the service could
 * not be told, the person is told that instead and may still be signed in (R-4.17). When the
 * identity provider has to be visited to end its session, it sends the browser back here, to
 * a visitor, who is told it is done. Opened as the app starts, the signing out is done before
 * the screen is first drawn (decision record 0018).
 */
export function SignOutScreen() {
  const session = useSession();
  // Opened directly, the person was signed out before this was first drawn, so it says at once
  // how that went (decision record 0018).
  const [outcome, setOutcome] = useState<SignOutOutcome | null>(signOutAtStartOutcome);
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current || outcome) return;
    const underWay = signOutAtStartUnderWay();
    if (underWay) {
      asked.current = true;
      void underWay.then(setOutcome);
      return;
    }
    if (session.status !== "signed-in" && session.status !== "refused") return;
    asked.current = true;
    void signOut().then(setOutcome);
  }, [session.status, outcome]);

  const failed = outcome === "failed";
  const done =
    outcome === "signed-out" ||
    (outcome === null && session.status === "visitor" && !signOutAtStartUnderWay());
  useScreenTitle(failed ? "Sign Out Failed" : done ? "Signed Out" : "Signing Out");

  if (failed) {
    return (
      <div style={page}>
        <Heading level={1}>Sign Out Failed</Heading>
        <div data-testid="sign-out-failed">
          <InlineAlert
            variant="danger"
            role="alert"
            title="We could not sign you out"
            description="You may still be signed in. Try signing out again."
          />
        </div>
      </div>
    );
  }

  if (!done) {
    return (
      <div style={page}>
        <Heading level={1}>Signing Out</Heading>
        <Loading label="Signing you out…" />
      </div>
    );
  }

  return (
    <div style={page}>
      <Heading level={1}>Signed Out</Heading>
      <div data-testid="sign-out-success">
        <InlineAlert variant="success" role="status" title="You have successfully signed out" />
      </div>
      <Text elementType="p">
        <Link href="/sign-in">Sign in again</Link>
      </Text>
    </div>
  );
}
