---
stage: "ratify"
title: "ratify"
at: "2026-09-07T01:21:50.948Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify opportunities: 6 accepted, 45 still open, 0 obsolete, 0 replacement(s) added.
Still open:
- D-opportunities-1 (inferred)
- D-opportunities-2 (open) — the running code implements three programs, but the application's own README describes only Code With Us and Sprint With Us, and its generated database-schema document lists no Team With Us tables at all. Both documents predate Team With Us; a human should confirm that all three programs carry forward rather than assuming the documents are merely stale.
- D-opportunities-3 (inferred)
- D-opportunities-4 (inferred)
- D-opportunities-5 (inferred) — when remote work is not acceptable the remote-work description may be empty, and any value over 500 characters is rejected either way.
- D-opportunities-6 (inferred) — duplicate skills are silently collapsed rather than rejected.
- D-opportunities-7 (inferred) — the absence of an upper budget limit on Team With Us is a difference from the other two programs, not a stated policy; nothing in the application explains it, so a human should rule on whether it carries forward.
- D-opportunities-8 (inferred) — when an already-published opportunity's deadline has passed, an edit is measured against that past deadline instead of today, so a closed opportunity can be edited without its dates being forced forward.
- D-opportunities-9 (inferred) — Sprint With Us weights four stages (questions, code challenge, team scenario, price); Team With Us weights three (questions, challenge, price). Each individual weight is separately required to fall between 0 and 100.
- D-opportunities-10 (inferred)
- D-opportunities-11 (inferred) — the rule as written in the application's own comment says "one and only one chair", but the code accepts a panel with no chair at all and rejects only a second chair. A human should rule on which was intended.
- D-opportunities-12 (inferred) — the same limits apply to Sprint With Us "team questions" and Team With Us "resource questions"; the two differ only in name.
- D-opportunities-13 (inferred)
- D-opportunities-14 (inferred) — Code With Us has a single evaluation stage; Sprint With Us has four (team questions individual, team questions consensus, code challenge, team scenario); Team With Us has three (resource questions individual, resource questions consensus, challenge).
- D-opportunities-15 (inferred) — a draft may go to under review or straight to published; under review may only go to published; published and every evaluation stage may go to the next stage or to cancelled; awarded and cancelled are final.
- D-opportunities-16 (inferred) — Code With Us checks only title, teaser, remote-work fields, location and description at this point, while Sprint With Us additionally checks budget, skills, weights and every phase — so a Code With Us opportunity can reach "under review" with a missing reward or missing skills and be caught only at publication.
- D-opportunities-17 (inferred)
- D-opportunities-18 (inferred)
- D-opportunities-20 (inferred) — Code With Us does not anonymise proponents.
- D-opportunities-21 (inferred)
- D-opportunities-22 (inferred)
- D-opportunities-23 (inferred)
- D-opportunities-24 (inferred) — a draft or under-review opportunity cannot be cancelled — it is deleted instead.
- D-opportunities-25 (open) — the application's own interface documentation says deletion is permitted only for a draft, while the code also permits an administrator to delete an opportunity that is under review. The three programs also disagree with each other: for Code With Us and Sprint With Us the creating staff member may delete only a draft, but for Team With Us they may also delete one that is under review. A human should rule on the intended rule before it is carried forward.
- D-opportunities-28 (inferred)
- D-opportunities-29 (inferred) — the reporting counts are withheld while the opportunity is still a draft or under review, even from the author.
- D-opportunities-30 (inferred)
- D-opportunities-32 (inferred)
- D-opportunities-33 (inferred) — Team With Us offers no such action at all. Nothing in the application explains the omission, so a human should decide whether it is a gap to close or a deliberate difference.
- D-opportunities-35 (inferred)
- D-opportunities-36 (inferred) — nobody is notified when the opportunity is a draft or has been cancelled.
- D-opportunities-37 (inferred)
- D-opportunities-38 (inferred)
- D-opportunities-39 (inferred) — an opportunity counts as open only while it is published and its proposal deadline is still in the future; everything published and past its deadline, including cancelled and awarded opportunities, counts as closed.
- D-opportunities-40 (inferred) — the state filter offers draft, under review, published, evaluation and awarded; there is no option for opportunities in processing or cancelled, so those can only be found by clearing the filter.
- D-opportunities-42 (inferred)
- D-opportunities-43 (inferred)
- D-opportunities-44 (inferred)
- D-opportunities-45 (inferred)
- D-opportunities-46 (inferred) — this contradicts the administrator-only publication rule recovered as D-opportunities-17. The equivalent Sprint With Us and Team With Us creation checks refuse this case explicitly, so the Code With Us omission reads as an oversight rather than an intended difference. There is no replacement criterion because the corrected behaviour is already stated by D-opportunities-17; a human should rule on whether the rebuild simply closes the hole.
- D-opportunities-47 (open) — the permitted-change table for Team With Us allows only cancellation out of processing, while the equivalent tables for the other two programs allow the award. Awarding does not consult that table, so the award succeeds anyway. Whether the table or the award path is wrong cannot be determined from the application; a human should rule.
- D-opportunities-48 (inferred) — the application marks the Sprint With Us version of this action as deprecated in a comment but still accepts it; the Team With Us equivalent carries no such comment. There is no replacement criterion because the intended guard is already stated by D-opportunities-43; a human should rule on removing the older path.
- D-opportunities-49 (open) — the interface offers the edit only to administrators once an opportunity is published, but the underlying service accepts it from the author too. The two disagree, and nothing in the application says which is intended.
- D-opportunities-50 (inferred) — the state is named "deprecated suspended" in the application's own code but is still accepted by the store's constraint, so historical records may hold it. There is no replacement criterion: whether the rebuild must still display an opportunity left in this state from the old data is a question for a human, not something the application answers.
- D-opportunities-51 (open) — recorded so that the gap is not mistaken for absent behaviour by a later reader. The behaviours themselves are stated in the criteria above; this criterion is about the documentation being an unreliable second source, which is why several criteria here are graded on code alone.
Unknown conditions (reported, not applied):
- Regrade D-opportunities-2 against constitution article J1, which already establishes that all three programs carry forward; the stale README and schema document are a documentation fact, not an open scope question.
- Obtain human rulings on the four conflicting and three defect criteria before build, not during it: D-opportunities-49 (who may edit a published opportunity), -25 (who may delete and at what state), -47 (Team With Us award out of processing), -11 (whether an evaluation panel requires a chair), -46 (Code With Us create-as-published bypassing administrator-only publication), -48 (deprecated consensus-skipping path), -50 (unreachable 'suspended' state).
- Withdraw D-opportunities-51 as a criterion at ratify or move it to the journal: its outcome is a statement about the old application's documentation being unreliable, not a behaviour the rebuilt system must exhibit.
- No inferred criterion may be upgraded to confirmed on the strength of the old application's README, generated schema document or OpenAPI files, which this recovery shows to be materially behind the code.
- Record that the old test suite was not read because .sdlc/config.yaml excludes cypress/ and tests/; if a later stage wants criteria upgraded rather than ruled, lifting that exclusion is a policy change to propose, not an archaeology re-run.
- Future archaeology proposals must carry an actual recommendation in front-matter; 'I've finished.' gives the gate holder nothing to rule on.