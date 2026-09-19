import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-list · signed-out — a visitor who is not signed in (and, identically, public sector staff): legal
// names only, no owner or qualification columns, nothing to open and nothing to create (R-3.1, R-3.2, R-3.21)
const meta: Meta = { title: "organizations/organization-list/signed-out" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
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

const organizations = [
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000204", name: "Aurora Data Collective" },
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000201", name: "Northwind Digital Co-operative" },
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000202", name: "Pacific Service Design Ltd." },
  { id: "4a9e1c20-6d3b-4f1a-8e2c-000000000205", name: "Tidewater Analytics Inc." },
];

export const SignedOut: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Organizations</Heading>
      <div role="region" aria-labelledby="organization-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption id="organization-list-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">Registered organizations by legal name.</Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>Organization</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((o) => (
              <tr key={o.id} data-testid="organization-list-row">
                <td style={cell}><span data-testid="organization-list-name">{o.name}</span></td>
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
