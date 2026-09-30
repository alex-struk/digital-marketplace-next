import { Header, Link } from "@bcgov/design-system-react-components";
import { useSession } from "../auth/session";

const links = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--layout-margin-medium)",
} as const;

/**
 * The banner every screen carries.
 *
 * It names the service, leads back to its home page, carries the keyboard route past
 * itself, and offers the way in or out: signing in and signing up to a visitor, and the
 * dashboard and signing out to somebody signed in (R-4.17). The navigation menu over the rest
 * of the service — the content area only to an administrator (R-7.6) — arrives with the
 * slices that build what it leads to.
 */
export function SiteHeader() {
  const { session } = useSession();
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
      >
        {session.status === "loading" ? null : (
          <nav aria-label="Account">
            {session.status === "signed-in" ? (
              <div style={links}>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/sign-out">Sign out</Link>
              </div>
            ) : (
              <div style={links}>
                <Link href="/sign-in">Sign in</Link>
                <Link href="/sign-up">Sign up</Link>
              </div>
            )}
          </nav>
        )}
      </Header>
    </div>
  );
}
