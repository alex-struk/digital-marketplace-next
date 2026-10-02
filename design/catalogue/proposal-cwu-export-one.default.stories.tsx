import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-export-one · default — a printable copy of one proposal, for anyone entitled to read it: its vendor, or
// staff once the opportunity has closed. It is one continuous document with nothing to expand, so it reads and prints
// whole (R-2.37)
const meta: Meta = { title: "proposals/proposal-cwu-export-one/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111/edit">
            Back to the proposal
          </Link>
          <Button variant="secondary">Print</Button>
        </Stack>
        <Stack as="article" gap="medium" aria-labelledby="export-title" data-testid="proposal-export-document">
          <Stack gap="small">
            <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
            <Heading level={1} id="export-title">Build an accessible permit tracker</Heading>
          </Stack>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Proponent</dt>
              <dd data-testid="proposal-proponent-name">Test Vendor</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd>Submitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Submitted</dt>
              <dd>September 15, 2026 at 2:12 p.m.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Proposal ID</dt>
              <dd>3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
            </Stack>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-proponent">
            <Heading level={2} id="export-proponent">Proponent</Heading>
            <Stack as="dl" direction="row" gap="medium">
              <Stack gap="small">
                <dt style={term}>Proponent type</dt>
                <dd>Individual</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Email address</dt>
                <dd>test.vendor@example.com</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Address</dt>
                <dd>100 Example Street, Victoria, BC V8W 0A0, Canada</dd>
              </Stack>
            </Stack>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-text">
            <Heading level={2} id="export-text">Proposal text</Heading>
            <Text elementType="p">
              I will add a status page to the permit application that shows each stage in plain language, built with the
              ministry's existing React front end and tested with a screen reader at each step.
            </Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-comments">
            <Heading level={2} id="export-comments">Additional comments</Heading>
            <Text elementType="p">I am available to start on the assignment date.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-attachments">
            <Heading level={2} id="export-attachments">Attachments</Heading>
            <ul>
              <li>Delivery plan.pdf</li>
            </ul>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
