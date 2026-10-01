import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, InlineAlert, Link, Text, TextArea, TextField } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-edit · created — the administrator confirmed publishing a new page and has been taken to its managing screen,
// told it was published and where anyone can read it (R-7.7). The address here is what a test reads to reach the page again.
const meta: Meta = { title: "content/content-edit/created" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Created: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Manage a page</Text>
          <Heading level={1}>Hackathon rules</Heading>
        </Stack>
        <div data-testid="content-published-success">
          <InlineAlert variant="success" role="status" title="Page published">
            <Text elementType="p">Anyone can now read it at /content/hackathon-rules.</Text>
          </InlineAlert>
        </div>
        <Stack as="dl" direction="row" gap="medium">
          <div>
            <dt style={term}>Public address</dt>
            <dd><Link href="/content/hackathon-rules" data-testid="content-page-address">/content/hackathon-rules</Link></dd>
          </div>
          <div>
            <dt style={term}>Published</dt>
            <dd><time dateTime="2026-09-19" data-testid="content-published-date">September 19, 2026</time></dd>
          </div>
          <div>
            <dt style={term}>Published by</dt>
            <dd><Link href="/users/0b6f2c1e-5a7d-4c3e-9f10-000000000001" data-testid="content-published-by">Test Administrator</Link></dd>
          </div>
          <div>
            <dt style={term}>Last updated</dt>
            <dd><time dateTime="2026-09-19" data-testid="content-updated-date">September 19, 2026</time></dd>
          </div>
          <div>
            <dt style={term}>Last updated by</dt>
            <dd><Link href="/users/0b6f2c1e-5a7d-4c3e-9f10-000000000001" data-testid="content-updated-by">Test Administrator</Link></dd>
          </div>
        </Stack>
        <ButtonGroup ariaLabel="Page actions">
          <Button variant="primary" data-testid="content-edit-button">Edit page</Button>
          <Button variant="secondary" danger data-testid="content-delete-button">Delete page</Button>
        </ButtonGroup>
        <Stack as="section" gap="medium" aria-labelledby="content-current-heading">
          <Heading level={2} id="content-current-heading">Current wording</Heading>
          <TextField label="Title" isReadOnly defaultValue="Hackathon rules" data-testid="content-title-field" />
          <TextField label="Address" isReadOnly defaultValue="hackathon-rules" data-testid="content-slug-field" />
          <TextArea
            label="Body"
            isReadOnly
            defaultValue="Placeholder: the rules of the hackathon, written by an administrator."
            data-testid="content-body-field"
          />
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
