import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { page } from "./layout";
import { useScreenTitle } from "./screen-title";

/**
 * The shared missing page.
 *
 * It is shown for an address no page holds and for an address that is not well formed, which
 * look the same to a person (R-7.2, R-7.3), and for every other address the app does not
 * answer for.
 */
export function NotFound() {
  useScreenTitle("Page not found");
  return (
    <div style={page} data-testid="not-found-page">
      <Heading level={1}>Page not found</Heading>
      <Text elementType="p">The page you are looking for does not exist.</Text>
      <div>
        <Link href="/" isButton buttonVariant="primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
