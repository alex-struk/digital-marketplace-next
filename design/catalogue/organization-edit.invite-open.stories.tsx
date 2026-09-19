import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Dialog, Heading, Link, Modal, Text, TextField } from "@bcgov/design-system-react-components";

// organization-edit · invite-open — the owner inviting two people at once by email address; each invitation is sent
// as an ordinary membership and waits, pending, until the person accepts (R-3.7, R-3.8, R-3.17)
const meta: Meta = { title: "organizations/organization-edit/invite-open" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const dialogBody = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
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

export const InviteOpen: StoryObj = {
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
          <Button variant="primary" data-testid="organization-add-team-members-button">Add team members</Button>
        </div>
      </section>
      <Modal isOpen isDismissable>
        <Dialog isCloseable data-testid="organization-invite-dialog">
          <div style={dialogBody}>
            <Heading level={2} slot="title">Add team members</Heading>
            <Text elementType="p">
              Each person is emailed an invitation and joins the team as a member once they accept. Only people with a vendor account can be
              invited. Anyone not yet registered is emailed an invitation to sign up instead.
            </Text>
            <TextField label="Email address 1" type="email" isRequired defaultValue="vendor4@example.com" data-testid="organization-invite-email-field" />
            <TextField label="Email address 2" type="email" defaultValue="vendor5@example.com" data-testid="organization-invite-email-field" />
            <div>
              <Button variant="tertiary" data-testid="organization-invite-add-email">Add another email address</Button>
            </div>
            <ButtonGroup alignment="end" ariaLabel="Invitation actions">
              <Button variant="secondary" data-testid="organization-dialog-cancel">Cancel</Button>
              <Button variant="primary" data-testid="organization-invite-submit">Send invitations</Button>
            </ButtonGroup>
          </div>
        </Dialog>
      </Modal>
    </div>
  ),
};
