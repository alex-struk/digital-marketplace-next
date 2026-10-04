# 0067 · The notification reference is built from the senders' own builders

- Status: accepted for the build (slice 21)
- Date: 2026-10-04

## Decision

**Where it is served.** `/admin/email-notification-reference` is the service's address
(`readEmailNotificationReference` in the contract) and also a page. The arrangement is the one
decision record 0060 uses for `/status`. The web server, and the Vite dev server, give a
browser's page request under `/admin` (one that accepts `text/html`) the single-page app. Every
other request goes to the service. The screen
(`frontend/src/screens/email-notification-reference.tsx`) then asks the service at the same
address for JSON. The service checks the bearer token on `/admin` exactly as on `/api`. It answers
an administrator with every message, grouped by the event that sends it. Anybody else, signed in
or not, gets 404, and the screen shows the shared missing page (R-6.13 note). The screen also
shows the missing page without asking the service when the session is not an administrator's
(`mayReadEmailReference` in `backend/src/rules/users.ts`).

**What it shows.** `backend/src/mail/notifications/reference.ts` lists every message. Each one is
built by the same function that builds it for sending, from invented sample data. For each
message the service answers the subject as a recipient receives it (marked `[TEST]` in a test
environment, R-6.3), a one-line summary of who receives it and why, the heading and body blocks,
and the closing line from `footerOf`. The preview is therefore the sent message, not a copy of
it. A message that each program sends in its own wording is shown once per program. The addendum
notice and the changed-opportunity notice share a builder, and each is shown. That comes to 62
messages under 45 events. The page begins with the Code With Us new-opportunity announcement.

**Keeping it complete (R-6.19).** Each entry records the builder it came from.
`backend/tests/notification-reference.test.ts` imports every module under
`src/mail/notifications` and fails if any exported builder is missing from the reference. A
message added later without a reference entry therefore fails `check`.

## The Unsubscribe line (R-6.6 against R-6.16)

The reference shows each message's real closing line. Decision record 0022 is unchanged:
Unsubscribe, opening `/users/me?tab=notifications&unsubscribe` with the question already asked,
ends the three new-opportunity announcements. Every other message ends with "Manage your
notification settings". The plan's slice 21 entry says "each sample ending in the Unsubscribe
offer". `plan/plan.md` ("Accepted criteria that pull against each other") says that if R-6.6's
test expects the offer on every sample, the conflict should be raised rather than satisfied. The
design story for this page shows the same split. Putting Unsubscribe on every sample would make
the reference disagree with the mail actually sent, and the invitation mail would break R-6.16.

## What would reverse it

A ruling that R-6.6 stands as written and R-6.16 is withdrawn. `footerOf` would then end every
message with Unsubscribe, and the reference would follow with no change of its own.
