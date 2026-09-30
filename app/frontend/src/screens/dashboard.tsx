import { Heading, Text } from "@bcgov/design-system-react-components";
import { page } from "../app/layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";

/**
 * The dashboard, where a returning person lands after signing in (R-4.22).
 *
 * This is its shell: the heading, and who is signed in. What it lists — a public sector
 * employee's opportunities, a vendor's proposals, a panel member's evaluations — belongs to
 * the slices that make those things, and arrives with them.
 */
export function DashboardScreen() {
  useScreenTitle("Dashboard");
  return (
    <RequireSignIn title="Dashboard">
      {(account) => (
        <div style={page}>
          <Heading level={1}>Dashboard</Heading>
          <Text elementType="p">{`You are signed in as ${account.name}.`}</Text>
        </div>
      )}
    </RequireSignIn>
  );
}
