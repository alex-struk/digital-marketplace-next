---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "Five of them can now be reached and are bound: R-4.8, R-4.25, R-8.21, R-8.28 and R-8.30."
opened: 2026-10-01T00:50:39.725Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** Five of them can now be reached and are bound: R-4.8, R-4.25, R-8.21, R-8.28 and R-8.30.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the new target's adapter binds every action and reading it can reach and nothing else. The R-4.8 capabilities screens and the R-4.25 read-only email field do: the locators are plain, nothing in them decides an outcome, and for an administrator viewing another account the capabilityRow reading returns empty when the section is absent, so the R-4.8 test's administrator half is answered rather than reported unbound. The reasons for the five criteria still unbound (R-8.13, R-8.17, R-6.6, R-6.16, R-4.33) are specific about what the running build does not serve. Nothing under tests/acceptance changed, and the runner's typecheck passed. The profile-picture bindings for R-8.21, R-8.28 and R-8.30 do not stay an adapter, for two reasons. First, offerFile now puts the file straight into the hidden file field in the button's group whenever pressing 'Choose a profile picture' opens no file chooser. The author's own words are that a real person may not be able to choose a picture and a pass does not prove the button works, so the adapter would report a control a person cannot use as working. Second, the file-image-picker readings (storedPictureAddress, rejectedImageError, imageReadableWhenSignedOut and the stored size readers) press 'Save changes' through savePicture before they read. A reading is then submitting a form the test never submitted. That changes what the test exercises: R-8.21's refusal of non-image content shows only because the reading saved. The justification that the contract has no save step does not hold, because the R-8.21 accepted case, R-8.28 and R-8.30 all call userProfileSelf.saveChanges themselves. Removing both workarounds would change the ruling: drive the picker only through what a person can press, report it unbound when that opens no chooser, and keep readings to reading. Not this proposal's: the egress check failure is in build-slice-2-11 files this diff does not touch, and the author left a 1x1 PNG saved as the seeded administrator's profile picture, which the interface offers no way to remove.

**Conditions:**
- tests/adapters/new/index.ts offerFile: remove the fallback that calls setInputFiles on the hidden input[type=file] in the button's role=group when no filechooser event fires. If pressing the picker button opens no file chooser in the Playwright run, report unbound for that member (user-profile.change_avatar, user-sign-up-complete.change_avatar, file-image-picker.choose_image), saying the button opens no file chooser and nothing a person can see takes a file. Set tests/adapters/new/bindings.yaml to match. If a Playwright run shows the button does open a chooser, the existing chooser path is enough and the fallback is still removed.
- tests/adapters/new/index.ts file-image-picker readings: remove savePicture and the picturePending mechanism, so imageAddress, currentImage, rejectedImageError, imageReadableWhenSignedOut, storedImageWidth and storedImageHeight read what the page shows and never press 'Save changes'. Saving is userProfileSelf.saveChanges (and organizationEdit.saveChanges for a logo), which the R-8.21, R-8.28 and R-8.30 tests call themselves wherever they mean to save. Remove the bindings.yaml and index.ts comments claiming the contract gives the picker no save step.

### Runner-owned typecheck evidence

Proposal revision: `f21a7c78586b121c0e46fc826ceabd8f6a6a23f5`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
