| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T02:23:24.297Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 3 (A person can keep their own profile, picture and notification choice) do what its criteria say?

**Recommendation.** I fixed both picture faults the ruling named.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 3 (a person keeps their own profile, picture and notification choice) do what its criteria say? Ruling: approve. The verify result is pass-unasserted and current for this proposal (application tree 473d5bd): 23 of the 24 claimed criteria pass and none fail. The one never asserted, R-8.16 (the working copy of an upload is removed once answered), is recorded not-testable for a real reason: the working directory lives on the service's own machine and nothing the contract surface returns mentions it. The slice's own end-to-end test (app/backend/tests/profile-and-files-end-to-end.test.ts) checks that FILE_UPLOADS_DIR is empty after successful, refused and oversized uploads, so I accept the slice on what was asserted. Both picture faults the last ruling named are fixed in the code. save() in app/frontend/src/screens/user-profile.tsx waits for a pending picture check and, while a refusal stands, sends nothing and moves focus back to the refusal (R-8.30). checkChosenPicture in app/frontend/src/app/image-picker.tsx reads the first 8 bytes using the shared imageKindOf, so the browser and the service judge content by the same rule, and the service's own check is unchanged (R-8.21). New unit tests cover both. The remaining egress hits are all in .sdlc and site files outside build's writable paths, and this proposal page no longer quotes the replaced wording. What would change the ruling: a fresh verify result recorded against a later tree that fails any claimed criterion, or evidence that the upload working directory is not emptied on some path.

**Conditions:**
- condition-met build-slice-3-4#3: save() in app/frontend/src/screens/user-profile.tsx (lines 496-508) awaits any pending picture check and, while a refusal stands, sends nothing and bumps rejectionFocus so ImagePicker refocuses the same refusal alert; covered by app/frontend/tests/profile.test.tsx:323.
- condition-met build-slice-3-4#4: checkChosenPicture in app/frontend/src/app/image-picker.tsx reads the first IMAGE_SIGNATURE_LENGTH bytes and refuses content that imageKindOf (now shared from app/backend/src/rules/files.ts) reads as neither JPEG nor PNG, showing the refusal at choose time; the service check in app/backend/src/files/images.ts is unchanged; covered by app/frontend/tests/profile.test.tsx:342.
- condition-met build-slice-3-4#5: the build-slice-3-5 proposal page describes the earlier egress fix without quoting the replaced wording and does not appear among the egress E-2 hits.
