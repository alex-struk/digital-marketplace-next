---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I could not run the TypeScript typecheck or a YAML parse: every request to run `tsc` (or node, or python) was blocked waiting for an approval that never came."
opened: 2026-10-04T06:22:00.861Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I could not run the TypeScript typecheck or a YAML parse: every request to run `tsc` (or node, or python) was blocked waiting for an approval that never came.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've revised the "new" adapter: the Code With Us proposal screen is now bound, and every unbound reason that relied on the old shared text now describes what the build serves. I could not run the TypeScript typecheck or a YAML parse: every request to run `tsc` (or node, or python) was blocked waiting for an approval that never came. Both files are edited but neither was compiled; the runner's typecheck is the first real check.

**Re-walk.** I walked the build again on 2026-10-03, signed in as the administrator, the public sector employee who sits on the seeded panels, the organization-owner vendor and a vendor with no proposals. The build had moved well past the old shared reason, so the problem was wider than the ruling named. Besides the Code With Us proposal screen, the target now serves:
- a vendor dashboard with "My proposals" and "My organizations' proposals";
- "Watch this opportunity" and "Start a proposal" on Sprint With Us and Team With Us opportunity pages;
- a "Proposals" section on the Sprint With Us and Team With Us management screens;
- terms links in the organization qualification sections;
- an "Attachments" part on the Sprint With Us and Team With Us opportunity forms.

**What I did for each condition**
- **proposal-cwu-view:**
  - Bound: proposal_identifier, proposal_tab, history_tab, proponent, score and export_link. Score reads as shown ("82%" or "Not yet scored"). export_link reads "enabled" for the "Printable copy" link, although that link lands on "Page not found".
  - Still unbound: enter_score, award_proposal and disqualify_proposal. Walked as the administrator on submitted, withdrawn, evaluated, awarded and not-awarded proposals (and as the public sector employee on one), the screen has no button of any kind. Each reason lists those proposals.
  - rank is unbound too: there is no rank anywhere on the screen or in the management screen's Proposals table.
- **Shared reason and comments in index.ts:** I rewrote `NOBODY_SIGNS_IN` and its comment, the file header, and the attachment comment near the old line 8244. The text now lists what the build serves and the few routes that still answer "Page not found" to everyone I walked:
  - `/proposals`;
  - the Sprint With Us and Team With Us proposal screens;
  - every program's `.../export` and `.../proposals/export`;
  - every program's `.../complete`;
  - the evaluation and consensus screens.

  Sprint With Us and Team With Us proposal view and export pages keep their unbound status, with reasons that are now true. The instructions, evaluation and consensus list pages now say the management screen opens but has no such section and `?tab=` draws the Summary. They no longer claim "Page not found".
- **bindings.yaml defaults:** proposal-swu-create and proposal-twu-create now carry a note on two defaults:
  - submit and both terms actions fill any empty "Response to question N" with placeholder text;
  - the team actions pick the first offered organization when the test names none.

**Other changes the re-walk made necessary** (outside the named conditions, but leaving them would have kept false reasons in the file):
- **proposal-vendor-dashboard:** both actions and all five readings rebound to the new sections. The status reading uses the "My proposals" table only.
- **Opportunity pages:** toggle_watch and start_proposal bound on the Sprint With Us and Team With Us pages, sharing the Code With Us helpers. The seed has no Team With Us opportunity still taking proposals, so I saw the Team With Us "Start a proposal" link only on the Sprint With Us layout.
- **Management screens:** proposals_tab bound on Sprint With Us and Team With Us. A section that withholds proposals before closing reads empty, as on Code With Us.
- **organization-edit:** view_swu_terms, view_twu_terms and not_qualified_notice bound.
- **evaluation-panel-dashboard:** show_my_opportunities and open_opportunity bound. Its other five members stay unbound with the true reason: the dashboard has nothing about panels.
- **proposal-list-stub.placeholder_text:** now `absent:`. `/proposals` answers "Page not found" to everyone and nothing links to it; before this, the adapter was returning the not-found text as the placeholder.
- **Old comments:** I deleted the "earlier reason, superseded" comment lines. My bulk text replacement had turned them into self-contradictory statements.

**One inconsistency to flag:** the `.../complete` and export pages, and the Sprint With Us and Team With Us proposal view pages, still answer "Page not found". Arguably they should be reported as `absent:` rather than `unbound:`, as proposal-list-stub now is. I kept them unbound because that classification was accepted before and the ruling didn't ask for it to change. The Code With Us export page is a slightly different case: the "Printable copy" link does lead to it.

The read-only Sprint With Us and Team With Us proposal pages (build-slice-15#4) still answer "Page not found" and are left for the build. Nothing outside `tests/adapters/new/` was changed.

## Fix turn

I fixed the four failed checks. They all came from one typo, repeated on two lines of `tests/adapters/new/bindings.yaml`. Under `proposal-swu-edit` and `proposal-twu-edit`, the `scoresheet_tab` line had no space between the colon and the opening quote (`scoresheet_tab:"unbound: …`). Without that space, YAML reads the whole line as one long key with no value. That is why the check reported `scoresheet_tab` as missing on both pages and a member named `scoresheet_tab:"unbound` as not in the surface. I added the space on both lines, so each now reads as `scoresheet_tab:` with its quoted unbound reason as the value. I left the wording of both reasons as it was. I searched the file for any other key followed directly by a quote and found none. I could not run a YAML parser to confirm the file loads, because that command needed an approval nobody was here to give. I made no other edits, either to the bindings file or to `index.ts`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the 'new' adapter bind every surface action and observation the target offers, and nothing else, while settling bind-adapter-new-72#1-3? Ruling: approve. Nothing under tests/acceptance changed; the runner's typecheck on 9ebb62f78 passed with no diagnostics under adapters/new; the malformed `scoresheet_tab:"` keys and the stale 'proposal forms answer Page not found' shared text are gone. proposal-cwu-view binds proposal_identifier, proposal_tab, history_tab, proponent, score and export_link, and leaves enter_score, award_proposal, disqualify_proposal and rank unbound with reasons naming the seeded proposals walked and what the screen lacks (no button of any kind, no rank term or column). NOBODY_SIGNS_IN and the attachment comments now describe the current build, and proposal-swu-create / proposal-twu-create carry the placeholder-answer and first-organization defaults. The new bindings are navigation and locators; the empty reading of a withholding Proposals section and the absent: for /proposals are readings of what the screen draws, not pass/fail logic. build-slice-15#4 belongs to build and stays open. What would change this: a calibration showing a newly bound member does not reach its screen, or any change under tests/acceptance.

**Conditions:**
- condition-met bind-adapter-new-72#1: proposal-cwu-view in tests/adapters/new/bindings.yaml binds proposal_identifier, proposal_tab, history_tab, proponent, score and export_link (implemented as proposalCwuView in index.ts); enter_score, award_proposal, disqualify_proposal and rank are unbound with reasons naming the seeded proposals walked and that the screen draws no button and no rank
- condition-met bind-adapter-new-72#2: NOBODY_SIGNS_IN, its comment, the file header and the attachment-region comment in tests/adapters/new/index.ts now list what the current build serves and only the routes still answering 'Page not found'; dependent unbound reasons (SWU/TWU proposal view/export, complete, evaluation screens, instructions/evaluation/consensus tabs) were rewritten to match
- condition-met bind-adapter-new-72#3: tests/adapters/new/bindings.yaml carries a 'Defaults the adapter supplies' comment above proposal-swu-create and proposal-twu-create recording the placeholder 'Response to question N' fill and the first-offered-organization default

### Runner-owned typecheck evidence

Proposal revision: `9ebb62f78eac8d7a63bb54e72ce31c3086dca856`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
