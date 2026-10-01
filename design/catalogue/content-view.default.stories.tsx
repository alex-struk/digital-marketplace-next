import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-view · default — a visitor who is not signed in reads the page at "privacy": its title, its body as formatted
// text, and its published and updated dates (R-7.1). The body is rendered as formatted text only; markup in it is shown,
// never run, and the same renderer is used wherever another screen embeds the body (R-7.17). No authorship is shown
// here: that is for an administrator on the managing screen (R-7.27).
const meta: Meta = { title: "content/content-view/default" };
export default meta;

const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack as="article" gap="large" aria-labelledby="content-page-heading" data-testid="content-page">
        <Stack gap="medium">
          <Heading level={1} id="content-page-heading">
            <span data-testid="content-page-title">Privacy</span>
          </Heading>
          <Stack as="dl" direction="row" gap="medium">
            <div>
              <dt style={term}>Published</dt>
              <dd><time dateTime="2020-12-02" data-testid="content-published-date">December 2, 2020</time></dd>
            </div>
            <div>
              <dt style={term}>Last updated</dt>
              <dd><time dateTime="2026-09-14" data-testid="content-updated-date">September 14, 2026</time></dd>
            </div>
          </Stack>
        </Stack>
        {/* Formatted text: the page's body, rendered by the project's own formatted-text renderer. Placeholder wording. */}
        <Stack gap="medium" data-testid="content-page-body">
          <Heading level={2}>How we handle your information</Heading>
          <Text elementType="p">
            Placeholder: the privacy notice's own wording is written by an administrator and is not part of the spec.
          </Text>
          <Text elementType="p">
            Questions about this notice can be raised through the{" "}
            <Link href="/content/accessibility" data-testid="content-body-link">accessibility page</Link>.
          </Text>
        </Stack>
        <Text elementType="p" size="small" color="secondary">
          Address of this page: <span data-testid="content-page-address">/content/privacy</span>
        </Text>
      </Stack>
    </PageContainer>
  ),
};
