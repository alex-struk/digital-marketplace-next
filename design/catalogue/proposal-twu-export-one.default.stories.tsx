import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-twu-export-one · default — a printable copy of one proposal as its vendor sees it, naming the organization.
// Staff see the same copy once the proposal has reached the challenge (R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-export-one/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={row}>
        <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311/edit">
          Back to the proposal
        </Link>
        <Button variant="secondary">Print</Button>
      </div>
      <article aria-labelledby="export-title" style={stack} data-testid="proposal-export-document">
        <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
        <Heading level={1} id="export-title">Data platform team</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Proponent</dt>
            <dd style={detail} data-testid="proposal-proponent-name">Example Digital Ltd.</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Status</dt>
            <dd style={detail}>Submitted</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Submitted</dt>
            <dd style={detail}>September 15, 2026 at 2:12 p.m.</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Proposal ID</dt>
            <dd style={detail}>3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
          </div>
        </dl>
        <section aria-labelledby="export-team" style={stack}>
          <Heading level={2} id="export-team">Team</Heading>
          <ul>
            <li>Full stack developer, 100% of full time: Test Developer One, $150.00 an hour</li>
            <li>Data professional, 50% of full time: Test Developer Two, $140.00 an hour</li>
          </ul>
          <Text elementType="p">Bid: $220.00 an hour, each rate weighted by its resource's target allocation.</Text>
        </section>
        <section aria-labelledby="export-questions" style={stack}>
          <Heading level={2} id="export-questions">Resource questions</Heading>
          <Heading level={3}>Question 1</Heading>
          <Text elementType="p">Describe your experience building data pipelines for health data.</Text>
          <Text elementType="p">
            Our team has built and run the ingestion pipelines for two provincial registries, with privacy reviews at each
            release.
          </Text>
        </section>
        <section aria-labelledby="export-attachments" style={stack}>
          <Heading level={2} id="export-attachments">Attachments</Heading>
          <ul>
            <li>Team profiles.pdf</li>
          </ul>
        </section>
      </article>
    </div>
  ),
};
