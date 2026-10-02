import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Checkbox, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · admin-rights-confirm — the owner giving an active member administrator rights must first
// confirm the statement of what those rights allow; the confirm button waits for it (R-3.12)
const meta: Meta = { title: "organizations/organization-edit/admin-rights-confirm" };
export default meta;

const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const AdminRightsConfirm: StoryObj = {
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
            <Button variant="tertiary" size="small" aria-label="Give administrator rights to Test Vendor Four" data-testid="organization-member-admin-toggle">
              Give administrator rights
            </Button>
          </div>
        </Stack>
      </Stack>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="confirmation"
          title="Give Test Vendor Four administrator rights?"
          data-testid="organization-admin-rights-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="organization-dialog-cancel">Cancel</Button>
              <Button variant="primary" isDisabled aria-describedby="admin-rights-hint" data-testid="organization-admin-rights-confirm">
                Give administrator rights
              </Button>
            </>
          }
        >
          <Stack gap="medium">
            <Text elementType="p">[Statement of what an organization administrator may do, supplied by the service.]</Text>
            <Checkbox data-testid="organization-admin-terms-checkbox">I have read this statement and confirm it</Checkbox>
            <Text id="admin-rights-hint" elementType="p" size="small" color="secondary">
              Confirm the statement to give administrator rights.
            </Text>
          </Stack>
        </AlertDialog>
      </Modal>
    </PageContainer>
  ),
};
