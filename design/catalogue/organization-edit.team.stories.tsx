import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// organization-edit · team — the owner on the Team members tab: one invitation still pending, which does not count
// towards team size or capabilities; administrator rights can be given or withdrawn on any active member but the
// owner and oneself (R-3.7, R-3.10, R-3.11, R-3.12, R-3.14, R-3.34)
// Capability names are illustrative: the spec does not carry the service's list.
const meta: Meta = { title: "organizations/organization-edit/team" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
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
const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

const capabilities = [
  { name: "Backend development", held: true },
  { name: "Frontend development", held: true },
  { name: "Delivery management", held: true },
  { name: "User research", held: false },
];

export const Team: StoryObj = {
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
          <li><Link href={`${base}?tab=organization`} data-testid="organization-tab-organization">Organization</Link></li>
          <li><Link href={`${base}?tab=team`} aria-current="page" data-testid="organization-tab-team">Team members</Link></li>
          <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
          <li><Link href={`${base}?tab=twu-qualification`} data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
          <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Team members</Heading>
        <Text elementType="p">
          Team size: 3 active members. An invited person joins the team, and counts towards its size and capabilities, once they accept.
        </Text>
        <div>
          <Button variant="primary" data-testid="organization-add-team-members-button">Add team members</Button>
        </div>
        <div role="region" aria-labelledby="team-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="team-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Everyone who belongs to or has been invited to this organization</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Name</th>
                <th scope="col" style={cell}>Membership</th>
                <th scope="col" style={cell}>Capabilities</th>
                <th scope="col" style={cell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr data-testid="organization-team-member-row">
                <td style={cell}>Test Vendor One (you)</td>
                <td style={cell}><span style={badge} data-testid="organization-owner-badge">Owner</span></td>
                <td style={cell}>2</td>
                <td style={cell} />
              </tr>
              <tr data-testid="organization-team-member-row">
                <td style={cell}>Test Vendor Two</td>
                <td style={cell}><span style={badge}>Administrator</span></td>
                <td style={cell}>2</td>
                <td style={cell}>
                  <div style={actions}>
                    <Button variant="tertiary" size="small" aria-label="Remove administrator rights from Test Vendor Two" data-testid="organization-member-admin-toggle">
                      Remove administrator rights
                    </Button>
                    <Button variant="tertiary" size="small" danger aria-label="Remove Test Vendor Two" data-testid="organization-member-remove-button">
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
              <tr data-testid="organization-team-member-row">
                <td style={cell}>Test Vendor Four</td>
                <td style={cell}><span style={badge}>Member</span></td>
                <td style={cell}>1</td>
                <td style={cell}>
                  <div style={actions}>
                    <Button variant="tertiary" size="small" aria-label="Give administrator rights to Test Vendor Four" data-testid="organization-member-admin-toggle">
                      Give administrator rights
                    </Button>
                    <Button variant="tertiary" size="small" danger aria-label="Remove Test Vendor Four" data-testid="organization-member-remove-button">
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
              <tr data-testid="organization-team-member-row">
                <td style={cell}>Test Vendor Three</td>
                <td style={cell}><span style={badge} data-testid="organization-pending-badge">Pending</span></td>
                <td style={cell}>1</td>
                <td style={cell}>
                  <div style={actions}>
                    <Button variant="tertiary" size="small" danger aria-label="Remove Test Vendor Three" data-testid="organization-member-remove-button">
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <section aria-labelledby="capabilities-heading" style={stack} data-testid="organization-team-capabilities">
          <Heading level={3} id="capabilities-heading">Team capabilities</Heading>
          <Text elementType="p">Only active members count. An invited person’s capabilities count once they accept.</Text>
          <ul>
            {capabilities.map((c) => (
              <li key={c.name} data-testid="organization-team-capability">
                {c.name}: {c.held ? "held" : "not held"}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  ),
};
