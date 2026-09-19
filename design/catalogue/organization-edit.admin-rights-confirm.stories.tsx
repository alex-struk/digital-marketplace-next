import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Checkbox, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// organization-edit · admin-rights-confirm — the owner giving an active member administrator rights must first
// confirm the statement of what those rights allow; the confirm button waits for it (R-3.12)
const meta: Meta = { title: "organizations/organization-edit/admin-rights-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

export const AdminRightsConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
      <Heading level={1}>Northwind Digital Co-operative</Heading>
      <Text elementType="p" size="small" color="secondary">
        Organization ID: <span data-testid="organization-identifier">{orgId}</span>
      </Text>
      <nav aria-label="Organization sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=organization`} data-testid="organization-tab-organization">Organization</Link></li>
          <li><Link href={`${base}?tab=team`} aria-current="page" data-testid="organization-tab-team">Team members</Link></li>
          <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Team members</Heading>
        <div>
          <Button variant="tertiary" size="small" aria-label="Give administrator rights to Test Vendor Four" data-testid="organization-member-admin-toggle">
            Give administrator rights
          </Button>
        </div>
      </section>
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
          <Text elementType="p">[Statement of what an organization administrator may do, supplied by the service.]</Text>
          <Checkbox data-testid="organization-admin-terms-checkbox">I have read this statement and confirm it</Checkbox>
          <Text id="admin-rights-hint" elementType="p" size="small" color="secondary">
            Confirm the statement to give administrator rights.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
