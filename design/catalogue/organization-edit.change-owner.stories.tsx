import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Dialog, Heading, Link, Modal, Select, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · change-owner — a service administrator transferring ownership; only active members are offered,
// so the pending invitee is not in the list, and the previous owner becomes an ordinary member (R-3.13)
const meta: Meta = { title: "organizations/organization-edit/change-owner" };
export default meta;

const dialogBody = { padding: "var(--layout-padding-large)" } as const;
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

// Test Vendor Three's invitation is still pending, so they are not a choice.
const activeMembers = [
  { id: "0b6f2c1e-5a7d-4c3e-9f10-000000000004", label: "Test Vendor Two" },
  { id: "0b6f2c1e-5a7d-4c3e-9f10-000000000007", label: "Test Vendor Four" },
];

export const ChangeOwner: StoryObj = {
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
          <div>
            <Button variant="secondary" data-testid="organization-change-owner-button">Change owner</Button>
          </div>
        </Stack>
      </Stack>
      <Modal isOpen isDismissable>
        <Dialog isCloseable data-testid="organization-change-owner-dialog">
          <div style={dialogBody}>
            <Stack gap="medium">
              <Heading level={2} slot="title">Change owner</Heading>
              <Text elementType="p">
                Test Vendor One, the current owner, will become an ordinary member. Only members who have accepted their invitation can be chosen.
              </Text>
              <Select label="New owner" isRequired items={activeMembers} data-testid="organization-new-owner-field" />
              <ButtonGroup alignment="end" ariaLabel="Change owner actions">
                <Button variant="secondary" data-testid="organization-dialog-cancel">Cancel</Button>
                <Button variant="primary" data-testid="organization-change-owner-confirm">Change owner</Button>
              </ButtonGroup>
            </Stack>
          </div>
        </Dialog>
      </Modal>
    </PageContainer>
  ),
};
