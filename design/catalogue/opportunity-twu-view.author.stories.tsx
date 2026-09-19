import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-twu-view · author — its author, who (with administrators) alone sees who created and last changed it,
// and who is not offered Watch on their own opportunity (R-1.5, R-1.29)
const meta: Meta = { title: "opportunities/opportunity-twu-view/author" };
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
      <Text elementType="p" size="small" color="secondary">Team With Us opportunity</Text>
      <Heading level={1}>Data platform team</Heading>
      <Text elementType="p" size="large">Add two specialists to the ministry's data platform team for a year.</Text>
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
          <dt style={term}>Maximum budget</dt>
          <dd style={detail} data-testid="opportunity-max-budget">$900,000</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Location</dt>
          <dd style={detail}>Victoria</dd>
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
        Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000301</span>
      </Text>
      <div>
        <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit" isButton buttonVariant="secondary">
          Manage this opportunity
        </Link>
      </div>
      <section aria-labelledby="view-description" style={stack}>
        <Heading level={2} id="view-description">Description</Heading>
        <Text elementType="p">
          The data platform team publishes open data for the ministry. Two specialists will join it for a year to move
          its pipelines to the new platform.
        </Text>
      </section>
      <section aria-labelledby="view-resources" style={stack} data-testid="opportunity-resources">
        <Heading level={2} id="view-resources">Resources</Heading>
        <ul>
          <li>Full stack developer: 100% of full time</li>
          <li>Data professional: 50% of full time</li>
        </ul>
      </section>
      <section aria-labelledby="view-addenda" style={stack} data-testid="opportunity-addenda">
        <Heading level={2} id="view-addenda">Addenda</Heading>
        <article aria-labelledby="addendum-1" style={tight}>
          <Heading level={3} id="addendum-1">Addendum of September 20, 2026</Heading>
          <Text elementType="p">Interviews for the challenge will be held by video.</Text>
        </article>
      </section>
    </div>
  ),
};
