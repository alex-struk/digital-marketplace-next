import { ReactNode } from "react";
import { Heading } from "@bcgov/design-system-react-components";
import { mayCreateOpportunity } from "@rules/opportunities";
import type { Account } from "../api/accounts";
import { useSession } from "../auth/session";
import { page } from "./layout";
import { Loading } from "./loading";
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
  if (session.status === "starting") {
    return (
      <div style={page}>
        <Heading level={1}>{title}</Heading>
        <Loading label={loadingLabel} />
      </div>
    );
  }
  if (session.status === "signed-in" && mayCreateOpportunity(session.account)) return <>{children(session.account)}</>;
  return <NotFound />;
}
