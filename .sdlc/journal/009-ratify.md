---
stage: "ratify"
title: "ratify"
at: "2026-09-07T03:10:55.349Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify opportunities: 56 accepted, 0 still open, 1 obsolete, 2 replacement(s) added.
Obsolete:
- D-opportunities-51 — It records that the old application's own interface description is incomplete, which is a property of the recovered sources rather than a behaviour the rebuilt system must exhibit; the behaviours it points at are already carried by the criteria above, and the documentation's unreliability belongs in the archaeology journal.
Unknown conditions (reported, not applied):
- Regrade D-opportunities-2 against constitution article J1, which already establishes that all three programs carry forward; the stale README and schema document are a documentation fact, not an open scope question.
- Obtain human rulings on the four conflicting and three defect criteria before build, not during it: D-opportunities-49 (who may edit a published opportunity), -25 (who may delete and at what state), -47 (Team With Us award out of processing), -11 (whether an evaluation panel requires a chair), -46 (Code With Us create-as-published bypassing administrator-only publication), -48 (deprecated consensus-skipping path), -50 (unreachable 'suspended' state).
- Withdraw D-opportunities-51 as a criterion at ratify or move it to the journal: its outcome is a statement about the old application's documentation being unreliable, not a behaviour the rebuilt system must exhibit.
- No inferred criterion may be upgraded to confirmed on the strength of the old application's README, generated schema document or OpenAPI files, which this recovery shows to be materially behind the code.
- Record that the old test suite was not read because .sdlc/config.yaml excludes cypress/ and tests/; if a later stage wants criteria upgraded rather than ruled, lifting that exclusion is a policy change to propose, not an archaeology re-run.
- Future archaeology proposals must carry an actual recommendation in front-matter; 'I've finished.' gives the gate holder nothing to rule on.
- confirm D-opportunities-1
- confirm D-opportunities-2
- edit D-opportunities-3: An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.
- confirm D-opportunities-4
- confirm D-opportunities-5
- confirm D-opportunities-6
- confirm D-opportunities-7
- confirm D-opportunities-8
- confirm D-opportunities-9
- confirm D-opportunities-10
- confirm D-opportunities-12
- confirm D-opportunities-13
- confirm D-opportunities-14
- confirm D-opportunities-15
- confirm D-opportunities-16
- confirm D-opportunities-17
- confirm D-opportunities-18
- confirm D-opportunities-20
- confirm D-opportunities-21
- confirm D-opportunities-22
- confirm D-opportunities-23
- confirm D-opportunities-24
- confirm D-opportunities-28
- confirm D-opportunities-29
- confirm D-opportunities-30
- confirm D-opportunities-32
- confirm D-opportunities-33
- confirm D-opportunities-35
- confirm D-opportunities-36
- confirm D-opportunities-37
- confirm D-opportunities-38
- confirm D-opportunities-39
- confirm D-opportunities-40
- confirm D-opportunities-42
- confirm D-opportunities-43
- confirm D-opportunities-44
- confirm D-opportunities-45
- defect D-opportunities-46: Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.
- defect D-opportunities-47: The permitted state changes for a Team With Us opportunity in processing are awarded and cancelled, matching Code With Us and Sprint With Us, so the recorded transitions and the award path agree.
- defect D-opportunities-48: There is exactly one path out of a questions consensus stage, and it refuses to advance unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.
- defect D-opportunities-50: The rebuilt system defines no suspended state for an opportunity: none can be created in it, moved to it or stored in it, and any historical record carrying it is mapped to a defined state before the rebuilt system reads it.