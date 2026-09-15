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

// One account type and one field chosen: the requirement sentence is gone and Export is available.
function UserListExportReady() {
  return (
    <PageShell>
      <PageHeading>Digital Marketplace Users</PageHeading>
      <UserListToolbar ids={ids} />
      <UserTable ids={ids} />
      <ExportDialog ids={ids} ready />
    </PageShell>
  );
}

const meta: Meta<typeof UserListExportReady> = {
  title: "users/user-list/export-ready",
  component: UserListExportReady,
  parameters: { layout: "fullscreen", page: "user-list", route: "/users", state: "export-ready" },
};

export default meta;

export const ExportReady: StoryObj<typeof UserListExportReady> = {};
