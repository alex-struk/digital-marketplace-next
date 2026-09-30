# 0012 · One mail path for every message

- Status: accepted for the build (slice 2)
- Date: 2026-09-30

## Decision

Every message the service sends goes through `Mailer` (`app/backend/src/mail/mailer.ts`). A
slice that adds a message writes a function returning an `Outgoing` — a recipient, anyone
blind-copied, and a `compose()` that returns the words — and hands it to `mailer.send()`. It
writes no markup, no plain text, no subject marker and no sender. The welcome message
(`app/backend/src/users/messages.ts`) is the first.

What the path does, once, for every message:

| Criterion | How |
| --- | --- |
| R-6.4 one sender, no reply-to | `MAILER_FROM`, a display name and an address in angle brackets; the service refuses to start with any other form. Default `Digital Marketplace <donotreply@example.test>`. No reply-to is set. |
| R-6.5 formatted and plain text | The one layout (`templates.ts`) renders the formatted form; `htmlToText` renders the plain text from it, links as "label (address)". |
| R-6.3 test marking | `SHOW_TEST_INDICATOR=1` puts `[TEST] ` before every subject and swaps the logo for `images/logo_test.png`. Both logos are served by the frontend from `public/images/`. |
| R-6.1 environment switch | `DISABLE_NOTIFICATIONS=1` makes `send()` do nothing; the caller carries on. |
| R-6.2 never fails the action | `send()` returns at once and never throws. Composition and delivery happen after the caller has been answered; a failure is logged (its code only, never an address) and not retried. |
| R-6.28 recipients with no address | Left out; a message left with nobody is not composed. A message to many continues past one that fails. |

Delivery is SMTP over a fresh connection per message, giving up on a server that has not
greeted within five seconds, as the old service did (`observables.yaml`).

In the sandbox (`app/compose/compose.yaml`) the service sends through `mail-hold`, a toxiproxy
in front of the catcher, and the catcher has fault injection on. Both control APIs are
published together at `http://localhost:8025` — the catcher's at the root, the proxy's under
`/hold` — as `observables.yaml` describes them for a target under test.
`SDLC_DISABLE_NOTIFICATIONS=1` at start-up turns the environment switch on.

Batching a broadcast (fifty to a message, the rest blind-copied) is not built here. The first
slice that sends to many (slice 7) adds it on top of `Outgoing.bcc`.

## What would reverse it

- A criterion that asks for separately written plain-text copy, or for a queue with retries.
  Both would replace the fire-and-forget delivery, not sit beside it.
