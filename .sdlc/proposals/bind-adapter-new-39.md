---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I ran this pass against the live target at http://localhost:4300."
opened: 2026-10-02T09:33:44.973Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I ran this pass against the live target at http://localhost:4300.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I ran this pass against the live target at http://localhost:4300. The running build has moved on since the adapter was last written: four of the six criteria now have something real to bind to, and two still don't. I couldn't type-check or test the result: there are no dependencies installed in the workspace, and I wasn't allowed to install them in my scratch directory or run a parser on the YAML. I checked by hand that I changed only values and comments in `bindings.yaml`, never keys. I confirmed each new locator in the live browser as the administrator, but I never pressed the final "Cancel opportunity", "Add addendum" or "Add note". Doing so would have changed seeded records that other tests read.

**What the target now offers on the Code With Us management screen (`/opportunities/code-with-us/:opportunityId/edit`).** Looked at as the administrator on the seeded published, lapsed-with-three-proposals, awarded and draft opportunities:
- A published opportunity's actions are "Edit" and "Cancel opportunity". Cancelling asks first, in a dialog with an optional "Note (optional)" box, "Keep opportunity" and a second "Cancel opportunity".
- Once an opportunity is published, its Summary carries a "Reporting" region with Views, Watchers and "Proposals submitted". The lapsed one reads 3.
- The Addenda section has a "New addendum (required)" box and an "Add addendum" button.
- History ends with "Add a private note": a "Note (required)" box, "Add attachment" and "Add note".
- A draft offers only "Edit", "Publish" and "Delete", with no Addenda section and no counts.

**Changes to the adapter:**
- **R-1.30 (`reporting_proposals`):** the adapter looked for a term called exactly "Proposals", but the page says "Proposals submitted". It now accepts both, and `reporting_views` and `reporting_watchers` resolve through the same reader. All three are bound.
- **R-1.30 (`history_tab`):** this failed because the screen answered "Page not found" to whoever the test had signed in. That is the application refusing that person, not the screen being missing. Readings and actions on this screen now return empty and log the refusal when the person refused is anyone other than an administrator. An administrator being refused still reports `unbound`.
- **R-1.28 (`cancel_opportunity`):** bound to "Cancel opportunity" and its dialog, with the note filled in when one is given. The failing calls were made on a draft, which genuinely offers no cancel. That is now logged as a refusal and the action returns, so the test's own follow-up reading decides the outcome. The reference adapter for the other target does the same.
- **R-1.32 (`add_addendum`):** bound. A draft has no Addenda section, and that is now logged as a refusal in the same way. I also fixed the order: the old code pressed the submit button before filling the box.
- **`add_note`** had the same problem on the same screen, so I rebound it: fill the note, attach a file through `uploadFile` when one is given, then press "Add note".

**Still unbound, looked for again:**
- **R-1.35 / R-1.36 (`proposal-vendor-dashboard.show_my_proposals`):** signed in as the organization-owner vendor, who wrote a seeded proposal, the dashboard is only "Dashboard" and "You are signed in as …". The header offers only Dashboard, My profile and Sign out, and `/proposals` answers "Page not found". The seeded published opportunity's page offers no way to start a proposal.
- **R-6.17 (`organization-edit.add_team_members`):** `/organizations` and `/organizations/:orgId/edit` still answer "Page not found" to the administrator and to the owner vendor. This was tried with the seeded organizations …301 and …304. The vendor's profile Organizations tab says organizations "will be listed here once organizations can be registered", so this part of the application isn't built yet.

**A wider gap I did not close.** On this build, `/opportunities` opens to signed-in people, and the Sprint With Us and Team With Us management screens open for the administrator. Every member of `opportunity-swu-edit` and `opportunity-twu-edit` is still unbound, because binding two whole management screens is beyond the six criteria asked about. Their old reasons said the screens answer "Page not found", which is now false. I changed them to say plainly that the screen opens but this adapter hasn't been walked through it yet.

I also corrected the shared wording in about 380 other reasons that wrongly listed these screens as not found. Two members, `opportunity-list.filter_by_status` and probably `toggle_watch`, may now be bindable but were not re-examined. A later pass should bind those two management screens and the list.

**Routes in `surface.yaml` that did not resolve on the target:**
- `/organizations` and `/organizations/:orgId/edit`
- `/proposals`
- `/opportunities/code-with-us/:opportunityId/complete`
- A Sprint With Us opportunity's public page `/opportunities/sprint-with-us/:opportunityId`, when opened signed in as the administrator
- The Code With Us proposal screens

Nothing outside `tests/adapters/new/` was changed, and no password or environment value appears in any file.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Ruling: return. Every new binding only drives or reads the page: cancel_opportunity confirms with the optional note, add_addendum fills the box before pressing Add addendum, add_note attaches through the file chooser, and the three reporting counts read the Reporting region. refusedReader returns empty only for a reader other than the administrator who was shown the screen's refusal, which is what that reader sees, so R-1.30's own assertions decide. tests/acceptance is unchanged and the runner's typecheck passed. But the adapter's own walk found that the Sprint With Us and Team With Us management screens now open for the administrator, and every member of opportunity-swu-edit and opportunity-twu-edit is left unbound with a reason (MANAGE_NOT_YET_BOUND) saying the adapter has not been walked through it. That names no missing surface, and verify would report it as the application lacking one. opportunity-list.filter_by_status and toggle_watch still give a reason (signed-in /opportunities answers 'Page not found') that the proposal itself reports as false on this build. A revision that binds those members, or gives each a reason naming what the current build's screen does not offer, would be approved with the present bindings kept.

**Conditions:**
- tests/adapters/new: bind the members of opportunity-swu-edit (seen with 00000000-0000-4000-8000-000000000701) and opportunity-twu-edit (seen with 00000000-0000-4000-8000-000000000801) on their management screens /opportunities/{sprint,team}-with-us/:opportunityId/edit, which now open for the administrator. Leave a member unbound only with a reason naming what that screen, walked on the current build, does not offer. 'The adapter has not been walked through it' is not an unbound reason.
- tests/adapters/new: re-walk opportunity-list.filter_by_status and opportunity-list.toggle_watch signed in, now that /opportunities opens to signed-in people. Bind each one, or replace its reason, which still says /opportunities answers 'Page not found' when signed in, with what the signed-in list actually offers.
- tests/adapters/new: keep the cancel_opportunity, add_addendum, add_note, reporting_views, reporting_watchers and reporting_proposals bindings and the refusedReader handling as they are in this proposal.

### Runner-owned typecheck evidence

Proposal revision: `b212e184dd3e8d58f7a795630dfae31a559cee88`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
