import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · twu-qualification — the owner on the Team With Us qualification tab: approved for one service
// area, terms not yet accepted, so not qualified; the owner is shown the approved areas and offered no way to change
// them (R-3.26, R-3.28)
// Service area names are illustrative: the spec does not carry the service's list.
const meta: Meta = { title: "organizations/organization-edit/twu-qualification" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const TwuQualification: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
          <Heading level={1}>Northwind Digital Co-operative</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p" size="small" color="secondary">
            Organization ID: <span data-testid="organization-identifier">{orgId}</span>
          </Text>
        </Stack>
        <nav aria-label="Organization sections">
          <Stack as="ul" direction="row" gap="medium" align="center">
            <li><Link href={`${base}?tab=organization`} data-testid="organization-tab-organization">Organization</Link></li>
            <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
            <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
            <li><Link href={`${base}?tab=twu-qualification`} aria-current="page" data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
            <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
          </Stack>
        </nav>
        <Stack as="section" aria-labelledby="tab-heading" gap="medium">
          <Heading level={2} id="tab-heading">Team With Us qualification</Heading>
          <div data-testid="organization-not-qualified-notice">
            <InlineAlert
              variant="info"
              title="This organization is not qualified for Team With Us"
              description="It can propose on Team With Us opportunities once every requirement below is met."
            />
          </div>
          <Stack as="ul" gap="small" aria-label="Team With Us requirements">
            <li data-testid="organization-twu-requirement-service-area">
              <Stack direction="row" align="center" gap="small">
                <span style={badge}>Met</span> Approved for at least one service area
              </Stack>
            </li>
            <li data-testid="organization-twu-requirement-terms-accepted">
              <Stack direction="row" align="center" gap="small">
                <span style={badge}>Not met</span> Team With Us terms and conditions accepted
              </Stack>
            </li>
          </Stack>
          <Stack as="section" aria-labelledby="areas-heading" gap="medium">
            <Heading level={3} id="areas-heading">Approved service areas</Heading>
            <Text elementType="p">Only an administrator can change which service areas an organization is approved for.</Text>
            <ul>
              <li data-testid="organization-service-area">Full stack developer</li>
            </ul>
          </Stack>
          <Stack as="section" aria-labelledby="terms-heading" gap="medium">
            <Heading level={3} id="terms-heading">Terms and conditions</Heading>
            <Text elementType="p">The Team With Us terms and conditions have not been accepted for this organization.</Text>
            <Text elementType="p">
              <Link href={`/organizations/${orgId}/team-with-us-terms-and-conditions`} data-testid="organization-view-twu-terms-link">
                Read and accept the Team With Us terms and conditions
              </Link>
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
