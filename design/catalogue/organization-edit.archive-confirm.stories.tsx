import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, Button, Heading, Link, Modal, Text, TextField } from "@bcgov/design-system-react-components";

// organization-edit · archive-confirm — a service administrator asked to confirm archiving an organization they do
// not own; the dialog says what archiving does and that the owner will be emailed (R-3.6, R-3.24)
const meta: Meta = { title: "organizations/organization-edit/archive-confirm" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
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

export const ArchiveConfirm: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
      <Heading level={1}>Northwind Digital Co-operative</Heading>
      <div style={row}>
        <Text elementType="p" size="small" color="secondary">
          Organization ID: <span data-testid="organization-identifier">{orgId}</span>
        </Text>
      </div>
      <nav aria-label="Organization sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=organization`} aria-current="page" data-testid="organization-tab-organization">Organization</Link></li>
          <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
          <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Organization</Heading>
        <div>
          <Button variant="primary" data-testid="organization-edit-button">Edit organization</Button>
        </div>
        <TextField label="Legal name" value="Northwind Digital Co-operative" isReadOnly data-testid="organization-legal-name-field" />
      </section>
      <section aria-labelledby="archive-heading" style={stack}>
        <Heading level={2} id="archive-heading">Archive this organization</Heading>
        <div>
          <Button variant="secondary" danger data-testid="organization-archive-button">Archive organization</Button>
        </div>
      </section>
      <Modal isOpen isDismissable>
        <AlertDialog
          variant="destructive"
          title="Archive Northwind Digital Co-operative?"
          data-testid="organization-archive-dialog"
          buttons={
            <>
              <Button variant="secondary" data-testid="organization-dialog-cancel">Cancel</Button>
              <Button variant="primary" danger data-testid="organization-archive-confirm">Archive organization</Button>
            </>
          }
        >
          <Text elementType="p">
            It will no longer appear in the organization list or in its members’ lists of organizations, and it cannot be used on proposals.
            Its records and memberships are kept.
          </Text>
          <Text elementType="p">Test Vendor One, the owner, will be emailed that an administrator has archived it.</Text>
        </AlertDialog>
      </Modal>
    </div>
  ),
};
