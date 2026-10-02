---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I revised the binding for `new` as the ruling asked."
opened: 2026-10-02T09:47:26.194Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I revised the binding for `new` as the ruling asked.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I revised the binding for `new` as the ruling asked. The Sprint With Us and Team With Us management screens are now walked and bound, and `filter_by_status` and `toggle_watch` on the opportunity list are now bound. I could not typecheck or run the adapter here: the workspace has no `node_modules`, and installing the type checker or running `node --check` was refused. I re-read the new code by hand and ran its locators in the browser against the running target, but the runner's typecheck is the first real compile.

**Sprint With Us and Team With Us management screens.** I walked them as the administrator on the seeded opportunities in every state the seed offers. For Sprint With Us that was published and lapsed (00000000-0000-4000-8000-000000000701 among them), individual evaluation, consensus, code challenge, team scenario, processing and awarded. For Team With Us it was published and lapsed (00000000-0000-4000-8000-000000000801), individual evaluation, consensus and challenge. I also walked them on a draft I saved from each program's create form, as the owning public sector employee, and as the panel evaluator.

Both screens use the same layout as the Code With Us one, but offer much less:
- **Sections:** Summary, Addenda (not on a draft) and History. Any other `?tab=` value, including `opportunity` and `proposals`, falls back to the Summary.
- **Actions:** only "Cancel opportunity", offered to the administrator from published through processing. A draft, an awarded opportunity and a public sector employee get no actions.
- **Summary:** it ends with "The rest of this opportunity — what makes it a … opportunity, and putting it forward for review or publication — cannot be managed here yet."
- **History:** the Sprint With Us History has the "Add a private note" form (not on a draft); the Team With Us History has none.
- **Evaluator:** the panel evaluator is answered "Page not found" on every one of these screens.

What is now bound, on both screens unless noted:
- `cancel_opportunity`, using the same confirmation dialog with an optional note as Code With Us.
- `add_addendum`.
- `add_note` (Sprint With Us only), with attachments through the file chooser.
- `opportunity_identifier`, `created_by_name`, `last_changed_by_name`.
- `summary_tab`, `addenda_tab`, `history_tab`.
- `proposal_deadline` and `assignment_date`. These are read from the Summary and returned as a date in YYYY-MM-DD form; the Summary shows them as e.g. "September 2, 2026 at 4:00 p.m. Pacific time".
- `offered_state_changes` (Team With Us), which returns "cancel" where "Cancel opportunity" is offered and nothing otherwise.

Where an action has nothing to press (a draft, an awarded opportunity, or a public sector employee), the adapter logs a refusal and returns rather than failing. A reader other than the administrator who is answered "Page not found" reads as nothing. Both follow the accepted Code With Us pattern.

The other members stay unbound, and each reason now names what the screen does not offer and the states walked:
- **Actions:** `edit_details`, `submit_for_review`, `publish`, `delete_opportunity`, `edit_evaluation_panel`, `finalize_question_consensuses`, and `start_team_scenario` (Sprint With Us).
- **Sections:** `opportunity_tab`, `proposals_tab`, `evaluation_panel_tab`, `consensus_tab`, `instructions_tab` and `evaluation_tab` on both screens, plus the program's own question and challenge sections.
- **Fields:** `evaluation_question_fields`, and the Team With Us `start_date` and `completion_date`, which the Summary does not carry.

**Opportunity list.** Re-walked signed in as the administrator and as a public sector employee:
- `filter_by_status` is bound. A "Status" chooser now sits in the "Filter opportunities" group, signed in and signed out, offering All statuses, Draft, Under review, Published, Evaluation and Awarded.
- `toggle_watch` is bound. Each card carries a "Watch <title>" box, found by the opportunity's title or identifier. A card for the reader's own opportunity has no box, nor does any card for a signed-out visitor; both are logged as refusals.

The `cancel_opportunity`, `add_addendum`, `add_note` and three reporting bindings on the Code With Us screen, and its `refusedReader` handling, are unchanged.

**Things a later stage should know:**
- **Three accepted list bindings look stale.** The list's filters have changed. `filter_by_program`, `filter_remote_only` and `search` still look for a "Filter Opportunities" chooser, a "Remote OK" box and a search *textbox*. The page now has an "All programs / Program" button, a "Remote work accepted only" box and a search box of the searchbox role. I left them alone because the ruling limited this revision to the named members. As written they will probably report unbound at run time.
- **The create screens open now.** `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create` both open on this build. Their pages, `opportunity-swu-create` and `opportunity-twu-create`, still carry the old "Page not found" reasons and need a walk of their own.
- **Two drafts were left on the target.** Walking created "Adapter walk SWU draft" and "Adapter walk TWU draft", and the screen offers no way to delete them.

No route was unreachable. Every route this revision concerns opened on the target. Nothing outside `tests/adapters/new/` was changed, and no password or environment value appears in the adapter, the bindings file or here.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-40 adapter bind every surface action and observation on the new target, and nothing else? Ruling: return. The revision does what bind-adapter-new-39 asked. The Sprint With Us and Team With Us management screens are bound with a shared helper that only navigates and locates. Each member left unbound names what the screen, walked in the seeded states, does not offer. filter_by_status and toggle_watch are bound after a signed-in walk. The Code With Us bindings and the refusedReader handling are kept. Nothing under tests/acceptance changed, and the runner's typecheck passed. It cannot be approved because this same diff rewrites every unbound reason on opportunity-swu-create and opportunity-twu-create to say the current build answers those routes with 'Page not found', while the proposal states that both create screens open and that it saved a draft from each. An unbound reason must be true. Second, opportunity-list.filter_by_program, filter_remote_only and search are recorded as bound, but their locators look for controls the author reports the page no longer has: a 'Filter Opportunities' combobox, a 'Remote OK' checkbox and a 'Search by Title or Location' textbox (index.ts:3386, 3423, 3434). A bound status that will report unbound when the suite runs is not a binding. What would change the ruling: the two create pages walked and bound, or their reasons replaced with what those screens actually lack; and the three list bindings repointed to the controls the list now renders, or marked unbound with a true reason.

**Conditions:**
- condition-met bind-adapter-new-39#1: opportunity-swu-edit and opportunity-twu-edit are bound through programManage in tests/adapters/new/index.ts (cancel_opportunity, add_addendum, add_note on Sprint With Us only, identifier, created/last-changed names, the summary, addenda and history tabs, proposal_deadline, assignment_date, and offered_state_changes on Team With Us). Each remaining member in tests/adapters/new/bindings.yaml names what the screen does not offer and the seeded states walked (00000000-0000-4000-8000-000000000701 and 00000000-0000-4000-8000-000000000801 among them).
- condition-met bind-adapter-new-39#2: opportunity-list.filter_by_status and toggle_watch were re-walked signed in and bound: the 'Status' chooser in the 'Filter opportunities' search group, and the per-card 'Watch <title>' checkbox, with refusals logged for the reader's own cards and for signed-out visitors (tests/adapters/new/index.ts filterByStatus/toggleWatch; bindings.yaml opportunity-list).
- condition-met bind-adapter-new-39#3: the Code With Us cancel_opportunity, add_addendum, add_note and reporting_views/watchers/proposals bindings and refusedReader are unchanged from bind-adapter-new-39 in tests/adapters/new/index.ts.
- tests/adapters/new: walk /opportunities/sprint-with-us/create and /opportunities/team-with-us/create signed in as the administrator and as a public sector employee. This proposal reports that both open and that it saved a draft from each. Bind the members of opportunity-swu-create and opportunity-twu-create, or replace each unbound reason, which now says the current build answers those routes with 'Page not found', with what the create screen actually does not offer.
- tests/adapters/new: rebind opportunity-list.filter_by_program, filter_remote_only and search to the controls the list renders on the current build. This proposal reports an 'All programs / Program' button, a 'Remote work accepted only' checkbox and a search box of the searchbox role, where the code still looks for a 'Filter Opportunities' combobox, a 'Remote OK' checkbox and a 'Search by Title or Location' textbox. Alternatively, mark each unbound with a reason naming what the list does not offer. Also update the stale opportunity-list comment in bindings.yaml.

### Runner-owned typecheck evidence

Proposal revision: `69f2c3db6dd2921579c301ac9ce4cd45215bb7f1`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
