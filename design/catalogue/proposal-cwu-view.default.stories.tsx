import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-view · default — the opportunity's author, after the opportunity has closed, on a proposal under review.
// They may enter its one score or disqualify it, and take away a printable copy (R-2.25, R-2.26, R-2.34, R-2.37)
const meta: Meta = { title: "proposals/proposal-cwu-view/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000111";

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Code With Us proposal</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Test Vendor</span></Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Stack gap="small">
            <dt style={term}>Opportunity</dt>
            <dd><Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit">Build an accessible permit tracker</Link></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Status</dt>
            <dd><span style={badge} data-testid="proposal-status">Under review</span></dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Submitted</dt>
            <dd>September 15, 2026 at 2:12 p.m.</dd>
          </Stack>
          <Stack gap="small">
            <dt style={term}>Proposal ID</dt>
            <dd data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000111</dd>
          </Stack>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="scores-heading">
          <Heading level={2} id="scores-heading">Score</Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Score</dt>
              <dd data-testid="proposal-score">Not yet scored</dd>
            </Stack>
          </Stack>
        </Stack>
        <div>
          <Link href={`${base}/export`} data-testid="proposal-export-link">Printable copy</Link>
        </div>
        <div data-testid="proposal-actions">
          <ButtonGroup ariaLabel="Proposal actions">
            <Button variant="primary" data-testid="proposal-enter-score">Enter score</Button>
            <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
          </ButtonGroup>
        </div>
        <nav aria-label="Proposal sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
            <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Proposal</Heading>
          <Stack as="section" gap="medium" aria-labelledby="tab-proponent">
            <Heading level={3} id="tab-proponent">Proponent</Heading>
            <Stack as="dl" direction="row" gap="medium">
              <Stack gap="small">
                <dt style={term}>Proponent type</dt>
                <dd>Individual</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Legal name</dt>
                <dd>Test Vendor</dd>
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
          <Stack as="section" gap="medium" aria-labelledby="tab-text">
            <Heading level={3} id="tab-text">Proposal text</Heading>
            <Text elementType="p">
              I will add a status page to the permit application that shows each stage in plain language, built with the
              ministry's existing React front end and tested with a screen reader at each step.
            </Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-comments">
            <Heading level={3} id="tab-comments">Additional comments</Heading>
            <Text elementType="p">I am available to start on the assignment date.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="tab-attachments">
            <Heading level={3} id="tab-attachments">Attachments</Heading>
            <ul>
              <li>
                <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000901?type=blob" data-testid="attachment-download-link">
                  Download Delivery plan.pdf
                </Link>
              </li>
            </ul>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
