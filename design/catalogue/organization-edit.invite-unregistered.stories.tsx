import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · invite-unregistered — an invited address belongs to nobody registered: no pending membership
// is created, the address is emailed an invitation to sign up, and the owner is warned, by address (R-3.30)
const meta: Meta = { title: "organizations/organization-edit/invite-unregistered" };
export default meta;

const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const InviteUnregistered: StoryObj = {
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
            <li><Link href={`${base}?tab=team`} aria-current="page" data-testid="organization-tab-team">Team members</Link></li>
            <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
            <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
            <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
          </Stack>
        </nav>
        <Stack as="section" aria-labelledby="tab-heading" gap="medium">
          <Heading level={2} id="tab-heading">Team members</Heading>
          <div data-testid="organization-invite-unregistered">
            <InlineAlert
              variant="warning"
              role="alert"
              title="newperson@example.com is not registered with the Digital Marketplace"
              description="They have been emailed an invitation to sign up. They are not on your team."
            />
          </div>
          <div>
            <Button variant="primary" data-testid="organization-add-team-members-button">Add team members</Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
