import { Header, Link } from "@bcgov/design-system-react-components";
import { useSession } from "../auth/session";
import { row } from "./layout";

/**
 * The banner every screen carries.
 *
 * It names the service, leads back to its home page, carries the keyboard route past itself,
 * and offers the way in or out: signing in and signing up to a visitor, and the dashboard and
 * signing out to somebody signed in (R-4.17). An administrator alone is offered the list of
 * users (R-4.14). The rest of the navigation menu — the content area for an administrator
 * (R-7.6) — arrives with the slices that build those screens.
 */
export function SiteHeader() {
  const session = useSession();
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
        {session.status === "signed-in" ? (
          <nav aria-label="Account" style={row}>
            <Link href="/dashboard">Dashboard</Link>
            {session.account.type === "ADMIN" ? <Link href="/users">Users</Link> : null}
            <Link href="/users/me">My profile</Link>
            <Link href="/sign-out">Sign out</Link>
          </nav>
        ) : session.status === "starting" ? null : (
          <nav aria-label="Account" style={row}>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/sign-up">Sign up</Link>
          </nav>
        )}
      </Header>
    </div>
  );
}
