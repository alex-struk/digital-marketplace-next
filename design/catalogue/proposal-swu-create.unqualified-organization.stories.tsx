import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, Select, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-swu-create · unqualified-organization — the chosen organization is not a qualified supplier for Sprint With
// Us. The vendor is told as soon as it is chosen, can still save a draft, and a submission is refused. A proposal naming
// no organization is refused with "An organization must be specified before submitting." at the same field (R-2.16)
const meta: Meta = { title: "proposals/proposal-swu-create/unqualified-organization" };
export default meta;

const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

// Illustrative only: the organizations the signed-in vendor owns or administers.
const organizations = [
  { id: "org-1", label: "Example Digital Ltd." },
  { id: "org-2", label: "Sample Software Co-op" },
];

export const UnqualifiedOrganization: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Create a Sprint With Us proposal</Heading>
        <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <section aria-labelledby="form-organization" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-organization">Organization</Heading>
                <Select
                  id="proposal-organization"
                  label="Organization"
                  isRequired
                  description="Organizations you own or administer. It must be a qualified supplier for Sprint With Us before you submit."
                  items={organizations}
                  defaultValue="org-1"
                  data-testid="proposal-organization-field"
                />
                <div data-testid="proposal-unqualified-organization-notice">
                  <InlineAlert variant="warning" title="Example Digital Ltd. is not qualified for Sprint With Us">
                    <Text elementType="p">
                      You can save this proposal as a draft, but it cannot be submitted for this organization until it is a
                      qualified supplier for Sprint With Us. Qualification is checked again when you submit.
                    </Text>
                    <Link href="/organizations/org-1/sprint-with-us-terms-and-conditions">Review the organization's qualification</Link>
                  </InlineAlert>
                </div>
              </Stack>
            </section>
            <Text elementType="p" size="small" color="secondary">
              The opportunity summary and the rest of the form are as in the default story and are trimmed here.
            </Text>
            <ButtonGroup ariaLabel="Proposal actions">
              <Button variant="tertiary" data-testid="proposal-cancel">Cancel</Button>
              <Button variant="secondary" data-testid="proposal-save-draft">Save draft</Button>
              <Button type="submit" variant="primary" data-testid="proposal-submit">Submit proposal</Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
