import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-twu-export-one · anonymous — the opportunity's author opens the printable copy while the proposal is still
// under review on its resource questions, so the proponent is named only as "Proponent 1" and the organization is
// withheld. Once the proposal reaches the challenge the staff copy names the organization (R-2.5, R-2.37)
const meta: Meta = { title: "proposals/proposal-twu-export-one/anonymous" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Anonymous: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000311">
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
              <dd data-testid="proposal-proponent-name">Proponent 1</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Status</dt>
              <dd>Under review: resource questions</dd>
            </Stack>
            <Stack gap="small">
              <dt style={term}>Proposal ID</dt>
              <dd>3f8a2c10-6d4b-4e19-a7c5-000000000311</dd>
            </Stack>
          </Stack>
          <Text elementType="p">The proponent's name is withheld from evaluators until the proposal reaches the challenge.</Text>
          <Text elementType="p" size="small" color="secondary">
            The Team, Resource questions and Attachments sections follow as in the default story, with the organization
            withheld. They are trimmed here.
          </Text>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
