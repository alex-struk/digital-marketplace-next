import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// file-attachment-control · public-view — the same attachments as they appear on the opportunity's own page
// (opportunity-*-view) once it is published: a list of download links at the end of the Description section. Nothing
// here can be renamed or removed, so no Remove control is rendered at all (R-8.10, R-8.25). The rest of the page is the
// opportunities domain's and is trimmed here.
const meta: Meta = { title: "files/file-attachment-control/public-view" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const list = {
  display: "grid",
  gap: "var(--layout-margin-small)",
  margin: "var(--layout-margin-none)",
} as const;

export const PublicView: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Code With Us opportunity</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <Text elementType="p" size="small" color="secondary">
        The teaser, key facts and actions are the opportunities domain's design and are not shown here.
      </Text>
      <section aria-labelledby="view-description" style={stack}>
        <Heading level={2} id="view-description">Description</Heading>
        <Text elementType="p">
          The ministry runs an online permit application that tells applicants little about where their application
          stands. This opportunity adds a status page that works with a keyboard and a screen reader.
        </Text>
        <Heading level={3} id="view-attachments">Attachments</Heading>
        <ul style={list} aria-labelledby="view-attachments" data-testid="attachment-list">
          <li data-testid="attachment-existing-row">
            <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000803?type=blob" data-testid="attachment-download-link">
              Download Statement of work.pdf
            </Link>
          </li>
          <li data-testid="attachment-existing-row">
            <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000804?type=blob" data-testid="attachment-download-link">
              Download Current permit screens.png
            </Link>
          </li>
        </ul>
      </section>
    </div>
  ),
};
