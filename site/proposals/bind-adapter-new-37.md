| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T13:59:22.852Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new-target adapter bind every surface member the contract adds, and nothing else? Approve. The two members of opportunity-counters are bound as reads only: view_count fetches /api/counters fresh on each read and turns an absent counter into "0", which the contract itself specifies (spec/contract/observables.yaml, 'absent counter reads as 0'), and refused_when_not_permitted returns the status and body only on 401/403. Neither asserts anything or decides a pass. On this target nobody is refused, so a refusal test will fail against the application, which is the right place for that failure. The unbound reasons for opportunity-cwu-edit.reporting_views (R-1.6) and reporting_watchers (R-1.5) are real: the reason names the missing observation, which is that no screen shows the count, backed by a third look at the Code With Us and Sprint With Us admin summaries after a public-page visit moved the view count to 1. Reading the counters API there would report a number the page never displays. Nothing under tests/acceptance changed, and the runner's typecheck on this revision passed with no diagnostics in adapters/new/. The open missing-test entries for R-1.5 (owed by calibrate) and R-1.6 (owed by derive-tests) belong to other stages, so this ruling adds no conditions. The ruling would change if a binding were found to assert an outcome, or if a screen on new were found to show the views or watchers count.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `86ffaf1edc25edc49101d33eaf1834916b0ad872`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
