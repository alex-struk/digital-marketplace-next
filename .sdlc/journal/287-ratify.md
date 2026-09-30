---
stage: "ratify"
title: "ratify proposals"
at: "2026-09-30T02:54:14.050Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify proposals: 38 accepted, 0 still open, 2 obsolete, 0 replacement(s) added.
Obsolete:
- D-proposals-35 — The stage between reviewing team questions and the code challenge is deprecated in the old system by its own migration, which comments 'Unused status; deprecate', rewrites every stored occurrence and narrows the permitted values so the old spelling can no longer be stored; only two migrations ever touch that constraint and neither restores it, and the live path moves proposals straight from question review to the code challenge. The new system carries no stage between them.
- D-proposals-37 — An address that renders nothing but the words 'Proposal List' is an unfinished stub rather than behaviour to carry forward. A vendor reaches their own and their organizations' proposals from the dashboard, which D-proposals-18 already states; the proposal-list-stub entry in spec/contract/surface.yaml is removed with it.
Unknown conditions (reported, not applied):
- defect D-proposals-31: A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.
- defect D-proposals-36: A Team With Us proposal is refused when the hourly rates it names, applied at each resource's target allocation across the opportunity's contract period, come to more than the opportunity's maximum budget; the check runs on both the create and the edit path, as the equivalent Sprint With Us check does.
- edit D-proposals-34: A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.
- confirm D-proposals-3
- confirm D-proposals-4
- confirm D-proposals-5
- edit D-proposals-6: A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.
- edit D-proposals-8: A proposal cannot move from draft to submitted once the opportunity's proposal deadline has passed, and a Code With Us proposal cannot be created already marked as submitted after that deadline, which is refused with "This opportunity is no longer accepting proposals."; the equivalent guard is absent from Sprint With Us and Team With Us creation, where the only barrier is that a closed opportunity is no longer visible to a vendor.
- confirm D-proposals-9
- confirm D-proposals-10
- edit D-proposals-11: Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, refused with "User is not an active member of the organization.", and a Team With Us proposal additionally refuses the same person named twice with "Please select unique team members.", while a Sprint With Us phase applies no such uniqueness check.
- edit D-proposals-12: A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.
- edit D-proposals-13: A Team With Us proposal must name at least one team member, each with an hourly rate of at least one dollar and each against a resource that exists, though the service does not check that the resource belongs to the opportunity being bid on.
- confirm D-proposals-14
- confirm D-proposals-15
- confirm D-proposals-16
- confirm D-proposals-18
- confirm D-proposals-19
- confirm D-proposals-21
- confirm D-proposals-22
- confirm D-proposals-23
- confirm D-proposals-24
- confirm D-proposals-25
- confirm D-proposals-26
- confirm D-proposals-27
- confirm D-proposals-28
- confirm D-proposals-29
- confirm D-proposals-30
- confirm D-proposals-32
- confirm D-proposals-33
- confirm D-proposals-38