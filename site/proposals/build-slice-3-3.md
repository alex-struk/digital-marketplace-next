| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T01:30:36.457Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 3 (A person can keep their own profile, picture and notification choice) do what its criteria say?

**Recommendation.** I changed the application for two of the three returned criteria, R-4.29 and R-4.18.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed the application for two of the three returned criteria, R-4.29 and R-4.18. The third, R-8.23, failed inside the test before anything reached the application, so there was nothing in the application to fix. I could not run the stack here (the `docker compose` command needed an approval this session cannot give), so I have not watched either fix in the running app. Both rest on reading the failure messages against the criteria. Typecheck and all unit tests pass: 15 migrations, 240 backend and 131 frontend.

**R-4.29, notifications.** Unticking the new-opportunity box on the profile opened the "Stop emails about new opportunities?" question and left the box ticked. That matches the ruling's "expected not checked". The criterion says a person may turn the notice on or off at any time from their profile. It asks for confirmation only when they arrive from a message's unsubscribe link. The box now saves the moment it is pressed, in either direction, with no question. It goes back with an alert only if the service refuses. Arriving at `/users/me?tab=notifications&unsubscribe` still opens the question naming the signed-in person's address, and the box changes only when Unsubscribe is pressed.

This goes against `design/DESIGN.md`, which says the question is asked "both from the checkbox and on arrival". I followed the criterion, and recorded the departure in `docs/decisions/0023-the-profile-in-slice-3.md`. The design file is not this stage's to change; whoever owns it may want to bring it into line.

**R-4.18, profile editing.** The failure showed only that the page text, beginning "User Profile", lacked something the test expected; it did not show what. The owner's view already shows the saved name, job title and email address as text, so I looked at the administrator's view of somebody else's profile. Next to the `user-profile` default story, which cites R-4.18, it was missing the sections for the administrator's powers that the criterion lists. It now draws them:
- A Permissions section with the Administrator box (`profile-admin-checkbox`).
- An Account status section offering Deactivate account for an active account (`profile-deactivate-button`).
- Reactivate account instead for an account an administrator deactivated (`profile-reactivate-button`).
- For an account its owner deactivated, only the statement that they come back by signing in.

Under the plan, what these controls do belongs to slice 4 (R-4.12, R-4.19, R-4.30). They are therefore drawn disabled, each saying it is not available yet, and the service still refuses those changes. There is still no edit control for an administrator. This fix is a reasoned guess. If R-4.18 fails again, the next place to look is what text the test expects; one candidate is the account-type wording ("Public sector employee" here).

**R-8.23, file names.** The error was `ENAMETOOLONG` opening `/tmp/sdlc-upload-…/nnn….pdf`. The test was writing its own local copy of a file with a 256-character name, which the operating system refuses at 255. The service never received it. It names its working copies with random identifiers, not the uploaded name. It already refuses a name longer than 255 characters with a 400 and "The file name must be between 1 and 255 characters long.", which its own unit tests cover. Passing this criterion needs the test to send the long name in the upload without first creating a file under that name on disk. That belongs to whoever owns the acceptance tests, not to this stage.

**Unit tests** (`app/frontend/tests/profile.test.tsx`):
- The notifications tests now check that the box turns on and off at once without a question.
- They check that, on arrival from the link, the box stays ticked until Unsubscribe is pressed and is unticked straight after.
- The administrator-view test checks the Deactivate control and Administrator box are offered alongside the read-only details.
- A new test checks Reactivate appears only for an administrator-deactivated account, with the sign-in statement for an owner-deactivated one.

I installed dependencies only to run the check, then removed them so they do not travel with the proposal. Nothing outside `app/` and `docs/decisions/` was touched.

**For slice 4:** the administrator box and the deactivate and reactivate buttons on somebody else's profile are drawn but disabled, and the service still refuses those changes (403). Slice 4 needs to enable them and build the confirmation dialog (`activation-modal`), the service actions and the messages each sends.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does slice 3 do what its criteria say, given verify escalated after three failed builds? Ruling: return. The nine failures are not the pipeline being unable to act. Each has a different owner, and none would be found by escalating. (1) R-8.13, R-8.21, R-8.28 and R-8.30 fail because pressing 'Choose a profile picture' on /users/me opens no file chooser in a real browser. That is the application, and build has not yet been asked to fix it, because these failures first appeared after bind-adapter-new-13 rebound the adapter. (2) R-8.23 fails with ENAMETOOLONG inside the adapter's upload helper, which writes the requested file to disk under its 256-character name before the service is reached. The test asks for what the criterion says, so the adapter's way of offering the file has to change. (3) R-8.17, R-6.6, R-6.16 and R-4.33 are unbound because their tests act through screens slice 3 does not build, which is a question of what the slice claims. R-8.16 is a registered not-testable criterion whose working-copy cleanup the backend end-to-end tests assert; it does not hold the slice back. The R-4.29 and R-4.18 fixes now pass. The R-4.29 fix rightly follows the criterion over design/DESIGN.md, which should be brought into line. What would change this: the picker opening a chooser and those four criteria passing, R-8.23 bound without a long-named file on disk, and the plan placing the four unbound criteria. Then the slice can be approved on what was asserted.

**Conditions:**
- R-8.13, R-8.21, R-8.28, R-8.30: on /users/me in edit mode, pressing the 'Choose a profile picture' button (data-testid change-avatar, a design-system Button inside react-aria FileTrigger in app/frontend/src/app/image-picker.tsx) opens no file chooser in Chromium driven by Playwright (page.waitForEvent('filechooser') times out), and the hidden file input is never clicked. jsdom unit tests do not exercise this. Make the button open the browser's file chooser, for example by making sure FileTrigger's press handler reaches the design-system Button, or by using a native file input with a label. Watch it work in the running app; doing that needs the docker compose approval this stage's session could not grant.
- Egress check E-2 flags docs/decisions/0021-the-file-store-and-its-answers.md:56, where 'SHA-256' reads as an internal ticket number. Reword it (for example 'a sha256 digest') so the egress check passes.
- addressed-to bind-adapter: R-8.23's test fails with ENAMETOOLONG before reaching the service, because the new target's offerFile passes the requested name to tests/fixtures/upload.ts uploadFile, which writes a file of that name under the OS temp directory, and a 256-character name exceeds the 255-byte filename limit. The criterion asks only that the upload carry a 256-character name and be refused with the 1-255 characters message. Offer the file without a file of that name on disk, for example Playwright's setFiles({ name, mimeType, buffer }) payload, or the API upload with the name as the form field.
- addressed-to plan: slice 3 claims R-8.17, R-6.6, R-6.16 and R-4.33, but verify reports each unbound because its test acts through a screen no slice-3 build serves: the attachment control on /opportunities/:program/:opportunityId/edit (R-8.17), /admin/email-notification-reference (R-6.6), /organizations/:orgId/edit (R-6.16), and /content/terms-and-conditions/edit (R-4.33). Move each to the slice that builds its screen, or bring that screen into slice 3 explicitly.
- addressed-to design: design/DESIGN.md says the 'Stop emails about new opportunities?' question is asked both from the profile checkbox and on arrival from the unsubscribe link. R-4.29 asks for confirmation only on arrival from the link and lets the box turn on or off at any time from the profile. The R-4.29 acceptance test now passes against the behaviour that follows the criterion (docs/decisions/0023-the-profile-in-slice-3.md records the departure). Bring the design into line with R-4.29.
