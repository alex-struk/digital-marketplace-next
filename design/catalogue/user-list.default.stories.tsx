import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";

// user-list · default — administrator browsing everyone registered (R-4.14, R-4.21)
const meta: Meta = { title: "users/user-list/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const toolbar = { display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: "var(--layout-margin-medium)" } as const;
const cell = {
  textAlign: "start",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

const users = [
  { id: "0b6f2c1e-5a7d-4c3e-9f10-000000000001", status: "Active", type: "Public sector employee", name: "Test Administrator", admin: true },
  { id: "0b6f2c1e-5a7d-4c3e-9f10-000000000002", status: "Active", type: "Public sector employee", name: "Test Public Servant", admin: false },
  { id: "0b6f2c1e-5a7d-4c3e-9f10-000000000003", status: "Active", type: "Vendor", name: "Test Vendor One", admin: false },
  { id: "0b6f2c1e-5a7d-4c3e-9f10-000000000005", status: "Inactive", type: "Vendor", name: "Test Vendor Five", admin: false },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Users</Heading>
      <div style={toolbar}>
        <TextField type="search" label="Search by name" data-testid="user-list-search" />
        <Button variant="secondary" data-testid="contact-list-open-export">Export contact list</Button>
      </div>
      <div role="region" aria-labelledby="user-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption id="user-list-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">Everyone registered, active accounts first, then by account type and name</Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>Status</th>
              <th scope="col" style={cell}>Account type</th>
              <th scope="col" style={cell}>Name</th>
              <th scope="col" style={cell}>Administrator</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} data-testid="user-list-row">
                <td style={cell}><span style={badge} data-testid="user-list-status-badge">{u.status}</span></td>
                <td style={cell}><span data-testid="user-list-account-type">{u.type}</span></td>
                <td style={cell}><Link href={`/users/${u.id}`} data-testid="user-list-profile-link">{u.name}</Link></td>
                <td style={cell}><span data-testid="user-list-admin-check">{u.admin ? "Yes" : "No"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};
