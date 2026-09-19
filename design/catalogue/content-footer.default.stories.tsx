import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footer, FooterLinks, Heading, Link, Text } from "@bcgov/design-system-react-components";

// content-footer · default — the footer every screen carries, here under the home page as a visitor who is not signed
// in sees it. Its "About this service" list links to the five pages the service keeps for its own prose (R-7.19). The
// home page above it is the opportunities domain's and is shown only as a placeholder frame.
const meta: Meta = { title: "content/content-footer/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const frame = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

// One entry per page, in the order R-7.19 names them. The address is the page's own, under /content.
const pages = [
  { slug: "about", label: "About", testId: "footer-about-link" },
  { slug: "disclaimer", label: "Disclaimer", testId: "footer-disclaimer-link" },
  { slug: "privacy", label: "Privacy", testId: "footer-privacy-link" },
  { slug: "accessibility", label: "Accessibility", testId: "footer-accessibility-link" },
  { slug: "copyright", label: "Copyright", testId: "footer-copyright-link" },
];

export const Default: StoryObj = {
  render: () => (
    <div>
      <div style={page}>
        <section aria-labelledby="home-placeholder-heading" style={frame}>
          <Heading level={1} id="home-placeholder-heading">Digital Marketplace</Heading>
          <Text elementType="p">Placeholder: the home page is designed by the opportunities domain.</Text>
        </section>
      </div>
      <div data-testid="site-footer">
        <Footer
          links={
            <FooterLinks
              title="About this service"
              links={pages.map((p) => (
                <Link key={p.slug} href={`/content/${p.slug}`} data-testid={p.testId}>
                  {p.label}
                </Link>
              ))}
            />
          }
        />
      </div>
    </div>
  ),
};
