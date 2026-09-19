import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Link, Select, Text, TextField } from "@bcgov/design-system-react-components";

// opportunity-list · staff — a public sector employee: their own unpublished opportunities form a third group, and
// nothing they created offers Watch (R-1.3, R-1.5, R-1.38)
const meta: Meta = { title: "opportunities/opportunity-list/staff" };
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
// The five states R-1.39's note records; processing and cancelled are not offered (see DESIGN.md, gaps).
const statuses = [
  { id: "all", label: "All statuses" },
  { id: "draft", label: "Draft" },
  { id: "under-review", label: "Under review" },
  { id: "published", label: "Published" },
  { id: "evaluation", label: "Evaluation" },
  { id: "awarded", label: "Awarded" },
];

type Opportunity = {
  id: string; program: string; programName: string; title: string; status: string;
  where: string; valueTerm: string; value: string; deadline: string; own: boolean;
};

const groups: { key: string; heading: string; order: string; items: Opportunity[] }[] = [
  {
    key: "unpublished",
    heading: "Unpublished",
    order: "Drafts and opportunities under review, most recently changed first.",
    items: [
      { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000302", program: "team-with-us", programName: "Team With Us", title: "Accessibility specialists for the digital office", status: "Draft", where: "Victoria · Remote work accepted", valueTerm: "Maximum budget", value: "$400,000", deadline: "October 30, 2026 at 4:00 p.m. Pacific time", own: true },
      { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000202", program: "sprint-with-us", programName: "Sprint With Us", title: "Replace the grant intake forms", status: "Under review", where: "Kamloops · On site only", valueTerm: "Total maximum budget", value: "$750,000", deadline: "October 23, 2026 at 4:00 p.m. Pacific time", own: true },
    ],
  },
  {
    key: "open",
    heading: "Open",
    order: "Accepting proposals, nearest proposal deadline first.",
    items: [
      { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000101", program: "code-with-us", programName: "Code With Us", title: "Build an accessible permit tracker", status: "Published", where: "Victoria · Remote work accepted", valueTerm: "Reward", value: "$45,000", deadline: "October 2, 2026 at 4:00 p.m. Pacific time", own: true },
      { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000201", program: "sprint-with-us", programName: "Sprint With Us", title: "Modernize the licence renewal service", status: "Published", where: "Victoria · Remote work accepted", valueTerm: "Total maximum budget", value: "$1,200,000", deadline: "October 16, 2026 at 4:00 p.m. Pacific time", own: false },
    ],
  },
  {
    key: "closed",
    heading: "Closed",
    order: "No longer accepting proposals, most recently closed first.",
    items: [
      { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000301", program: "team-with-us", programName: "Team With Us", title: "Data platform team", status: "Resource questions: individual evaluation", where: "Victoria · Remote work accepted", valueTerm: "Maximum budget", value: "$900,000", deadline: "September 11, 2026 at 4:00 p.m. Pacific time", own: false },
      { id: "7c1e2d40-5b1a-4c2e-9d3f-000000000104", program: "code-with-us", programName: "Code With Us", title: "Fix the fisheries licence export", status: "Awarded", where: "Nanaimo · On site only", valueTerm: "Reward", value: "$12,000", deadline: "August 28, 2026 at 4:00 p.m. Pacific time", own: false },
    ],
  },
];

export const Staff: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Opportunities</Heading>
      <form role="search" aria-label="Filter opportunities" style={filters}>
        <Select label="Program" items={programs} defaultValue="all" data-testid="opportunity-filter-program" />
        <Select label="Status" items={statuses} defaultValue="all" data-testid="opportunity-filter-status" />
        <Checkbox data-testid="opportunity-filter-remote">Remote work accepted only</Checkbox>
        <TextField type="search" label="Search by title or location" data-testid="opportunity-search" />
      </form>
      <div role="status">
        <Text elementType="p" size="small" color="secondary">Showing 6 opportunities. The list changes as you choose.</Text>
      </div>
      <Text elementType="p">Tick Watch on an opportunity to be emailed whenever it changes. You cannot watch one you created.</Text>
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`group-${g.key}`} style={stack} data-testid={`opportunity-group-${g.key}`}>
          <Heading level={2} id={`group-${g.key}`}>{g.heading}</Heading>
          <Text elementType="p" size="small" color="secondary">{g.order}</Text>
          <ul style={cardList}>
            {g.items.map((o) => (
              <li key={o.id}>
                <article aria-labelledby={`opportunity-${o.id}`} style={card}>
                  <Text elementType="p" size="small" color="secondary">{o.programName}</Text>
                  <Heading level={3} id={`opportunity-${o.id}`}>
                    <Link href={`/opportunities/${o.program}/${o.id}`}>{o.title}</Link>
                  </Heading>
                  <div><span style={badge} data-testid="opportunity-status">{o.status}</span></div>
                  <Text elementType="p">{o.where}</Text>
                  <Text elementType="p">{o.valueTerm}: {o.value}</Text>
                  <Text elementType="p">
                    Proposal deadline: <span data-testid="opportunity-proposal-deadline">{o.deadline}</span>
                  </Text>
                  {!o.own && (
                    <Checkbox aria-label={`Watch ${o.title}`} data-testid="opportunity-watch-toggle">Watch</Checkbox>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  ),
};
