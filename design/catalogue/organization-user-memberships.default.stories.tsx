import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-user-memberships · default — a vendor's organizations reached by account identifier: the one they own,
// one they administer, one they are an ordinary member of, and an invitation waiting for their answer
// (R-3.9, R-3.10, R-3.15, R-3.23, R-3.25)
const meta: Meta = { title: "organizations/organization-user-memberships/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const actions = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/users/0b6f2c1e-5a7d-4c3e-9f10-000000000003";

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>My Organizations</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href={base} data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href={`${base}?tab=capabilities`} data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href={`${base}?tab=organizations`} aria-current="page" data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href={`${base}?tab=notifications`} data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href={`${base}?tab=legal`} data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="owned-heading" style={stack}>
        <Heading level={2} id="owned-heading">Organizations you own</Heading>
        <div>
          <Link href="/organizations/create" isButton buttonVariant="primary" data-testid="organization-create-link">Create organization</Link>
        </div>
        <div role="region" aria-labelledby="owned-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="membership-owned-table">
            <caption id="owned-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Owned organizations, with team size and Sprint With Us qualification</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Organization</th>
                <th scope="col" style={cell}>Team members</th>
                <th scope="col" style={cell}>Sprint With Us qualified</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cell}>
                  <Link href="/organizations/4a9e1c20-6d3b-4f1a-8e2c-000000000201/edit" data-testid="membership-organization-link">
                    Northwind Digital Co-operative
                  </Link>
                </td>
                <td style={cell}><span data-testid="membership-team-member-count">3</span></td>
                <td style={cell}><span data-testid="organization-swu-qualified-mark">Yes</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="affiliated-heading" style={stack}>
        <Heading level={2} id="affiliated-heading">Organizations you belong to</Heading>
        <Text elementType="p">Leaving an organization takes you off its team. You would need to be invited again to rejoin.</Text>
        <div role="region" aria-labelledby="affiliated-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="membership-affiliated-table">
            <caption id="affiliated-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Organizations you are a member of or have been invited to</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Organization</th>
                <th scope="col" style={cell}>Membership</th>
                <th scope="col" style={cell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cell}>Aurora Data Collective</td>
                <td style={cell}><span style={badge}>Member</span></td>
                <td style={cell}>
                  <Button variant="tertiary" size="small" danger aria-label="Leave Aurora Data Collective" data-testid="membership-leave-button">Leave</Button>
                </td>
              </tr>
              <tr>
                <td style={cell}>
                  <Link href="/organizations/4a9e1c20-6d3b-4f1a-8e2c-000000000202/edit" data-testid="membership-organization-link">
                    Pacific Service Design Ltd.
                  </Link>
                </td>
                <td style={cell}><span style={badge}>Administrator</span></td>
                <td style={cell}>
                  <Button variant="tertiary" size="small" danger aria-label="Leave Pacific Service Design Ltd." data-testid="membership-leave-button">Leave</Button>
                </td>
              </tr>
              <tr>
                <td style={cell}>Tidewater Analytics Inc.</td>
                <td style={cell}><span style={badge} data-testid="organization-pending-badge">Pending</span></td>
                <td style={cell}>
                  <div style={actions}>
                    <Button variant="tertiary" size="small" aria-label="Accept the invitation from Tidewater Analytics Inc." data-testid="membership-approve-button">
                      Accept
                    </Button>
                    <Button variant="tertiary" size="small" danger aria-label="Decline the invitation from Tidewater Analytics Inc." data-testid="membership-reject-button">
                      Decline
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  ),
};
