import type { Meta, StoryObj } from "@storybook/react";
import { ExportDialog, PageHeading, PageShell, UserListToolbar, UserTable } from "./users.shared";

const ids = {
  search_by_name: "user-list__search_by_name",
  open_export_contact_list: "user-list__open_export_contact_list",
  toggle_export_user_type: "user-list__toggle_export_user_type",
  toggle_export_field: "user-list__toggle_export_field",
  export_contact_list: "user-list__export_contact_list",
  cancel_export: "user-list__cancel_export",
  open_user_profile: "user-list__open_user_profile",
  user_row: "user-list__user_row",
  status_badge: "user-list__status_badge",
  account_type: "user-list__account_type",
  admin_check: "user-list__admin_check",
  export_modal: "user-list__export_modal",
  export_disabled_until_selection: "user-list__export_disabled_until_selection",
} as const;

// The export dialog just opened: nothing chosen, Export unavailable, the reason stated (R-4.32).
function UserListExportOpen() {
  return (
    <PageShell>
      <PageHeading>Digital Marketplace Users</PageHeading>
      <UserListToolbar ids={ids} />
      <UserTable ids={ids} />
      <ExportDialog ids={ids} ready={false} />
    </PageShell>
  );
}

const meta: Meta<typeof UserListExportOpen> = {
  title: "users/user-list/export-open",
  component: UserListExportOpen,
  parameters: { layout: "fullscreen", page: "user-list", route: "/users", state: "export-open" },
};

export default meta;

export const ExportOpen: StoryObj<typeof UserListExportOpen> = {};
