import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-program-select · default — a public sector employee choosing a program (R-1.7, R-1.8, R-1.12, R-1.13)
// The one-line program descriptions are placeholder copy; the spec does not carry them.
const meta: Meta = { title: "opportunities/opportunity-program-select/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const card = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

const programs = [
  {
    slug: "code-with-us",
    name: "Code With Us",
    description: "One well-defined piece of work, paid as a fixed reward to the developer or team whose proposal is chosen.",
    maxBudget: "Up to $70,000",
  },
  {
    slug: "sprint-with-us",
    name: "Sprint With Us",
    description: "A team works in phases on a larger service, chosen through questions, a code challenge and a team scenario.",
    maxBudget: "Up to $5,000,000",
  },
  {
    slug: "team-with-us",
    name: "Team With Us",
    description: "Specialists join a government team for a set time, chosen through questions and a challenge.",
    maxBudget: "No upper limit",
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create an opportunity</Heading>
      <Text elementType="p">
        Choose the program the opportunity belongs to. The program cannot be changed once the opportunity is created.
      </Text>
      {programs.map((p) => (
        <section key={p.slug} aria-labelledby={`program-${p.slug}`} style={card} data-testid="program-card">
          <Heading level={2} id={`program-${p.slug}`}>{p.name}</Heading>
          <Text elementType="p">{p.description}</Text>
          <Text elementType="p">
            Maximum budget: <span data-testid="program-max-budget">{p.maxBudget}</span>
          </Text>
          <div>
            <Link href={`/opportunities/${p.slug}/create`} isButton buttonVariant="primary" data-testid={`program-choose-${p.slug}`}>
              Create a {p.name} opportunity
            </Link>
          </div>
        </section>
      ))}
    </div>
  ),
};
