---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I bound the one action this contract added, `proposal-twu-edit.set_hourly_rate`."
opened: 2026-10-04T07:05:24.127Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I bound the one action this contract added, `proposal-twu-edit.set_hourly_rate`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I bound the one action this contract added, `proposal-twu-edit.set_hourly_rate`. Of the two kinds of earlier "unbound" report, one is still a real gap in the application and the other was out of date. I could not run the TypeScript type check: both attempts to run `npx tsc` needed an approval that never came in this unattended session. The change is a single line written exactly like its neighbours, but it has not been compiled.

**What I bound.** I signed in through the sandbox identity provider as the organization-owner vendor (`test-vendor-2`). I opened the seeded closed Team With Us proposal's screen (`…/team-with-us/…0801/proposals/…0841/edit`) and pressed "Edit". It opens the same form as the create screen: a "Resource 1: Full stack developer…" group with an "Hourly rate for Blake Placeholder" box holding "$120". I tested the role-and-label lookup the create page already uses, and it filled that box, so `proposalTwuEdit.setHourlyRate` now opens the form and reuses the create page's `setResourceRate`. I then cancelled without saving. `bindings.yaml` now lists `set_hourly_rate: bound` under `proposal-twu-edit`.

**Sprint With Us references (R-2.7, 2.9, 2.11, 2.16, 2.18, 2.22).** These still fail as unbound, and the cause is in the application. Those tests give each reference a `company`, and the running form has no field for one. As the same vendor I checked two places:
- **Create form** for the seeded open Sprint With Us opportunity (`…a025…/proposals/create`): after pressing "Add a reference", "Reference 1" has only Name, Email address and Phone number (optional). No label anywhere on the form mentions a company or employer.
- **Seeded proposals' edit screen**: the References section shows name, email and phone only.

So `add_reference` stays `bound` for those three fields and still refuses a `company` key rather than dropping it silently. I only made the refusal message say where I looked. Whoever rules the build should decide whether the form gains a Company field or the criteria stop asking for one.

**Sprint With Us proposal screen (R-2.25).** The quoted reason is out of date. It came from an earlier binding, which said this proposal screen answered "Page not found". Signed in as the administrator, I opened `/opportunities/sprint-with-us/…a016…/proposals/…a016…101` and it loads. It shows the proponent, Opportunity, Status, Submitted, Proposal ID, "Printable copy" and a "Proposal sections" navigation (Proposal, History), with a Proposal region holding Organization, Team, Team questions, References and Attachments. The current adapter already binds `proposal_tab` against this. The shared text still carried the old claim and is reused in other members' messages, so I corrected it, and the matching code comment, to list these proposal screens as served. I did not re-walk the other routes that text still calls "Page not found" (/proposals, the printable copies, `…/complete`, and the evaluation and consensus screens), so those claims stand as the previous run left them.

**Other findings.** No route I opened failed to resolve. The seed has no Team With Us opportunity still taking proposals; every one listed has a past deadline. Even so, the closed one still offers its author "Edit" and "Withdraw", which is how I reached the rate box.

I changed only `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Ruling: approve. The one action the contract added, proposal-twu-edit.set_hourly_rate, is bound by wrapping the existing create-form setResourceRate in the same onTeamForm opener the other edit actions use. That helper resolves the resource group, reads the rate from the input and fills the 'Hourly rate for <member>' box. It is navigation and locators only, with no assertion and no decision about pass or fail, and surface.yaml declares the action. The runner's typecheck on cf4c666 passed with no diagnostics under adapters/new/. Nothing under tests/acceptance, spec/ or app/ changed and no protected path is touched. The two text edits leave behaviour alone: the add_reference refusal still refuses a 'company' key instead of dropping it, which is correct because the running Sprint With Us reference form has only Name, Email and Phone, and that gap is the application's, still owed by build under build-slice-15-2#1, which this proposal does not settle. The served-routes note now lists the Sprint With Us and Team With Us proposal screens, which fits the adapter already binding proposal_tab there. This would change to a return with an adapter-wrong condition if verify still reports set_hourly_rate unbound or shows it filling something other than the rate box.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cf4c666c49feee7f7ce3d83c3be0e9c10e597c4d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
