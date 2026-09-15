import type { Meta, StoryObj } from "@storybook/react";
import { NotFound, PageShell } from "./users.shared";

// Any :noticeId other than the two the application defines is answered as not found. The
// surface names no observation for this, so nothing here carries a test ID.
function UserNoticeNotFound() {
  return (
    <PageShell>
      <NotFound />
    </PageShell>
  );
}

const meta: Meta<typeof UserNoticeNotFound> = {
  title: "users/user-notice/not-found",
  component: UserNoticeNotFound,
  parameters: { layout: "fullscreen", page: "user-notice", route: "/notice/:noticeId", state: "not-found" },
};

export default meta;

export const NotFoundNotice: StoryObj<typeof UserNoticeNotFound> = {};
