import { ReactNode, useEffect, useRef } from "react";
import { Heading } from "@bcgov/design-system-react-components";
import { useRouterState } from "@tanstack/react-router";
import { signInReturningTo } from "@rules/sign-in";
import type { Account } from "../api/accounts";
import { useSession } from "../auth/session";
import { page } from "./layout";
import { Loading } from "./loading";
import { useGoTo } from "./go-to";

/**
 * A screen only a signed-in person may see. A visitor is sent to sign in, and brought back
 * here afterwards (R-4.22); the screen is drawn with the account once it is known.
 */
export function RequireSignIn({
  title,
  loadingLabel = "Loading…",
  children,
}: {
  title: string;
  loadingLabel?: string;
  children: (account: Account) => ReactNode;
}) {
  const session = useSession();
  const goTo = useGoTo();
  const here = useRouterState({ select: (state) => state.location.href });
  // The address this screen was opened at. While the move to sign in is under way the router
  // already reports the sign-in address, and this screen must not send the person on again.
  const openedAt = useRef(here);

  useEffect(() => {
    if (session.status === "visitor") {
      goTo(signInReturningTo(openedAt.current));
    }
  }, [session.status, goTo]);

  if (session.status === "signed-in") return <>{children(session.account)}</>;
  return (
    <div style={page}>
      <Heading level={1}>{title}</Heading>
      <Loading label={loadingLabel} />
    </div>
  );
}
