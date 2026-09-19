import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-swu-export-one · default — a printable copy of one proposal as its vendor sees it, naming the organization.
// Staff see the same copy once the proposal has reached the code challenge (R-2.37)
const meta: Meta = { title: "proposals/proposal-swu-export-one/default" };
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
        <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211/edit">
          Back to the proposal
        </Link>
        <Button variant="secondary">Print</Button>
      </div>
      <article aria-labelledby="export-title" style={stack} data-testid="proposal-export-document">
        <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
        <Heading level={1} id="export-title">Modernize the licence renewal service</Heading>
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
            <dd style={detail}>October 10, 2026 at 2:12 p.m.</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Proposal ID</dt>
            <dd style={detail}>3f8a2c10-6d4b-4e19-a7c5-000000000211</dd>
          </div>
        </dl>
        <section aria-labelledby="export-team" style={stack}>
          <Heading level={2} id="export-team">Team</Heading>
          <Heading level={3}>Prototype phase</Heading>
          <ul>
            <li>Test Vendor, scrum master: Agile coaching, User research</li>
            <li>Test Developer One: Frontend development, Backend development</li>
          </ul>
          <Text elementType="p">Proposed cost: $300,000</Text>
          <Heading level={3}>Implementation phase</Heading>
          <ul>
            <li>Test Vendor, scrum master: Agile coaching</li>
            <li>Test Developer One: Frontend development, Backend development</li>
            <li>Test Designer: User research, Security engineering</li>
          </ul>
          <Text elementType="p">Proposed cost: $850,000</Text>
          <Text elementType="p">Total proposed cost: $1,150,000 of the $1,200,000 maximum budget.</Text>
        </section>
        <section aria-labelledby="export-questions" style={stack}>
          <Heading level={2} id="export-questions">Team questions</Heading>
          <Heading level={3}>Question 1</Heading>
          <Text elementType="p">Describe how your team would approach user research for the renewal service.</Text>
          <Text elementType="p">
            We would start with the renewal staff and the ten most common reasons a renewal is returned, then test each change
            with applicants who use assistive technology.
          </Text>
          <Heading level={3}>Question 2</Heading>
          <Text elementType="p">Describe a time your team replaced a legacy system without interrupting service.</Text>
          <Text elementType="p">We moved a permit service to a new platform in stages, running both side by side for six weeks.</Text>
        </section>
        <section aria-labelledby="export-references" style={stack}>
          <Heading level={2} id="export-references">References</Heading>
          <Text elementType="p">Test Reference One, test.reference@example.com</Text>
        </section>
        <section aria-labelledby="export-attachments" style={stack}>
          <Heading level={2} id="export-attachments">Attachments</Heading>
          <ul>
            <li>Delivery approach.pdf</li>
          </ul>
        </section>
      </article>
    </div>
  ),
};
