import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Heading, Link, Select, Text, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// notification-optin-opportunity-list · default — a signed-in vendor with new-opportunity emails off, on the list of
// opportunities. The control sits once, between the filters and the first group, at every screen width (R-6.21,
// R-6.27). Pressing it saves at once, with no confirmation (R-6.21 note). The list around it is the opportunities
// domain's design, trimmed to one group here.
const meta: Meta = { title: "notifications/notification-optin-opportunity-list/default" };
export default meta;

// A card section's border and inner padding are its own; its content is laid out by the stack.
const card = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

const programs = [
  { id: "all", label: "All programs" },
  { id: "code-with-us", label: "Code With Us" },
  { id: "sprint-with-us", label: "Sprint With Us" },
  { id: "team-with-us", label: "Team With Us" },
];
const statuses = [
  { id: "all", label: "All statuses" },
  { id: "published", label: "Published" },
  { id: "evaluation", label: "Evaluation" },
  { id: "awarded", label: "Awarded" },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Opportunities</Heading>
        <form role="search" aria-label="Filter opportunities">
          <Stack direction="row" gap="medium" align="end">
            <Select label="Program" items={programs} defaultValue="all" data-testid="opportunity-filter-program" />
            <Select label="Status" items={statuses} defaultValue="all" data-testid="opportunity-filter-status" />
            <Checkbox data-testid="opportunity-filter-remote">Remote work accepted only</Checkbox>
            <TextField type="search" label="Search by title or location" data-testid="opportunity-search" />
          </Stack>
        </form>
        <section aria-labelledby="notification-optin-heading" style={card} data-testid="notification-optin-control">
          <Stack direction="row" gap="medium" align="center">
            <Heading level={2} id="notification-optin-heading">New opportunity emails</Heading>
            <Text elementType="p" data-testid="notification-optin-state">
              You are not emailed when new opportunities are posted.
            </Text>
            <Button variant="secondary" data-testid="notification-optin-toggle">Email me about new opportunities</Button>
            <div role="status" />
          </Stack>
        </section>
        <Stack as="section" gap="medium" aria-labelledby="group-open" data-testid="opportunity-group-open">
          <Heading level={2} id="group-open">Open</Heading>
          <Text elementType="p" size="small" color="secondary">Accepting proposals, nearest proposal deadline first.</Text>
          <Stack as="ul" gap="medium">
            <li>
              <article aria-labelledby="opportunity-101" style={card}>
                <Stack gap="small">
                  <Text elementType="p" size="small" color="secondary">Code With Us</Text>
                  <Heading level={3} id="opportunity-101">
                    <Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101">Build an accessible permit tracker</Link>
                  </Heading>
                  <div><span style={badge} data-testid="opportunity-status">Published</span></div>
                  <Text elementType="p">Victoria · Remote work accepted</Text>
                  <Text elementType="p">Reward: $45,000</Text>
                  <Text elementType="p">
                    Proposal deadline: <span data-testid="opportunity-proposal-deadline">October 2, 2026 at 4:00 p.m. Pacific time</span>
                  </Text>
                  <Checkbox aria-label="Watch Build an accessible permit tracker" data-testid="opportunity-watch-toggle">Watch</Checkbox>
                </Stack>
              </article>
            </li>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
