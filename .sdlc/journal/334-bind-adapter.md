---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T00:50:39.691Z"
cost: 6.320009000000002
turns: 141
session: "dbc862ce-4b14-4828-8635-4fd2225b1ad7"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've re-walked all ten criteria on the running build. Five of them can now be reached and are bound: R-4.8, R-4.25, R-8.21, R-8.28 and R-8.30. Five stay unbound, because the screens they need still answer "Page not found" or 404: R-8.13, R-8.17, R-6.6, R-6.16 and R-4.33. I couldn't typecheck or run the adapter. Playwright and TypeScript aren't installed in the workspace, and running Node needed an approval I didn't have. So everything below was checked by driving the browser tool by hand with the same locators the adapter uses, and the edited code has never compiled or run.

**Newly bound**
- **R-4.8, capabilities.** A vendor's `/users/me?tab=capabilities` now shows a list of capability checkboxes, each with a "Show description of <name>" button. Ticking a box saves it straight away ("Saved. DevOps Engineering is recorded as a capability you hold.") and it stays ticked after a reload. I bound all five members of `user-profile-self-capabilities` and `user-profile-capabilities`. When I tested as the seeded organization owner, I set the box back to how it was.
- **R-4.25, another account's email.** The administrator can now open another person's `/users/:userId`, which shows a read-only "Email address" field. The existing reader works there unchanged; I only removed old reason text that claimed this page was refused.
- **Profile picture (R-8.21, R-8.28, R-8.30).** The picker is now on the "Edit profile" form at `/users/me`.
  - One judgement call for the reviewer. Pressing "Choose a profile picture" never opens a file chooser in this browser (I tried click, Enter, Space and a plain mouse press). The button sits in a "Profile picture (optional)" group next to a hidden file field, and that field does accept a file: the page shows the preview and the refusal messages. So when no chooser opens, the adapter hands the file to that field. It finds it by structure (an XPath for the file input inside the button's group), not by a class or test id. A real person may not be able to choose a picture at all, so a passing test here doesn't prove the button works.
  - A file with the wrong ending or over 10 MB is refused at once in the group. A file whose content isn't an image is refused only when "Save changes" is pressed.
  - The contract gives the picker no save step of its own. So a chosen picture stays pending until something reads the stored picture (its address, size, refusal or signed-out readability), which saves it first. The preview is read without saving.
  - A stored picture appears at `/api/files/<id>?type=blob`, and fetching it without a session returned 200 image/png.
  - While testing, I saved a 1×1 PNG as the seeded administrator's profile picture. I found no way in the interface to remove it.
- **Related fixes that came with this:** profile edit, save, cancel, change picture, and deactivate with its confirm/cancel dialog are now bound on both profile pages. `user-sign-up-complete.change_avatar` is bound too: I checked the same group structure on `/sign-up/complete` as the vendor still to complete a profile, without submitting the form. `saveChanges` now presses "Edit profile" first, because the fields are read-only rather than disabled until then.

**Still unbound**
- **R-8.13** (organization edit plus its logo picker) and **R-6.16** (`organization-edit.add_team_members`): as the seeded organization owner, `/organizations`, the organization's own page, `/organizations/create` and `/organizations/<seeded id>/edit` all answer "Page not found". Its profile's Organizations section says organizations "will be listed here once organizations can be registered". The administrator gets the same "Page not found" answers. If a test reaches the picker from an organization screen, the picker now reports unbound instead of reading the profile picture by mistake.
- **R-8.17** (attachment size limit): as the administrator, the seeded opportunity's edit page, its public page and `/opportunities/code-with-us/create` all answer "Page not found".
- **R-6.6** (email reference): as the administrator, `/admin/email-notification-reference` is not a screen. The service answers 404 "Cannot GET". The `/api` versions of the address I tried also return 404, and `/admin` is "Page not found".
- **R-4.33** (terms broadcast): `/content/terms-and-conditions/edit` answers "Page not found" to the administrator. The terms page itself still opens at `/content/terms-and-conditions`.

**Pages whose route doesn't resolve on the target:** for a signed-in user, every organization, opportunity, content-management and admin screen, plus `/opportunities`, `/organizations` and `/users`, answers "Page not found". `/admin/email-notification-reference` answers 404 to the administrator.

I also corrected reason text that said `/users/:userId` was refused to the administrator, or that the Organizations section just redrew the profile. Changes are in `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`; I didn't touch anything else in the workspace.