---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T12:43:35.750Z"
cost: 3.2667854000000003
turns: 107
session: "977530ce-2796-4fb0-ad63-432c8a7abc57"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I looked for all five criteria again on the running build. Three are now bound; the two reporting counts are still unbound because the build doesn't show them. The build has changed a lot since the earlier pass, and screens that answered "Page not found" before now open. I couldn't run the type-checker (the command needed an approval I couldn't get here), so I tested the new locators against the live page through the browser instead.

**R-6.21 and R-6.27 (the new-opportunity notification control): now bound.** Signed in as a vendor, a public sector employee or the administrator, `/opportunities` shows a "New opportunity emails" section. When the person is subscribed it says "You are emailed at <address> when new opportunities are posted." with a "Stop emailing me about new opportunities" button. When they are not, it says "You are not emailed…" with an "Email me about new opportunities" button. Pressing the button saves at once and shows a "Saved…" message.
- `notification_control` reads the section's heading, sentence and button label.
- `notification_control_state` reads "checked" or "unchecked", the same words the profile's own box uses.
- `toggle_new_opportunity_notifications` follows the input when it says which way to end up. It throws if the button doesn't change.
- A signed-out visitor gets no such section, so the two readers return empty there, and the toggle reports unbound because there is nothing to press.
- I also bound `notification_control_hidden_on_narrow_screen`. It narrows the window to 375 pixels, reads the section if it's visible, then restores the window. The section stays visible at that width, so it returns the section's words.
- I tried the toggle both ways and left the vendor subscribed, as the seed has it.

**R-1.2 (`opportunity-cwu-view.status`): now bound.** The seeded draft belonging to another staff member opens for the administrator with Status "Draft". It answers a vendor and the other public sector employee "Page not found", which is the page keeping a draft from someone who may not see it, not a broken route. So every reader on this page now returns empty when that refusal comes for an opportunity known to exist: a seeded one, or one already seen open in the same run. For an identifier never seen open, the refusal can't be told apart from a page that doesn't exist, so it still reports unbound.

While there I found a "Watch this opportunity" checkbox, shown to anyone signed in, so `toggle_watch` is now bound to it. `start_proposal` stays unbound: signed in as a vendor on the seeded published opportunity (deadline in 2030), the watch box is the page's only control.

**R-1.5 and R-1.6 (`reporting_watchers`, `reporting_views`): still unbound.** I looked as the administrator and as the owning public sector employee, on the seeded published, three-proposal, in-processing and awarded opportunities.
- The Summary shows only Proposal deadline, Reward, Published, Created by and Last changed by.
- The only sections are Summary, Opportunity, Addenda and History.
- I ticked "Watch this opportunity" as the administrator and came back: still no watcher count. I unticked it afterwards.
- The opportunity data the screen loads (`/api/opportunities/code-with-us/:id`) has no view, watcher or proposal figures at all.

The new reasons in the adapter and in `bindings.yaml` say all of this.

**Out-of-date reasons I left alone.** Many other unbound reasons in the adapter rest on a shared statement that `/opportunities`, the Sprint With Us and Team With Us screens and the rest answer "Page not found" when signed in. That is no longer true: `/opportunities` and all 40 seeded opportunities, Sprint With Us and Team With Us included, now appear in the list. In `bindings.yaml`, `opportunity-list.filter_by_status` and `opportunity-list.toggle_watch` are unbound for that reason, yet the list now has a Status filter. I kept to the five criteria I was asked about, so those other screens need to be looked at again.

Every route I opened resolved. I changed only `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`.