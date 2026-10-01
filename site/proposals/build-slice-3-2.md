| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T01:03:50.719Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 3 (A person can keep their own profile, picture and notification choice) do what its criteria say?

**Recommendation.** This revision addresses three of the five returned criteria (R-4.27, R-4.29, R-6.7) and probably a fourth (R-4.18).

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

This revision addresses three of the five returned criteria (R-4.27, R-4.29, R-6.7) and probably a fourth (R-4.18). The fifth (R-8.23) fails in the test harness itself and nothing in the application can fix it. `npm --prefix app run check` passes across all three packages (15, 240 and 130 tests). I did not bring up the compose sandbox or drive a browser against it. The tool permissions in this session would not let me check the sandbox password or the compose state. The changes are therefore checked only by unit tests, not against the running application. Everything else in slice 3 is as it was.

**R-6.7 and R-4.29: the new-opportunity box lagged behind the click.** The box on the notifications page only changed once the service had answered. Read straight after pressing, it still showed the old state: unticked after pressing it on (R-6.7), and still ticked after confirming "Unsubscribe" (R-4.29). It now changes at once: ticked when pressed, unticked when stopping is confirmed, and the question closes on confirm. If the service refuses, the box goes back and the existing "Your choice could not be saved" alert appears. Turning notices off still asks first, as the criterion requires. The change is in `NotificationsSection` in `app/frontend/src/screens/user-profile.tsx`.

**R-4.27: names over 100 characters were cut short instead of reported.** The profile edit form put a 100-character browser limit on the name and job title fields. A 101-character name was silently trimmed to 100 and then saved, so no error was ever shown. The sign-up form, where R-4.27 passed in slice 2, has no such limit. I removed both limits, so an over-long name or job title is now kept as typed and reported by the same rule the service applies.

**R-4.18: a best guess, not a confirmed fix.** The ruling only shows that the page text began "User Profile" and lacked some expected string. On both an administrator's view and one's own profile, the name, email address and job title appeared only inside read-only input boxes. Text in those boxes does not count as page text. The profile now also shows a line above the account facts naming the person, with a public sector employee's job title and the email address, so it reads correctly after a save and to an administrator. If the test was instead looking for the administrator's deactivate, reactivate or administrator-rights controls, the plan gives those to slice 4. They are still not drawn, so the test will keep failing until slice 4 is built. I did not build them, to stay out of slice 4's work.

**R-8.23: the failure is in the test harness.** The error is the test runner's own failure to create a 256-character file name in its own temp folder (`/tmp/sdlc-upload-…`). Most file systems will not store a name that long. The application's upload folder is `/srv/uploads` (by default it is named `digital-marketplace-uploads`), so the path in the error is not ours. The backend does refuse a 256-character name with "The file name must be between 1 and 255 characters long." Two backend tests cover this: `app/backend/tests/file-rules.test.ts` and `app/backend/tests/profile-and-files-end-to-end.test.ts`. The test would need to send the name in the upload request without writing that file to disk. Changing it belongs to whoever owns the acceptance suite, not this stage.

**Unit tests added**, in `app/frontend/tests/profile.test.tsx`:
- The box is ticked the moment it is pressed, before the service answers, and goes back if the service refuses.
- The box is unticked as soon as stopping is confirmed, before the service answers.
- A 101-character name is kept in full, reported as an error, and nothing is sent.
- The name and email appear in the page text, both on an administrator's view and after one's own save.

I added a short section to `docs/decisions/0023-the-profile-in-slice-3.md` recording these three choices. To run the tests I installed packages under `app/`, then deleted those `node_modules` folders, because there is no ignore file and they would otherwise have travelled with the proposal.

**What slice 4 will find missing:** the administrator controls on somebody else's profile (administrator box, deactivate, reactivate) and the service behaviour behind them. The service still refuses an administrator's deactivation of someone else's account with 403, and has no reactivate or administrator-rights changes yet.

_Ruled: return by runner:verify_
