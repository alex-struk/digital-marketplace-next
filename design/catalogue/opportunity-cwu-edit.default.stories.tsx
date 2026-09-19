import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// opportunity-cwu-edit · default — an administrator on a closed opportunity: the summary with its reporting counts,
// and Edit and Cancel opportunity offered (R-1.28, R-1.29, R-1.30, R-1.31, R-1.56)
const meta: Meta = { title: "opportunities/opportunity-cwu-edit/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
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
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit";

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Code With Us opportunity</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Evaluation</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</span>
        </Text>
      </div>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} aria-current="page" data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
          <li><Link href={`${base}?tab=proposals`} data-testid="opportunity-tab-proposals">Proposals</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Summary</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Proposal deadline</dt>
            <dd style={detail}>September 11, 2026 at 4:00 p.m. Pacific time</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Reward</dt>
            <dd style={detail}>$45,000</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Published</dt>
            <dd style={detail}>August 14, 2026</dd>
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
        <section aria-labelledby="reporting-heading" style={stack}>
          <Heading level={3} id="reporting-heading">Reporting</Heading>
          <dl style={facts}>
            <div style={fact}>
              <dt style={term}>Views</dt>
              <dd style={detail} data-testid="reporting-views">342</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Watchers</dt>
              <dd style={detail} data-testid="reporting-watchers">12</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Proposals submitted</dt>
              <dd style={detail} data-testid="reporting-proposals">5</dd>
            </div>
          </dl>
        </section>
      </section>
    </div>
  ),
};
