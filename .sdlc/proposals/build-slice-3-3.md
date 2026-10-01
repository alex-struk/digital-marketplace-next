---
gate: G3
question: "Does slice 3 (A person can keep their own profile, picture and notification choice) do what its criteria say?"
recommendation: "I changed the application for two of the three returned criteria, R-4.29 and R-4.18."
opened: 2026-10-01T01:30:36.457Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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
