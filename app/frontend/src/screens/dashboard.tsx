import { Heading, Text } from "@bcgov/design-system-react-components";
import { page } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { RequireSignIn } from "../auth/require-sign-in";

/**
 * `/dashboard` — where a signed-in person lands (R-4.22).
 *
 * This is the shell only, so that signing in has somewhere to arrive and a visitor who is
 * not signed in is sent to sign in and brought back. What a dashboard shows — a person's
 * opportunities, or a vendor's proposals — belongs to the opportunities and proposals
 * slices, which fill it in.
 */
export function DashboardScreen() {
  useScreenTitle("Dashboard");
  return (
    <RequireSignIn title="Dashboard">
      {(user) => (
        <div style={page}>
          <Heading level={1}>Dashboard</Heading>
          <Text elementType="p">{`You are signed in as ${user.name}.`}</Text>
        </div>
      )}
    </RequireSignIn>
  );
}
