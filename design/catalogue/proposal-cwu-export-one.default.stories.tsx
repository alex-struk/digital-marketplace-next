import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-cwu-export-one · default — a printable copy of one proposal, for anyone entitled to read it: its vendor, or
// staff once the opportunity has closed. It is one continuous document with nothing to expand, so it reads and prints
// whole (R-2.37)
const meta: Meta = { title: "proposals/proposal-cwu-export-one/default" };
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
        <Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111/edit">
          Back to the proposal
        </Link>
        <Button variant="secondary">Print</Button>
      </div>
      <article aria-labelledby="export-title" style={stack} data-testid="proposal-export-document">
        <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
        <Heading level={1} id="export-title">Build an accessible permit tracker</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Proponent</dt>
            <dd style={detail} data-testid="proposal-proponent-name">Test Vendor</dd>
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
            <dd style={detail}>3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
          </div>
        </dl>
        <section aria-labelledby="export-proponent" style={stack}>
          <Heading level={2} id="export-proponent">Proponent</Heading>
          <dl style={facts}>
            <div style={fact}>
              <dt style={term}>Proponent type</dt>
              <dd style={detail}>Individual</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Email address</dt>
              <dd style={detail}>test.vendor@example.com</dd>
            </div>
            <div style={fact}>
              <dt style={term}>Address</dt>
              <dd style={detail}>100 Example Street, Victoria, BC V8W 0A0, Canada</dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="export-text" style={stack}>
          <Heading level={2} id="export-text">Proposal text</Heading>
          <Text elementType="p">
            I will add a status page to the permit application that shows each stage in plain language, built with the
            ministry's existing React front end and tested with a screen reader at each step.
          </Text>
        </section>
        <section aria-labelledby="export-comments" style={stack}>
          <Heading level={2} id="export-comments">Additional comments</Heading>
          <Text elementType="p">I am available to start on the assignment date.</Text>
        </section>
        <section aria-labelledby="export-attachments" style={stack}>
          <Heading level={2} id="export-attachments">Attachments</Heading>
          <ul>
            <li>Delivery plan.pdf</li>
          </ul>
        </section>
      </article>
    </div>
  ),
};
