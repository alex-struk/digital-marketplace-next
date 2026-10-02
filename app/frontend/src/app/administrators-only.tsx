import { ReactNode } from "react";
import { Heading } from "@bcgov/design-system-react-components";
import { mayManagePages } from "@rules/content";
import type { Account } from "../api/accounts";
import { useSession } from "../auth/session";
import { Stack } from "./page-layout";
import { Loading } from "./loading";
import { NotFound } from "./not-found";

/**
 * A screen of the content area. An administrator sees it; anybody else who reaches it directly —
 * a vendor, a public sector employee, a visitor who has not signed in — is shown the not-found
 * screen, and nothing is asked of the service (R-7.6).
 */
export function AdministratorsOnly({
  title,
  loadingLabel,
  children,
}: {
  title: string;
  loadingLabel: string;
  children: (administrator: Account) => ReactNode;
}) {
  const session = useSession();
  if (session.status === "starting") {
    return (
      <Stack gap="large">
        <Heading level={1}>{title}</Heading>
        <Loading label={loadingLabel} />
      </Stack>
    );
  }
  if (session.status === "signed-in" && mayManagePages(session.account)) {
    return <>{children(session.account)}</>;
  }
  return <NotFound />;
}
