---
stage: "build"
title: "build slice 3"
at: "2026-10-01T02:23:24.246Z"
cost: 1.1846082000000002
turns: 51
session: "d9006b3a-8fc9-4612-98ef-1ab2567ddba3"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed both picture faults the ruling named. `npm --prefix app run check` passes for all three workspaces: migrations 15 tests, backend 240, frontend 134. The real acceptance run happens after my turn, so whether the picture halves of R-8.21 and R-8.30 now pass there is not yet known.

**R-8.30: Save no longer clears a refusal.** Before, if the picker refused a picture (for example `portrait.gif`) and the person then pressed Save changes, `save()` in `app/frontend/src/screens/user-profile.tsx` saved the profile and closed the form, and the refusal vanished with it. Now `save()` first checks for a refusal, including one from a file that is still being checked when Save is pressed. If there is one, it does not send anything: the form stays open, the refusal stays where it was, and focus moves back to it. The focus works through a new optional `rejectionFocus` counter on `ImagePicker`. While a refusal is showing, the person can choose another picture or cancel. A refusal from the service when the form is saved still works as before.

**R-8.21: the picker reads the file's first bytes when it is chosen.** `checkChosenPicture` in `app/frontend/src/app/image-picker.tsx` is now async. After the existing name and size checks, it reads the file's first eight bytes. If they are neither a JPEG start (FF D8 FF) nor the PNG signature, the refusal appears straight away in the picker's alert. So a `.png` whose content is text is refused at the moment it is chosen. If the browser cannot read the file, the picker accepts it and leaves the decision to the service.

To make sure the picker and the service judge content by the same rule, I moved the signature test (`imageKindOf`) into the shared `app/backend/src/rules/files.ts`. The service's image module (`app/backend/src/files/images.ts`) still exports it from there, and the service's own check is unchanged.

**Change outside the ruling: the sign-up completion screen.** `app/frontend/src/screens/sign-up-complete.tsx` uses the same check, so it had to follow the async change. If someone chooses twice quickly, only the latest choice counts, and a check still running when the form is submitted is waited for. I left its behaviour after a refusal as it was: it still completes without the picture, which its own message offers ("Choose another picture, or none"). The ruling was about `/users/me` only.

**Tests in `app/frontend/tests/profile.test.tsx`:**
- **New: Save during a refusal (R-8.30).** After a `.gif` is refused, pressing Save sends nothing, shows no saved message, and the same refusal element is still there with focus.
- **New: text inside a `.png` (R-8.21).** The file is refused when chosen, with no preview and nothing sent.
- **Changed: the `.gif` test.** It no longer expects a save to go through after the refusal.
- **Changed: test files now start with real image bytes.** The upload test uses a full PNG signature. The service-refusal test uses a file that starts like a JPEG, so it passes the picker and is refused by the service on save.

**Not mine to do:**
- **Organization-logo halves.** R-8.13, R-8.21, R-8.28 and R-8.30 each have a logo half that is tested on `/organizations/:orgId/edit`, which this slice does not build. Those halves will stay unbound or failing until the plan moves them or makes the slice that builds that screen a prerequisite. The ruling sent that condition to the plan stage.
- **Egress hits outside `app/`.** The remaining egress hits are in pipeline ledger and site files this stage cannot write.
- **Earlier egress wording.** Following the ruling, I have not quoted the wording that the earlier egress fix replaced.

I wrote no new decision record. The npm dependencies I installed to run the checks have been removed again, so the workspace is as it came apart from the changes above.