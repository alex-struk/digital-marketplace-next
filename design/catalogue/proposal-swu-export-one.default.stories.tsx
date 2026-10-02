import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-export-one · default — a printable copy of one proposal as its vendor sees it, naming the organization.
// Staff see the same copy once the proposal has reached the code challenge (R-2.37)
const meta: Meta = { title: "proposals/proposal-swu-export-one/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211/edit">
            Back to the proposal
          </Link>
          <Button variant="secondary">Print</Button>
        </Stack>
        <Stack as="article" gap="medium" aria-labelledby="export-title" data-testid="proposal-export-document">
          <Stack gap="small">
            <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
            <Heading level={1} id="export-title">Modernize the licence renewal service</Heading>
          </Stack>
          <Stack as="dl" direction="row" gap="medium">
            <Stack gap="small">
              <dt style={term}>Proponent</dt>
              <dd data-testid="proposal-proponent-name">Example Digital Ltd.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd>Submitted</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Submitted</dt>
              <dd>October 10, 2026 at 2:12 p.m.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Proposal ID</dt>
              <dd>3f8a2c10-6d4b-4e19-a7c5-000000000211</dd>
            </Stack>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-team">
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
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-questions">
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
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-references">
            <Heading level={2} id="export-references">References</Heading>
            <Text elementType="p">Test Reference One, test.reference@example.com</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-attachments">
            <Heading level={2} id="export-attachments">Attachments</Heading>
            <ul>
              <li>Delivery approach.pdf</li>
            </ul>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
