---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "Nothing else in the file was touched, and `bindings.yaml` didn't need to change: every member these conditions name was already marked bound."
opened: 2026-10-02T22:38:41.969Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** Nothing else in the file was touched, and `bindings.yaml` didn't need to change: every member these conditions name was already marked bound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've fixed all 13 conditions in `tests/adapters/new/index.ts`. Nothing else in the file was touched, and `bindings.yaml` didn't need to change: every member these conditions name was already marked bound. I couldn't compile the change because there is no TypeScript toolchain in this workspace (`tests/node_modules` doesn't exist), and I didn't run the suite. The edits were checked against the running target by reading the pages, not by executing the adapter.

**Status on the Sprint With Us and Team With Us views (conditions 1, 2, 3, 4, 5, 8, 9, 13).** `status()` now reads the value under the page's "Status" term. It uses the same term reader the Code With Us view already used. I opened the seeded closed Sprint With Us opportunity (`…-8000-000000000701`) and the term reads "Published", which matches what the reviewer reported for R-1.19. The old reading, the line after the program's name, is kept only as a fallback if the page has no "Status" term.

**Chair on the panel (conditions 4, 6, 7, 8, 9).** The panel setter used by both programs' create forms now applies a chair given beside the members, as in `{members, chair}`. The chair can be a person, a seeded account record or a position in the list. The member it matches by name gets their Chair box ticked and every other member's box is left unticked. If the chair is none of the listed members, the setter throws `unbound:` naming it. A chair flag on a single member still works as before. Signed in as the administrator, I confirmed the Sprint With Us create form shows each panel member with an "Evaluator" box (ticked by default) and a "Chair" box (unticked).

**No identifier from the create form (conditions 7, 8, 9, 10).** When there is no "Opportunity ID" line, the identifier helper falls back to the address. It now returns empty when the address is a program's create form rather than returning "create". The program view's own identifier reader gets the same guard. A refused create therefore sends the test down its "nothing was created" branch instead of opening `/…/create` as if it were a record. This shared helper also serves the Code With Us screens, where the guard behaves the same way. With the chair and identifier fixed, the evaluation panel screen in condition 10 is given a real opportunity to open, so its binding stays as it was.

**Refusal when the chooser doesn't offer the person (conditions 11, 12).** When the "Public sector employee" chooser doesn't offer the person asked for, such as a vendor, `addPanelMember` now throws an error beginning `refused:`. The error names who the chooser did offer. It deliberately does not begin `unbound:`, so the test reads it as a refusal. The refusal is still recorded in the log as before.

**Re-check of the calibration's unbound list.** R-5.16's `add_panel_member` was only reported unbound because it was opened with the id "create". The fixes above remove that cause. For `evaluation-individual-create-swu.enter_question_score` I checked again, signed in as the administrator:
- The seeded Sprint With Us opportunity with an evaluation already begun (`…-a028-000000000001`) and its seeded proposal (`…-a028-000000000101`): the `/team-questions/evaluations/create` address still answers "Page not found".
- That opportunity's management screen offers only Edit, Cancel opportunity, Summary, Opportunity, Addenda, History and Evaluation panel. Nothing there opens a proponent's evaluation.

The existing unbound reason stands unchanged.

Every route these conditions touch resolved on the target except that evaluation screen, which is a real absence rather than a wrong route. No condition is deferred, and nothing outside `tests/adapters/new/` was written.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether bind-adapter-new-52 still binds the new target's pages without asserting anything, and whether it carries out the 13 binding fixes the build-slice-10-2 ruling asked of bind-adapter. It does. The diff touches only tests/adapters/new/index.ts, nothing under tests/acceptance changed, and the runner's typecheck on revision 6adb2d7de passed with no diagnostics. Every change only finds things on the page or translates what it sees. status() reads the value under the page's 'Status' term, keeping the old program-name reading only as a fallback. The panel setter ticks the Chair box of the member named by a chair given beside the members, and throws unbound: when that chair is none of the members. Both identifier readers return empty on a program's create form, so a refused create follows the test's 'nothing was created' path. addPanelMember throws refused: when the chooser does not offer the person. That last change comes closest to deciding an outcome, but it translates a page observation into the convention the test already uses (R-5.1's refused() reads any throw that is not unbound: as a refusal), and the earlier ruling asked for exactly this. The remaining unbound reason for enter_question_score is real: the route answers 'Page not found' and the opportunity's management screen offers no way to open a proponent's evaluation. This ruling would change if a verify run showed a 'Status' read or a chair tick still failing on these pages, or if pick() turned out to return false when the chooser was not found rather than not offering the person, which would report a binding fault as a refusal. Condition #14 is addressed to plan and stays open.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `6adb2d7de7d6dd050d4548fc3a7589cc25619405`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
