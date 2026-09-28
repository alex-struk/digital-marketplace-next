---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I rewrote nine bindings the reviewer found wrong and bound most of the members previously reported unbound."
opened: 2026-09-28T18:03:27.211Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I rewrote nine bindings the reviewer found wrong and bound most of the members previously reported unbound.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote nine bindings the reviewer found wrong and bound most of the members previously reported unbound. What's still unbound is either not offered anywhere on the target or blocked by persona data outside this stage. Only `tests/adapters/old/index.ts` and `tests/adapters/old/bindings.yaml` changed. **Nothing has been typechecked or run through the suite:** every attempt to run `tsc` or `npm run typecheck` needed an approval this session couldn't give. The new flows were checked by hand in the browser, and each edited region was reread for syntax and types.

## The nine corrections

- **R-3.10, team member rows:** each Team row now carries the member's email. The team table, the "View Team Member" dialog and the user API (401 for an owner) all withhold emails. The organization's membership list gives each member's account id, and the seed maps that id to an email.
- **R-3.25, Sprint With Us requirements:** each now returns "Met: …" or "Not met: …". This uses the same icon-colour reader the Team With Us requirements already used (green when met, body colour when not).
- **R-2.23, submit proposal:** after "Submit", every box in "Review Terms and Conditions" is ticked before "Submit Proposal" is pressed. "Save changes and submit" uses the same step.
- **R-5.23, submit scores for consensus:** a disabled or missing control now throws a refusal instead of returning silently. The refusal is kept so `incomplete_evaluation_error` reports it too; the page shows no message of its own beside the disabled control.
- **R-2.31, total score on the view pages:** the Sprint With Us and Team With Us views now open the Proposal Details tab before reading "Total Score".
- **R-2.32, vendor's total and rank:** the vendor's Sprint With Us and Team With Us pages read the total from the Scoresheet table's body row, and the rank as the figure above "Ranking". Before an award, the Scoresheet tab says it "will be available once the opportunity has been awarded", so both read as empty.
- **R-5.35, proponent name:** pages about a single proposal return one name. Only the individual evaluation list keeps the joined list of names.
- **R-5.32 and R-5.36, confirm finalize:** the action now waits up to 30 seconds for a new notice or for "Finalize Consensus Scores" to leave the top bar. An "Unable to Finalize Consensuses" notice is reported as a refusal and kept for the two error readers on that tab.
  - I saw that notice by trying to finalize the seeded opportunity where nobody can be screened in. The server refused, so nothing changed.

## Previously unbound, now bound

- **Sprint With Us team members (R-2.7, 2.9, 2.11, 2.16, 2.18, 2.21, 2.37):** there are no checkboxes to tick. Each phase has its own "Add Team Member(s)", which opens a dialog where members are picked by clicking their names. Members are named from the membership lists of the signed-in vendor's organizations. The binding picks the organization if none was chosen yet. Scrum master is an unlabelled radio in the member's row.
- **Team With Us resource members (R-2.10, 2.17, 2.22, 2.24):** the chooser is "Resource Name", with "Hourly Rate" beside it.
- **Question answers (R-2.16, R-2.20):** each question is folded under "Question N" and must be opened to show its "Question N Response" box.
- **Capabilities held (R-4.8):** read from the icon colour, the signal the reviewer accepted for R-3.25. On the live page it matched the seeded capabilities exactly.
- **Export field (R-4.32):** the dialog's field boxes are "First Name", "Last Name", "Email" and "Organization Name", so "email address" now maps to "Email".
- **Submit final consensus scores (R-5.30):** this app has one step, "Finalize Consensus Scores". No separate submit control exists, so it is bound to that.

## Reported as the page refusing, instead of unbound

In each case the page loaded and showed the refusal, so these now throw a refusal (or, on the content page, return quietly) rather than `unbound`:

- **R-5.14:** the evaluator who is not chair sees no finalize control at consensus.
- **R-5.16:** at consensus the panel is read-only with no "Edit"; `panel_locked_after_consensus` now reports that state.
- **R-2.4:** a submitted proposal offers "Edit" and "Withdraw" but no "Delete"; drafts do offer "Delete".
- **R-2.28:** the stage tab says the proposal "can be scored once the opportunity reaches the Team Scenario" (or the Challenge); `wrong_stage_error` now reads that line.
- **R-7.10:** non-administrators get "Not Found" at /content/create, so publish and confirm return quietly as the form's fields already did. For the administrator, "Publish" works.

## Still unbound

- **Adding a note (R-1.33):** the service's update request accepts an "addNote" change, but no screen sends one. I rechecked as the administrator on the seeded published and processing opportunities and on a new Sprint With Us one.
- **The sign-up completion form (R-4.3, R-4.23, R-4.24):** /sign-up/complete always redirects. I tried the administrator and staff routes and vendor routes 1 to 16 (17 and above fail); none reaches an unfinished profile.
- **Sign-in personas (R-6.20, R-6.23, R-4.1, R-4.2, R-4.5):** these come from the `unavailable` entries in the persona data, which this stage doesn't own.

## Other notes

- Every route I opened resolved on the target.
- **I left test data on the target:**
  - one published Sprint With Us and one published Team With Us opportunity, both titled "Adapter probe", created through the API as the administrator;
  - a draft Code With Us proposal by the first vendor on the seeded published opportunity.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: does the old adapter bind every surface action and observation on the target and nothing else, staying navigation and locators only? Ruling: return. The runner's typecheck shows no diagnostics under adapters/old/, and most of the revision is sound: the nine corrections, the new SWU/TWU team, resource and question bindings, the refusal conversions for R-2.4, R-2.28, R-5.14, R-5.16, R-5.23 and R-7.10, and the remaining unbound reasons for R-1.33, the sign-up completion page and the persona data. But evaluationConsensusListSwu/Twu.submitFinalConsensusScores and confirmSubmitConsensus are now bound to 'Finalize Consensus Scores' and its confirmation, the same irreversible control the contract names separately as finalizeConsensusScores. In R-5.30 the first submit therefore finalises and moves the opportunity out of consensus, so the resubmission the criterion is about is refused because of the adapter and not the application. In R-5.32, R-5.36, R-5.10, R-5.13, R-5.14 and R-2.35, which run submit, confirm, finalize, confirm, the finalize that follows finds its control gone and reports a false unbound. Aliasing two contract actions onto one state-changing control decides test outcomes, which an adapter must not do. What would change the ruling: the submit pair bound to the application's actual consensus-submission step, or marked unbound with a real reason if the application has none. Separately, the run left 'Adapter probe' opportunities and a draft proposal on the target; that is for the oracle reseed, not this gate.

**Conditions:**
- tests/adapters/old/index.ts evaluationConsensusList: submitFinalConsensusScores and confirmSubmitConsensus must not press 'Finalize Consensus Scores' or confirm it. That control is finalizeConsensusScores' own, and pressing it at 'submit' finalises the consensus: R-5.30's resubmission is then refused by the adapter's doing, and R-5.32, R-5.36, R-5.10, R-5.13, R-5.14 and R-2.35 then fail finalizeConsensusScores with a false unbound. Bind them to the step on the target that records the chair's consensus as submitted without finalising it, if one exists (for example a per-proponent submission on the consensus sheets). If none exists, mark both members unbound in bindings.yaml and index.ts with a reason naming what was looked at.
- tests/adapters/old/bindings.yaml: bring the evaluation-consensus-list entries for submit_final_consensus_scores and confirm_submit_consensus into line with whatever index.ts ends up doing for them.

### Runner-owned typecheck evidence

Proposal revision: `58d200bc827a4abb10abc79e97f97986542840ce`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
