import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";

// organization-edit · remove-member-confirm — the owner asked to confirm ending an active member's membership; it
// becomes inactive rather than erased, and the person stops counting towards the team (R-3.10)
const meta: Meta = { title: "organizations/organization-edit/remove-member-confirm" };
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

export const RemoveMemberConfirm: StoryObj = {
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
          <Button variant="tertiary" size="small" danger aria-label="Remove Test Vendor Four" data-testid="organization-member-remove-button">
            Remove
          </Button>
        </div>
      </section>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Remove Test Vendor Four from the team?"
          data-testid="organization-member-remove-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="organization-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="organization-member-remove-confirm">Remove from team</Button>
            </>
          }
        >
          <Text elementType="p">
            Test Vendor Four will no longer be on Northwind Digital Co-operative’s team, and will stop counting towards its size and capabilities.
            They can be invited again later.
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
