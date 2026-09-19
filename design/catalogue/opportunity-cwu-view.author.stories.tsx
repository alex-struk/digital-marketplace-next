import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-cwu-view · author — its author, who (with administrators) alone sees who created and last changed it,
// and who is not offered Watch on their own opportunity (R-1.5, R-1.29)
const meta: Meta = { title: "opportunities/opportunity-cwu-view/author" };
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

export const Author: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us opportunity</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <Text elementType="p" size="large">Add plain-language status tracking to the online permit application.</Text>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="opportunity-status">Published</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal deadline</dt>
          <dd style={detail} data-testid="opportunity-proposal-deadline">October 2, 2026 at 4:00 p.m. Pacific time</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Reward</dt>
          <dd style={detail} data-testid="opportunity-reward">$45,000</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Location</dt>
          <dd style={detail}>Victoria</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Remote work</dt>
          <dd style={detail}>Accepted. Work from anywhere in Canada, with one kick-off meeting by video.</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Published</dt>
          <dd style={detail} data-testid="opportunity-published-date">September 10, 2026</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Created by</dt>
          <dd style={detail} data-testid="opportunity-created-by">Test Public Servant</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Last changed by</dt>
          <dd style={detail} data-testid="opportunity-last-changed-by">Test Administrator</dd>
        </div>
      </dl>
      <Text elementType="p" size="small" color="secondary">
        Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</span>
      </Text>
      <div>
        <Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit" isButton buttonVariant="secondary">
          Manage this opportunity
        </Link>
      </div>
      <section aria-labelledby="view-description" style={stack}>
        <Heading level={2} id="view-description">Description</Heading>
        <Text elementType="p">
          The ministry runs an online permit application that tells applicants little about where their application
          stands. This opportunity adds a status page that works with a keyboard and a screen reader.
        </Text>
      </section>
      <section aria-labelledby="view-skills" style={stack}>
        <Heading level={2} id="view-skills">Skills</Heading>
        <ul>
          <li>React</li>
          <li>TypeScript</li>
          <li>Accessibility</li>
        </ul>
      </section>
      <section aria-labelledby="view-dates" style={stack}>
        <Heading level={2} id="view-dates">Key dates</Heading>
        <ul>
          <li>Assignment date: October 9, 2026</li>
          <li>Start date: October 19, 2026</li>
          <li>Completion date: January 29, 2027</li>
        </ul>
      </section>
      <section aria-labelledby="view-addenda" style={stack} data-testid="opportunity-addenda">
        <Heading level={2} id="view-addenda">Addenda</Heading>
        <article aria-labelledby="addendum-1" style={tight}>
          <Heading level={3} id="addendum-1">Addendum of September 20, 2026</Heading>
          <Text elementType="p">The kick-off meeting will be held by video, not in person.</Text>
        </article>
      </section>
    </div>
  ),
};
