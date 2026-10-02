import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-edit · fixed — an administrator on the managing screen of "about", a page the service needs and created for
// itself, never edited. A warning says the service needs it at this address; no Delete page is offered (R-7.25). It still
// carries its stub wording and its address as its title (R-7.12), and names "System" as publisher and last editor (R-7.27).
const meta: Meta = { title: "content/content-edit/fixed" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Fixed: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="medium">
          <Stack gap="small">
            <Text elementType="p" size="small" color="secondary">Manage a page</Text>
            <Heading level={1}>about</Heading>
          </Stack>
          <Stack as="dl" direction="row" gap="medium">
            <div>
              <dt style={term}>Public address</dt>
              <dd><Link href="/content/about" data-testid="content-page-address">/content/about</Link></dd>
            </div>
            <div>
              <dt style={term}>Published</dt>
              <dd><time dateTime="2020-12-02" data-testid="content-published-date">December 2, 2020</time></dd>
            </div>
            <div>
              <dt style={term}>Published by</dt>
              <dd><span data-testid="content-published-by">System</span></dd>
            </div>
            <div>
              <dt style={term}>Last updated</dt>
              <dd><time dateTime="2020-12-02" data-testid="content-updated-date">December 2, 2020</time></dd>
            </div>
            <div>
              <dt style={term}>Last updated by</dt>
              <dd><span data-testid="content-updated-by">System</span></dd>
            </div>
          </Stack>
        </Stack>
        <div data-testid="content-fixed-page-warning">
          <InlineAlert variant="warning" title="The service needs this page">
            <Text elementType="p">
              Parts of the service link to this page or show its text, so it must stay at /content/about. You can change its
              title and body, but you cannot change its address or delete it.
            </Text>
          </InlineAlert>
        </div>
        <ButtonGroup ariaLabel="Page actions">
          <Button variant="primary" data-testid="content-edit-button">Edit page</Button>
        </ButtonGroup>
        <Stack as="section" gap="medium" aria-labelledby="content-current-heading">
          <Heading level={2} id="content-current-heading">Current wording</Heading>
          <TextField label="Title" isReadOnly defaultValue="about" data-testid="content-title-field" />
          <TextField label="Address" isReadOnly defaultValue="about" data-testid="content-slug-field" />
          <TextArea label="Body" isReadOnly defaultValue="Initial version" data-testid="content-body-field" />
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
