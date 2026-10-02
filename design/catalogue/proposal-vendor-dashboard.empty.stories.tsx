import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-vendor-dashboard · empty — a vendor who owns an organization, before anyone has started a proposal. Each
// heading keeps its place and says in words that its list is empty (R-2.24)
const meta: Meta = { title: "proposals/proposal-vendor-dashboard/empty" };
export default meta;

export const Empty: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Dashboard</Heading>
        <nav aria-label="Dashboard sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href="#my-proposals" data-testid="dashboard-show-my-proposals">My proposals</Link></li>
            <li><Link href="#organization-proposals" data-testid="dashboard-show-org-proposals">My organizations' proposals</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" id="my-proposals" tabIndex={-1} aria-labelledby="my-proposals-heading">
          <Heading level={2} id="my-proposals-heading">My proposals</Heading>
          <div data-testid="dashboard-empty-my-proposals">
            <Text elementType="p">
              You have not started any proposals. <Link href="/opportunities">Browse opportunities</Link> to find one to bid on.
            </Text>
          </div>
        </Stack>
        <Stack as="section" gap="medium" id="organization-proposals" tabIndex={-1} aria-labelledby="org-proposals-heading">
          <Heading level={2} id="org-proposals-heading">My organizations' proposals</Heading>
          <div data-testid="dashboard-empty-org-proposals">
            <Text elementType="p">No one has started a proposal for an organization you own or administer.</Text>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
