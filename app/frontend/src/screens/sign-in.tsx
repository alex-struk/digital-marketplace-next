import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { page, stack } from "../app/layout";
import { LoadingStatus } from "../app/loading-status";
import { useScreenTitle } from "../app/screen-title";
import { beginSignIn } from "../auth/pkce";
import { useSession } from "../auth/session";

/**
 * The identity-provider hint for each kind of account: a vendor signs in with a
 * code-hosting identity and a public sector employee with a government one (R-4.1).
 */
export const VENDOR_PROVIDER = "github";
export const PUBLIC_SECTOR_PROVIDER = "idir";

const card = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

/** A person who is already signed in has nothing to do here, and goes to their dashboard. */
function useAwayIfSignedIn(): void {
  const { session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session.status === "signed-in") router.history.replace("/dashboard");
  }, [session.status, router]);
}

/** Starts signing in and shows nothing further: the browser is on its way to the identity provider. */
function useSignIn(returnTo: string | null) {
  const [leaving, setLeaving] = useState(false);
  return {
    leaving,
    signIn: (provider: string) => {
      setLeaving(true);
      void beginSignIn(provider, returnTo).catch(() => setLeaving(false));
    },
  };
}

/** `/sign-in` — user-sign-in · default (R-4.1, R-4.22). */
export function SignInScreen({ returnTo }: { readonly returnTo: string | null }) {
  useScreenTitle("Sign In");
  useAwayIfSignedIn();
  const { leaving, signIn } = useSignIn(returnTo);
  return (
    <div style={page}>
      <Heading level={1}>Sign In</Heading>
      <Text elementType="p">Choose the kind of account you sign in with.</Text>
      <section aria-labelledby="sign-in-vendor-heading" style={card} data-testid="sign-in-vendor-card">
        <Heading level={2} id="sign-in-vendor-heading">
          Vendor
        </Heading>
        <Text elementType="p">
          Sign in with your code-hosting account to register organizations and submit proposals.
        </Text>
        <div>
          <Button
            variant="secondary"
            isDisabled={leaving}
            onPress={() => signIn(VENDOR_PROVIDER)}
            data-testid="sign-in-vendor-button"
          >
            Sign in as a vendor
          </Button>
        </div>
      </section>
      <section
        aria-labelledby="sign-in-public-sector-heading"
        style={card}
        data-testid="sign-in-public-sector-card"
      >
        <Heading level={2} id="sign-in-public-sector-heading">
          Public sector employee
        </Heading>
        <Text elementType="p">
          Sign in with your government account to create and manage opportunities.
        </Text>
        <div>
          <Button
            variant="secondary"
            isDisabled={leaving}
            onPress={() => signIn(PUBLIC_SECTOR_PROVIDER)}
            data-testid="sign-in-public-sector-button"
          >
            Sign in as a public sector employee
          </Button>
        </div>
      </section>
      <Text elementType="p">
        Don’t have an account?{" "}
        <Link href="/sign-up" data-testid="sign-in-go-to-sign-up">
          Sign up
        </Link>
      </Text>
    </div>
  );
}

/** `/sign-up` — user-sign-up-choose-account · default (R-4.1). */
export function SignUpScreen({ returnTo }: { readonly returnTo: string | null }) {
  useScreenTitle("Choose Account Type");
  useAwayIfSignedIn();
  const { leaving, signIn } = useSignIn(returnTo);
  return (
    <div style={page}>
      <Heading level={1}>Choose Account Type</Heading>
      <Text elementType="p">
        Your account is created the first time you sign in. The kind of account you get depends
        on how you sign in.
      </Text>
      <section aria-labelledby="sign-up-vendor-heading" style={card} data-testid="sign-up-vendor-card">
        <Heading level={2} id="sign-up-vendor-heading">
          Vendor
        </Heading>
        <Text elementType="p">
          For people who want to register organizations and submit proposals. You sign up with
          your code-hosting account.
        </Text>
        <div>
          <Button
            variant="secondary"
            isDisabled={leaving}
            onPress={() => signIn(VENDOR_PROVIDER)}
            data-testid="sign-up-vendor-button"
          >
            Sign up as a vendor
          </Button>
        </div>
      </section>
      <section
        aria-labelledby="sign-up-public-sector-heading"
        style={card}
        data-testid="sign-up-public-sector-card"
      >
        <Heading level={2} id="sign-up-public-sector-heading">
          Public sector employee
        </Heading>
        <Text elementType="p">
          For public sector staff who create and manage opportunities. You sign up with your
          government account.
        </Text>
        <div>
          <Button
            variant="secondary"
            isDisabled={leaving}
            onPress={() => signIn(PUBLIC_SECTOR_PROVIDER)}
            data-testid="sign-up-public-sector-button"
          >
            Sign up as a public sector employee
          </Button>
        </div>
      </section>
      <Text elementType="p">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </Text>
    </div>
  );
}

/**
 * `/auth/sign-in` — the contract's address for beginning sign-in (decision record 0003). It
 * sends the browser straight on to the identity provider with the hint and the return
 * address it was given.
 */
export function StartSignInScreen({
  provider,
  returnTo,
}: {
  readonly provider: string | null;
  readonly returnTo: string | null;
}) {
  useScreenTitle("Sign In");
  useEffect(() => {
    void beginSignIn(provider, returnTo);
  }, [provider, returnTo]);
  return (
    <div style={{ ...page, ...stack }}>
      <Heading level={1}>Sign In</Heading>
      <LoadingStatus label="Signing in" text="Taking you to sign in…" />
    </div>
  );
}
