import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { Heading } from "@bcgov/design-system-react-components";
import { safeReturnAddress } from "@rules/users";
import { page } from "../app/layout";
import { LoadingStatus } from "../app/loading-status";
import type { User } from "../api/users";
import { useCurrentAddress, useSession } from "./session";

/** The sign-in screen, set to bring the person back to `returnTo` afterwards (R-4.22). */
export function signInAddressFor(returnTo: string): string {
  const safe = safeReturnAddress(returnTo);
  return safe ? `/sign-in?${new URLSearchParams({ redirectOnSuccess: safe }).toString()}` : "/sign-in";
}

/**
 * A screen only a signed-in person may open. Anyone else is sent to sign in, and brought
 * back here once they have (R-4.22, R-4.23).
 */
export function RequireSignIn({
  title,
  children,
}: {
  /** The screen's own heading, shown while the app finds out who is asking. */
  readonly title: string;
  readonly children: (user: User) => ReactNode;
}) {
  const { session } = useSession();
  const router = useRouter();
  const address = useCurrentAddress();
  // The address this screen was opened at. Once the browser is on its way to sign in, the
  // address changes while this screen is still on the page, and that is not somewhere to
  // come back to.
  const openedAt = useRef(address);
  const sent = useRef(false);

  useEffect(() => {
    if (session.status !== "signed-out" || sent.current) return;
    sent.current = true;
    router.history.replace(signInAddressFor(openedAt.current));
  }, [session.status, router]);

  if (session.status !== "signed-in") {
    return (
      <div style={page}>
        <Heading level={1}>{title}</Heading>
        <LoadingStatus label="Checking who is signed in" text="Checking who is signed in…" />
      </div>
    );
  }
  return <>{children(session.user)}</>;
}
