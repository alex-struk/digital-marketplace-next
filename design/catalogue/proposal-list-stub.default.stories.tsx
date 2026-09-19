import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-list-stub · default — the /proposals address. The old service left it as a stub reading only "Proposal
// List"; the criterion recording that (D-proposals-37) is obsolete and says the entry should go, but the ruled surface
// still carries it. This design lists nothing here and points to the dashboard, where R-2.24 puts a vendor's proposals.
// See the proposals domain's gaps in design/DESIGN.md
const meta: Meta = { title: "proposals/proposal-list-stub/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Proposals</Heading>
      <div data-testid="proposal-list-placeholder">
        <Text elementType="p">Your proposals, and your organizations' proposals, are listed on your dashboard.</Text>
      </div>
      <div>
        <Link href="/dashboard" isButton buttonVariant="primary">Go to your dashboard</Link>
      </div>
    </div>
  ),
};
