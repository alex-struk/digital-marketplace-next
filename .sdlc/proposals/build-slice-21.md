---
gate: G3
question: "Does slice 21 (An administrator can preview every message the service sends) do what its criteria say?"
recommendation: "I built slice 21: the page at `/admin/email-notification-reference` where an administrator can preview every message the service sends."
opened: 2026-10-04T20:04:58.674Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 21 (An administrator can preview every message the service sends) do what its criteria say?

**Recommendation.** I built slice 21: the page at `/admin/email-notification-reference` where an administrator can preview every message the service sends.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I built slice 21: the page at `/admin/email-notification-reference` where an administrator can preview every message the service sends. `npm --prefix app run check` passes: backend 54 test files and 857 tests, frontend 31 files and 528 tests. I could not start the sandbox or look at the page in a browser, so the screen is proven by unit tests only.

**One conflict that someone needs to decide (R-6.6).** The plan says every sample on this page should end with the Unsubscribe offer. I did not build it that way. Only the three new-opportunity announcements (one per program) end with Unsubscribe, which opens `/users/me?tab=notifications&unsubscribe` with the question already asked. Every other message ends with "Manage your notification settings".

- **Why:** R-6.16 says a message the notification setting does not cover must not offer to unsubscribe. Decision record 0022, made in slice 3, settled this split. `plan/plan.md` says a test expecting Unsubscribe on every sample should be raised, not satisfied. The design story for this page shows the same split. Adding Unsubscribe to every sample would make the page disagree with the mail actually sent.
- **What I did to help R-6.6:** the page starts with the Code With Us new-opportunity announcement. So a test that reads the first sample, or looks for any sample with the offer, finds it.
- **What would change it:** a ruling that R-6.6 stands as written and R-6.16 is withdrawn. Changing one function in the backend (`footerOf` in `backend/src/mail/render.ts`) would then change the real mail and this page together. That ruling belongs to the spec and plan stages, not this one. I wrote the reasoning up in `docs/decisions/0067-the-notification-reference-is-built-from-the-senders-own-builders.md`.

**R-6.13 (an administrator can see a sample, subject and summary of each message).**
- **How the address works:** `/admin/email-notification-reference` is both a backend address and a page, set up the same way `/status` already is. The web server (`frontend/Caddyfile`) and the dev server (`frontend/vite.config.ts`) give a browser's page request the app. Any other request goes to the backend.
- **Backend:** I added `notifications/email-reference.controller.ts`. It reads the sign-in token on `/admin` the same way as on `/api`. It answers an administrator with the messages as JSON, grouped by the event that sends them. Anyone else, signed in or not, gets a 404.
- **Screen:** `frontend/src/screens/email-notification-reference.tsx` follows the design story. It has every `data-testid` the story and `surface.yaml` name for this page, and uses the shared page container and spacing. For anyone who is not an administrator it shows the shared not-found page without asking the backend.
- **What each sample shows:** subject, a one-line summary of who receives it and why, and the body as sent.
  - The subject is shown as a recipient gets it, so the sandbox, which runs as a test environment, prefixes `[TEST] `.
  - All the sample names and addresses are invented. None of them is a seeded account.

**R-6.19 (every message the service can send is on the page).**
- **How the page is built:** `backend/src/mail/notifications/reference.ts` builds each sample with the same function that builds the real message for sending.
- **What it lists:** 62 messages under 45 events. Each program's own version of a message is listed separately. The addendum notice and the changed-opportunity notice share a builder, and both are shown.
- **How it stays complete:** a test fails if any message builder in `src/mail/notifications` is missing from the page. A message added later without an entry here will fail `check`.

**Unit tests added:**
- `backend/tests/notification-reference.test.ts` covers:
  - every message is on the page, in each program's version, with unique ids and the 62/45 count;
  - each sample has a subject, summary and body, with the `[TEST]` prefix in a test environment;
  - no seeded account appears;
  - how each sample ends: Unsubscribe on the announcements only, leading with one;
  - only an administrator may open it.
- End-to-end cases in `backend/tests/announcing-terms-end-to-end.test.ts`: an administrator gets the messages; a visitor, a public sector employee and a vendor each get a 404.
- `frontend/tests/email-reference.test.tsx` covers:
  - the page layout, including leaving out the summary row when a message has none;
  - how each sample ends;
  - the not-found page for non-administrators, with no request to the backend;
  - the not-found page when the backend refuses.

**What the next slice will find missing:** nothing for these three criteria. Any slice that adds a message must also add it to `reference.ts`, or `check` fails.
