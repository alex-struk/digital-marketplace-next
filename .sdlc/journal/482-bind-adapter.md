---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-04T07:05:24.087Z"
cost: 1.6868066
turns: 55
session: "61708f75-181a-4b34-ba2e-4da482a58c35"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I bound the one action this contract added, `proposal-twu-edit.set_hourly_rate`. Of the two kinds of earlier "unbound" report, one is still a real gap in the application and the other was out of date. I could not run the TypeScript type check: both attempts to run `npx tsc` needed an approval that never came in this unattended session. The change is a single line written exactly like its neighbours, but it has not been compiled.

**What I bound.** I signed in through the sandbox identity provider as the organization-owner vendor (`test-vendor-2`). I opened the seeded closed Team With Us proposal's screen (`…/team-with-us/…0801/proposals/…0841/edit`) and pressed "Edit". It opens the same form as the create screen: a "Resource 1: Full stack developer…" group with an "Hourly rate for Blake Placeholder" box holding "$120". I tested the role-and-label lookup the create page already uses, and it filled that box, so `proposalTwuEdit.setHourlyRate` now opens the form and reuses the create page's `setResourceRate`. I then cancelled without saving. `bindings.yaml` now lists `set_hourly_rate: bound` under `proposal-twu-edit`.

**Sprint With Us references (R-2.7, 2.9, 2.11, 2.16, 2.18, 2.22).** These still fail as unbound, and the cause is in the application. Those tests give each reference a `company`, and the running form has no field for one. As the same vendor I checked two places:
- **Create form** for the seeded open Sprint With Us opportunity (`…a025…/proposals/create`): after pressing "Add a reference", "Reference 1" has only Name, Email address and Phone number (optional). No label anywhere on the form mentions a company or employer.
- **Seeded proposals' edit screen**: the References section shows name, email and phone only.

So `add_reference` stays `bound` for those three fields and still refuses a `company` key rather than dropping it silently. I only made the refusal message say where I looked. Whoever rules the build should decide whether the form gains a Company field or the criteria stop asking for one.

**Sprint With Us proposal screen (R-2.25).** The quoted reason is out of date. It came from an earlier binding, which said this proposal screen answered "Page not found". Signed in as the administrator, I opened `/opportunities/sprint-with-us/…a016…/proposals/…a016…101` and it loads. It shows the proponent, Opportunity, Status, Submitted, Proposal ID, "Printable copy" and a "Proposal sections" navigation (Proposal, History), with a Proposal region holding Organization, Team, Team questions, References and Attachments. The current adapter already binds `proposal_tab` against this. The shared text still carried the old claim and is reused in other members' messages, so I corrected it, and the matching code comment, to list these proposal screens as served. I did not re-walk the other routes that text still calls "Page not found" (/proposals, the printable copies, `…/complete`, and the evaluation and consensus screens), so those claims stand as the previous run left them.

**Other findings.** No route I opened failed to resolve. The seed has no Team With Us opportunity still taking proposals; every one listed has a past deadline. Even so, the closed one still offers its author "Edit" and "Withdraw", which is how I reached the rate box.

I changed only `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml`.