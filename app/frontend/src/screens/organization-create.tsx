import { Heading, Text } from "@bcgov/design-system-react-components";
import { mayRegisterOrganization } from "@rules/organizations";
import { createOrganization } from "../api/organizations";
import { useSession } from "../auth/session";
import { useGoTo } from "../app/go-to";
import { Loading, useLoadingShown } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { EMPTY_PROFILE, OrganizationForm } from "./organization-form";

/**
 * Registering an organization, at `/organizations/create` (organization-create). Only a vendor
 * who has accepted the terms may; anyone else is shown the missing page (R-3.2; design/DESIGN.md,
 * organizations gap 3). The registrant becomes the owner and is taken to the new organization's
 * management page (R-3.23).
 */
export function OrganizationCreateScreen() {
  const session = useSession();
  const loadingShown = useLoadingShown(session.status === "starting");
  if (session.status === "starting") {
    if (!loadingShown) return null;
    return (
      <Stack gap="large">
        <Heading level={1}>Create Organization</Heading>
        <Loading label="Loading…" />
      </Stack>
    );
  }
  if (session.status !== "signed-in" || !mayRegisterOrganization(session.account)) return <NotFound />;
  return <CreateOrganization ownerName={session.account.name} />;
}

function CreateOrganization({ ownerName }: { ownerName: string }) {
  useScreenTitle("Create Organization");
  const goTo = useGoTo();
  return (
    <Stack gap="large">
      <Heading level={1}>Create Organization</Heading>
      <Text elementType="p">You will be the organization’s owner. Fields not marked “(optional)” are required.</Text>
      <OrganizationForm
        kind="create"
        initial={EMPTY_PROFILE}
        storedLogo={null}
        ownerName={ownerName}
        save={(profile, logo) => createOrganization(profile, logo)}
        onSaved={(organization) => goTo(`/organizations/${organization.id}/edit`)}
        onCancel={() => goTo("/organizations")}
      />
    </Stack>
  );
}
