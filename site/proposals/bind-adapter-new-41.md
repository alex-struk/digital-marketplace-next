| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T09:59:40.317Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't run the typecheck: there is no `node_modules` here, `tsc` isn't installed, and running it through `npx` or `npm` needed approval that nobody here can give.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've rebound the two Sprint With Us and Team With Us create pages and the three opportunity-list filters, and every member in both create sections is now `bound`. I couldn't run the typecheck: there is no `node_modules` here, `tsc` isn't installed, and running it through `npx` or `npm` needed approval that nobody here can give. I checked the types by reading the code, and every locator the new code uses was tried on the live target.

**The create screens (`opportunity-swu-create`, `opportunity-twu-create`).** Both open signed in, as the ruling said. As the administrator and as a public sector employee I saved drafts from each, published a Sprint With Us opportunity as the administrator, and submitted one for review as the public sector employee. Each landed on the new opportunity's management screen. The two people are offered different buttons: the administrator gets "Save draft" and "Publish", the public sector employee gets "Save draft" and "Submit for review". When the action asked for isn't offered to the signed-in person, it is logged as a refusal, the same way the Code With Us form already handles it.

- **Shared code:** one helper drives both screens. Each action enters every value it is given before pressing anything, and throws `unbound:` naming any key the form has no field for.
- **What the helper fills:**
  - the Overview fields and the remote-work Yes/No question;
  - the budget, skills, description and key dates;
  - phases ("Add an inception phase" / "Add a prototype phase", each with its own start and completion dates);
  - resources, each with its "Service area" chooser and "Target allocation";
  - team or resource questions;
  - the scoring weights;
  - the evaluation panel: members chosen, added and removed, with their Evaluator and Chair boxes.
- **`field_error`:** reads the form's alert and the reason on the field marked invalid. A refused save stays on the form with "The opportunity was not saved" and a message such as "Describe the remote work, because remote work is acceptable."
- **`score_weight_error`:** reads only messages about the weights. Weights totalling 150% raised no message (only the "Total: N%" line changes), so on this build it correctly reads empty.
- **`evaluation_question_fields`:** returns the five fields of the question at the given position (the first by default) in the contract's words, and empty when there is no question at that position.
- **Signed out:** both create screens show "Page not found", which is logged as a refusal.

**The opportunity list.** `filter_by_program`, `filter_remote_only` and `search` now use what the list shows signed in and signed out: the "All programs / Program" button that opens a "Program" list, the "Remote work accepted only" checkbox, and the "Search by title or location" search box. I tried all three; the list narrowed for the first two. The search filled, but "Seeded" matched every card, so I didn't see it narrow. `filter_by_status` uses the same chooser helper and behaves as before. The stale opportunity-list comment in `bindings.yaml` is rewritten, and so is the program-chooser comment that said the Sprint With Us and Team With Us links led to "Page not found".

**Wording fixes.** The shared sentence describing what a signed-in person is served, used in the adapter's own error messages and in about 340 unbound reasons in `bindings.yaml`, now names all three programs' create forms instead of only Code With Us.

**The calibration items:**
- **`opportunity-cwu-edit` (cancel, reporting count, addendum, history):** all four were already `bound` in this binding. The quoted reasons came from an older run. On the current build the management screen opens, its Summary has a "Reporting" region with Views, Watchers and Proposals submitted, and the Sprint With Us management screen offers "Cancel opportunity" to the administrator.
- **`organization-edit.add_team_members` and `proposal-vendor-dashboard.show_my_proposals`:** still unbound, and the reasons are still true. Signed in as the organization-owner vendor, `/organizations/<seeded qualified id>/edit` and `/organizations` both show "Page not found". `/dashboard` reads only "Dashboard / You are signed in as Blake Placeholder."

**Routes that still don't open.** Signed in as a vendor, a Sprint With Us or Team With Us opportunity's public page shows "Page not found". I tried the seeded closed ones and one I had just published. So the existing unbound reasons on those pages' watch and start-proposal actions stand.

I didn't rebind or re-walk anything else, and wrote nothing outside `tests/adapters/new/`.

**Left on the target.** These walks created about eight test opportunities on the target, including one published Sprint With Us opportunity with an empty form, titled "Untitled opportunity". They will appear in the opportunity list and dashboards.

## Fix turn

Line 299 of `tests/adapters/new/index.ts` should now compile, but I couldn't confirm it: the sandbox needs approval to run the TypeScript compiler, so I never ran the typecheck.

**Journal addition.** All of the reported compile errors were on line 299, inside the long single-quoted `NOBODY_SIGNS_IN` reason string. The phrase "the three programs' forms" had an unescaped apostrophe, which ended the string literal early, so the rest of the line was read as code. I escaped that one apostrophe (`programs\' forms`). The string's wording, its meaning and every other line of the adapter and `bindings.yaml` are unchanged. After the edit I listed the unescaped single quotes on line 299, and only the string's own opening and closing quotes are left. That is consistent with the errors being gone, but whoever runs the suite next needs to confirm it with the typecheck.

Per the instruction to fix only the compile errors, I didn't touch the open conditions from the ruling either. The create-screen reasons for `opportunity-swu-create` and `opportunity-twu-create` still say "Page not found". The `opportunity-list` locators for `filter_by_program`, `filter_remote_only` and `search` still look for the old controls, and its comment in `bindings.yaml` is still stale.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Approved. The branch touches nothing under tests/acceptance or app/, and the runner's typecheck on c42a21a0f passed with no diagnostics under adapters/new. The two instructions left owed by bind-adapter-new-40 are carried out in the diff: every member of opportunity-swu-create and opportunity-twu-create is bound through a shared programForm helper that fills the form and presses the action, logging a refusal where an action is not offered to the signed-in person; and opportunity-list's filter_by_program, filter_by_status, filter_remote_only and search now target the 'Program'/'Status' button-and-listbox choosers, the 'Remote work accepted only' checkbox and the 'Search by title or location' searchbox inside the 'Filter opportunities' search group, with the stale comment rewritten. The new code is navigation, locators and input-to-label mapping only; refusals are logged for the test to judge, and throws are reserved for an action that could not be performed (disabled control, checkbox that did not change). The remaining unbound reasons on the Sprint With Us and Team With Us management screens and public pages each name what the screen does not offer. The proposal page's 'Fix turn' section says these conditions were left untouched; the diff shows otherwise, and the ruling is on the diff. A calibration showing the new locators do not match the rendered list filters or create forms would change this.

**Conditions:**
- condition-met bind-adapter-new-40#4: opportunity-swu-create and opportunity-twu-create are bound in full (tests/adapters/new/bindings.yaml, opportunity-twu-create at line 279 and opportunity-swu-create above it), implemented by programForm in tests/adapters/new/index.ts and wired as opportunitySwuCreate/opportunityTwuCreate in place of the former absent(...) entries
- condition-met bind-adapter-new-40#5: opportunity-list filter_by_program, filter_by_status, filter_remote_only and search now use listFilters()/listChoice() against the 'Program' and 'Status' choosers, the 'Remote work accepted only' checkbox and the 'Search by title or location' searchbox in tests/adapters/new/index.ts, and the opportunity-list comment in bindings.yaml is rewritten to the current controls

### Runner-owned typecheck evidence

Proposal revision: `c42a21a0f3acf8f90d46eaec6bc16f2d2325bbd9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
