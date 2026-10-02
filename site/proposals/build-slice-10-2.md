| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T21:20:07.998Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 10 (Staff can create Sprint With Us and Team With Us opportunities with an evaluation panel) do what its criteria say?

**Recommendation.** # Slice 10 revision: three likely causes fixed, but I couldn't reproduce the failures, so none of the 11 criteria is confirmed passing

This revision fixes three places where the screens departed from…

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

# Slice 10 revision: three likely causes fixed, but I couldn't reproduce the failures, so none of the 11 criteria is confirmed passing

This revision fixes three places where the screens departed from the design and could explain the returned failures. I could not reproduce any of the 11 failures myself, so whether this clears them depends on the next acceptance run. `npm --prefix app run check` passes: typecheck plus 16 migrations tests, 480 backend tests and 312 frontend tests.

## How I looked for the cause

- **No real browser was available.** Docker compose needs approval in this session. A headless Chromium download finished but would not unpack: after about 20 minutes only one file had been extracted.
- **The service is not the cause.** I started it in-process over the real migrations and seed. Every seeded Sprint With Us, Team With Us and Code With Us opportunity read back correctly as an administrator, as the author, as a vendor and signed out. The panel was shown only to those allowed to see it. Drafts built exactly as the form sends them were accepted in both programs.
- **The screens render the real data correctly in jsdom.** I fed the service's actual answer for the seeded consensus opportunity into the manage page (Summary, History and Evaluation panel tabs) and into the public view. Everything rendered, including the locked-panel notice, with no errors.

That left differences between the screens and the design, which a test driving the stories would trip over.

## What changed

1. **The Resources section had no usable name.** Its accessible label pointed at the section itself, not at its "Resources" heading. This is exactly the R-1.17 failure: the test found no "Resources" section on the Team With Us create page. It is now labelled by its heading, and a unit test checks it.

2. **The Evaluation panel tab now sets the browser title to "Evaluation Panel".** `design/DESIGN.md` says the browser title is always the surface title. The panel tab (`?tab=evaluationPanel`) is its own surface in `surface.yaml`, titled "Evaluation Panel", but the page always said "Manage a … opportunity". The profile tabs already follow this rule. If the acceptance driver recognises a page by its title, this explains all the empty readings on the panel tab: R-1.43, R-1.55, R-5.1, R-5.17 and R-5.18.

3. **The create form's panel now starts the way its story draws it.** That is two members still to be chosen, each ticked as an evaluator and neither as chair. Before, it started with the author already chosen and ticked as chair. Anything filling the panel from the story's shape would leave that tick behind, giving two chairs. The form's own check would then refuse the opportunity before sending it, so nothing was created and every later reading was empty.
   - The check now ignores rows where nobody has been chosen. The request already left them out. A panel with one person chosen is therefore refused as "The panel needs at least two members", not for its empty second row.
   - A problem with one member is still numbered by its row on the form.
   - A draft saved with nobody chosen still gets its author as the only member, as decision record 0045 says.
   - This may explain the remaining failures on the Sprint With Us create screen: R-1.8, R-1.16, R-1.48 and R-1.53.

4. **The question stages are named in each program's words.** The status badge now says "Team questions: individual evaluation" and "Team questions: consensus" for Sprint With Us, and "Resource questions: …" for Team With Us. This matches the stories and the note on R-1.19. It used to say "Questions: …" for both. This is on the public views, the manage pages, the opportunity list and the dashboard. The History tab rows still use the generic wording.

New unit tests cover:
- the panel's starting state;
- the Resources section's name;
- the create form's panel check (`createPanelProblems`): an empty row left out, row numbering, a valid panel accepted;
- the program-specific status wording (`statusLabel`);
- the panel tab's browser title and status wording.

The two existing tests that assumed the author starts on the panel were updated. The changes are recorded in `docs/decisions/0046-the-panel-tab-is-its-own-surface-and-the-create-panel-starts-empty.md`.

## What may still fail, and what isn't this slice's

- **R-1.19's "moves on to a program-specific evaluation stage" case may need the deadline hook.** That is the hook in front of `/api` and `/status` that closes lapsed opportunities. It does not exist yet, and `plan/tasks.md` gives it to a later slice. If the test closes a lapsed Sprint With Us opportunity itself, rather than reading one the seed already has at an evaluation stage, it will keep failing until that slice lands.
- **Stage tabs are not drawn.** These are the Proposals, Team questions, Code challenge, Team scenario, Resource questions, Challenge and Consensus tabs, and the "Finalize consensus scores" action. The design shows them from closing onward, but their contents belong to later slices.
- **R-1.16's "must have an implementation phase" case remains unexplained.** The form never lets the implementation phase be removed, so if that test tries to remove it, the form would need a change I can't justify from the story.
- **Attachments on these programs** are still not offered (R-8.19, slice 15).

I removed every temporary probe file and the dependencies I installed to run the tests. Nothing outside `app/` and `docs/decisions/` was changed.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Verify recorded a current fail against tree b69a691 (8 pass, 13 not, R-7.29 not-testable with a real reason: the embedded pages cannot be removed through the surface, per R-7.25), so this cannot be approved. I sorted every failure against its evidence page and the adapter in tests/adapters/new/index.ts, and none shows the application missing what a criterion needs. (1) opportunityView().status() returns the line after one reading exactly the program name, which is the original application's header. The new view, matching the design story, draws a 'Status' term with its value, which read Draft, Published or 'Team questions: consensus' while the adapter read ''. (2) programForm.setPanel reads 'chair' only per member and ignores the top-level 'chair' the tests pass to setEvaluationPanel({members, chair}). With the form now starting with nobody chosen, as its story draws it, every create is refused with 'Evaluation panel: choose a chair' (R-1.13's page). (3) opportunityIdentifier() returns 'create' while still on the create form, so the tests open /opportunities/sprint-with-us/create as a view, or /create/edit?tab=evaluationPanel (R-5.16 unbound). (4) The panel tab's pick() logs a refusal and returns when the chooser does not offer a vendor, which the application correctly withholds, but the tests read a refusal only from a throw. (5) R-1.19's 'moves on to a program-specific evaluation stage' case needs the deadline hook that plan/tasks.md (line 87) delivers in a later slice. No condition is addressed to build. This ruling would change to an approval on a current verify pass of this tree once bind-adapter and plan have answered.

**Conditions:**
- addressed-to bind-adapter: R-1.8: opportunitySwuView.status() returns the line after one reading exactly 'Sprint With Us', which this page never draws. The page at /opportunities/sprint-with-us/<id> shows a paragraph 'Sprint With Us opportunity' and then a 'Status' term whose value read 'Draft' (.sdlc/evidence/slice-10/R-1.8.txt), yet the adapter read ''. Read the value given under the 'Status' term (the design story marks it data-testid opportunity-status).
- addressed-to bind-adapter: R-1.18: opportunityTwuView.status() has the same fault on /opportunities/team-with-us/<id>: it looks for a line reading exactly 'Team With Us' and the page shows the state under a 'Status' term, so all four reads returned ''. Read the value under 'Status'.
- addressed-to bind-adapter: R-1.43: opportunitySwuView.status() read '' on /opportunities/sprint-with-us/00000000-0000-4000-a011-000000000001, whose 'Status' term reads 'Team questions: consensus' (.sdlc/evidence/slice-10/R-1.43.txt). Read the value under 'Status' rather than the line after an exact program-name line.
- addressed-to bind-adapter: R-1.48: opportunitySwuView.status() read '' on the created opportunity's view, which shows its state under a 'Status' term. Same fix as R-1.8. Separately, programForm.setPanel ignores the top-level 'chair' given to setEvaluationPanel({members, chair}) and only reads a per-member chair flag, so no Chair box is ticked and the create form refuses with 'Evaluation panel: choose a chair'. Tick the Chair box of the member the input names as chair.
- addressed-to bind-adapter: R-1.53: opportunitySwuView.status() read '' on /opportunities/sprint-with-us/<id>, where the state is shown under a 'Status' term. Same fix as R-1.8.
- addressed-to bind-adapter: R-1.13: opportunityTwuCreate.setEvaluationPanel({members, chair}) never ticks the Chair box of the member named by the top-level 'chair', because programForm.setPanel reads 'chair' only on each member. The form then refused with 'Evaluation panel: choose a chair. The panel needs one person to record the agreed scores.' (.sdlc/evidence/slice-10/R-1.13.txt). Apply the top-level chair to the matching member's Chair box.
- addressed-to bind-adapter: R-1.16: after a publish the form refused, opportunitySwuEdit.opportunityIdentifier() read 'create' from /opportunities/sprint-with-us/create and returned it as an opportunity id, so the test 'viewed' the create form and phases() read ''. Return '' while the page is still the create form, so the test takes its 'nothing was created' branch. setEvaluationPanel's chair must also be applied, as for R-1.13.
- addressed-to bind-adapter: R-1.17: the publish was refused because setEvaluationPanel ticked no chair (see R-1.13), and opportunityIdentifier() then returned 'create', so opportunitySwuView.status() was read on /opportunities/sprint-with-us/create and returned ''. Apply the top-level chair, return no identifier from the create form, and read status under the 'Status' term.
- addressed-to bind-adapter: R-5.17: setEvaluationPanel({members: [first, second], chair: second}) ticked no chair, the publish stayed on /opportunities/sprint-with-us/create, and opportunityIdentifier() returned 'create', so every status() read was taken on a blank create form (.sdlc/evidence/slice-10/R-5.17.png). Apply the top-level chair, return no identifier from the create form, and read status under 'Status'.
- addressed-to bind-adapter: R-5.16: evaluationPanelSwu was opened at /opportunities/sprint-with-us/create/edit?tab=evaluationPanel because the id it was given was 'create', returned by opportunityIdentifier() after a create refused for want of a chair. The panel tab does open for a real opportunity, as R-1.55's evidence at /opportunities/sprint-with-us/<id>/edit?tab=evaluationPanel shows. Fix the chair and identifier faults and the binding has a real opportunity to open.
- addressed-to bind-adapter: R-1.55: on /opportunities/sprint-with-us/<id>/edit?tab=evaluationPanel the 'Public sector employee' chooser correctly does not offer the vendor. addPanelMember's pick() calls noteRefusal and returns false without throwing, while the test reads a refusal only from a throw, so it concluded the vendor was added and found only the administrator. When the chooser does not offer the person asked for, addPanelMember must raise the refusal.
- addressed-to bind-adapter: R-5.1: same fault as R-1.55. evaluationPanelSwu.addPanelMember({member: vendor}) found the vendor not offered by the chooser, noted the refusal and returned normally, so the test's refused() saw no refusal and failed when panelMemberRow() lacked the vendor. Raise the refusal when the chooser does not offer the person.
- addressed-to bind-adapter: R-1.19: opportunitySwuView.status() read '' on /opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701, whose 'Status' term reads 'Published' (.sdlc/evidence/slice-10/R-1.19.txt). Read the value under 'Status'.
- addressed-to plan: slice 10 claims R-1.19, whose case 'an opportunity moves on to a program-specific evaluation stage' needs a lapsed Sprint With Us opportunity to leave Published when scheduled transitions run. plan/tasks.md line 87 delivers 'the deadline hook in front of /api and /status that closes opportunities in all three programs' in a later slice, and the seeded closed opportunity still reads 'Published' after scheduledTransitionTrigger.runPendingTransitions(). Either move R-1.19 to the slice that delivers the hook, or bring the hook into slice 10.
