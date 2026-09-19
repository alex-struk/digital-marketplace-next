---
stage: "design"
title: "design notifications"
at: "2026-09-19T07:23:20.766Z"
cost: 4.1052375
turns: 44
session: "79fa5c45-015a-49a2-a7b0-32c7b91cb5ea"
---

I designed the notifications domain's four pages. That covers 14 states across four pages, each with a story, plus the part of `design/DESIGN.md` that goes with them and every test ID on those pages. Nothing has been compiled or scanned yet: that runs after my turn and writes to `design/report.json`. The last report in the workspace passed with no violations, and it covers only the earlier domains' stories.

**What this domain actually puts on screen.** Most of what the notifications criteria describe happens in the sending machinery and has no screen. That includes turning notifications off for an environment, failed delivery, the test-environment marker, the single sender, batching with hidden recipients, silence for deactivated accounts, and skipping recipients with no address. The design says so and leaves them alone. Three of the four pages are parts of screens other domains own, so those stories show the other domain's part trimmed down or as a marked placeholder.

**The screens and their states:**
- **`notification-unsubscribe-landing`** is the users domain's notification settings, arriving from an email's Unsubscribe link with the question already open. It has four states:
  - `default`: the dialog open, naming the account that is signed in and its address in its own element. The unsubscribe link acts on whoever is signed in, not whoever the email went to.
  - `loading`: nothing is asked until that account has loaded.
  - `unsubscribed`: the dialog was confirmed, the checkbox is cleared and the change is announced.
  - `sign-in-required`: the users domain's sign-in screen, worded for this arrival.

  There is no "cancelled" state, because cancelling leaves the settings page exactly as the users domain already designed it. I added one sentence saying the choice covers only emails about new opportunities, so someone arriving from any other kind of email isn't misled.
- **`notification-optin-opportunity-list`** has `default` (emails off), `subscribed` (just turned on) and `signed-out` (no control shown). The control is a button whose text names the choice it offers, with the current state in a sentence before it. That follows the criterion's "offers the opposite choice" and keeps the state out of styling alone. It sits between the filters and the first group, outside the search form, and nothing hides it at any screen width. The opportunities domain's notes say it goes "at the end of the filter row", so I recorded why I placed it differently.
- **`notification-terms-broadcast`** has `default`, `notify-confirm`, `notified` and `notify-failed`. The success message says what the service actually knows at that moment: every acceptance has been withdrawn and the emails are still going out. It does not claim they were delivered.
- **`notification-email-reference`** has `default`, `loading` and `not-found`. Messages are grouped by the event that sends them (a heading per event, one entry per message). Each shows its subject, the "who receives it and why" line only where one is written, and its body in a bordered frame. A contents list at the top links to every event. Non-administrators get the shared "Page not found" page, as in every other domain.

**Test IDs.** Every action and observation on the four pages now has one in `spec/contract/surface.yaml`. Where the element is the same as another domain's, I reused its ID: `unsubscribe-confirm-button`, `unsubscribe-cancel-button`, `unsubscribe-modal`, `notifications-email-address`, `sign-in-required` and `not-found-page`. The new ones are:
- `unsubscribe-confirmation-address`
- `notification-optin-toggle`, `notification-optin-control`, `notification-optin-state`
- `notify-vendors-button`, `notify-vendors-confirm-button`, `notify-vendors-cancel-button`, `notify-vendors-dialog`, `notify-vendors-success`, `notify-vendors-failure`
- `email-reference-page`, `email-reference-group-title`, `email-reference-subject`, `email-reference-summary`, `email-reference-body`

`email-reference-group-title` sits on an element inside each heading, because nothing yet shows that the design system's heading passes a test ID through.

**Components.** The catalogue leans on the design system's `Heading`, `Text`, `Button`, `Link`, `Modal` with `AlertDialog`, `InlineAlert` and `ProgressCircle`, plus the users domain's `Checkbox`. No new design-system component was introduced. The only new component of the project's own is the email preview frame, a labelled bordered group. It is listed under the project's-own-components heading in `DESIGN.md` next to the reused card section and fact list. No colour or other value is typed; only tokens the earlier domains already use appear.

**Gaps for the spec.** All thirteen are in `DESIGN.md`; none was filled with invented behaviour. The ones that matter most:
- **An observation names a replaced rule.** `notification_control_hidden_on_narrow_screen` uses the wording of R-6.22, which R-6.27 replaced: the control must now show at every width. I bound it to the control itself, so a test can confirm it is visible on a narrow screen. The contract stage should rename it; I'm not allowed to.
- **Two accepted criteria conflict.** R-6.6 says every email ends with Unsubscribe; R-6.16 says emails the setting doesn't govern must not offer it. The sample emails follow R-6.16.
- **Which emails the setting governs isn't stated** anywhere current. The only list is in the replaced R-6.10 (new-opportunity announcements only), and the design follows that.
- **No email content is in the spec.** R-6.19 requires every email on the reference page, but the spec gives neither the list nor any subject, summary or body. The sample emails are placeholders. The service logo is left out because the tokens have no image size.
- **Failures and wording aren't specified.** Nothing says what a failed announcement means or whether some acceptances may already be withdrawn, or what a failed opt-in save shows. The wording after an immediate save is my own.
- **Undecided cases:** unsubscribing when already unsubscribed, whether a signed-out visitor should be invited to sign in, when the announcement is offered and whether it may be repeated, whether previewed subjects carry the test marker, and what the refusal on the reference page looks like.

One inconsistency for the users domain: their `unsubscribe-confirm` story leaves out the profile section links, while mine includes them. The two should match.