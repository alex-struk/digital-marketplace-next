import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { page, row, stack } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";

/**
 * The home page, as a visitor who has not signed in sees it.
 *
 * This is the shell: the service's own account of itself, the way in, and the way to each of
 * the three programs. The figures for what has been awarded through the service are the
 * opportunities domain's and arrive with the slice that counts them.
 */
export function HomeScreen() {
  useScreenTitle("Digital Marketplace");
  return (
    <div style={page} data-testid="home-page">
      <Heading level={1}>Digital Marketplace</Heading>
      <Text elementType="p" size="large">
        The Digital Marketplace is where the BC Public Service posts procurement
        opportunities for digital work, and where vendors propose to do that work,
        through three programs: Code With Us, Sprint With Us and Team With Us.
      </Text>
      <div style={row}>
        <Link
          href="/opportunities"
          isButton
          buttonVariant="primary"
          data-testid="home-browse-opportunities"
        >
          Browse opportunities
        </Link>
        <Link
          href="/sign-in"
          isButton
          buttonVariant="secondary"
          data-testid="home-sign-in"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          isButton
          buttonVariant="tertiary"
          data-testid="home-sign-up"
        >
          Sign up
        </Link>
      </div>
      <section aria-labelledby="home-programs-heading" style={stack}>
        <Heading level={2} id="home-programs-heading">
          The three programs
        </Heading>
        <ul>
          <li>
            <Link href="/learn-more/code-with-us">Learn about Code With Us</Link>
          </li>
          <li>
            <Link href="/learn-more/sprint-with-us">
              Learn about Sprint With Us
            </Link>
          </li>
          <li>
            <Link href="/learn-more/team-with-us">Learn about Team With Us</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
