import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// content-list · deleted — an administrator confirmed removing the ordinary page "hackathon-rules" and has been returned
// to the list, told it was removed. It is no longer listed, and its address now answers as not found (R-7.9).
const meta: Meta = { title: "content/content-list/deleted" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const toolbar = { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--layout-margin-medium)" } as const;
const cell = {
  textAlign: "start",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

const pages = [
  { slug: "about", title: "about", fixed: true, created: ["2020-12-02", "December 2, 2020"], updated: ["2020-12-02", "December 2, 2020"] },
  { slug: "accessibility", title: "accessibility", fixed: true, created: ["2020-12-02", "December 2, 2020"], updated: ["2020-12-02", "December 2, 2020"] },
  { slug: "privacy", title: "Privacy", fixed: true, created: ["2020-12-02", "December 2, 2020"], updated: ["2026-09-14", "September 14, 2026"] },
  { slug: "service-level-agreement", title: "service-level-agreement", fixed: true, created: ["2026-09-18", "September 18, 2026"], updated: ["2026-09-18", "September 18, 2026"] },
];

export const Deleted: StoryObj = {
  render: () => (
    <div style={page}>
      <div style={toolbar}>
        <Heading level={1}>Content Management</Heading>
        <Link href="/content/create" isButton buttonVariant="primary" data-testid="content-create-link">Create page</Link>
      </div>
      <div data-testid="content-deleted-success">
        <InlineAlert variant="success" role="status" title="Page removed">
          <Text elementType="p">"Hackathon rules" and every earlier version of it have been removed. Its address, /content/hackathon-rules, no longer answers.</Text>
        </InlineAlert>
      </div>
      <Text elementType="p">
        Pages marked "Needed by the service" are linked to or embedded by the service. Their title and body can be changed,
        but they cannot be moved to another address or removed.
      </Text>
      <div role="region" aria-labelledby="content-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="content-list-table">
          <caption id="content-list-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">Every page, in order of title</Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>Title</th>
              <th scope="col" style={cell}>Public address</th>
              <th scope="col" style={cell}>Needed by the service</th>
              <th scope="col" style={cell}>Created</th>
              <th scope="col" style={cell}>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.slug} data-testid="content-list-row">
                <td style={cell}>
                  <Link href={`/content/${p.slug}/edit`} data-testid="content-list-title-link">{p.title}</Link>
                </td>
                <td style={cell}>
                  <Link href={`/content/${p.slug}`} data-testid="content-list-address-link">/content/{p.slug}</Link>
                </td>
                <td style={cell}>
                  <span data-testid="content-list-fixed">{p.fixed ? <span style={badge}>Yes</span> : "No"}</span>
                </td>
                <td style={cell}><time dateTime={p.created[0]} data-testid="content-list-created">{p.created[1]}</time></td>
                <td style={cell}><time dateTime={p.updated[0]} data-testid="content-list-updated">{p.updated[1]}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};
