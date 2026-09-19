import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-swu-view · default — a signed-in vendor on an open opportunity: they can watch it and start a proposal
// (R-1.5, R-1.6, R-1.16, R-1.23, R-2.1)
const meta: Meta = { title: "opportunities/opportunity-swu-view/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tight = { display: "grid", gap: "var(--layout-margin-small)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <Text elementType="p" size="large">Rebuild licence renewals as an accessible, cloud-hosted service.</Text>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="opportunity-status">Published</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal deadline</dt>
          <dd style={detail} data-testid="opportunity-proposal-deadline">October 16, 2026 at 4:00 p.m. Pacific time</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Total maximum budget</dt>
          <dd style={detail} data-testid="opportunity-total-max-budget">$1,200,000</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Location</dt>
          <dd style={detail}>Victoria</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Remote work</dt>
          <dd style={detail}>Accepted. The team may work remotely within Canada.</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Published</dt>
          <dd style={detail} data-testid="opportunity-published-date">September 10, 2026</dd>
        </div>
      </dl>
      <Text elementType="p" size="small" color="secondary">
        Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
      </Text>
      <div style={tight}>
        <Text elementType="p" size="small" color="secondary">Watching sends you an email whenever this opportunity changes.</Text>
        <Checkbox data-testid="opportunity-watch-toggle">Watch this opportunity</Checkbox>
        <div role="status" />
      </div>
      <div>
        <Link
          href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/create"
          isButton
          buttonVariant="primary"
          data-testid="opportunity-start-proposal"
        >
          Start a proposal
        </Link>
      </div>
      <section aria-labelledby="view-description" style={stack}>
        <Heading level={2} id="view-description">Description</Heading>
        <Text elementType="p">
          Licence holders renew on paper today. This opportunity replaces that with an online service that meets WCAG 2.1 AA,
          built in phases with the ministry's product team.
        </Text>
      </section>
      <section aria-labelledby="view-phases" style={stack} data-testid="opportunity-phases">
        <Heading level={2} id="view-phases">Phases</Heading>
        <ul>
          <li>Prototype phase: November 2, 2026 to January 29, 2027</li>
          <li>Implementation phase: February 1, 2027 to September 30, 2027</li>
        </ul>
      </section>
      <section aria-labelledby="view-skills" style={stack}>
        <Heading level={2} id="view-skills">Skills</Heading>
        <ul>
          <li>React</li>
          <li>PostgreSQL</li>
        </ul>
      </section>
      <section aria-labelledby="view-dates" style={stack}>
        <Heading level={2} id="view-dates">Key dates</Heading>
        <ul>
          <li>Assignment date: October 23, 2026</li>
        </ul>
      </section>
      <section aria-labelledby="view-addenda" style={stack} data-testid="opportunity-addenda">
        <Heading level={2} id="view-addenda">Addenda</Heading>
        <article aria-labelledby="addendum-1" style={tight}>
          <Heading level={3} id="addendum-1">Addendum of September 20, 2026</Heading>
          <Text elementType="p">The team scenario will be held by video, not in person.</Text>
        </article>
      </section>
    </div>
  ),
};
