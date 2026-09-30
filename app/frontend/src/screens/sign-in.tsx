import { useEffect } from "react";
import { Button, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { useSearch } from "@tanstack/react-router";
import { DASHBOARD, returnPathFrom } from "@rules/sign-in";
import { page } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { beginSignIn, useSession } from "../auth/session";
import { useGoTo } from "../app/go-to";

const card = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

/** The page sign-in began from, carried on the sign-in address (R-4.22). */
function useReturnPath(): string | null {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  return returnPathFrom(search.redirectOnSuccess);
}

/** A person who is already signed in has nothing to do here, and goes on to their dashboard. */
function useOnwardIfSignedIn(returnTo: string | null): void {
  const session = useSession();
  const goTo = useGoTo();
  useEffect(() => {
    if (session.status === "signed-in") {
      goTo(returnTo ?? DASHBOARD);
    }
  }, [session.status, returnTo, goTo]);
}

/**
 * Said when a page that needs signing in sent the person here (user-profile-self ·
 * sign-in-required): they will be brought back to it afterwards (R-4.17, R-4.22).
 */
function SignInRequired({ returnTo }: { returnTo: string }) {
  const toProfile = returnTo.split(/[?#]/)[0]?.startsWith("/users/") ?? false;
  return (
    <div data-testid="sign-in-required">
      <InlineAlert
        variant="info"
        role="status"
        title={toProfile ? "Sign in to see your profile" : "Sign in to see that page"}
        description={
          toProfile
            ? "Once you have signed in you will be taken back to your profile."
            : "Once you have signed in you will be taken back to the page you were on."
        }
      />
    </div>
  );
}

/**
 * Sign In (user-sign-in · default). One card for each way in; which one a person uses decides
 * the kind of account a first sign-in makes (R-4.1).
 */
export function SignInScreen() {
  useScreenTitle("Sign In");
  const returnTo = useReturnPath();
  useOnwardIfSignedIn(returnTo);
  const signInAs = (provider: "vendor" | "public-sector") => {
    void beginSignIn({ provider, returnTo });
  };

  return (
    <div style={page}>
      <Heading level={1}>Sign In</Heading>
      {returnTo ? <SignInRequired returnTo={returnTo} /> : null}
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
            data-testid="sign-in-vendor-button"
            onPress={() => signInAs("vendor")}
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
            data-testid="sign-in-public-sector-button"
            onPress={() => signInAs("public-sector")}
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

/**
 * Choose Account Type (user-sign-up-choose-account · default). Signing up is signing in for
 * the first time: the account is made then, and its kind follows the identity used (R-4.1).
 */
export function SignUpScreen() {
  useScreenTitle("Choose Account Type");
  const returnTo = useReturnPath();
  useOnwardIfSignedIn(returnTo);
  const signUpAs = (provider: "vendor" | "public-sector") => {
    void beginSignIn({ provider, returnTo });
  };

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
            data-testid="sign-up-vendor-button"
            onPress={() => signUpAs("vendor")}
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
            data-testid="sign-up-public-sector-button"
            onPress={() => signUpAs("public-sector")}
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
