import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import {
  OrganizationViewer,
  compareByLegalName,
  listOffersDetailColumns,
  listOffersRegistration,
  pageOf,
} from "@rules/organizations";
import { fileAddress } from "../api/files";
import { ListedOrganization, fetchOrganizations } from "../api/organizations";
import { useSession } from "../auth/session";
import { Loading, useLoadingShown } from "../app/loading";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";

/**
 * The organization list, at `/organizations` (organization-list).
 *
 * Anyone may browse it: every organization that has not been archived, by legal name, fifty to a
 * page, a page past the last showing the first (R-3.1). Each row shows the organization's logo,
 * which anyone may see (R-8.28), and its legal name. Vendors and administrators are offered the
 * owner, team size and qualification columns, filled only where the service tells them — every
 * row for an administrator, the rows a vendor owns or administers — and only those rows link to
 * the organization's management page (R-3.3, R-3.21). A vendor is offered Create organization
 * and My organizations (R-3.2).
 */

const TITLE = "Digital Marketplace Organizations";

// Owner, team size and the two qualification marks.
const DETAIL_COLUMNS = 4;

const cell = {
  textAlign: "start",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

// Keeps a logo inside its column. Not spacing: the files domain's image rule.
const image = { maxWidth: "100%", height: "auto" } as const;

export function OrganizationListScreen() {
  useScreenTitle(TITLE);
  const session = useSession();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const viewer: OrganizationViewer | null = session.status === "signed-in" ? session.account : null;
  const settled = session.status !== "starting";
  const viewerId = viewer?.id ?? null;
  const [answer, setAnswer] = useState<readonly ListedOrganization[] | "loading" | "refused" | "failed">("loading");

  // Asked once it is known whom the list is for, since what the service tells depends on it.
  useEffect(() => {
    if (!settled) return;
    let current = true;
    setAnswer("loading");
    void fetchOrganizations().then((found) => {
      if (!current) return;
      setAnswer(found.kind === "listed" ? [...found.organizations].sort(compareByLegalName) : found.kind);
    });
    return () => {
      current = false;
    };
  }, [settled, viewerId]);

  const loading = answer === "loading";
  const loadingShown = useLoadingShown(loading);
  if (loading) {
    if (!loadingShown) return null;
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLE}</Heading>
        <Loading label="Loading organizations…" />
      </Stack>
    );
  }
  if (answer === "refused") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLE}</Heading>
        <div data-testid="organization-list-refused">
          <TitledAlert variant="danger" role="alert" title="You are not permitted to see these organizations">
            <Text elementType="p">Only a signed-in vendor can see the organizations they act for.</Text>
          </TitledAlert>
        </div>
      </Stack>
    );
  }
  if (answer === "failed") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLE}</Heading>
        <InlineAlert variant="danger" role="alert" title="The organizations could not be loaded" description="Try again in a moment." />
      </Stack>
    );
  }

  const detailed = listOffersDetailColumns(viewer);
  const { page, pageCount, items } = pageOf(answer, search.page);
  const caption = !detailed
    ? "Registered organizations by legal name."
    : viewer?.type === "ADMIN"
      ? "Registered organizations by legal name. Archived organizations are not listed."
      : "Registered organizations by legal name. Owner, team size and qualification are shown only for organizations you own or administer.";

  return (
    <Stack gap="large">
      <Heading level={1}>{TITLE}</Heading>
      {listOffersRegistration(viewer) ? (
        <Stack direction="row" align="center" gap="medium">
          <Link href="/organizations/create" isButton buttonVariant="primary" data-testid="organization-create-link">
            Create organization
          </Link>
          <Link href="/users/me?tab=organizations" isButton buttonVariant="secondary" data-testid="organization-list-my-organizations">
            My organizations
          </Link>
        </Stack>
      ) : null}
      <div role="region" aria-labelledby="organization-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption id="organization-list-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">
              {caption}
            </Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>
                Organization
              </th>
              {detailed ? (
                <>
                  <th scope="col" style={cell}>
                    Owner
                  </th>
                  <th scope="col" style={cell}>
                    Team size
                  </th>
                  <th scope="col" style={cell}>
                    Sprint With Us qualified
                  </th>
                  <th scope="col" style={cell}>
                    Team With Us qualified
                  </th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((organization) => (
              <Row key={organization.id} organization={organization} detailed={detailed} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} />
    </Stack>
  );
}

/**
 * One organization. A row whose owner, team size and qualification the viewer is not told holds
 * its name alone, in one cell across the table, so it carries no empty cells to be read as a
 * blank owner or mark (R-3.21; decision record 0048). It looks the same as empty cells would.
 */
function Row({ organization, detailed }: { organization: ListedOrganization; detailed: boolean }) {
  const details = organization.details;
  const name = <span data-testid="organization-list-name">{organization.legalName}</span>;
  const named = details ? (
    <Link href={`/organizations/${organization.id}/edit`} data-testid="organization-list-name-link">
      {name}
    </Link>
  ) : (
    name
  );
  return (
    <tr data-testid="organization-list-row">
      <td style={cell} colSpan={detailed && !details ? DETAIL_COLUMNS + 1 : undefined}>
        {organization.logoImageFile ? (
          <Stack gap="small" align="start">
            <img src={fileAddress(organization.logoImageFile)} alt={`${organization.legalName} logo`} style={image} />
            {named}
          </Stack>
        ) : (
          named
        )}
      </td>
      {detailed && details ? (
        <>
          <td style={cell}>
            <span data-testid="organization-list-owner">{details.ownerName}</span>
          </td>
          <td style={cell}>
            <span data-testid="organization-list-team-size">{details.numTeamMembers}</span>
          </td>
          <td style={cell}>
            <span data-testid="organization-swu-qualified-mark">{details.swuQualified ? "Yes" : "No"}</span>
          </td>
          <td style={cell}>
            <span data-testid="organization-twu-qualified-mark">{details.twuQualified ? "Yes" : "No"}</span>
          </td>
        </>
      ) : null}
    </tr>
  );
}

/** Links, not buttons, because each page has its own address (design/DESIGN.md, "Pagination"). */
function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <nav aria-label="Pages of organizations" data-testid="organization-list-pagination">
      <Stack as="ul" direction="row" gap="medium" align="center">
        <li>
          <Text>{`Page ${page} of ${pageCount}`}</Text>
        </li>
        {page > 1 ? (
          <li>
            <Link href={`/organizations?page=${page - 1}`} data-testid="organization-list-page-link">
              Previous page
            </Link>
          </li>
        ) : null}
        {pages.map((number) => (
          <li key={number}>
            <Link
              href={`/organizations?page=${number}`}
              aria-current={number === page ? "page" : undefined}
              aria-label={`Page ${number}`}
              data-testid="organization-list-page-link"
            >
              {String(number)}
            </Link>
          </li>
        ))}
        {page < pageCount ? (
          <li>
            <Link href={`/organizations?page=${page + 1}`} data-testid="organization-list-page-link">
              Next page
            </Link>
          </li>
        ) : null}
      </Stack>
    </nav>
  );
}
