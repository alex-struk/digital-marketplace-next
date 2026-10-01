---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I bound both members the contract adds on the new `opportunity-counters` page, `view_count` and `refused_when_not_permitted`."
opened: 2026-10-01T13:59:22.852Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I bound both members the contract adds on the new `opportunity-counters` page, `view_count` and `refused_when_not_permitted`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I bound both members the contract adds on the new `opportunity-counters` page, `view_count` and `refused_when_not_permitted`. `reporting_views` and `reporting_watchers` stay unbound after a third look. I could not type-check the result: `tsc` was refused for approval in this session, so I checked by hand that every helper the new code uses exists in the adapter. A compile run is still owed before calibrate.

**The new page.** `opportunity-counters` is a request page, not a screen. Its route, `/api/counters?counters=opportunity.:program.:opportunityId.views`, resolved on the target. I added it to `tests/adapters/new/index.ts` the same way as the other request pages already there:
- **`open`** builds the counter name from the program and opportunity given. When the program is left out, it takes it from the seeded record.
- **`view_count`** asks the service fresh on every read. It returns the number, or "0" when the answer leaves the counter out. It returns nothing if the service did not answer 200.
- **`refused_when_not_permitted`** returns the status and body when the answer is 401 or 403, and nothing otherwise.

To bind it I opened the seeded published Code With Us opportunity on the target. The count read 0 signed out, 0 as a vendor, 1 after I opened the opportunity's public page as that vendor, and 1 as the administrator.

**This target does not refuse anyone.** The contract says only an administrator or public sector staff may read counters. On this target a vendor and a request with no session both get 200 with the count. So `refused_when_not_permitted` is bound, and here it correctly reads empty: I reached the place and nothing was refused. A test expecting a refusal will fail, and that failure is in the application, not the binding.

**R-1.5 and R-1.6** (`opportunity-cwu-edit.reporting_watchers` and `reporting_views`): still unbound. I signed in as the administrator and opened the published opportunity's public page, which moved its views counter to 1. Its manage Summary still showed only Proposal deadline, Reward, Published, Created by and Last changed by. I also checked the manage Summary of the seeded published Sprint With Us opportunity, which the earlier reason did not cover; it shows no views or watchers either. `?tab=reporting` and `?tab=metrics` load the same screen. I added this third look to both reasons in `bindings.yaml` and in the adapter's matching reason text.

The application does count views; it just never shows the number on a screen, so I left these screen observations unbound rather than reading them from the API. The views count can be read through `opportunity-counters.view_count`.

In `bindings.yaml` I added `opportunity-counters` with both observations bound, spelled as the contract spells them. Every page whose route I opened resolved on the target. I wrote nothing outside `tests/adapters/new/`, and the password was only ever typed as its variable name.
