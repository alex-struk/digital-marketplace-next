import { useEffect, useRef, useState } from "react";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { endCurrentSession } from "../api/users";
import { page } from "../app/layout";
import { LoadingStatus } from "../app/loading-status";
import { useScreenTitle } from "../app/screen-title";
import { signOutAddress } from "../auth/pkce";
import { useSession } from "../auth/session";
import { readTokens } from "../auth/tokens";

type Stage = "signing-out" | "signed-out" | "failed";

/**
 * `/sign-out` — signing out of the service and the identity provider (R-4.17).
 *
 * With a session in the browser, the service is asked to end it first; if it cannot be, the
 * person is told so and stays signed in. Once it has, the tokens leave the browser and the
 * browser goes to the identity provider to end its session there, which sends it back here
 * with nobody signed in — and then the person is told they have signed out.
 */
export function SignOutScreen() {
  const { session, signedOut } = useSession();
  const [stage, setStage] = useState<Stage>(() =>
    readTokens() ? "signing-out" : "signed-out",
  );
  const started = useRef(false);
  useScreenTitle(
    stage === "signed-out" ? "Signed Out" : stage === "failed" ? "Sign Out Failed" : "Signing Out",
  );

  useEffect(() => {
    if (stage !== "signing-out" || started.current) return;
    if (session.status === "loading") return;
    started.current = true;
    void (async () => {
      const idToken = readTokens()?.idToken ?? null;
      if (!(await endCurrentSession())) {
        started.current = false;
        setStage("failed");
        return;
      }
      signedOut();
      window.location.replace(await signOutAddress(idToken, "/sign-out"));
    })();
  }, [stage, session.status, signedOut]);

  if (stage === "failed") {
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

  if (stage === "signing-out") {
    return (
      <div style={page}>
        <Heading level={1}>Signing Out</Heading>
        <LoadingStatus label="Signing out" text="Signing you out…" />
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
