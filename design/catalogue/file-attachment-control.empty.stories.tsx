import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-attachment-control · empty — the opportunity has no attachments yet. The list is replaced by a sentence saying
// so, and the size limit is stated before the person chooses a file (R-8.17).
const meta: Meta = { title: "files/file-attachment-control/empty" };
export default meta;

// The card section: a border and the inner padding that keeps content off it. Spacing inside it is the stack's.
const card = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit";

export const Empty: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a Code With Us opportunity</Text>
          <Heading level={1}>Build an accessible permit tracker</Heading>
        </Stack>
        <nav aria-label="Opportunity sections">
          <Stack as="ul" direction="row" gap="medium">
            <li><Link href={`${base}?tab=summary`}>Summary</Link></li>
            <li><Link href={`${base}?tab=opportunity`} aria-current="page">Opportunity</Link></li>
            <li><Link href={`${base}?tab=addenda`}>Addenda</Link></li>
            <li><Link href={`${base}?tab=history`}>History</Link></li>
          </Stack>
        </nav>
        <Stack as="section" gap="medium" aria-labelledby="tab-heading">
          <Heading level={2} id="tab-heading">Opportunity</Heading>
          <Text elementType="p" size="small" color="secondary">
            The overview, description, details and key dates come first. They are the opportunities domain's design and are
            not shown here.
          </Text>
          <section aria-labelledby="form-attachments" style={card}>
            <Stack gap="medium">
              <Heading level={3} id="form-attachments">Attachments</Heading>
              <Text elementType="p">
                Attach any documents proponents need. Anyone who can read this opportunity can read its attachments.
              </Text>
              <Text elementType="p">No attachments have been added.</Text>
              <div id="attachment-size-limit" data-testid="attachment-size-limit">
                <Text elementType="p" size="small" color="secondary">Any type of file, up to 10 MB each.</Text>
              </div>
              <div>
                <FileTrigger>
                  <Button variant="secondary" aria-describedby="attachment-size-limit" data-testid="attachment-add-button">
                    Add attachment
                  </Button>
                </FileTrigger>
              </div>
            </Stack>
          </section>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
