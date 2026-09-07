---
stage: "ratify"
title: "ratify"
at: "2026-09-07T03:31:13.878Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify proposals: 38 accepted, 0 still open, 2 obsolete, 0 replacement(s) added.
Obsolete:
- D-proposals-35 — The stage between reviewing team questions and the code challenge is deprecated in the old system by its own migration, which comments 'Unused status; deprecate', rewrites every stored occurrence and narrows the permitted values so the old spelling can no longer be stored; only two migrations ever touch that constraint and neither restores it, and the live path moves proposals straight from question review to the code challenge. The new system carries no stage between them.
- D-proposals-37 — An address that renders nothing but the words 'Proposal List' is an unfinished stub rather than behaviour to carry forward. A vendor reaches their own and their organizations' proposals from the dashboard, which R-2.24 already states; the proposal-list-stub entry in spec/contract/surface.yaml is removed with it.
Unknown conditions (reported, not applied):
- defect D-proposals-31: A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.
- defect D-proposals-36: A Team With Us proposal is refused when the hourly rates it names, applied at each resource's target allocation across the opportunity's contract period, come to more than the opportunity's maximum budget; the check runs on both the create and the edit path, as the equivalent Sprint With Us check does.
- edit D-proposals-34: A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.