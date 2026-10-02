import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import {
  Button,
  ButtonGroup,
  Form,
  Heading,
  Link,
  Radio,
  RadioGroup,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// proposal-cwu-create · default — a signed-in vendor who has accepted the service's terms starts a proposal as an
// individual. A draft can be saved with every field blank, and the terms are asked for only on submit (R-2.1, R-2.3,
// R-2.12, R-2.13, R-2.14)
const meta: Meta = { title: "proposals/proposal-cwu-create/default" };
export default meta;

const panel = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>Create a Code With Us proposal</Heading>
        <section aria-labelledby="create-opportunity" style={panel} data-testid="proposal-opportunity-summary">
          <Stack gap="medium">
            <Heading level={2} id="create-opportunity">The opportunity</Heading>
            <Stack as="dl" direction="row" gap="medium">
              <Stack gap="small">
                <dt style={term}>Opportunity</dt>
                <dd><Link href="/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101">Build an accessible permit tracker</Link></dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Reward</dt>
                <dd>$45,000</dd>
              </Stack>
              <Stack gap="small">
                <dt style={term}>Proposal deadline</dt>
                <dd>October 2, 2026 at 4:00 p.m. Pacific time</dd>
              </Stack>
            </Stack>
          </Stack>
        </section>
        <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <section aria-labelledby="form-proponent" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-proponent">Proponent</Heading>
                <RadioGroup id="proposal-proponent-type" label="Who is submitting this proposal?" isRequired defaultValue="individual">
                  <Radio value="individual" data-testid="proposal-proponent-individual">An individual</Radio>
                  <Radio value="organization" data-testid="proposal-proponent-organization">An organization</Radio>
                </RadioGroup>
                <TextField id="proposal-legal-name" label="Legal name" isRequired data-testid="proposal-legal-name-field" />
                <TextField id="proposal-email" label="Email address" type="email" isRequired data-testid="proposal-email-field" />
                <TextField id="proposal-phone" label="Phone number (optional)" type="tel" data-testid="proposal-phone-field" />
                <TextField id="proposal-street" label="Street address" isRequired data-testid="proposal-street-field" />
                <TextField id="proposal-street-2" label="Street address line 2 (optional)" data-testid="proposal-street-2-field" />
                <TextField id="proposal-city" label="City" isRequired data-testid="proposal-city-field" />
                <TextField id="proposal-region" label="Province or state" isRequired data-testid="proposal-region-field" />
                <TextField id="proposal-postal" label="Postal code" isRequired data-testid="proposal-postal-field" />
                <TextField id="proposal-country" label="Country" isRequired data-testid="proposal-country-field" />
              </Stack>
            </section>
            <section aria-labelledby="form-proposal" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-proposal">Proposal</Heading>
                <TextArea
                  id="proposal-text"
                  label="Proposal"
                  isRequired
                  maxLength={10000}
                  description="Between 1 and 10,000 characters."
                  data-testid="proposal-text-field"
                />
                <TextArea
                  id="proposal-comments"
                  label="Additional comments (optional)"
                  maxLength={10000}
                  description="Up to 10,000 characters."
                  data-testid="proposal-comments-field"
                />
              </Stack>
            </section>
            <section aria-labelledby="form-attachments" style={panel}>
              <Stack gap="medium">
                <Heading level={2} id="form-attachments">Attachments</Heading>
                <Text elementType="p">
                  Anyone who can read this proposal can read its attachments. Attachments are checked even when you save a draft.
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
            <Text elementType="p">
              You will be asked to accept the terms and conditions when you submit. You can withdraw a submitted proposal at any
              time.
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
