import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-export-one · default — a printable copy of one proposal as its vendor sees it, naming the organization.
// Staff see the same copy once the proposal has reached the challenge (R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-export-one/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311/edit">
            Back to the proposal
          </Link>
          <Button variant="secondary">Print</Button>
        </Stack>
        <Stack as="article" gap="medium" aria-labelledby="export-title" data-testid="proposal-export-document">
          <Stack gap="small">
            <Text elementType="p" size="small" color="secondary">Team With Us proposal</Text>
            <Heading level={1} id="export-title">Data platform team</Heading>
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
              <dd>September 15, 2026 at 2:12 p.m.</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Proposal ID</dt>
              <dd>3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
            </Stack>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-team">
            <Heading level={2} id="export-team">Team</Heading>
            <ul>
              <li>Full stack developer, 100% of full time: Test Developer One, $150.00 an hour</li>
              <li>Data professional, 50% of full time: Test Developer Two, $140.00 an hour</li>
            </ul>
            <Text elementType="p">Bid: $220.00 an hour, each rate weighted by its resource's target allocation.</Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-questions">
            <Heading level={2} id="export-questions">Resource questions</Heading>
            <Heading level={3}>Question 1</Heading>
            <Text elementType="p">Describe your experience building data pipelines for health data.</Text>
            <Text elementType="p">
              Our team has built and run the ingestion pipelines for two provincial registries, with privacy reviews at each
              release.
            </Text>
          </Stack>
          <Stack as="section" gap="medium" aria-labelledby="export-attachments">
            <Heading level={2} id="export-attachments">Attachments</Heading>
            <ul>
              <li>Team profiles.pdf</li>
            </ul>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
