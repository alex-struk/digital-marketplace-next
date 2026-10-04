---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-04T20:13:45.422Z"
cost: 1.6861238000000003
turns: 53
session: "fa8e6b2f-5f81-44f4-84ea-c407c3bf0c9a"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I've bound the Email Notification Reference page (`/admin/email-notification-reference`) in `tests/adapters/new/`. But R-6.13 and R-6.19 will now fail for real rather than read as unbound, because the page breaks when it is opened by its address. I couldn't run the type-checker or the separation check: both commands needed an approval this session can't get, so the edits are checked by reading and by trying the locators on the live page.

**What changed on the target.** The last binding run found nothing at this address: the service answered a raw 404 (`Cannot GET …`). On today's build it is a real screen. Signed out, it shows the application's "Page not found". Signed in as the administrator (test-admin), it shows the heading "Email Notification Reference", an index called "Events that send email", and then one titled section per event (45 in all). Each section holds one message per recipient, with "Subject" over the subject, "Who receives it and why" over a summary, and the email itself (62 messages). No link on the dashboard, profile, notifications tab, Users or Content screens leads to it, so the address is the only way in.

**The page fails when opened by its address.** It fetches its sample emails from its own address. The browser answers that fetch from its cache, with the page's own HTML from the visit that just loaded it. So the person sees only the heading and the alert "The sample emails could not be loaded / Reload the page to try again." This happens with a freshly cleared cache too. Reloading, as the alert advises, changes nothing. The data is there: a request for JSON to that address returns the groups, and the full page draws once the same request skips the cache. I made the page draw that way only to see its structure, and the adapter does not do it. That would hide a fault a real person meets. I take the fault to be the application's: the screen and its data share one address, and the response doesn't vary by what was asked for. Whoever rules the build should decide that.

**How the binding behaves:**
- `open` and `open_reference` go to the address directly.
- If the page shows its "could not be loaded" alert, the adapter reloads once. If the alert is still there, each reader throws a plain failure, not `unbound:` and not an empty string. The message names the address, the persona, the alert's words, and the cached-HTML cause. Returning empty would let a criterion about something not being shown pass falsely.
- When the samples do load, the readers return text in the old binding's form:
  - `message_group_title`: each event's title, one per line. The index heading "Events that send email" is left out.
  - `message_subject`: lines of the form "Subject: …".
  - `message_summary`: lines of the form "Summary: …", taken from "Who receives it and why".
  - `message_body`: the page's main text.
- A non-administrator is refused with "Page not found". The readers return empty for that person, and `refused_for_non_administrator` still reads the refusal, as before.

In `bindings.yaml` all six members of this page are now `bound`, with a comment describing the cache fault. In `index.ts` I removed the helper that used to report pages as absent, because nothing uses it any more. No other page's bindings changed, and every route in `surface.yaml` that I opened this run answered. I touched nothing outside `tests/adapters/new/`.