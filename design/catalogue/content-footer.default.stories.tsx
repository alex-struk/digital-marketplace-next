import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footer, FooterLinks, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// content-footer · default — the footer every screen carries, here under the home page as a visitor who is not signed
// in sees it. Its "About this service" list links to the five pages the service keeps for its own prose (R-7.19). The
// home page above it is the opportunities domain's and is shown only as a placeholder frame.
const meta: Meta = { title: "content/content-footer/default" };
export default meta;

// The placeholder frame marks out a screen this domain does not design. Its border and inner padding are its own; its
// content is laid out by the stack.
const frame = {
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

// The footer sits outside the page container: the design system's Footer centres its own content to the same width.
export const Default: StoryObj = {
  render: () => (
    <div>
      <PageContainer>
        <Stack gap="large">
          <section aria-labelledby="home-placeholder-heading" style={frame}>
            <Stack gap="medium">
              <Heading level={1} id="home-placeholder-heading">Digital Marketplace</Heading>
              <Text elementType="p">Placeholder: the home page is designed by the opportunities domain.</Text>
            </Stack>
          </section>
        </Stack>
      </PageContainer>
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
