# 0022 · Only the announcement of a new opportunity offers to unsubscribe

- Status: accepted for the build (slice 3)
- Date: 2026-09-30

## Decision

Every message the service sends ends with a line about notification settings, below a rule, in
both its formatted and its plain-text form (`app/backend/src/mail/render.ts`, `footerOf`):

- A message the new-opportunity notice choice governs ends with "You are receiving this email
  because you asked to be told about new opportunities." and a link labelled **Unsubscribe** to
  `<service origin>/users/me?tab=notifications&unsubscribe`, which opens the reader's own
  notification settings with the question already asked (R-6.6, R-4.29).
- Every other message ends with a link labelled **Manage your notification settings** to
  `<service origin>/users/me?tab=notifications`, and does not offer to unsubscribe (R-6.16).

A message says which it is with `governedByNoticeChoice` on the message. Only the
announcement of a newly published opportunity, in each of the three programs, sets it
(spec/contract/observables.yaml, `governed_by_notification_setting`); that message is slice 7's
to write. In slice 3 every message — welcome, deactivation, reactivation — takes the second
form.

Neither link carries anything about whom the message was sent to: "me" is whoever is signed in
when it is opened, and a visitor is sent to sign in first and brought back with the question
asked (R-6.7). The landing always asks, even when notices are already off, so whoever follows
the link is shown the question naming their own address.

## Why

R-6.6 says every message ends with an offer labelled Unsubscribe; R-6.16, authored later to
replace R-6.10, says a message the preference does not govern must not offer to unsubscribe.
Both are slice 3's so one build reconciles them, and `plan/plan.md` reads R-6.16 as narrowing
R-6.6 to the messages the choice governs. The design (notifications gap 2) follows the same
reading. This record applies it.

## What would reverse it

A ruling that R-6.6 stands as written — every message offering Unsubscribe — which would
withdraw R-6.16. `footerOf` would then return the first form for every message.
