---
stage: "ratify"
title: "ratify"
at: "2026-09-07T03:26:07.390Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify proposals: 10 accepted, 28 still open, 2 obsolete, 2 replacement(s) added.
Still open:
- D-proposals-3 (inferred)
- D-proposals-4 (inferred)
- D-proposals-5 (inferred)
- D-proposals-6 (inferred)
- D-proposals-8 (inferred)
- D-proposals-9 (inferred)
- D-proposals-10 (inferred)
- D-proposals-11 (inferred) — a team member whose membership is still pending is shown as pending on the proposal rather than being hidden, so a vendor can see why the submission is blocked.
- D-proposals-12 (inferred)
- D-proposals-13 (inferred)
- D-proposals-14 (inferred)
- D-proposals-15 (inferred)
- D-proposals-16 (inferred)
- D-proposals-18 (inferred)
- D-proposals-19 (inferred) — a withdrawn proposal is visible to administrators but hidden from the opportunity's own author.
- D-proposals-21 (inferred)
- D-proposals-22 (inferred)
- D-proposals-23 (inferred)
- D-proposals-24 (inferred)
- D-proposals-25 (inferred) — a Team With Us bid is the sum of each named person's hourly rate weighted by the target allocation of the resource they are named against, rather than a stated total cost.
- D-proposals-26 (inferred)
- D-proposals-27 (inferred)
- D-proposals-28 (inferred) — only a proposal that is fully evaluated, or one previously passed over, may be awarded.
- D-proposals-29 (inferred)
- D-proposals-30 (inferred)
- D-proposals-32 (inferred)
- D-proposals-33 (inferred)
- D-proposals-38 (inferred)
Obsolete:
- D-proposals-35 — The stage between reviewing team questions and the code challenge is deprecated in the old system by its own migration, which comments 'Unused status; deprecate', rewrites every stored occurrence and narrows the permitted values so the old spelling can no longer be stored; only two migrations ever touch that constraint and neither restores it, and the live path moves proposals straight from question review to the code challenge. The new system carries no stage between them.
- D-proposals-37 — An address that renders nothing but the words 'Proposal List' is an unfinished stub rather than behaviour to carry forward. A vendor reaches their own and their organizations' proposals from the dashboard, which D-proposals-18 already states; the proposal-list-stub entry in spec/contract/surface.yaml is removed with it.