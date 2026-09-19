import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Link, Select, Text, TextField } from "@bcgov/design-system-react-components";

// notification-optin-opportunity-list · signed-out — a visitor who is not signed in has no account to record the
// choice on, so the control is not rendered (R-6.21 offers it to a signed-in person). Nothing takes its place: the
// filters are followed directly by the first group, and there is no Watch. Whether a visitor should instead be
// invited to sign in to get these emails is not stated (DESIGN.md, notifications gap 6).
const meta: Meta = { title: "notifications/notification-optin-opportunity-list/signed-out" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const filters = { display: "flex", flexWrap: "wrap", alignItems: "end", gap: "var(--layout-margin-medium)" } as const;
const cardList = { display: "grid", gap: "var(--layout-margin-medium)", listStyle: "none", margin: "var(--layout-margin-none)", padding: "var(--layout-padding-none)" } as const;
const card = {
  display: "grid",
  gap: "var(--layout-margin-small)",
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

export const SignedOut: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Opportunities</Heading>
      <form role="search" aria-label="Filter opportunities" style={filters}>
        <Select label="Program" items={programs} defaultValue="all" data-testid="opportunity-filter-program" />
        <Select label="Status" items={statuses} defaultValue="all" data-testid="opportunity-filter-status" />
        <Checkbox data-testid="opportunity-filter-remote">Remote work accepted only</Checkbox>
        <TextField type="search" label="Search by title or location" data-testid="opportunity-search" />
      </form>
      <section aria-labelledby="group-open" style={stack} data-testid="opportunity-group-open">
        <Heading level={2} id="group-open">Open</Heading>
        <Text elementType="p" size="small" color="secondary">Accepting proposals, nearest proposal deadline first.</Text>
        <ul style={cardList}>
          <li>
            <article aria-labelledby="opportunity-101" style={card}>
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
            </article>
          </li>
        </ul>
      </section>
    </div>
  ),
};
