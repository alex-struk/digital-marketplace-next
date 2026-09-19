import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-list · default — a signed-in vendor browsing registered organizations; owner, team size and
// qualification are filled in only for the organizations they own or administer (R-3.1, R-3.2, R-3.21)
const meta: Meta = { title: "organizations/organization-list/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const cell = {
  textAlign: "start",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const pager = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--layout-margin-medium)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

// Test Vendor One owns Northwind and administers Pacific; the other two rows are somebody else's.
const organizations = [
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000204", name: "Aurora Data Collective", mine: false, owner: "", size: 0, swu: false, twu: false },
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000201", name: "Northwind Digital Co-operative", mine: true, owner: "Test Vendor One", size: 3, swu: true, twu: false },
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000202", name: "Pacific Service Design Ltd.", mine: true, owner: "Test Vendor Two", size: 2, swu: false, twu: true },
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000205", name: "Tidewater Analytics Inc.", mine: false, owner: "", size: 0, swu: false, twu: false },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Organizations</Heading>
      <div style={row}>
        <Link href="/organizations/create" isButton buttonVariant="primary" data-testid="organization-create-link">Create organization</Link>
        <Link href="/users/me?tab=organizations" isButton buttonVariant="secondary" data-testid="organization-list-my-organizations">
          My organizations
        </Link>
      </div>
      <div role="region" aria-labelledby="organization-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption id="organization-list-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">
              Registered organizations by legal name. Owner, team size and qualification are shown only for organizations you own or administer.
            </Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>Organization</th>
              <th scope="col" style={cell}>Owner</th>
              <th scope="col" style={cell}>Team size</th>
              <th scope="col" style={cell}>Sprint With Us qualified</th>
              <th scope="col" style={cell}>Team With Us qualified</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((o) => (
              <tr key={o.id} data-testid="organization-list-row">
                <td style={cell}>
                  {o.mine ? (
                    <Link href={`/organizations/${o.id}/edit`} data-testid="organization-list-name-link">
                      <span data-testid="organization-list-name">{o.name}</span>
                    </Link>
                  ) : (
                    <span data-testid="organization-list-name">{o.name}</span>
                  )}
                </td>
                <td style={cell}>{o.mine && <span data-testid="organization-list-owner">{o.owner}</span>}</td>
                <td style={cell}>{o.mine && <span data-testid="organization-list-team-size">{o.size}</span>}</td>
                <td style={cell}>{o.mine && <span data-testid="organization-swu-qualified-mark">{o.swu ? "Yes" : "No"}</span>}</td>
                <td style={cell}>{o.mine && <span data-testid="organization-twu-qualified-mark">{o.twu ? "Yes" : "No"}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pages of organizations" data-testid="organization-list-pagination">
        <ul style={pager}>
          <li><Text>Page 1 of 2</Text></li>
          <li><Link href="/organizations?page=1" aria-current="page" aria-label="Page 1" data-testid="organization-list-page-link">1</Link></li>
          <li><Link href="/organizations?page=2" aria-label="Page 2" data-testid="organization-list-page-link">2</Link></li>
          <li><Link href="/organizations?page=2" data-testid="organization-list-page-link">Next page</Link></li>
        </ul>
      </nav>
    </div>
  ),
};
