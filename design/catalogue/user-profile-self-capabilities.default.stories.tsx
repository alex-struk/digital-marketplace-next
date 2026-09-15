import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";

// user-profile-self-capabilities · default — a vendor recording their own capabilities, one description expanded (R-4.8)
// Capability names and descriptions are illustrative: the spec does not carry the service's list.
const meta: Meta = { title: "users/user-profile-self-capabilities/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const list = { display: "grid", gap: "var(--layout-margin-medium)", listStyle: "none", margin: "var(--layout-margin-none)", padding: "var(--layout-padding-none)" } as const;
const item = {
  display: "grid",
  gap: "var(--layout-margin-small)",
  paddingBlock: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

const capabilities = [
  { key: "backend", name: "Backend development", held: true, expanded: true, description: "Building and maintaining server-side services and data stores." },
  { key: "frontend", name: "Frontend development", held: true, expanded: false, description: "Building accessible user interfaces for the web." },
  { key: "research", name: "User research", held: false, expanded: false, description: "Planning and running research with the people who use a service." },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Capabilities</Heading>
      <nav aria-label="Profile sections">
        <ul style={tabs}>
          <li><Link href="/users/me" data-testid="profile-tab-profile">Profile</Link></li>
          <li><Link href="/users/me?tab=capabilities" aria-current="page" data-testid="profile-tab-capabilities">Capabilities</Link></li>
          <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
          <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
          <li><Link href="/users/me?tab=legal" data-testid="profile-tab-legal">Legal</Link></li>
        </ul>
      </nav>
      <Text elementType="p">
        Tick each capability you have. Your choices are saved as you make them, and you may leave them all unticked.
      </Text>
      <ul style={list} aria-label="Capabilities">
        {capabilities.map((c) => (
          <li key={c.key} style={item} data-testid="capability-row">
            <Checkbox defaultSelected={c.held} data-testid="capability-checkbox">{c.name}</Checkbox>
            <div>
              <Button
                variant="tertiary"
                size="small"
                aria-expanded={c.expanded}
                aria-controls={`capability-${c.key}-description`}
                data-testid="capability-description-toggle"
              >
                {c.expanded ? `Hide description of ${c.name}` : `Show description of ${c.name}`}
              </Button>
            </div>
            <div id={`capability-${c.key}-description`} hidden={!c.expanded}>
              {c.expanded && (
                <Text elementType="p" size="small" color="secondary" data-testid="capability-description">{c.description}</Text>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div role="status" />
    </div>
  ),
};
