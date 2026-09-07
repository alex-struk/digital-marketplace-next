---
stage: "ratify"
title: "ratify"
at: "2026-09-07T03:07:24.448Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify opportunities: 51 accepted, 3 still open, 1 obsolete, 4 replacement(s) added.
Still open:
- D-opportunities-11 (open) — the rule as written in the application's own comment says "one and only one chair", but the code accepts a panel with no chair at all and rejects only a second chair. A human should rule on which was intended.
- D-opportunities-25 (open) — the application's own interface documentation says deletion is permitted only for a draft, while the code also permits an administrator to delete an opportunity that is under review. The three programs also disagree with each other: for Code With Us and Sprint With Us the creating staff member may delete only a draft, but for Team With Us they may also delete one that is under review. A human should rule on the intended rule before it is carried forward.
- D-opportunities-49 (open) — the interface offers the edit only to administrators once an opportunity is published, but the underlying service accepts it from the author too. The two disagree, and nothing in the application says which is intended.
Obsolete:
- D-opportunities-51 — It records that the old application's own interface description is incomplete, which is a property of the recovered sources rather than a behaviour the rebuilt system must exhibit; the behaviours it points at are already carried by the criteria above, and the documentation's unreliability belongs in the archaeology journal.
Unknown conditions (reported, not applied):
- Regrade D-opportunities-2 against constitution article J1, which already establishes that all three programs carry forward; the stale README and schema document are a documentation fact, not an open scope question.
- Obtain human rulings on the four conflicting and three defect criteria before build, not during it: D-opportunities-49 (who may edit a published opportunity), -25 (who may delete and at what state), -47 (Team With Us award out of processing), -11 (whether an evaluation panel requires a chair), -46 (Code With Us create-as-published bypassing administrator-only publication), -48 (deprecated consensus-skipping path), -50 (unreachable 'suspended' state).
- Withdraw D-opportunities-51 as a criterion at ratify or move it to the journal: its outcome is a statement about the old application's documentation being unreliable, not a behaviour the rebuilt system must exhibit.
- No inferred criterion may be upgraded to confirmed on the strength of the old application's README, generated schema document or OpenAPI files, which this recovery shows to be materially behind the code.
- Record that the old test suite was not read because .sdlc/config.yaml excludes cypress/ and tests/; if a later stage wants criteria upgraded rather than ruled, lifting that exclusion is a policy change to propose, not an archaeology re-run.
- Future archaeology proposals must carry an actual recommendation in front-matter; 'I've finished.' gives the gate holder nothing to rule on.