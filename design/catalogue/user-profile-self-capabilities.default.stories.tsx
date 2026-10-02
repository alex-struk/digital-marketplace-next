import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// user-profile-self-capabilities · default — a vendor recording their own capabilities, one description expanded (R-4.8)
// Capability names and descriptions are illustrative: the spec does not carry the service's list.
const meta: Meta = { title: "users/user-profile-self-capabilities/default" };
export default meta;

// A row's rule and inner padding are its own; its content is laid out by the stack.
const item = {
  paddingBlock: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const capabilities = [
  { key: "backend", name: "Backend development", held: true, expanded: true, description: "Building and maintaining server-side services and data stores." },
  { key: "frontend", name: "Frontend development", held: true, expanded: false, description: "Building accessible user interfaces for the web." },
  { key: "research", name: "User research", held: false, expanded: false, description: "Planning and running research with the people who use a service." },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Capabilities</Heading>
        <nav aria-label="Profile sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="/users/me" data-testid="profile-tab-profile">Profile</Link></li>
            <li><Link href="/users/me?tab=capabilities" aria-current="page" data-testid="profile-tab-capabilities">Capabilities</Link></li>
            <li><Link href="/users/me?tab=organizations" data-testid="profile-tab-organizations">Organizations</Link></li>
            <li><Link href="/users/me?tab=notifications" data-testid="profile-tab-notifications">Notifications</Link></li>
            <li><Link href="/users/me?tab=legal" data-testid="profile-tab-legal">Legal</Link></li>
          </Stack>
        </nav>
        <Text elementType="p">
          Tick each capability you have. Your choices are saved as you make them, and you may leave them all unticked.
        </Text>
        <Stack as="ul" gap="medium" aria-label="Capabilities">
          {capabilities.map((c) => (
            <li key={c.key} style={item} data-testid="capability-row">
              <Stack gap="small">
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
              </Stack>
            </li>
          ))}
        </Stack>
        <div role="status" />
      </Stack>
    </PageContainer>
  ),
};
