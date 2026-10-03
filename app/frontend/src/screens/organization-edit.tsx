import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { mayChangeOrganization } from "@rules/organizations";
import type { Account } from "../api/accounts";
import { fileAddress } from "../api/files";
import {
  Organization,
  archiveOrganization,
  fetchOrganization,
  updateOrganizationProfile,
} from "../api/organizations";
import { useSession } from "../auth/session";
import { useGoTo } from "../app/go-to";
import { term } from "../app/layout";
import { Loading, useLoadingShown } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { FIELD_TEST_IDS, OrganizationForm, valuesOf } from "./organization-form";
import { ChangelogTab, TeamTab } from "./organization-team";
import { SwuQualificationTab, TwuQualificationTab } from "./organization-qualification";

/**
 * An organization's management page, at `/organizations/:orgId/edit` (organization-edit).
 *
 * Opened by a service administrator and by the organization's owner and administrators; anyone
 * else, and anyone at an archived or unknown organization, is shown the missing page (R-3.3).
 * The Organization tab shows the profile read-only, and offers Edit and Archive to the owner and
 * a service administrator alone; an organization administrator who is not the owner sees the
 * profile with neither control (R-3.18). The Team members and Changelog tabs are in
 * `organization-team.tsx` (slice 12), and the two qualification tabs in
 * `organization-qualification.tsx` (slice 13).
 */

type Tab = "organization" | "team" | "swu-qualification" | "twu-qualification" | "changelog";

const TABS: readonly { readonly tab: Tab; readonly label: string }[] = [
  { tab: "organization", label: "Organization" },
  { tab: "team", label: "Team members" },
  { tab: "swu-qualification", label: "Sprint With Us qualification" },
  { tab: "twu-qualification", label: "Team With Us qualification" },
  { tab: "changelog", label: "Changelog" },
];

function tabOf(asked: unknown): Tab {
  return TABS.find((entry) => entry.tab === asked)?.tab ?? "organization";
}

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

// Keeps a logo inside its column. Not spacing: the files domain's image rule.
const image = { maxWidth: "100%", height: "auto" } as const;

export function OrganizationEditScreen({ orgId }: { orgId: string }) {
  const session = useSession();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [answer, setAnswer] = useState<Organization | "loading" | "missing" | "failed">("loading");
  const viewer = session.status === "signed-in" ? session.account : null;
  const viewerId = viewer?.id ?? null;
  const settled = session.status !== "starting";

  useEffect(() => {
    if (!settled || !viewerId) return;
    let current = true;
    setAnswer("loading");
    void fetchOrganization(orgId).then((found) => {
      if (!current) return;
      setAnswer(found.kind === "found" ? found.organization : found.kind);
    });
    return () => {
      current = false;
    };
  }, [orgId, settled, viewerId]);

  const loading = !settled || (viewer !== null && answer === "loading");
  const loadingShown = useLoadingShown(loading);
  if (loading) {
    if (!loadingShown) return null;
    return (
      <Stack gap="large">
        <Heading level={1}>Edit Organization</Heading>
        <Loading label="Loading organization…" />
      </Stack>
    );
  }
  if (!viewer || answer === "missing" || answer === "loading") return <NotFound />;
  if (answer === "failed") return <Failed />;
  if (!answer.active) return <NotFound />;
  return <ManageOrganization viewer={viewer} organization={answer} tab={tabOf(search.tab)} onChanged={setAnswer} />;
}

function Failed() {
  useScreenTitle("Edit Organization");
  return (
    <Stack gap="large">
      <Heading level={1}>Edit Organization</Heading>
      <TitledAlert variant="danger" role="alert" title="The organization could not be loaded">
        <Text elementType="p">Try again in a moment.</Text>
      </TitledAlert>
    </Stack>
  );
}

function ManageOrganization({
  viewer,
  organization,
  tab,
  onChanged,
}: {
  viewer: Account;
  organization: Organization;
  tab: Tab;
  onChanged: (organization: Organization) => void;
}) {
  useScreenTitle("Edit Organization");
  const base = `/organizations/${organization.id}/edit`;
  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          Edit Organization
        </Text>
        <Heading level={1}>{organization.legalName}</Heading>
      </Stack>
      <Stack direction="row" align="center" gap="medium">
        {organization.swuQualified ? (
          <span style={badge} data-testid="organization-swu-qualified-badge">
            Sprint With Us qualified
          </span>
        ) : null}
        {organization.twuQualified ? (
          <span style={badge} data-testid="organization-twu-qualified-badge">
            Team With Us qualified
          </span>
        ) : null}
        <Text elementType="p" size="small" color="secondary">
          Organization ID: <span data-testid="organization-identifier">{organization.id}</span>
        </Text>
      </Stack>
      <nav aria-label="Organization sections">
        <Stack as="ul" direction="row" gap="medium" align="center">
          {TABS.map((entry) => (
            <li key={entry.tab}>
              <Link
                href={`${base}?tab=${entry.tab}`}
                aria-current={entry.tab === tab ? "page" : undefined}
                data-testid={`organization-tab-${entry.tab}`}
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </Stack>
      </nav>
      {tab === "organization" ? (
        <OrganizationTab viewer={viewer} organization={organization} onChanged={onChanged} />
      ) : tab === "team" ? (
        <TeamTab viewer={viewer} organization={organization} onChanged={onChanged} />
      ) : tab === "swu-qualification" ? (
        <SwuQualificationTab organization={organization} />
      ) : tab === "twu-qualification" ? (
        <TwuQualificationTab viewer={viewer} organization={organization} onChanged={onChanged} />
      ) : (
        <ChangelogTab organization={organization} />
      )}
    </Stack>
  );
}

function OrganizationTab({
  viewer,
  organization,
  onChanged,
}: {
  viewer: Account;
  organization: Organization;
  onChanged: (organization: Organization) => void;
}) {
  const [editing, setEditing] = useState(false);
  const mayChange = mayChangeOrganization(viewer, organization.viewerMembership);

  if (editing && mayChange) {
    return (
      <OrganizationForm
        kind="edit"
        initial={valuesOf(organization)}
        storedLogo={organization.logoImageFile}
        ownerName={organization.legalName}
        save={(profile, logo) => updateOrganizationProfile(organization.id, profile, logo)}
        onSaved={(saved) => {
          onChanged(saved);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
      <Stack as="section" aria-labelledby="tab-heading" gap="medium">
        <Heading level={2} id="tab-heading">
          Organization
        </Heading>
        {mayChange ? (
          <div>
            <Button variant="primary" onPress={() => setEditing(true)} data-testid="organization-edit-button">
              Edit organization
            </Button>
          </div>
        ) : (
          <Text elementType="p">Only the organization’s owner can change these details.</Text>
        )}
        {organization.logoImageFile ? (
          <Stack role="group" aria-labelledby="logo-label" gap="small" align="start">
            <Text elementType="p" id="logo-label">
              Logo
            </Text>
            <img
              src={fileAddress(organization.logoImageFile)}
              alt={`${organization.legalName} logo`}
              style={image}
              data-testid="organization-current-logo"
            />
          </Stack>
        ) : (
          <Text elementType="p" size="small" color="secondary">
            No logo has been added.
          </Text>
        )}
        <Stack as="dl" gap="medium">
          <ReadOnly organization={organization} field="legalName" label="Legal name" />
          <ReadOnly organization={organization} field="websiteUrl" label="Website" />
        </Stack>
        <Heading level={3}>Address</Heading>
        <Stack as="dl" gap="medium">
          <ReadOnly organization={organization} field="streetAddress1" label="Street address" />
          <ReadOnly organization={organization} field="streetAddress2" label="Address line 2" />
          <ReadOnly organization={organization} field="city" label="City" />
          <ReadOnly organization={organization} field="region" label="Province or state" />
          <ReadOnly organization={organization} field="mailCode" label="Postal code or ZIP code" />
          <ReadOnly organization={organization} field="country" label="Country" />
        </Stack>
        <Heading level={3}>Contact</Heading>
        <Stack as="dl" gap="medium">
          <ReadOnly organization={organization} field="contactName" label="Contact name" />
          <ReadOnly organization={organization} field="contactTitle" label="Contact title" />
          <ReadOnly organization={organization} field="contactEmail" label="Contact email address" />
          <ReadOnly organization={organization} field="contactPhone" label="Contact phone number" />
        </Stack>
        {/* Inside the tab's section, so the tab reads as offering both Edit and Archive (R-3.18). */}
        {mayChange ? <ArchiveSection viewer={viewer} organization={organization} /> : null}
      </Stack>
  );
}

/**
 * One profile field, read-only: its label and its value as text, so the value is part of what the
 * tab reads as and not only the content of a box (decision record 0048). An empty field says so.
 */
function ReadOnly({
  organization,
  field,
  label,
}: {
  organization: Organization;
  field: keyof typeof FIELD_TEST_IDS;
  label: string;
}) {
  const value = organization[field];
  return (
    <Stack gap="small">
      <dt style={term}>{label}</dt>
      <dd data-testid={FIELD_TEST_IDS[field]}>{value ? value : "Not entered"}</dd>
    </Stack>
  );
}

/**
 * Archiving, by the owner or a service administrator (R-3.6, R-3.18). It asks first, saying what
 * archiving does, and — when a service administrator archives an organization — that its owner
 * will be emailed (R-3.24). Once archived, the organization has left the list it is taken to.
 */
function ArchiveSection({ viewer, organization }: { viewer: Account; organization: Organization }) {
  const goTo = useGoTo();
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState<readonly string[] | null>(null);

  async function archive() {
    if (working) return;
    setWorking(true);
    setFailed(null);
    const answer = await archiveOrganization(organization.id);
    setWorking(false);
    setAsking(false);
    if (answer.kind === "saved") {
      goTo("/organizations");
      return;
    }
    setFailed(answer.reasons);
  }

  const administratorArchiving = viewer.type === "ADMIN" && organization.viewerMembership?.membershipType !== "OWNER";

  return (
    <Stack as="section" aria-labelledby="archive-heading" gap="medium">
      <Heading level={3} id="archive-heading">
        Archive this organization
      </Heading>
      <Text elementType="p">
        An archived organization leaves the organization list and its members’ lists of organizations, and can no longer be
        used on proposals. Its records are kept.
      </Text>
      {failed ? (
        <TitledAlert variant="danger" role="alert" title="The organization could not be archived">
          <Text elementType="p">{failed.join(" ") || "Try again in a moment."}</Text>
        </TitledAlert>
      ) : null}
      <div>
        <Button variant="secondary" danger onPress={() => setAsking(true)} data-testid="organization-archive-button">
          Archive organization
        </Button>
      </div>
      <Modal isOpen={asking} isDismissable onOpenChange={(open) => (working ? undefined : setAsking(open))}>
        <AlertDialog
          variant="destructive"
          title={`Archive ${organization.legalName}?`}
          data-testid="organization-archive-dialog"
          buttons={
            <>
              <Button variant="secondary" isDisabled={working} onPress={() => setAsking(false)} data-testid="organization-dialog-cancel">
                Cancel
              </Button>
              <Button
                variant="primary"
                danger
                isDisabled={working}
                onPress={() => void archive()}
                data-testid="organization-archive-confirm"
              >
                Archive organization
              </Button>
            </>
          }
        >
          <Stack gap="medium">
            <Text elementType="p">
              It will no longer appear in the organization list or in its members’ lists of organizations, and it cannot be used
              on proposals. Its records and memberships are kept.
            </Text>
            {administratorArchiving ? (
              <Text elementType="p">
                {organization.ownerName
                  ? `${organization.ownerName}, the owner, will be emailed that an administrator has archived it.`
                  : "The owner will be emailed that an administrator has archived it."}
              </Text>
            ) : null}
          </Stack>
        </AlertDialog>
      </Modal>
    </Stack>
  );
}
