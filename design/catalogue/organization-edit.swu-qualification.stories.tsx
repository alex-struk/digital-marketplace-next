import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · swu-qualification — the owner on the Sprint With Us qualification tab: two active members who
// between them hold every capability, but the terms not yet accepted, so the organization is not qualified (R-3.25)
const meta: Meta = { title: "organizations/organization-edit/swu-qualification" };
export default meta;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const SwuQualification: StoryObj = {
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
            <li><Link href={`${base}?tab=swu-qualification`} aria-current="page" data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
            <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
            <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
          </Stack>
        </nav>
        <Stack as="section" aria-labelledby="tab-heading" gap="medium">
          <Heading level={2} id="tab-heading">Sprint With Us qualification</Heading>
          <div data-testid="organization-not-qualified-notice">
            <InlineAlert
              variant="info"
              title="This organization is not qualified for Sprint With Us"
              description="It can propose on Sprint With Us opportunities once every requirement below is met."
            />
          </div>
          <Stack as="ul" gap="small" aria-label="Sprint With Us requirements">
            <li data-testid="organization-swu-requirement-two-members">
              <Stack direction="row" align="center" gap="small">
                <span style={badge}>Met</span> At least two active team members
              </Stack>
            </li>
            <li data-testid="organization-swu-requirement-all-capabilities">
              <Stack direction="row" align="center" gap="small">
                <span style={badge}>Met</span> Active team members between them hold every capability
              </Stack>
            </li>
            <li data-testid="organization-swu-requirement-terms-accepted">
              <Stack direction="row" align="center" gap="small">
                <span style={badge}>Not met</span> Sprint With Us terms and conditions accepted
              </Stack>
            </li>
          </Stack>
          <Text elementType="p">Invited people who have not yet accepted do not count towards team size or capabilities.</Text>
          <Stack as="section" aria-labelledby="terms-heading" gap="medium">
            <Heading level={3} id="terms-heading">Terms and conditions</Heading>
            <Text elementType="p">The Sprint With Us terms and conditions have not been accepted for this organization.</Text>
            <Text elementType="p">
              <Link href={`/organizations/${orgId}/sprint-with-us-terms-and-conditions`} data-testid="organization-view-swu-terms-link">
                Read and accept the Sprint With Us terms and conditions
              </Link>
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
