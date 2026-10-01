# 0013 · One mail path, and how a message is written

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Decision

Every message the service sends goes through one `Mailer` (`app/backend/src/mail/`), which
later slices call with an envelope — who it is for, and the message — and nothing else.

**A message is written once, as a small document** — a subject, a heading, paragraphs of words
and links, and at most one call to action — and both forms are rendered from it: the formatted
form as HTML with the logo at the top, the plain-text form as the same heading, words and links
in the same order, each link written out beside its label. R-6.5 asks that the plain text be a
rendering of the formatted version rather than separately written copy; rendering both from one
source is how the same words and links are guaranteed without an HTML-to-text converter guessing
at them. No message writes text of its own.

**What the mailer does to every message, so no message has to ask:**

- sends from `MAILER_FROM`, which must be `Display name <address>` or the service does not
  start, and sets no reply-to (R-6.4);
- prefixes the subject with `[TEST] ` and uses `images/logo_test.png` instead of
  `images/logo.png` when `SHOW_TEST_INDICATOR` is on (R-6.3); links and the logo are absolute,
  on `SERVICE_ORIGIN`, and the frontend serves both images;
- sends nothing at all when `DISABLE_NOTIFICATIONS` is on (R-6.1);
- drops a recipient with no address, and sends nothing if that leaves nobody (R-6.28, R-4.2);
  a batch of blind copies is visibly addressed to the sender's own address (R-6.15's shape,
  used from slice 7);
- hands the message over after the action has been saved and returns at once (`send`, on the
  next turn of the event loop). Delivery opens a fresh SMTP connection per message, gives up on
  a server that has not greeted within five seconds, logs a failure as one JSON line naming the
  kind of message and an error code — never an address or a body (P3) — and never tries again
  (R-6.2). `sendEach` sends several one after another and carries on past any that fail.

In the sandbox, `MAILER_FROM` is `Digital Marketplace <donotreply@example.test>` and
`SHOW_TEST_INDICATOR` is on, as `spec/contract/observables.yaml` configures the oracle. Every
sandbox is a test environment, so the unmarked half of R-6.3 is shown only by unit tests.
`DISABLE_NOTIFICATIONS` follows `SDLC_ORACLE_DISABLE_NOTIFICATIONS`, the variable the observables
name for R-6.1's separate instance. The mail catcher runs with Mailpit's fault injection on, so
a test can make it refuse delivery (R-6.2).

## What is not built here

- The unsubscribe offer and the link to notification settings at the foot of a message (R-6.6,
  R-6.16) are slice 3's, with the settings page they lead to. The welcome message carries
  neither.
- Batching many recipients into groups of fifty (R-6.8) is slice 7's, where the first message
  to many people is sent.
- The slow-delivery proxy the observables describe at `${SDLC_MAIL_API}/hold` (for R-6.24) was
  not in the compose file here; slice 6 added it (decision record 0028).

## What would reverse it

A ruling that "a rendering of the formatted version" means the text must be produced from the
HTML itself. The document model would stay; the text renderer would be replaced by a converter
over `renderHtml`'s output.
