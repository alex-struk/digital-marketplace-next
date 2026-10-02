import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// home · loading — the awarded figures have not arrived; everything else is already readable
const meta: Meta = { title: "opportunities/home-page/loading" };
export default meta;

export const Loading: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large" data-testid="home-page">
        <Heading level={1}>Digital Marketplace</Heading>
        <Text elementType="p" size="large">
          The Digital Marketplace is where the BC Public Service posts procurement opportunities for digital work, and where
          vendors propose to do that work, through three programs: Code With Us, Sprint With Us and Team With Us.
        </Text>
        <Stack direction="row" align="center" gap="medium">
          <Link href="/opportunities" isButton buttonVariant="primary" data-testid="home-browse-opportunities">Browse opportunities</Link>
          <Link href="/sign-in" isButton buttonVariant="secondary" data-testid="home-sign-in">Sign in</Link>
          <Link href="/sign-up" isButton buttonVariant="tertiary" data-testid="home-sign-up">Sign up</Link>
        </Stack>
        <Stack as="section" gap="medium" aria-labelledby="home-awards-heading">
          <Heading level={2} id="home-awards-heading">Awarded through the Digital Marketplace</Heading>
          <Stack direction="row" align="center" gap="small" role="status">
            <ProgressCircle isIndeterminate aria-label="Loading figures" />
            <Text>Loading figures…</Text>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
