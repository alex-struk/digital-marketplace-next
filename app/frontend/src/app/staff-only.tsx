import { ReactNode } from "react";
import { Heading } from "@bcgov/design-system-react-components";
import { mayCreateOpportunity } from "@rules/opportunities";
import type { Account } from "../api/accounts";
import { useSession } from "../auth/session";
import { Stack } from "./page-layout";
import { Loading, useLoadingShown } from "./loading";
import { NotFound } from "./not-found";

/**
 * A screen for public sector staff and administrators alone. Anybody else who reaches it — a
 * vendor, a visitor who has not signed in — is shown the not-found screen, which never says "not
 * allowed" (R-1.7; design/DESIGN.md, opportunities, "Not found and refused").
 */
export function StaffOnly({
  title,
  loadingLabel = "Loading…",
  children,
}: {
  title: string;
  loadingLabel?: string;
  children: (account: Account) => ReactNode;
}) {
  const session = useSession();
  // Nothing is drawn until it is known who is asking, unless that takes long enough to say so
  // (decision record 0039).
  const loadingShown = useLoadingShown(session.status === "starting");
  if (session.status === "starting") {
    if (!loadingShown) return null;
    return (
      <Stack gap="large">
        <Heading level={1}>{title}</Heading>
        <Loading label={loadingLabel} />
      </Stack>
    );
  }
  if (session.status === "signed-in" && mayCreateOpportunity(session.account)) return <>{children(session.account)}</>;
  return <NotFound />;
}
