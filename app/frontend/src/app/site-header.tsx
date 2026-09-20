import { Header } from "@bcgov/design-system-react-components";

/**
 * The banner every screen carries.
 *
 * The navigation menu — which offers the content area only to an administrator (R-7.6), and
 * the rest of the service only to somebody signed in — arrives with the slice that has
 * somebody to sign in. Until then the banner names the service, leads back to its home page,
 * and carries the keyboard route past itself.
 */
export function SiteHeader() {
  return (
    <div data-testid="site-header">
      <Header
        title="Digital Marketplace"
        titleElement="span"
        skipLinks={[
          <a key="main" href="#main">
            Skip to main content
          </a>,
        ]}
      />
    </div>
  );
}
