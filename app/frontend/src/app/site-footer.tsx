import { Footer, FooterLinks, Link } from "@bcgov/design-system-react-components";

/**
 * The footer every screen carries, signed in or not (R-7.19).
 *
 * Its five links are the service's whole standing offer of its own prose, and each opens the
 * page held at that address. Each of the five is a page the service creates for itself, so
 * every one of them resolves on a fresh installation (R-7.12).
 */
export const FOOTER_PAGES = [
  { slug: "about", label: "About", testId: "footer-about-link" },
  { slug: "disclaimer", label: "Disclaimer", testId: "footer-disclaimer-link" },
  { slug: "privacy", label: "Privacy", testId: "footer-privacy-link" },
  {
    slug: "accessibility",
    label: "Accessibility",
    testId: "footer-accessibility-link",
  },
  { slug: "copyright", label: "Copyright", testId: "footer-copyright-link" },
] as const;

export function SiteFooter() {
  return (
    <div data-testid="site-footer">
      <Footer
        links={
          <FooterLinks
            title="About this service"
            links={FOOTER_PAGES.map((entry) => (
              <Link
                key={entry.slug}
                href={`/content/${entry.slug}`}
                data-testid={entry.testId}
              >
                {entry.label}
              </Link>
            ))}
          />
        }
      />
    </div>
  );
}
