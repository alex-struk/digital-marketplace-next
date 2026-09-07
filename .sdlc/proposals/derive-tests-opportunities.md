---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "82 tests across 36 files, plus 14 not-testable entries."
opened: 2026-09-07T15:54:01.037Z
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** 82 tests across 36 files, plus 14 not-testable entries.

82 tests across 36 files, plus 14 not-testable entries. Here is my journal.

---

I derived acceptance tests for the fifty accepted opportunities criteria from the contract alone — `tests/generated/surface.d.ts`, `personas.ts`, `seed.ts` and the mail fixture. Thirty-six criteria got a spec file under `tests/acceptance/opportunities/`, 82 tests in all; fourteen got an entry in `tests/acceptance/not-testable.yaml` instead.

**What shaped nearly every decision.** One fact about the surface governs a third of this domain: nothing in it can close a published opportunity. An opportunity closes when its proposal deadline passes, `observables.yaml` names the status route as the request that runs the closing hook, and no page, action or observation makes that request. Nor can a past-deadline opportunity be manufactured — the seed's only published one falls due in 2030, a non-draft submission is refused a deadline earlier than today (R-1.14), and a draft left without one is given a deadline fourteen days out (R-1.9). Everything downstream of closure is therefore unreachable: the evaluation stages, processing, awarded, the anonymous proponent names, the consensus and code-challenge guards, the completed-opportunity report. That single gap accounts for **R-1.1, R-1.24, R-1.25, R-1.26, R-1.27, R-1.40, R-1.41, R-1.42, R-1.43, R-1.49 and R-1.50**. The observations for several of those refusals already exist on the panel and consensus surfaces — `not_all_consensuses_submitted_error`, `no_screenable_proponent_error`, `panel_locked_after_consensus`, `full_report` — they simply have no opportunity that can be brought in front of them.

The other three not-testables are about missing observations rather than missing reach. **R-1.23** needs an opportunity's published date, which no opportunity view or management surface returns (`published_date` exists only on the content pages), and there is no action that republishes an already-published opportunity, so the "even if later republished" clause has no *when*. **R-1.29** needs the names of the people who created and last changed an opportunity; no observation returns either, so their presence for an administrator and their absence for anyone else read identically. **R-1.51** needs some way to name a suspended state — no action requests a move to one, no observation reports the states an opportunity may hold or the states the list filter offers, and the seed carries no historical record in it.

**Surface additions that would close real gaps**, in the order I'd rank them:

1. An action that triggers the deadline-driven closure (the contract's `scheduled_transitions` trigger has no page behind it), or a seeded published opportunity whose deadline has already passed. Either one alone unlocks eleven criteria.
2. `published_date` on the three opportunity views (R-1.23).
3. `created_by` / `last_updated_by` observations on the opportunity views (R-1.29).
4. An error observation on the three opportunity *management* surfaces. They have `edit_details`, `publish`, `cancel_opportunity`, `delete_opportunity` and `add_addendum` but no `field_error` at all, so every refusal there — R-1.20, R-1.22, R-1.28, R-1.32, R-1.53, R-1.56 — is asserted as the opportunity's state or content being unchanged rather than as a stated refusal.
5. A `watch_state` observation on the opportunity views, and a distinct watch action rather than only `toggle_watch`. R-1.5's third outcome, that the same opportunity cannot be watched twice, cannot be requested at all through a toggle.
6. An observation for a second chair on the evaluation panel surfaces. `minimum_members_error`, `duplicate_member_error`, `missing_chair_error` and `non_public_sector_member_error` cover four of R-1.55's five faults; a panel with two chairs can be built but its refusal cannot be read.
7. Observations for an opportunity's assignment, start and completion dates, and for the time a date was recorded at. R-1.9's "completion date left empty" and R-1.14's "4:00 p.m. Pacific" are unassertable without them.
8. `refused_for_non_administrator` on the opportunity create and complete surfaces, as the content pages already carry — R-1.7 currently reads the refusal as the program chooser offering no program.

**Assumptions a later stage should check.** Two of them are load-bearing. First, criteria that need a record the test itself made refer to it by the title the test gave it (`surface.opportunityCwuEdit.open({ title })`); the seed says outright that Sprint With Us and Team With Us opportunities and all proposals are built through the pages rather than seeded, so there is no seed handle to use, and `open(params)` is the only way to name one. Second, action inputs are `unknown` in the generated contract, so the field names I pass (`proposalDeadline`, `totalMaxBudget`, `targetAllocation`, `mandatorySkills`, the four Sprint and three Team weights, `members`/`chair` on the panel) are my invention in shape though not in vocabulary — I took them from the criteria's own words. An adapter author will have to reconcile them, and it would be worth the contract naming input shapes at the design gate.

Three smaller judgements: mail assertions cover only the author's own notice, because every group notice in this domain goes out as blind copies and `mail.messagesTo` searches by visible recipient — the same limit the notifications stage recorded. R-1.56 asserts the published-edit rule for Code With Us only, though the criterion claims all three programs. R-1.32's "cannot be removed afterwards" and R-1.8's "never changed afterwards" are asserted nowhere: both are claims about an action that does not exist, and the absence of an action is not an observation.

I edited only `tests/acceptance/opportunities/` and the `not-testable.yaml` entries for this domain. I did not run the suite — `tests/node_modules` is not installed here and there is no target to run against — so the tests are checked by reading, plus a scan for the patterns the separation check refuses (none present).
