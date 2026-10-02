import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-list · refused — the service answered the list request with "not permitted". It is shown as a
// refusal and never as an empty table, so the two answers cannot be mistaken for each other. Which request is
// refused, and for whom, is not stated by any criterion: see DESIGN.md, organizations gap 1.
const meta: Meta = { title: "organizations/organization-list/refused" };
export default meta;

export const Refused: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Digital Marketplace Organizations</Heading>
        <div data-testid="organization-list-refused">
          <InlineAlert
            variant="danger"
            role="alert"
            title="You are not permitted to see these organizations"
            description="Only a signed-in vendor can see the organizations they act for."
          />
        </div>
      </Stack>
    </PageContainer>
  ),
};
