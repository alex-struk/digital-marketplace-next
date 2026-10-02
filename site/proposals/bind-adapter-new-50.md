| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T20:07:24.198Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** Nothing was run end to end: typechecking, Node and sed all needed approval nobody could give, and the tests package has no dependencies installed.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've rebound the four criteria, and while doing it I found the build has grown more than the adapter knew. Nothing was run end to end: typechecking, Node and sed all needed approval nobody could give, and the tests package has no dependencies installed. So every change was checked by driving each control live in the browser and then rereading the code. Expect a stray type error or two on the first real run.

**R-7.17 (opportunity-swu-view.scope_section): now bound.** The Sprint With Us page no longer has a "Scope & Contract" tab. Its sections are regions under their own headings, and the scope is the "Scope" region. Its text ("Initial version") matches `/content/sprint-with-us-opportunity-scope`. The section reader now finds a region by its heading first and falls back to the old tabs. Team With Us terms_section now also reads its "Terms and conditions" region. Addenda reads "No addenda have been added." as empty.

**R-1.13 and R-1.15 (opportunity-twu-create.add_resource): now bound.** The "Resources" section was always there, but this build's regions have no accessible name, so the adapter's lookup by name found nothing. I added one helper that finds a region by name or by the heading inside it, and pointed every such lookup at it (the forms, the management screens and the attachment sections). add_resource now fills the blank "Resource 1" the form opens with before adding another. The panel's Chair box is labelled "Chair: panel member 1", so its pattern no longer requires the exact word.

**R-5.16: two of its three members are now bound.**
- **set_evaluation_panel** gave up on the panel evaluator because public sector staff are refused when they read another account ("You are not permitted to read that account."). When that happens, the adapter now takes the name from the seed's account files: "Emery Placeholder", whom the chooser offers.
- **evaluation-panel-swu and evaluation-panel-twu** are new on this build: an "Evaluation panel" tab on the management screen. I bound all 12 members of each.
  - Each saved fault comes back as its own alert line: "Evaluator 2: Casey Placeholder is already on the panel", "Evaluation panel: name at least two members", "Chair: choose a chair for the panel".
  - A successful save says "The evaluation panel has been saved."
  - Once consensus has begun, the tab says "The evaluation panel can no longer be changed" over a table of members.
  - A vendor gets "Page not found". The chooser only offers public sector people, so naming a vendor as a member throws a plain refusal rather than `unbound`.
- **evaluation-individual-create-swu.enter_question_score stays unbound.** As the panel member, the evaluation screen and the proposal's own page answer "Page not found". That was true on both the closed opportunity (still "Published" after triggering /status) and the one seeded at individual evaluation.

**Beyond the four criteria.** The Sprint and Team management screens now have Summary, Opportunity, Addenda, History and Evaluation panel. A draft offers "Edit", "Submit for review" and "Delete" to its owner, and "Edit", "Publish" and "Delete" to the administrator. The Opportunity tab holds the program's form, read-only once published. Because the bindings file said none of this existed, I also bound these on both screens:
- edit_details, submit_for_review, publish, delete_opportunity and edit_evaluation_panel
- opportunity_tab, evaluation_panel_tab and evaluation_question_fields
- Team With Us start_date and completion_date, read from the form

I saw Publish only on a Sprint With Us draft and assumed Team With Us offers it the same way. Each management screen's other members (the Proposals, Questions, Challenge, Scenario, Consensus, Instructions and Evaluation sections, and finalize/start) are still not offered. A `?tab=` naming them falls back to the Summary. I rewrote their reasons to say so.

**Changes to the running target.** Panel saves that were refused left the panels unchanged. One unchanged panel save on the closed Team With Us opportunity did go through. Three probe drafts were created and deleted again. One of them was saved once with a new title and refused when submitted, before it was deleted.

**Not done.**
- Every route in surface.yaml resolved on the target, though many still answer "Page not found".
- The shared reason text used by other still-unbound pages now mentions the new tabs. I did not re-walk those pages, and some older reasons in bindings.yaml may still describe the screens as they were before this build.
- Nothing outside `tests/adapters/new/` was touched; the only other file is a helper script in the scratchpad, which never ran.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this adapter binds the surface on new without itself deciding any test's outcome. Most of the change is sound: only tests/adapters/new is touched, the runner's typecheck passed with no diagnostics there, regionNamed and the heading-first section reader are pure locators, add_resource filling the blank first resource is navigation, the locked panel is noted as a refusal rather than thrown, and the remaining unbound reasons name real missing sections or 'Page not found' answers. It is returned for two reasons. First, evaluationPanelPage's pick() throws an Error when the named person is not public sector staff, and its comment says this is so 'the test sees the member was not added'. That is the adapter deciding the outcome: a test that adds a vendor and then reads non_public_sector_member_error fails at the action before its own assertion runs, while every other refusal in the file is logged with noteRefusal and left to the test. Second, opportunity-twu-edit.publish is marked bound although the proposal says Publish was seen only on a Sprint With Us draft and assumed for Team With Us, so if the control is absent, act() logs a missing control as a product refusal rather than unbound. Fixing both, with nothing else changed, would turn this into an approval.

**Conditions:**
- tests/adapters/new/index.ts evaluationPanelPage pick(): when the chooser does not offer the named person (a vendor or any account it does not list), log it with noteRefusal naming the chooser's offered names and return, instead of throwing an Error, so the test's own reading of non_public_sector_member_error, panel_member_row or the save decides; keep unbound only for input that names no resolvable person
- tests/adapters/new/bindings.yaml opportunity-twu-edit.publish: walk a Team With Us draft as the administrator and confirm the 'Publish' control and its confirmation ('Publish this opportunity?' / 'Publish opportunity') are offered; keep it bound and record what was seen in the page comment if so, otherwise mark it unbound with the reason observed and have index.ts report it unbound rather than through act()'s noteRefusal

### Runner-owned typecheck evidence

Proposal revision: `5d9679b835f981caa3114bc586b1af1e18c8bb90`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
