# Journal

## 015 · ratify · 2026-09-07

cost $0 · turns 0

ratify organizations: 35 accepted, 0 still open, 0 obsolete, 1 replacement(s) added.
Unknown conditions (reported, not applied):
- confirm D-organizations-3
- confirm D-organizations-6
- confirm D-organizations-15
- confirm D-organizations-18
- confirm D-organizations-23
- confirm D-organizations-24
- confirm D-organizations-25
- confirm D-organizations-27
- confirm D-organizations-29
- defect D-organizations-7: The Edit and Archive controls on an organization's management page are offered only to a person permitted to use them — the organization's owner or a service administrator; an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control, and the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator.
- defect D-organizations-8: A change to an organization's contact phone number made while editing its profile is saved along with every other profile field, and clearing the field removes the stored number.
- defect D-organizations-30: Asking for the organizations one may act on behalf of is refused as not permitted for anyone who is not a signed-in vendor, rather than answered with an empty list.

## 014 · ratify · 2026-09-07

cost $0 · turns 0

ratify organizations: 20 accepted, 14 still open, 0 obsolete, 3 replacement(s) added.
Still open:
- D-organizations-2 (inferred) — the owner and qualification columns are hidden entirely from a visitor who is not signed in and from public sector staff, so only vendors and administrators ever see them.
- D-organizations-4 (inferred) — the published interface description lists the same set of fields but says nothing about which are required or how long they may be, so the required/optional split and the hundred-character limit rest on the code alone.
- D-organizations-5 (inferred)
- D-organizations-10 (inferred)
- D-organizations-11 (inferred) — only active members count towards the capability total; a member who has been invited but has not yet accepted is excluded.
- D-organizations-12 (inferred) — the database description carried by the old application does not list the Team With Us terms field, the service-area approvals or the membership-rights history at all, so it is behind the schema the application actually uses.
- D-organizations-13 (inferred) — an administrator reading the terms page is not offered the accept control, so acceptance is in practice an act of the organization's own people.
- D-organizations-14 (inferred)
- D-organizations-16 (inferred)
- D-organizations-17 (inferred)
- D-organizations-20 (inferred)
- D-organizations-22 (inferred) — no message is sent when the organization's own owner or administrator withdraws a pending invitation, nor when an established member leaves; the code that would tell the owner about a member leaving is present but nothing invokes it.
- D-organizations-26 (inferred)
- D-organizations-28 (inferred)

## 013 · archaeology · 2026-09-07

cost $7.864792999999998 · turns 89

Work is complete. Three files touched, all within `spec/`.

---

## Journal

The organizations domain is how a vendor gets a company onto the Digital Marketplace and staffs it. A vendor who has accepted the service's terms registers an organization — legal name, address, contact details, optional logo — and becomes its owner on the spot; from there they invite other registered vendors by email address, each invitation sitting as a pending membership until the invited person accepts or declines it. The organization then earns the right to bid: it becomes Sprint With Us qualified once it has two active members who between them hold every capability the service recognises and has accepted the Sprint With Us terms, and Team With Us qualified once a service administrator has approved it for at least one service area and it has accepted the Team With Us terms. Everything else in the domain hangs off the affiliation record, which carries both a type (owner, administrator, member) and a status (pending, active, inactive), and which is never deleted — leaving, being removed, and declining an invitation all mark it inactive.

I recovered 31 criteria into `spec/domains/organizations.md`, six pages into `spec/contract/surface.yaml`, and two new roles — organization owner and organization member — into `spec/contract/personas.yaml`, plus organization-side abilities added to the organization administrator role that was already listed for the proposals domain. Four criteria are graded `confirmed` because the published interface description or the changelog says the same thing the code does; the rest are `inferred` on code alone. Three are marked `defect`.

**What conflicted.** The application's own database description is behind its schema: it does not list the Team With Us terms field on organizations, and it has no entry at all for the service-area approvals or for the membership-rights history, both of which later migrations added and which the running code reads on every organization page. The interface description and the code also disagree on how a membership is updated — the description gives the operation one request method and the service accepts another, so the description cannot be followed literally. On the substance of what happens, though, the two agree everywhere I could check them: archiving marks an organization inactive rather than deleting it, ending a membership deactivates it, accepting an invitation moves a pending membership to active, and an invitation may name only a member or an owner.

Three places where the code disagrees with itself rather than with a document. Editing an organization's profile silently discards the contact phone number, because the request is unpacked field by field and the phone is read from a differently named field than the form sends. The management page shows the Edit and Archive controls to anyone who can open the page, including an organization's administrators, but the service accepts those two actions only from the owner or a service administrator — so a person can see controls they cannot use. And the permission rule guarding the list of organizations one may act for is written but never actually invoked; the check asks whether the rule exists rather than running it. Nothing leaks as a result, because the underlying lookup returns nothing to a non-vendor, but the outcome is an empty success where a refusal was intended.

**What I could not determine.** For the contact phone defect I could establish that the submitted value never reaches the stored record, but not whether the stored number is left as it was or cleared — that turns on how the database layer treats a field it was not handed, which the source does not settle. Whether a person whose membership was previously ended can be invited back is read off the shape of the duplicate check, not observed, and I have flagged it as such. I also could not tell whether the three defects are defects in anyone's eyes but mine: each carries a note saying no corrected criterion has been written, because deciding between widening a permission and hiding a control is a product judgement, not an archaeological one. Finally, one notification path — telling an owner that an established member has left — exists in the code but nothing calls it, so the owner is told when an invitation is declined and not when a member departs; I recorded the asymmetry rather than guessing which half was intended.

## 012 · ratify · 2026-09-07

cost $0 · turns 0

ratify proposals: 38 accepted, 0 still open, 2 obsolete, 0 replacement(s) added.
Obsolete:
- D-proposals-35 — The stage between reviewing team questions and the code challenge is deprecated in the old system by its own migration, which comments 'Unused status; deprecate', rewrites every stored occurrence and narrows the permitted values so the old spelling can no longer be stored; only two migrations ever touch that constraint and neither restores it, and the live path moves proposals straight from question review to the code challenge. The new system carries no stage between them.
- D-proposals-37 — An address that renders nothing but the words 'Proposal List' is an unfinished stub rather than behaviour to carry forward. A vendor reaches their own and their organizations' proposals from the dashboard, which R-2.24 already states; the proposal-list-stub entry in spec/contract/surface.yaml is removed with it.
Unknown conditions (reported, not applied):
- defect D-proposals-31: A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.
- defect D-proposals-36: A Team With Us proposal is refused when the hourly rates it names, applied at each resource's target allocation across the opportunity's contract period, come to more than the opportunity's maximum budget; the check runs on both the create and the edit path, as the equivalent Sprint With Us check does.
- edit D-proposals-34: A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

## 011 · ratify · 2026-09-07

cost $0 · turns 0

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

## 010 · archaeology · 2026-09-07

cost $11.763324 · turns 101

The proposals domain is recovered and written. Journal entry follows.

---

**Journal — archaeology, proposals domain**

A proposal is one vendor's bid against one procurement opportunity, and the old application treats it as a small object with a long life: a vendor drafts it privately, submits it before the opportunity's deadline, and from that moment it is out of their hands except that they may withdraw it. When the opportunity closes, every submitted proposal is stripped of its identity — renamed "Proponent 1", "Proponent 2" and so on — and moves into that program's first review stage, where public sector staff score it through a fixed sequence of stages until one proposal is awarded and every other proposal still in contention is automatically marked not awarded. All three programs share that spine; what differs between them is what a proposal contains (free text and a named proponent for Code With Us, a phased team with proposed costs for Sprint With Us, named people at hourly rates against resources for Team With Us) and how many evaluation stages sit between closing and awarding.

I recovered 38 criteria into `spec/domains/proposals.md`, all provisional `D-proposals-n` IDs with `recovered` origin. Five are `confirmed` — corroborated by the README, the CHANGELOG, the generated database-schema document or the application's own interface descriptions; the rest are `inferred` from code alone, which is the honest grade for most of this domain because the old application documents almost none of its proposal rules in prose. I also appended twenty-one pages under `domain: proposals` to `spec/contract/surface.yaml` and two roles to `spec/contract/personas.yaml` — an organization owner or administrator, who can act on proposals belonging to their organization rather than only their own, and an evaluation panel member, who can read a closed opportunity's proposals under their anonymous names.

**What conflicted.** Three things, and in each case the running code is the stricter or later source. The published interface descriptions say a proposal is created as "DRAFT" or "PUBLISHED"; the service accepts only draft or submitted, and rejects "PUBLISHED" outright. The Sprint With Us description still lists actions for scoring questions and screening into and out of the code challenge that the service no longer accepts at all — question scoring moved to a panel and a consensus, and the only screening actions left are into and out of the team scenario. Both descriptions say deleting a proposal requires the opportunity to be in draft; the code requires only that the proposal itself be a draft and never looks at the opportunity. There is no interface description for Team With Us proposals at all, though the program has been running long enough to have its own migrations. All of that is recorded as one `open` criterion with a note per disagreement, because "the documents are merely stale" is a ruling a human should make rather than an assumption I should bake in.

**What I could not determine.** Whether the Sprint With Us stage between reviewing team questions and the code challenge is still reachable. The running code still offers the move and labels the stage with one value; the migration that introduced the evaluation panel rewrote every stored occurrence of that value to a differently-spelled "deprecated" one and narrowed the permitted stored values to a list that no longer contains the old spelling, and no later migration puts it back. On that reading the code offers a move the store would reject — but I cannot run the application, and the live path bypasses the stage entirely, so I left it `open` with the reasoning written out rather than guessing.

Two further things I found and marked as defects rather than behaviour to carry forward, each needing a ruling. Team With Us has a rule that computes a proposal's total cost from its hourly rates over the contract's working days and rejects it when that exceeds the opportunity's budget — and nothing calls that rule, on either the create or the edit path, so a Team With Us proposal is accepted at any price. Sprint With Us enforces the equivalent ceiling, which is what makes this look like an oversight rather than a decision. And a vendor can see the history of their own Sprint With Us and Team With Us proposals but not of their own Code With Us one; the three permission rules are otherwise identical, and only the Code With Us one omits the proposal's own author. I have not proposed replacements for either, because which way to correct them is a product question.

One smaller gap worth flagging: the address that ought to list proposals renders the words "Proposal List" and nothing else. The working place for a vendor to see their bids is the dashboard, which separates their own proposals from their organizations'. Nothing should carry that address forward without a decision about what belongs on it.

## 009 · ratify · 2026-09-07

cost $0 · turns 0

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

## 008 · ratify · 2026-09-07

cost $0 · turns 0

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

## 007 · ratify · 2026-09-07

cost $0 · turns 0

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

## 006 · archaeology · 2026-09-07

cost $11.958588999999995 · turns 130

I've finished. Files written: `spec/domains/opportunities.md` (51 criteria), plus appended entries to `spec/contract/surface.yaml` and `spec/contract/personas.yaml`.

---

## Journal

The opportunities domain is where a procurement posting lives its whole life. A member of public sector staff drafts an opportunity under one of three programs — Code With Us, Sprint With Us, Team With Us — submits it for review, and an administrator publishes it; from that point vendors can see it and propose against it until its deadline passes, at which point the opportunity closes itself and moves into a program-specific chain of evaluation stages ending in an award or a cancellation. Around that spine sit the supporting behaviours: per-program content validation, a versioned edit history with immutable addenda, watchers who get notified when the posting changes, visibility rules that hide unpublished postings from everyone but their author and administrators, and view/watcher/proposal counts visible only to the author and administrators.

I recovered 51 criteria, all `recovered` origin: 6 graded `confirmed`, 40 `inferred`, 5 `open`. By reconciliation class: 43 `implemented-only`, 4 `conflicting`, 3 `defect`, 1 `documented-only`. I read entry points, the shared status and validation modules, the database layer, the permission module, the migrations, the two OpenAPI files the application carries, its README, its generated schema document and its changelog. I did not open the test suite and did not go looking for it.

**What conflicted.** The application's own documentation is materially behind its code, and this is the single biggest finding. The README describes two programs; the generated database-schema document contains no Team With Us tables at all; there is an OpenAPI file for Code With Us and one for Sprint With Us and none for Team With Us. The Code With Us interface description says an opportunity may be created only as a draft or published, omitting the under-review state that a later migration added; it omits the "submit for review" and "add note" actions entirely; and it says deletion is permitted only for a draft, where the code also lets an administrator delete an opportunity that is under review. Because of this I could only grade six criteria `confirmed` — for most behaviours the code is the only witness, so I graded them `inferred` rather than borrowing confidence from prose that has demonstrably drifted.

There are also disagreements inside the code. The interface offers editing of a published opportunity only to administrators, while the service behind it accepts the same edit from the staff member who created it — the two can't both be the intent, and nothing says which. The evaluation-panel rule is documented in its own comment as "one and only one chair" but the code accepts a panel with no chair and rejects only a second one. Team With Us records that a processing opportunity may only be cancelled, never awarded, yet the award path does not consult that table and writes the award anyway.

Three things I recorded as defects rather than intent. A member of public sector staff who is not an administrator can publish a Code With Us opportunity by *creating* it as published, sidestepping the administrator-only publication rule — the equivalent Sprint With Us and Team With Us creation checks close this explicitly, which is why it reads as an oversight. An older action for advancing out of the consensus stage still works alongside the newer one and skips the check that all consensus evaluations have been submitted; the Sprint With Us copy is marked deprecated in a comment but still accepted, and the Team With Us copy carries no such marking. And "suspended" remains a permitted stored state that nothing can reach, so historical records may hold a value the live system has no path to.

**What I could not determine.** Why Team With Us has no upper budget limit when the other two programs are capped, why it alone has no "add note" action, and why its staff author may delete an under-review opportunity when the other two programs restrict them to drafts — these are real per-program divergences, but the application gives no reason for any of them, and each could as easily be an omission as a decision. I could not tell whether the stale README and schema document mean Team With Us was added without updating them, or whether some earlier decision scoped the service to two programs and the third was added later against that; both readings fit the evidence. I could not determine what the completion date on a Code With Us opportunity is used for downstream, since it is optional and nothing I read consumes it. And I could not establish the intended precision of automatic closure: closure is driven by ordinary web traffic rather than a clock, throttled to at most once a minute and additionally hung off the health-check route so it still fires on an idle site — so an opportunity closes at the first request after its deadline, not at the deadline. Whether that lag is acceptable behaviour or a workaround for the absence of a scheduler is a question the code cannot answer.

## 005 · archaeology · 2026-09-07

cost $0 · turns 0

Work is complete. Here is the journal entry.

---

**Opportunities domain — archaeology run**

An opportunity is a procurement posting that a public sector employee writes, an administrator publishes, vendors respond to, and a panel or an administrator eventually awards or cancels. It exists in one of three programs — Code With Us, Sprint With Us, Team With Us — which share a common skeleton (draft → awaiting review → published → one or more evaluation states → processing → awarded, with cancellation available from publication onward) and differ in what they ask for: a single reward and criteria for the first, budgeted delivery phases and team questions for the second, named resources drawn from a fixed list of service areas and resource questions for the third. Around that spine sits everything that makes the posting usable: who can see it in which state, what makes it complete enough to publish, the addenda and private notes that accumulate on it, the watchers who get told when it changes, the view and proposal counts its author can see, and a nightly-in-effect sweep that closes it and moves its proposals into review the moment its deadline has passed.

I recovered 48 criteria into `spec/domains/opportunities.md`, all provisional `D-opportunities-<n>` identifiers, all `origin: recovered`, each with at least one citation into `sources/old`. I also filled `spec/contract/surface.yaml` with the thirteen pages the domain presents (list, program chooser, three create forms, three public views, three tabbed edit pages, and an administrator-only completed-opportunity report), and `spec/contract/personas.yaml` with the six roles the domain distinguishes — anonymous visitor, vendor, public sector employee, administrator, and the per-opportunity evaluation-panel evaluator and chair, which are granted on one opportunity rather than globally. `spec/spec.md`'s opportunities section now points at the domain file instead of claiming there are no criteria.

**Where the sources disagreed.** Four places, and they are not all the same kind of disagreement. The application's README and its database-schema document describe a two-program service; the code carries a full third program, Team With Us, with its own routes, tables, statuses and evaluation panel. Those documents are simply stale, and I treated the code as authoritative while recording the gap. The interface description for Code With Us is stale in two smaller ways: it lists only two creation states where the code has accepted three since a migration added the awaiting-review state, and it says deletion requires a draft where the code also permits an administrator to delete one that is awaiting review. Those three I graded as code-with-a-stale-document.

The two genuine unresolved conflicts are different. First, the rule that decides which state changes are permitted omits processing-to-awarded for Team With Us alone, while the award path writes the awarded state directly and bypasses that rule — so awarding works, but the service's own definition of a legal transition says it should not. Either the omission is an oversight or the award path is, and nothing in the sources settles it; that is `D-opportunities-23`, graded open. Second, the screens hide editing of a published opportunity from anyone but an administrator, while the server accepts such an edit from the opportunity's own author — so the observable behaviour depends on whether the request arrives through the service's own pages; that is `D-opportunities-32`, also open.

I recorded one behaviour as a defect rather than as intent. The permission check for creating a Code With Us opportunity ignores the requested starting state, so a public sector employee who is not an administrator can create one that is already published — it becomes publicly visible and its subscribers are notified, with no administrator ever having approved it. The other two programs explicitly bar that at creation, and the publish action itself is administrator-only in all three. I proposed no replacement, because whether to close the hole at creation or to widen who may publish is a product decision, not a recovery one.

**What I could not determine.** Three things. The measure of "complete enough to publish" differs between programs in a way I could describe but not explain: Code With Us re-validates the whole posting at publication, while Sprint With Us validates at submission for review and explicitly declines to repeat the check at publication, on the stated assumption that review already covered it — nothing says whether an administrator editing an opportunity between those two points is meant to be able to publish something incomplete. The Team With Us maximum budget has no upper bound while the other two programs are capped at seventy thousand and five million dollars; I could find no statement anywhere of whether that asymmetry is deliberate. And the closing sweep is not a scheduled job at all — it is a throttled step that runs before handling incoming requests, so an opportunity closes on the first request that happens to arrive after its deadline rather than at the deadline; whether "closes at the deadline" or "closes on next traffic" is the intended behaviour is not recorded, and on a quiet service the difference is observable.

One process note for whoever picks this up: `spec/README.md`, named in my instructions as the grammar this file is checked against, does not exist in the repository. I followed the criterion format stated in `spec/spec.md`'s header — identifier, version, confidence, statement, citations, reconciliation class — extended with the origin and given/when/then fields the task required. If a parser expects something stricter, the domain file may need reshaping rather than rewriting; the content is field-per-line and uniform, and a structural check confirms all 48 blocks carry origin, reconciliation, given, when, then and at least one citation.

spec/domains/opportunities.md:20: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:21: expected a heading (### ID · vN · confidence · origin), got: The system shall offer three opportunity programs — Code With Us, Sprint With Us and Team With Us — and every opportunity shall belong to exactly one of them.
spec/domains/opportunities.md:23: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:24: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:25: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:26: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:27: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: cites: README.md:5
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:13
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: given: a person browsing the service
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: when: they open the opportunity list
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: then: opportunities of all three programs are listed, each labelled with its program, and no opportunity belongs to more than one program
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: note: The application's own README describes only Code With Us and Sprint With Us, and the database-schema document lists no Team With Us tables at all, while the code carries a complete third program with its own routes, statuses, resources and evaluation panel. Both documents are stale rather than describing a different intent; the code is treated as authoritative here, and the disagreement is recorded rather than resolved.
spec/domains/opportunities.md:35: malformed heading: ### D-opportunities-2 (v1) [confidence: confirmed]
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public state.
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:9
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has never been published
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a signed-in vendor asks for the opportunity list, or for that opportunity directly
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity does not appear in the list, and a direct request for it is answered as not found
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-3 (v1) [confidence: confirmed]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every public opportunity plus the unpublished opportunities they themselves created, and shall show an administrator every opportunity.
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: given: two unpublished opportunities, one created by public sector employee A and one by public sector employee B
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: when: employee A asks for the opportunity list
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: then: A's own unpublished opportunity is listed and B's is not, while an administrator making the same request sees both
spec/domains/opportunities.md:60: malformed heading: ### D-opportunities-4 (v1) [confidence: inferred]
spec/domains/opportunities.md:61: expected a heading (### ID · vN · confidence · origin), got: The system shall treat an opportunity as public once it has been published and thereafter — through every evaluation state, processing, award and cancellation — and shall treat it as private only while it is a draft or awaiting review.
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:130
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:124
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has been published and later cancelled
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor asks for it
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: then: it is still returned, showing its cancelled state
spec/domains/opportunities.md:72: malformed heading: ### D-opportunities-5 (v1) [confidence: inferred]
spec/domains/opportunities.md:73: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only public sector employees and administrators to create an opportunity, and shall refuse creation to vendors and to anyone not signed in.
spec/domains/opportunities.md:75: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:76: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:37
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: given: a signed-in vendor
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: when: they attempt to create an opportunity of any program
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: then: the attempt is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:85: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got: The system shall accept an opportunity created as a draft, as submitted for review, or as published, and shall reject any other requested starting state.
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:89: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:90: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:39
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:62
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:180
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:197
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: when: they ask for it to start in an awarded or cancelled state
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: then: the request is rejected with a validation error naming the state
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: note: The Sprint With Us interface document lists the three accepted starting states; the Code With Us document lists only draft and published, omitting the awaiting-review state that the code has accepted since the migration that introduced it. The Code With Us document is stale.
spec/domains/opportunities.md:99: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: The system shall save a draft opportunity without checking that its content is complete, filling any missing or invalid dates with a default two weeks ahead.
spec/domains/opportunities.md:102: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:412
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:363
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee with an empty opportunity form
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: when: they save it as a draft
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: then: the draft is created and is retrievable, with dates defaulted rather than rejected
spec/domains/opportunities.md:111: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:112: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity that is not a draft when any required field is missing or out of range, reporting the errors field by field.
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:295
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:588
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:413
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity to be published
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got: when: they omit the description and the location
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is not created and the response names the description and the location as the fields at fault
spec/domains/opportunities.md:123: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:124: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Code With Us reward between one dollar and seventy thousand dollars inclusive, a Sprint With Us total maximum budget between one dollar and five million dollars inclusive, and a Team With Us maximum budget of at least one dollar with no upper bound.
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:28
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:30
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:176
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing a Code With Us opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: when: they set the reward to eighty thousand dollars
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the reward is named as the field at fault
spec/domains/opportunities.md:136: expected a heading (### ID · vN · confidence · origin), got: note: The absence of an upper bound on the Team With Us budget is asymmetric with the other two programs. Nothing in the sources says whether that is deliberate; it is recorded as it stands.
spec/domains/opportunities.md:138: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: The system shall require the scoring weights of a Sprint With Us or Team With Us opportunity to total one hundred percent.
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:616
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:437
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:146: expected a heading (### ID · vN · confidence · origin), got: when: the four scoring weights total ninety percent
spec/domains/opportunities.md:147: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that the scoring weights must total one hundred percent
spec/domains/opportunities.md:149: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then assignment date, then start date, then completion date — with the proposal deadline no earlier than the day the opportunity is saved, and shall record each date at four in the afternoon.
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:157: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity
spec/domains/opportunities.md:158: expected a heading (### ID · vN · confidence · origin), got: when: they set an assignment date earlier than the proposal deadline
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the assignment date is named as the field at fault
spec/domains/opportunities.md:161: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall measure its new proposal deadline against the old deadline rather than against today, unless the opportunity is still a draft.
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:453
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:551
spec/domains/opportunities.md:169: expected a heading (### ID · vN · confidence · origin), got: given: a closed opportunity whose proposal deadline was last month
spec/domains/opportunities.md:170: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits it and leaves the deadline unchanged
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: then: the edit is accepted rather than rejected for having a deadline in the past
spec/domains/opportunities.md:173: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us opportunity that has an inception phase to also have a prototype phase, and shall require every phase to carry at least one required capability, a budget no greater than the opportunity's total, and dates that follow the preceding phase.
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:629
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:117
spec/domains/opportunities.md:180: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:97
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:182: expected a heading (### ID · vN · confidence · origin), got: when: they define an inception phase but no prototype phase
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that a prototype phase must follow an inception phase
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Team With Us opportunity to name one or more resources, each drawn from a fixed set of service areas and each with a target allocation between one and one hundred percent of full time.
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:239
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Team With Us opportunity
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: when: they name a resource in a service area the service does not offer
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and that resource is named as the item at fault
spec/domains/opportunities.md:197: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:198: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity to carry up to one hundred scored questions, each with a word limit of at most three thousand words and, where a minimum score is set, a minimum below the question's available score.
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:16
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:344
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:362
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:82
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee writing a question worth five points
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: when: they set the question's minimum score to five
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the minimum score is named as the field at fault
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall require the evaluation panel of a Sprint With Us or Team With Us opportunity to hold at least two members, all of them public sector employees, with no member listed twice and no more than one chair.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:431
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:511
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:32
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:34
spec/domains/opportunities.md:220: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee assembling an evaluation panel
spec/domains/opportunities.md:221: expected a heading (### ID · vN · confidence · origin), got: when: they name two chairs, or name a vendor as a panel member
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message naming the panel as the item at fault
spec/domains/opportunities.md:224: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity of any program.
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:632
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1354
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:760
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity awaiting review, created by a public sector employee
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got: when: that employee asks to publish it
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and the opportunity stays unpublished
spec/domains/opportunities.md:237: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: The system shall allow a public sector employee to submit their own draft opportunity for review, and shall refuse the submission if the opportunity's title, teaser, remote-work answer, location or description is incomplete.
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:241: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:242: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:705
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1354
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity with no description
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: then: the submission is refused with a message that the opportunity is incomplete and must be completed before it can be published
spec/domains/opportunities.md:248: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse a request from a public sector employee to create a Sprint With Us or Team With Us opportunity that is already published.
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:252: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:253: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: when: they create a Sprint With Us opportunity asking for it to start published
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:259: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: A public sector employee who is not an administrator can create a Code With Us opportunity that is already published, so that it becomes publicly visible and its subscribers are notified without any administrator having approved it.
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got: reconciliation: defect
spec/domains/opportunities.md:264: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:265: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:187
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:394
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: when: they create a Code With Us opportunity asking for it to start published
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is created in a published state and the publication notice is sent
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: note: This contradicts D-opportunities-17 and the equivalent rule the other two programs enforce at D-opportunities-19: the permission check for creating a Code With Us opportunity ignores the requested starting state, so the administrator-only publication rule can be bypassed at creation time. No replacement criterion is proposed, because whether the fix is to bar the state at creation or to widen who may publish is a decision for the people who own the service.
spec/domains/opportunities.md:272: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Code With Us opportunity only along the sequence draft, awaiting review, published, evaluation, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:275: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:276: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20231102143211_cwu-opp-under-review.ts:27
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts:28
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: given: a published Code With Us opportunity
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to draft
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays published
spec/domains/opportunities.md:284: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Sprint With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, code challenge, team scenario, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:288: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:289: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge state
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to question consensus
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays in the code challenge state
spec/domains/opportunities.md:294: malformed heading: ### D-opportunities-23 (v1) [confidence: open]
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Team With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, challenge, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:299: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:300: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:501
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: given: a Team With Us opportunity in the processing state
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards a proposal on it
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: note: The rule that decides which changes of state are permitted omits processing-to-awarded for Team With Us, although it permits exactly that change for the other two programs and although the same file elsewhere treats an awarded Team With Us opportunity as a normal outcome. Awarding still works, because the award path writes the new state directly instead of consulting that rule. Two readings are open: either the omission is an oversight and the award transition is intended, or awarding a Team With Us opportunity is meant to be barred and the award path is the defect. Nothing in the sources decides which.
spec/domains/opportunities.md:307: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity's proposal deadline passes, the system shall close it without anyone acting — moving it into its programme's first evaluation state, moving every submitted proposal on it into review, and telling the opportunity's author that it is ready for evaluation.
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:311: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:312: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/hooks/code-with-us.ts:20
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one submitted proposal and a proposal deadline that has just passed
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: when: no one takes any action
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is in its first evaluation state with a history note that it has closed, the proposal is under review, and the author has been sent a ready-for-evaluation notice
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: note: The closing sweep runs as a throttled step before handling requests rather than as a scheduled job, so an opportunity closes on the first request that arrives after its deadline, not at the deadline itself. On a service with no traffic, closure is deferred indefinitely.
spec/domains/opportunities.md:321: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: When every proposal still in contention on an opportunity has been evaluated, the system shall move the opportunity into processing without anyone acting, recording that it did so.
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:326: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:327: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation with three proposals still in contention, two of them already evaluated
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: when: the third is evaluated
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity moves to processing and its history shows that it was moved automatically because all proposals had been evaluated
spec/domains/opportunities.md:332: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: When a proposal on an opportunity is awarded, the system shall mark the opportunity as awarded and shall show the successful proponent on it.
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1159
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:339: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:340: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in processing with several proposals
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards one of them
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded and names the successful proponent, while the other proposals become not awarded
spec/domains/opportunities.md:344: malformed heading: ### D-opportunities-27 (v1) [confidence: confirmed]
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and shall tell the opportunity's author, its subscribers and everyone who has a proposal on it that it has been cancelled.
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:823
spec/domains/opportunities.md:351: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:352: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:96
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: when: an administrator cancels it with a reason
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is cancelled, remains publicly visible as cancelled, and the author, the subscriber and the proposal's author each receive a cancellation notice
spec/domains/opportunities.md:357: malformed heading: ### D-opportunities-28 (v1) [confidence: confirmed]
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an administrator, or the opportunity's own author, to publish an addendum to any opportunity that is no longer a draft, and shall keep every addendum with the time it was added.
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:363: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:403
spec/domains/opportunities.md:364: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:835
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:98
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: when: its author adds an addendum
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: then: the addendum appears on the opportunity for everyone who can see the opportunity, carrying the date it was added
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: note: The interface the service presents offers the addendum action only once an opportunity is public, while the rule the server applies also allows an addendum while an opportunity is merely awaiting review. The server is the more permissive of the two.
spec/domains/opportunities.md:371: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: The system shall tell an opportunity's subscribers, and everyone who has a proposal on it, whenever it is edited or gains an addendum, except while it is a draft or after it has been cancelled.
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:375: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:376: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:908
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its description
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: then: the subscriber, the proposal's author and the opportunity's author each receive an update notice
spec/domains/opportunities.md:383: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall tell every administrator that it is waiting for them and shall confirm the submission to the person who submitted it.
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:388: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:389: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:933
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: then: each administrator receives a notice that an opportunity is awaiting review, and the author receives a confirmation
spec/domains/opportunities.md:394: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall tell every user who has asked for opportunity notifications, and shall confirm the publication to the opportunity's author.
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:957
spec/domains/opportunities.md:401: expected a heading (### ID · vN · confidence · origin), got: given: a user who has turned opportunity notifications on, and an opportunity awaiting review
spec/domains/opportunities.md:402: expected a heading (### ID · vN · confidence · origin), got: when: an administrator publishes it
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: then: that user receives a new-opportunity notice and the opportunity's author receives a publication confirmation
spec/domains/opportunities.md:405: malformed heading: ### D-opportunities-32 (v1) [confidence: open]
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited while it is a draft or awaiting review, and once it is published shall allow only an administrator to edit them.
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity created by a public sector employee who is not an administrator
spec/domains/opportunities.md:415: expected a heading (### ID · vN · confidence · origin), got: when: that employee submits an edit to its description
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: then: unresolved — the interface does not offer them the action, but the server accepts the edit
spec/domains/opportunities.md:417: expected a heading (### ID · vN · confidence · origin), got: note: The interface hides editing of a published opportunity from anyone but an administrator, while the server permits the opportunity's own author to edit it in the published state. Which of the two expresses the intended rule cannot be told from the sources; the observable behaviour therefore depends on whether the request comes through the service's own screens.
spec/domains/opportunities.md:419: malformed heading: ### D-opportunities-33 (v1) [confidence: inferred]
spec/domains/opportunities.md:420: expected a heading (### ID · vN · confidence · origin), got: The system shall keep every version of an opportunity, recording an edit as a new version alongside a dated entry in the opportunity's history rather than overwriting what was there.
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:304
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:156
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its title twice
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity shows the latest title, and its history shows two separate edit entries with the times they were made
spec/domains/opportunities.md:431: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's history, and its counts of views, watchers and submitted proposals, only to an administrator or to the opportunity's own author, and shall show the counts only once the opportunity is public.
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:477
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with views, watchers and proposals
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got: when: a vendor asks for it, and then its author asks for it
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got: then: the vendor receives no history and no counts, and the author receives both
spec/domains/opportunities.md:442: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:443: expected a heading (### ID · vN · confidence · origin), got: The system shall hide who created and who last changed an opportunity from anyone who is neither an administrator nor one of those two people.
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a vendor asks for it
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is returned without naming the person who created or last changed it
spec/domains/opportunities.md:452: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, attach a private note with files to an opportunity's history at any point in its life.
spec/domains/opportunities.md:455: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: when: an administrator adds a note with an attached file
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: then: the note and its attachment appear in the opportunity's history, visible only to those who may see the history
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: note: The note action is absent from the published interface description, which lists only editing, publishing, cancelling and adding an addendum. It is implemented and reachable.
spec/domains/opportunities.md:464: malformed heading: ### D-opportunities-37 (v1) [confidence: confirmed]
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an unpublished opportunity to be deleted and shall refuse to delete one that has ever been published.
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to delete it
spec/domains/opportunities.md:475: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity remains
spec/domains/opportunities.md:476: expected a heading (### ID · vN · confidence · origin), got: note: The interface document says deletion requires the opportunity to be a draft. The code is wider in two ways: an administrator may also delete an opportunity that is awaiting review, and for Team With Us the author as well as an administrator may delete in either of those states, whereas for the other two programs an author may delete only their own draft. Whether the Team With Us difference is intended is not stated anywhere.
spec/domains/opportunities.md:478: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity so as to receive its updates, and shall refuse to let someone watch an opportunity they created themselves.
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:53
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:367
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee viewing an opportunity they created
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: when: they ask to watch it
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that they cannot subscribe to their own opportunity
spec/domains/opportunities.md:490: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got: The system shall count each viewing of an opportunity's public page and report that count among the opportunity's figures.
spec/domains/opportunities.md:493: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with no views
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor opens its page twice
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: then: the view count the author sees increases by two
spec/domains/opportunities.md:501: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: The system shall accept proposals on an opportunity only while it is published and its proposal deadline is still in the future.
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:146
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:139
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity whose proposal deadline has passed
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got: when: a vendor opens it
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is shown as closed and no submission is offered
spec/domains/opportunities.md:513: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:514: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity list into unpublished, open and closed opportunities, ordering open ones by the soonest proposal deadline first and closed ones by the most recently closed first.
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:195
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: given: several published opportunities with different proposal deadlines
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: when: a visitor opens the opportunity list
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: then: the open opportunities appear together with the one closing soonest at the top
spec/domains/opportunities.md:524: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: The system shall let a person narrow the opportunity list by programme, by state, to remote-friendly opportunities only, and by words in the title.
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:530: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:531: expected a heading (### ID · vN · confidence · origin), got: given: a list holding opportunities of all three programmes
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: when: a visitor narrows it to Code With Us
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: then: only Code With Us opportunities remain listed
spec/domains/opportunities.md:535: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has no title as "Untitled" wherever it is listed.
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:141
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity whose title has never been filled in
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got: when: its author opens the opportunity list
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: then: it is listed as "Untitled"
spec/domains/opportunities.md:546: malformed heading: ### D-opportunities-44 (v1) [confidence: inferred]
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity that is described as remote-friendly to also carry a description of its remote arrangements.
spec/domains/opportunities.md:549: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity marked as remote-friendly
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: when: they leave the remote description empty
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the remote description is named as the field at fault
spec/domains/opportunities.md:556: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's evaluation panel to be changed only while the opportunity is a draft, awaiting review, published, or in individual question evaluation, and shall tell members added to or removed from a panel that it has changed.
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:561: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
spec/domains/opportunities.md:562: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:585
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2216
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity that has reached question consensus
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to change its evaluation panel
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the panel stays as it was
spec/domains/opportunities.md:568: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity out of question consensus unless every consensus has been submitted and at least one proponent has met the minimum score on every question that sets one.
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
spec/domains/opportunities.md:574: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in question consensus where no proponent meets the minimum score on one of the questions
spec/domains/opportunities.md:575: expected a heading (### ID · vN · confidence · origin), got: when: the panel chair asks to finalise the consensus
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that at least one proponent must be able to be screened into the code challenge
spec/domains/opportunities.md:578: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity into team scenario evaluation unless every proponent still in the code challenge has been scored or disqualified, and at least one has been screened in.
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1593
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge with one unscored proponent
spec/domains/opportunities.md:585: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to start the team scenario
spec/domains/opportunities.md:586: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that all proponents must be scored first
spec/domains/opportunities.md:588: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: The system shall offer an administrator a single continuous report of a completed opportunity, gathering its details, summary, addenda, history and proposals in one page.
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/app/router.ts:741
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/complete/index.tsx:184
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: given: an awarded opportunity
spec/domains/opportunities.md:596: expected a heading (### ID · vN · confidence · origin), got: when: an administrator opens its complete report, and then a public sector employee tries the same
spec/domains/opportunities.md:597: expected a heading (### ID · vN · confidence · origin), got: then: the administrator sees the whole report on one page and the other person is refused access
spec/domains/opportunities.md:20: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:21: expected a heading (### ID · vN · confidence · origin), got: The system shall offer three opportunity programs — Code With Us, Sprint With Us and Team With Us — and every opportunity shall belong to exactly one of them.
spec/domains/opportunities.md:23: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:24: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:25: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:26: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:27: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: cites: README.md:5
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:13
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: given: a person browsing the service
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: when: they open the opportunity list
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: then: opportunities of all three programs are listed, each labelled with its program, and no opportunity belongs to more than one program
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: note: The application's own README describes only Code With Us and Sprint With Us, and the database-schema document lists no Team With Us tables at all, while the code carries a complete third program with its own routes, statuses, resources and evaluation panel. Both documents are stale rather than describing a different intent; the code is treated as authoritative here, and the disagreement is recorded rather than resolved.
spec/domains/opportunities.md:35: malformed heading: ### D-opportunities-2 (v1) [confidence: confirmed]
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public state.
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:9
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has never been published
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a signed-in vendor asks for the opportunity list, or for that opportunity directly
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity does not appear in the list, and a direct request for it is answered as not found
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-3 (v1) [confidence: confirmed]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every public opportunity plus the unpublished opportunities they themselves created, and shall show an administrator every opportunity.
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: given: two unpublished opportunities, one created by public sector employee A and one by public sector employee B
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: when: employee A asks for the opportunity list
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: then: A's own unpublished opportunity is listed and B's is not, while an administrator making the same request sees both
spec/domains/opportunities.md:60: malformed heading: ### D-opportunities-4 (v1) [confidence: inferred]
spec/domains/opportunities.md:61: expected a heading (### ID · vN · confidence · origin), got: The system shall treat an opportunity as public once it has been published and thereafter — through every evaluation state, processing, award and cancellation — and shall treat it as private only while it is a draft or awaiting review.
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:130
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:124
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has been published and later cancelled
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor asks for it
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: then: it is still returned, showing its cancelled state
spec/domains/opportunities.md:72: malformed heading: ### D-opportunities-5 (v1) [confidence: inferred]
spec/domains/opportunities.md:73: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only public sector employees and administrators to create an opportunity, and shall refuse creation to vendors and to anyone not signed in.
spec/domains/opportunities.md:75: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:76: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:37
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: given: a signed-in vendor
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: when: they attempt to create an opportunity of any program
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: then: the attempt is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:85: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got: The system shall accept an opportunity created as a draft, as submitted for review, or as published, and shall reject any other requested starting state.
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:89: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:90: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:39
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:62
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:180
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:197
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: when: they ask for it to start in an awarded or cancelled state
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: then: the request is rejected with a validation error naming the state
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: note: The Sprint With Us interface document lists the three accepted starting states; the Code With Us document lists only draft and published, omitting the awaiting-review state that the code has accepted since the migration that introduced it. The Code With Us document is stale.
spec/domains/opportunities.md:99: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: The system shall save a draft opportunity without checking that its content is complete, filling any missing or invalid dates with a default two weeks ahead.
spec/domains/opportunities.md:102: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:412
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:363
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee with an empty opportunity form
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: when: they save it as a draft
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: then: the draft is created and is retrievable, with dates defaulted rather than rejected
spec/domains/opportunities.md:111: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:112: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity that is not a draft when any required field is missing or out of range, reporting the errors field by field.
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:295
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:588
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:413
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity to be published
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got: when: they omit the description and the location
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is not created and the response names the description and the location as the fields at fault
spec/domains/opportunities.md:123: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:124: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Code With Us reward between one dollar and seventy thousand dollars inclusive, a Sprint With Us total maximum budget between one dollar and five million dollars inclusive, and a Team With Us maximum budget of at least one dollar with no upper bound.
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:28
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:30
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:176
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing a Code With Us opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: when: they set the reward to eighty thousand dollars
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the reward is named as the field at fault
spec/domains/opportunities.md:136: expected a heading (### ID · vN · confidence · origin), got: note: The absence of an upper bound on the Team With Us budget is asymmetric with the other two programs. Nothing in the sources says whether that is deliberate; it is recorded as it stands.
spec/domains/opportunities.md:138: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: The system shall require the scoring weights of a Sprint With Us or Team With Us opportunity to total one hundred percent.
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:616
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:437
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:146: expected a heading (### ID · vN · confidence · origin), got: when: the four scoring weights total ninety percent
spec/domains/opportunities.md:147: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that the scoring weights must total one hundred percent
spec/domains/opportunities.md:149: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then assignment date, then start date, then completion date — with the proposal deadline no earlier than the day the opportunity is saved, and shall record each date at four in the afternoon.
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:157: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity
spec/domains/opportunities.md:158: expected a heading (### ID · vN · confidence · origin), got: when: they set an assignment date earlier than the proposal deadline
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the assignment date is named as the field at fault
spec/domains/opportunities.md:161: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall measure its new proposal deadline against the old deadline rather than against today, unless the opportunity is still a draft.
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:453
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:551
spec/domains/opportunities.md:169: expected a heading (### ID · vN · confidence · origin), got: given: a closed opportunity whose proposal deadline was last month
spec/domains/opportunities.md:170: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits it and leaves the deadline unchanged
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: then: the edit is accepted rather than rejected for having a deadline in the past
spec/domains/opportunities.md:173: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us opportunity that has an inception phase to also have a prototype phase, and shall require every phase to carry at least one required capability, a budget no greater than the opportunity's total, and dates that follow the preceding phase.
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:629
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:117
spec/domains/opportunities.md:180: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:97
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:182: expected a heading (### ID · vN · confidence · origin), got: when: they define an inception phase but no prototype phase
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that a prototype phase must follow an inception phase
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Team With Us opportunity to name one or more resources, each drawn from a fixed set of service areas and each with a target allocation between one and one hundred percent of full time.
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:239
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Team With Us opportunity
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: when: they name a resource in a service area the service does not offer
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and that resource is named as the item at fault
spec/domains/opportunities.md:197: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:198: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity to carry up to one hundred scored questions, each with a word limit of at most three thousand words and, where a minimum score is set, a minimum below the question's available score.
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:16
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:344
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:362
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:82
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee writing a question worth five points
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: when: they set the question's minimum score to five
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the minimum score is named as the field at fault
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall require the evaluation panel of a Sprint With Us or Team With Us opportunity to hold at least two members, all of them public sector employees, with no member listed twice and no more than one chair.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:431
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:511
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:32
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:34
spec/domains/opportunities.md:220: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee assembling an evaluation panel
spec/domains/opportunities.md:221: expected a heading (### ID · vN · confidence · origin), got: when: they name two chairs, or name a vendor as a panel member
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message naming the panel as the item at fault
spec/domains/opportunities.md:224: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity of any program.
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:632
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1354
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:760
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity awaiting review, created by a public sector employee
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got: when: that employee asks to publish it
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and the opportunity stays unpublished
spec/domains/opportunities.md:237: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: The system shall allow a public sector employee to submit their own draft opportunity for review, and shall refuse the submission if the opportunity's title, teaser, remote-work answer, location or description is incomplete.
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:241: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:242: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:705
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1354
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity with no description
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: then: the submission is refused with a message that the opportunity is incomplete and must be completed before it can be published
spec/domains/opportunities.md:248: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse a request from a public sector employee to create a Sprint With Us or Team With Us opportunity that is already published.
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:252: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:253: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: when: they create a Sprint With Us opportunity asking for it to start published
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:259: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: A public sector employee who is not an administrator can create a Code With Us opportunity that is already published, so that it becomes publicly visible and its subscribers are notified without any administrator having approved it.
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got: reconciliation: defect
spec/domains/opportunities.md:264: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:265: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:187
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:394
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: when: they create a Code With Us opportunity asking for it to start published
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is created in a published state and the publication notice is sent
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: note: This contradicts D-opportunities-17 and the equivalent rule the other two programs enforce at D-opportunities-19: the permission check for creating a Code With Us opportunity ignores the requested starting state, so the administrator-only publication rule can be bypassed at creation time. No replacement criterion is proposed, because whether the fix is to bar the state at creation or to widen who may publish is a decision for the people who own the service.
spec/domains/opportunities.md:272: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Code With Us opportunity only along the sequence draft, awaiting review, published, evaluation, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:275: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:276: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20231102143211_cwu-opp-under-review.ts:27
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts:28
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: given: a published Code With Us opportunity
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to draft
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays published
spec/domains/opportunities.md:284: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Sprint With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, code challenge, team scenario, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:288: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:289: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge state
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to question consensus
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays in the code challenge state
spec/domains/opportunities.md:294: malformed heading: ### D-opportunities-23 (v1) [confidence: open]
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Team With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, challenge, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:299: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:300: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:501
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: given: a Team With Us opportunity in the processing state
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards a proposal on it
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: note: The rule that decides which changes of state are permitted omits processing-to-awarded for Team With Us, although it permits exactly that change for the other two programs and although the same file elsewhere treats an awarded Team With Us opportunity as a normal outcome. Awarding still works, because the award path writes the new state directly instead of consulting that rule. Two readings are open: either the omission is an oversight and the award transition is intended, or awarding a Team With Us opportunity is meant to be barred and the award path is the defect. Nothing in the sources decides which.
spec/domains/opportunities.md:307: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity's proposal deadline passes, the system shall close it without anyone acting — moving it into its programme's first evaluation state, moving every submitted proposal on it into review, and telling the opportunity's author that it is ready for evaluation.
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:311: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:312: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/hooks/code-with-us.ts:20
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one submitted proposal and a proposal deadline that has just passed
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: when: no one takes any action
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is in its first evaluation state with a history note that it has closed, the proposal is under review, and the author has been sent a ready-for-evaluation notice
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: note: The closing sweep runs as a throttled step before handling requests rather than as a scheduled job, so an opportunity closes on the first request that arrives after its deadline, not at the deadline itself. On a service with no traffic, closure is deferred indefinitely.
spec/domains/opportunities.md:321: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: When every proposal still in contention on an opportunity has been evaluated, the system shall move the opportunity into processing without anyone acting, recording that it did so.
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:326: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:327: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation with three proposals still in contention, two of them already evaluated
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: when: the third is evaluated
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity moves to processing and its history shows that it was moved automatically because all proposals had been evaluated
spec/domains/opportunities.md:332: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: When a proposal on an opportunity is awarded, the system shall mark the opportunity as awarded and shall show the successful proponent on it.
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1159
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:339: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:340: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in processing with several proposals
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards one of them
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded and names the successful proponent, while the other proposals become not awarded
spec/domains/opportunities.md:344: malformed heading: ### D-opportunities-27 (v1) [confidence: confirmed]
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and shall tell the opportunity's author, its subscribers and everyone who has a proposal on it that it has been cancelled.
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:823
spec/domains/opportunities.md:351: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:352: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:96
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: when: an administrator cancels it with a reason
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is cancelled, remains publicly visible as cancelled, and the author, the subscriber and the proposal's author each receive a cancellation notice
spec/domains/opportunities.md:357: malformed heading: ### D-opportunities-28 (v1) [confidence: confirmed]
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an administrator, or the opportunity's own author, to publish an addendum to any opportunity that is no longer a draft, and shall keep every addendum with the time it was added.
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:363: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:403
spec/domains/opportunities.md:364: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:835
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:98
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: when: its author adds an addendum
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: then: the addendum appears on the opportunity for everyone who can see the opportunity, carrying the date it was added
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: note: The interface the service presents offers the addendum action only once an opportunity is public, while the rule the server applies also allows an addendum while an opportunity is merely awaiting review. The server is the more permissive of the two.
spec/domains/opportunities.md:371: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: The system shall tell an opportunity's subscribers, and everyone who has a proposal on it, whenever it is edited or gains an addendum, except while it is a draft or after it has been cancelled.
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:375: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:376: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:908
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its description
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: then: the subscriber, the proposal's author and the opportunity's author each receive an update notice
spec/domains/opportunities.md:383: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall tell every administrator that it is waiting for them and shall confirm the submission to the person who submitted it.
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:388: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:389: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:933
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: then: each administrator receives a notice that an opportunity is awaiting review, and the author receives a confirmation
spec/domains/opportunities.md:394: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall tell every user who has asked for opportunity notifications, and shall confirm the publication to the opportunity's author.
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:957
spec/domains/opportunities.md:401: expected a heading (### ID · vN · confidence · origin), got: given: a user who has turned opportunity notifications on, and an opportunity awaiting review
spec/domains/opportunities.md:402: expected a heading (### ID · vN · confidence · origin), got: when: an administrator publishes it
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: then: that user receives a new-opportunity notice and the opportunity's author receives a publication confirmation
spec/domains/opportunities.md:405: malformed heading: ### D-opportunities-32 (v1) [confidence: open]
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited while it is a draft or awaiting review, and once it is published shall allow only an administrator to edit them.
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity created by a public sector employee who is not an administrator
spec/domains/opportunities.md:415: expected a heading (### ID · vN · confidence · origin), got: when: that employee submits an edit to its description
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: then: unresolved — the interface does not offer them the action, but the server accepts the edit
spec/domains/opportunities.md:417: expected a heading (### ID · vN · confidence · origin), got: note: The interface hides editing of a published opportunity from anyone but an administrator, while the server permits the opportunity's own author to edit it in the published state. Which of the two expresses the intended rule cannot be told from the sources; the observable behaviour therefore depends on whether the request comes through the service's own screens.
spec/domains/opportunities.md:419: malformed heading: ### D-opportunities-33 (v1) [confidence: inferred]
spec/domains/opportunities.md:420: expected a heading (### ID · vN · confidence · origin), got: The system shall keep every version of an opportunity, recording an edit as a new version alongside a dated entry in the opportunity's history rather than overwriting what was there.
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:304
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:156
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its title twice
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity shows the latest title, and its history shows two separate edit entries with the times they were made
spec/domains/opportunities.md:431: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's history, and its counts of views, watchers and submitted proposals, only to an administrator or to the opportunity's own author, and shall show the counts only once the opportunity is public.
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:477
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with views, watchers and proposals
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got: when: a vendor asks for it, and then its author asks for it
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got: then: the vendor receives no history and no counts, and the author receives both
spec/domains/opportunities.md:442: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:443: expected a heading (### ID · vN · confidence · origin), got: The system shall hide who created and who last changed an opportunity from anyone who is neither an administrator nor one of those two people.
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a vendor asks for it
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is returned without naming the person who created or last changed it
spec/domains/opportunities.md:452: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, attach a private note with files to an opportunity's history at any point in its life.
spec/domains/opportunities.md:455: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: when: an administrator adds a note with an attached file
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: then: the note and its attachment appear in the opportunity's history, visible only to those who may see the history
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: note: The note action is absent from the published interface description, which lists only editing, publishing, cancelling and adding an addendum. It is implemented and reachable.
spec/domains/opportunities.md:464: malformed heading: ### D-opportunities-37 (v1) [confidence: confirmed]
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an unpublished opportunity to be deleted and shall refuse to delete one that has ever been published.
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to delete it
spec/domains/opportunities.md:475: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity remains
spec/domains/opportunities.md:476: expected a heading (### ID · vN · confidence · origin), got: note: The interface document says deletion requires the opportunity to be a draft. The code is wider in two ways: an administrator may also delete an opportunity that is awaiting review, and for Team With Us the author as well as an administrator may delete in either of those states, whereas for the other two programs an author may delete only their own draft. Whether the Team With Us difference is intended is not stated anywhere.
spec/domains/opportunities.md:478: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity so as to receive its updates, and shall refuse to let someone watch an opportunity they created themselves.
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:53
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:367
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee viewing an opportunity they created
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: when: they ask to watch it
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that they cannot subscribe to their own opportunity
spec/domains/opportunities.md:490: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got: The system shall count each viewing of an opportunity's public page and report that count among the opportunity's figures.
spec/domains/opportunities.md:493: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with no views
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor opens its page twice
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: then: the view count the author sees increases by two
spec/domains/opportunities.md:501: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: The system shall accept proposals on an opportunity only while it is published and its proposal deadline is still in the future.
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:146
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:139
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity whose proposal deadline has passed
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got: when: a vendor opens it
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is shown as closed and no submission is offered
spec/domains/opportunities.md:513: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:514: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity list into unpublished, open and closed opportunities, ordering open ones by the soonest proposal deadline first and closed ones by the most recently closed first.
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:195
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: given: several published opportunities with different proposal deadlines
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: when: a visitor opens the opportunity list
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: then: the open opportunities appear together with the one closing soonest at the top
spec/domains/opportunities.md:524: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: The system shall let a person narrow the opportunity list by programme, by state, to remote-friendly opportunities only, and by words in the title.
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:530: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:531: expected a heading (### ID · vN · confidence · origin), got: given: a list holding opportunities of all three programmes
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: when: a visitor narrows it to Code With Us
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: then: only Code With Us opportunities remain listed
spec/domains/opportunities.md:535: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has no title as "Untitled" wherever it is listed.
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:141
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity whose title has never been filled in
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got: when: its author opens the opportunity list
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: then: it is listed as "Untitled"
spec/domains/opportunities.md:546: malformed heading: ### D-opportunities-44 (v1) [confidence: inferred]
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity that is described as remote-friendly to also carry a description of its remote arrangements.
spec/domains/opportunities.md:549: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity marked as remote-friendly
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: when: they leave the remote description empty
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the remote description is named as the field at fault
spec/domains/opportunities.md:556: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's evaluation panel to be changed only while the opportunity is a draft, awaiting review, published, or in individual question evaluation, and shall tell members added to or removed from a panel that it has changed.
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:561: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
spec/domains/opportunities.md:562: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:585
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2216
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity that has reached question consensus
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to change its evaluation panel
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the panel stays as it was
spec/domains/opportunities.md:568: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity out of question consensus unless every consensus has been submitted and at least one proponent has met the minimum score on every question that sets one.
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
spec/domains/opportunities.md:574: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in question consensus where no proponent meets the minimum score on one of the questions
spec/domains/opportunities.md:575: expected a heading (### ID · vN · confidence · origin), got: when: the panel chair asks to finalise the consensus
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that at least one proponent must be able to be screened into the code challenge
spec/domains/opportunities.md:578: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity into team scenario evaluation unless every proponent still in the code challenge has been scored or disqualified, and at least one has been screened in.
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1593
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge with one unscored proponent
spec/domains/opportunities.md:585: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to start the team scenario
spec/domains/opportunities.md:586: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that all proponents must be scored first
spec/domains/opportunities.md:588: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: The system shall offer an administrator a single continuous report of a completed opportunity, gathering its details, summary, addenda, history and proposals in one page.
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/app/router.ts:741
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/complete/index.tsx:184
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: given: an awarded opportunity
spec/domains/opportunities.md:596: expected a heading (### ID · vN · confidence · origin), got: when: an administrator opens its complete report, and then a public sector employee tries the same
spec/domains/opportunities.md:597: expected a heading (### ID · vN · confidence · origin), got: then: the administrator sees the whole report on one page and the other person is refused access
spec/domains/opportunities.md has no criteria

## 004 · archaeology · 2026-09-07

cost $0 · turns 0

I've finished. Here is my journal entry.

---

## What the opportunities domain does

The opportunities domain is where a public sector employee writes up a piece of procurement work, gets it approved and published, and then walks it through evaluation to an award. It covers three programs — Code With Us (a fixed-price posting for a single deliverable, capped at $70,000), Sprint With Us (an agile team engagement in phases, capped at $5,000,000) and Team With Us (individual resources drawn from five named service areas, billed on time and materials) — which share one lifecycle skeleton but differ in their fields, their evaluation stages and their scoring rules. An opportunity is never overwritten: each edit writes a new version, and a parallel chain of status and event records is what the history page reads, so who changed what and when survives publication.

The recovered rules fall into four groups: **who can see it** (anonymous visitors and vendors get public statuses only; a public sector employee also gets their own drafts; an administrator gets everything; on the two newer programs an evaluation panel member also gets the unpublished opportunity they are assigned to), **who can move it** (creation is open to any public sector employee, but publication and cancellation are administrator-only — an ordinary author submits for review instead), **what makes a submission valid** (field lengths, a date chain that must run deadline → assignment → start → completion with everything pinned to 4pm Pacific, at least one skill, scoring weights summing to exactly 100 percent, an evaluation panel of at least two public sector employees with at most one chair), and **what happens without anyone acting** (a lapsed deadline moves the opportunity into evaluation and its submitted proposals into review; a fully-scored evaluation moves it to processing; awarding a proposal moves it to awarded and marks the rest not awarded).

I wrote 56 criteria to `spec/domains/opportunities.md`, appended 14 pages to `spec/contract/surface.yaml` under `domain: opportunities`, and added six roles to `spec/contract/personas.yaml`.

## What conflicted between the sources

The shipped prose is a version or two behind the shipped code, consistently in the same direction — it predates Team With Us. The README describes the service as administering two programs; `docs/database-schema.md` documents no Team With Us tables at all; and `src/back-end/docs/` carries OpenAPI files for Code With Us and Sprint With Us opportunities but none for Team With Us, even though that resource is registered in the router alongside the other two. The Code With Us OpenAPI file also documents only two creatable statuses (draft and published) and four update actions, where the code has accepted under-review since a 2023 migration and offers six actions. And it says deletion "will fail if the Opportunity is not in Draft or has previously been published" — the code never looks at whether an opportunity was previously published, only at its current status, and it additionally lets an administrator delete an under-review opportunity.

Two conflicts are internal to the code rather than between code and docs, and those are the more interesting ones. The first is about editing a published opportunity: the front-end withholds the edit unless the viewer is an administrator, while the permission the request is actually checked against allows the opportunity's public sector author too. The restriction is presentational only, and I could not determine which layer states the intent, so I recorded it as `open` / `conflicting` rather than picking a side. The second is the three programs disagreeing with each other about creation: Sprint With Us and Team With Us both refuse a non-administrator who asks to create an opportunity directly in the published status, and Code With Us does not check the status at all — so a Code With Us opportunity can be created as published by someone who would be refused if they tried to publish that same opportunity a second later. The interface never offers it, so it is reachable only by calling the API directly.

## What I could not determine

Three things I deliberately left open rather than resolving:

Whether the divergences between programs are intent or drift. Team With Us has no upper bound on its maximum budget where the other two are capped; its history records carry no attachments where the others do; its transition table omits processing-to-awarded, which awarding bypasses anyway by writing the status directly; and its delete permission checks no status, so an author can delete their own opportunity after submitting it for review, which the other two forbid. Each of these is a single-program difference with no comment, no migration note and no documentation explaining it. Read one way they are three deliberate product choices; read another they are an unfinished port of the newest program. The code cannot settle it and I did not guess — they are recorded as `defect` or carry a `note` saying a human has to rule.

Why the listing's status filter is missing two of its statuses. It offers draft, under review, published, evaluation and awarded — so a cancelled or processing opportunity vanishes the moment any status filter is applied. I could not tell whether the fix is to add the two missing choices or to change what the existing choices match, so I wrote no replacement criterion.

The intended timing of the deadline transition. It is not a scheduled job. It runs as a throttled hook before handling an incoming request, and it is deliberately attached to the status endpoint so a health probe keeps it firing when nothing else does. On an idle system an opportunity stays published past its deadline. Whether that is acceptable behaviour to carry forward or an artefact of not having a scheduler available is a product question, and I flagged it as one because a scheduled job and a request hook are not observationally equivalent under low traffic.

One process note for whoever runs this stage next: the instructions point at `spec/README.md` for the exact criterion grammar, and no such file exists in the repository. I wrote against the format declared at the top of `spec/spec.md` instead, extended with the `origin` / `cites` / `reconciliation` / given-when-then fields this stage is required to record, and said so in a header block at the top of the domain file. If a checker is validating against a grammar defined somewhere I could not see, that file is the thing to reconcile first.

spec/domains/opportunities.md:27: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: The system shall publish procurement opportunities under exactly three programs — Code With
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: Us, Sprint With Us and Team With Us — each with its own creation form, its own detail page
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: and its own set of statuses.
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:77
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:105
spec/domains/opportunities.md:34: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:160
spec/domains/opportunities.md:35: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: aligned
spec/domains/opportunities.md:37: expected a heading (### ID · vN · confidence · origin), got: - given: a visitor on the "create an opportunity" page
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: - when: the page is displayed
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: - then: three programs are offered, each with a guide link and a "get started" link to its
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got:   own creation form
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: - note: the shipped prose disagrees with the shipped code. `README.md:5` describes the
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got:   service as administering "Code With Us and Sprint With Us"; `docs/database-schema.md`
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got:   documents no Team With Us tables at all; and `src/back-end/docs/` carries OpenAPI files
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got:   for the Code With Us and Sprint With Us opportunity endpoints but none for Team With Us,
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got:   although the Team With Us resource is registered in the router. Three programs is what the
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got:   code does; the documentation is stale on all three counts.
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-2 (v1) [confidence: inferred]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall record an opportunity as a chain of immutable versions with a separate
spec/domains/opportunities.md:50: expected a heading (### ID · vN · confidence · origin), got: chain of status and event records, so that every change to a published opportunity leaves a
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: history entry rather than overwriting the previous content.
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: - cites: docs/database-schema.md:156
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity that has been edited twice
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens its history
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: - then: the history shows one entry per edit, in addition to the entries for each status
spec/domains/opportunities.md:59: expected a heading (### ID · vN · confidence · origin), got:   change, and the opportunity displays the most recent version's content
spec/domains/opportunities.md:61: malformed heading: ### D-opportunities-3 (v1) [confidence: inferred]
spec/domains/opportunities.md:62: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has never been given a title as "Untitled" in
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: listings and headings.
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:150
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with an empty title
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: - when: its author opens the opportunity listing
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity appears with the title "Untitled"
spec/domains/opportunities.md:72: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:74: expected a heading (### ID · vN · confidence · origin), got: ## Who may see what
spec/domains/opportunities.md:76: malformed heading: ### D-opportunities-4 (v1) [confidence: confirmed]
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public status,
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: both in the listing and when a single opportunity is requested by its identifier.
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:84: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity and a published opportunity
spec/domains/opportunities.md:85: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor opens the opportunity listing, and then requests the draft
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got:   opportunity's address directly
spec/domains/opportunities.md:87: expected a heading (### ID · vN · confidence · origin), got: - then: the listing shows only the published opportunity, and the direct request is answered
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got:   as not found
spec/domains/opportunities.md:90: malformed heading: ### D-opportunities-5 (v1) [confidence: confirmed]
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every opportunity in a public status plus the
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: unpublished opportunities they authored, and no other unpublished opportunity.
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:98: expected a heading (### ID · vN · confidence · origin), got: - given: two public sector employees, each with one draft opportunity
spec/domains/opportunities.md:99: expected a heading (### ID · vN · confidence · origin), got: - when: the first opens the opportunity listing
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: - then: their own draft is listed and the other employee's draft is not
spec/domains/opportunities.md:102: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: The system shall show an administrator every opportunity regardless of status.
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:406
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:626
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: - given: draft opportunities authored by several different public sector employees
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens the opportunity listing
spec/domains/opportunities.md:110: expected a heading (### ID · vN · confidence · origin), got: - then: all of them are listed
spec/domains/opportunities.md:112: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:113: expected a heading (### ID · vN · confidence · origin), got: For Sprint With Us and Team With Us, the system shall additionally let a member of an
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: opportunity's evaluation panel open that opportunity while it is still unpublished, even
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: when they did not author it.
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:793
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: - given: a draft Sprint With Us opportunity whose evaluation panel includes a public sector
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got:   employee who is not its author
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: - when: that panel member requests the opportunity
spec/domains/opportunities.md:122: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is shown to them
spec/domains/opportunities.md:123: expected a heading (### ID · vN · confidence · origin), got: - note: Code With Us has no evaluation panel and so no equivalent rule.
spec/domains/opportunities.md:125: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: The system shall offer a way to list only the opportunities on whose evaluation panel the
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: requesting public sector employee sits, and when that view is requested it shall exclude
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: every other opportunity, including public ones.
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:172
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:640
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: - given: a panel member who also authored an unrelated published opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: - when: they request the panel-member view of the listing
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: - then: only the opportunities they sit on a panel for are returned
spec/domains/opportunities.md:137: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:138: expected a heading (### ID · vN · confidence · origin), got: The system shall withhold the identity of an opportunity's author and last editor from every
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: viewer except an administrator, the author, and the last editor.
spec/domains/opportunities.md:140: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor views it
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: - then: no author or editor name is shown
spec/domains/opportunities.md:147: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:148: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's change history only to an administrator or the
spec/domains/opportunities.md:149: expected a heading (### ID · vN · confidence · origin), got: opportunity's author.
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:151: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:478
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with several status changes
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor and then the author view it
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: - then: the vendor sees no history and the author sees the full list of status changes and
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got:   events
spec/domains/opportunities.md:158: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's reporting figures — number of views, number of
spec/domains/opportunities.md:160: expected a heading (### ID · vN · confidence · origin), got: watchers, number of submitted proposals — only to an administrator or the author, and only
spec/domains/opportunities.md:161: expected a heading (### ID · vN · confidence · origin), got: once the opportunity has reached a public status.
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:163: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with two submitted proposals
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: - when: the author views it
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: - then: the view count, watcher count and proposal count are shown; a vendor viewing the
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got:   same opportunity sees none of them
spec/domains/opportunities.md:170: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: The system shall count one additional view of an opportunity each time its detail page is
spec/domains/opportunities.md:172: expected a heading (### ID · vN · confidence · origin), got: opened.
spec/domains/opportunities.md:173: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:175: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/counter.ts
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose reported view count is a known number
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: - when: any visitor opens its detail page
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: - then: the view count reported to the author increases by one
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: ## Listing, sorting and filtering
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity listing into three sections — unpublished, open and
spec/domains/opportunities.md:187: expected a heading (### ID · vN · confidence · origin), got: closed — where open means published with a proposal deadline still in the future, closed
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: means published-or-later with the deadline passed or the opportunity no longer accepting
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: proposals, and unpublished means draft or under review.
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: - given: one draft, one published opportunity with a future deadline, and one awarded
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got:   opportunity
spec/domains/opportunities.md:196: expected a heading (### ID · vN · confidence · origin), got: - when: the author opens the listing
spec/domains/opportunities.md:197: expected a heading (### ID · vN · confidence · origin), got: - then: each appears in the unpublished, open and closed section respectively
spec/domains/opportunities.md:199: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: The system shall order open opportunities by soonest proposal deadline first, closed
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: opportunities by most recently passed deadline first, and unpublished opportunities by most
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: recently changed first.
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:194
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: - given: three open opportunities with deadlines a week apart
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor opens the listing
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: - then: they appear in ascending order of deadline
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall let a visitor narrow the opportunity listing by program, by status, to
spec/domains/opportunities.md:212: expected a heading (### ID · vN · confidence · origin), got: remote-friendly opportunities only, and by a text search matched against title and location.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: - given: opportunities across all three programs, some remote-friendly
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects the Code With Us program and ticks the remote-only option
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: - then: only remote-friendly Code With Us opportunities remain listed
spec/domains/opportunities.md:221: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: The status filter on the opportunity listing shall offer a choice for every status an
spec/domains/opportunities.md:223: expected a heading (### ID · vN · confidence · origin), got: opportunity can hold.
spec/domains/opportunities.md:224: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:60
spec/domains/opportunities.md:226: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:346
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity and an opportunity in the processing status
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects any value in the status filter
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: - then: neither opportunity can be brought back into view by any filter choice, because the
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got:   filter offers only draft, under review, published, evaluation and awarded
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: - note: this is written as the intended behaviour, not as the recovered behaviour. The
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got:   recovered behaviour is that cancelled and processing opportunities are silently excluded
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got:   whenever a status filter is applied. There is no replacement criterion because whether the
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got:   fix is to add the two missing choices or to change what the existing choices match is a
spec/domains/opportunities.md:236: expected a heading (### ID · vN · confidence · origin), got:   product decision, not something the code settles.
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: ## Creating an opportunity
spec/domains/opportunities.md:242: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator or a public sector employee to create an
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: opportunity, and shall refuse the attempt for a vendor or an anonymous visitor.
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:247: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:75
spec/domains/opportunities.md:248: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor
spec/domains/opportunities.md:250: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to create an opportunity
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused and no opportunity is created
spec/domains/opportunities.md:253: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is saved as a draft, the system shall accept it without checking any
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: field other than its attachments, and shall stand in a date fourteen days from now wherever
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: a required date is missing or invalid.
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:258: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:259: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee filling in the creation form
spec/domains/opportunities.md:261: expected a heading (### ID · vN · confidence · origin), got: - when: they save a draft with no title, no description and no dates
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: - then: the draft is created, and its proposal, assignment and start dates are set two weeks
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got:   from today
spec/domains/opportunities.md:265: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review or published rather than saved as a draft, the
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: system shall reject it unless every required field is valid, and shall say which fields are
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: at fault.
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:276
spec/domains/opportunities.md:271: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:272: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity form with an empty description
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: - when: the author submits it for review
spec/domains/opportunities.md:274: expected a heading (### ID · vN · confidence · origin), got: - then: the submission is rejected and the description field is reported as invalid
spec/domains/opportunities.md:276: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity whose title is empty or longer than 200 characters,
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: whose teaser is longer than 500 characters, whose description is empty or longer than 10,000
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: characters, or whose location is empty.
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:89
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:137
spec/domains/opportunities.md:283: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:147
spec/domains/opportunities.md:284: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:286: expected a heading (### ID · vN · confidence · origin), got: - when: its title is 201 characters long
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message naming the title
spec/domains/opportunities.md:289: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is marked as open to remote work, the system shall require a description
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: of the remote arrangement; when it is not, the description may be left empty. In both cases
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: the description shall be at most 500 characters.
spec/domains/opportunities.md:293: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:294: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:296: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity marked remote-friendly with an empty remote description
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:300: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: The system shall require at least one skill on a Code With Us opportunity and at least one
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: mandatory skill on a Sprint With Us or Team With Us opportunity, shall limit each skill to
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: 100 characters, and shall silently discard duplicate skills.
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:53
spec/domains/opportunities.md:306: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:56
spec/domains/opportunities.md:307: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published with no skills listed
spec/domains/opportunities.md:309: expected a heading (### ID · vN · confidence · origin), got: - when: it is submitted
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message asking for at least one skill
spec/domains/opportunities.md:312: malformed heading: ### D-opportunities-23 (v1) [confidence: inferred]
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: The system shall cap a Code With Us reward at $70,000 and require it to be at least $1, and
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: shall cap a Sprint With Us total budget at $5,000,000 and require it to be at least $1.
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:28
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:320: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity with a reward of $70,001
spec/domains/opportunities.md:321: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:323: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us has no upper limit on its maximum budget — only a lower bound of $1
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got:   (`src/shared/lib/validation/opportunity/team-with-us.ts:176`). Whether the absent cap is
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got:   deliberate or an oversight cannot be settled from the code.
spec/domains/opportunities.md:327: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: assignment date, then start date, then completion date — with the proposal deadline no
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: earlier than today, and shall record every one of them at 4pm Pacific time on the chosen day.
spec/domains/opportunities.md:331: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:332: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:334: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:26
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: - when: its assignment date is set earlier than its proposal deadline
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:340: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: measure the new proposal deadline against the old deadline rather than against today, so
spec/domains/opportunities.md:343: expected a heading (### ID · vN · confidence · origin), got: that a closed opportunity can be re-dated without the deadline having to be in the future.
spec/domains/opportunities.md:344: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:346: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:543
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose deadline passed a month ago and which is no longer published
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it and sets a deadline three weeks ago
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is accepted
spec/domains/opportunities.md:352: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: The system shall require the four Sprint With Us scoring weights (team questions, code
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: challenge, team scenario, price) to total exactly 100 percent, and likewise the three Team
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: With Us weights (resource questions, challenge, price).
spec/domains/opportunities.md:356: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:357: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:615
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:436
spec/domains/opportunities.md:359: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity whose weights total 90 percent
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying the weights must total 100 percent
spec/domains/opportunities.md:364: malformed heading: ### D-opportunities-27 (v1) [confidence: inferred]
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: The system shall not accept a Sprint With Us opportunity that defines an inception phase
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: without also defining a prototype phase; the implementation phase is always required.
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:628
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:206
spec/domains/opportunities.md:370: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:371: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity with an inception phase and an implementation phase
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: - when: it is published without a prototype phase
spec/domains/opportunities.md:373: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying a prototype phase must follow an
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got:   inception phase
spec/domains/opportunities.md:376: malformed heading: ### D-opportunities-28 (v1) [confidence: inferred]
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us or Team With Us evaluation panel to have at least
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: two members, at most one chair, no member listed twice, and every member a public sector
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: employee.
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:382: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:429
spec/domains/opportunities.md:383: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:32
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:385: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity being published
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: - when: its evaluation panel names two chairs
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying only a single chair may be specified
spec/domains/opportunities.md:389: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: The system shall let a Team With Us opportunity request one or more resources, each drawn
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: from a fixed list of five service areas — full stack developer, data professional, agile
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: coach, devops specialist, service designer — with a target allocation between 1 and 100
spec/domains/opportunities.md:393: expected a heading (### ID · vN · confidence · origin), got: percent of full time.
spec/domains/opportunities.md:394: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:396: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: - when: a resource is added with a target allocation of 120 percent
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:402: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: The system shall allow at most 100 evaluation questions on a Sprint With Us or Team With Us
spec/domains/opportunities.md:404: expected a heading (### ID · vN · confidence · origin), got: opportunity, each with a word limit between 1 and 3,000 words, an available score of at
spec/domains/opportunities.md:405: expected a heading (### ID · vN · confidence · origin), got: least 1, and — where a minimum passing score is set — a minimum strictly below the available
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: score.
spec/domains/opportunities.md:407: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:14
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:78
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:100
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us question worth 5 points
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: - when: its minimum passing score is set to 5
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:418: expected a heading (### ID · vN · confidence · origin), got: ## Publishing, and the status lifecycle
spec/domains/opportunities.md:420: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:421: expected a heading (### ID · vN · confidence · origin), got: Every opportunity shall hold exactly one status at a time, drawn from its programme's set:
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: Code With Us — draft, under review, published, evaluation, processing, awarded, cancelled;
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: Sprint With Us — draft, under review, published, individual team-question evaluation,
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: team-question consensus, code challenge, team scenario, processing, awarded, cancelled; Team
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: With Us — draft, under review, published, individual resource-question evaluation,
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: resource-question consensus, challenge, processing, awarded, cancelled.
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:430: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:431: expected a heading (### ID · vN · confidence · origin), got: - cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:433: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in any program
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: - when: its status is read
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: - then: it is one of the values listed for that program
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: - note: each program also defines a "suspended" status marked deprecated in the code. No
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got:   transition reaches it and nothing sets it, so it exists only for records written by an
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got:   earlier version of the application. The Code With Us OpenAPI file
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got:   (`src/back-end/docs/opportunities/code-with-us.yaml:180`) documents the creatable statuses
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got:   as draft and published only, omitting under review, which the code has accepted since the
spec/domains/opportunities.md:441: expected a heading (### ID · vN · confidence · origin), got:   migration at `src/migrations/tasks/20231102143211_cwu-opp-under-review.ts`.
spec/domains/opportunities.md:443: malformed heading: ### D-opportunities-32 (v1) [confidence: inferred]
spec/domains/opportunities.md:444: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity; a public sector
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: employee shall instead submit it for review, moving it to the under-review status.
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:347
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity authored by a public sector employee
spec/domains/opportunities.md:451: expected a heading (### ID · vN · confidence · origin), got: - when: the author acts on it
spec/domains/opportunities.md:452: expected a heading (### ID · vN · confidence · origin), got: - then: the action offered is "submit for review", and the opportunity moves to under review
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got:   rather than published
spec/domains/opportunities.md:455: malformed heading: ### D-opportunities-33 (v1) [confidence: open]
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: When creating an opportunity, the system shall refuse a public sector employee who is not an
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: administrator the ability to create it directly in the published status.
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:463: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in public sector employee who is not an administrator
spec/domains/opportunities.md:464: expected a heading (### ID · vN · confidence · origin), got: - when: they create a Code With Us opportunity with the published status
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused
spec/domains/opportunities.md:466: expected a heading (### ID · vN · confidence · origin), got: - note: this is the Sprint With Us and Team With Us behaviour, where the create permission
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got:   takes the requested status and refuses `PUBLISHED` for a non-administrator. The Code With
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got:   Us create permission takes no status at all and permits any public sector employee, so a
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got:   Code With Us opportunity can be created directly as published by a user who would not be
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got:   allowed to publish that same opportunity a moment later. The user interface never offers
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got:   this, so it is reachable only by calling the interface directly. Marked `open` because the
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got:   three programs contradict each other and nothing in the code or documentation says which
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got:   is intended; the correction stated here assumes the two-of-three behaviour is the rule and
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got:   Code With Us is the omission, which needs a human ruling.
spec/domains/opportunities.md:476: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:477: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to submit for review or to publish an opportunity that is
spec/domains/opportunities.md:478: expected a heading (### ID · vN · confidence · origin), got: incomplete, and shall say that the opportunity must be completed and saved before it can be
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: published again.
spec/domains/opportunities.md:480: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:714
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:764
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with no description
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused with a message saying the opportunity is incomplete
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: - note: the completeness check applied when submitting for review is narrower than the one
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got:   applied when publishing — it checks title, teaser, remote flag, remote description,
spec/domains/opportunities.md:489: expected a heading (### ID · vN · confidence · origin), got:   location and description, while publishing additionally checks reward, skills, submission
spec/domains/opportunities.md:490: expected a heading (### ID · vN · confidence · origin), got:   information, acceptance criteria and evaluation criteria. A Code With Us opportunity can
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got:   therefore pass review submission and still be refused at publication.
spec/domains/opportunities.md:493: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: The system shall permit only these status moves: from draft to under review or published;
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: from under review to published; from published to cancelled or to the program's first
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: evaluation stage; through the program's evaluation stages in order, each also able to move
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: to cancelled; from the last evaluation stage to processing; and from processing to awarded
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: or cancelled.
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:500: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:501: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:503: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: - when: any actor attempts to move it back to published
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: - then: the move is refused
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: - note: the Team With Us transition table omits processing-to-awarded, which its Code With
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got:   Us and Sprint With Us counterparts both list. Awarding a Team With Us opportunity still
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got:   works, because awarding writes the awarded status directly rather than going through the
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got:   transition check (`src/back-end/lib/db/proposal/team-with-us.ts:1460`). The omission is
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got:   therefore latent rather than visible, but it means the two paths to the awarded status
spec/domains/opportunities.md:512: expected a heading (### ID · vN · confidence · origin), got:   disagree about whether it is legal.
spec/domains/opportunities.md:514: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:515: expected a heading (### ID · vN · confidence · origin), got: When an opportunity's proposal deadline passes, the system shall move it out of the published
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: status into the program's first evaluation stage, move every submitted proposal on it into
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: review, and notify the author that the opportunity is ready for evaluation.
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:523: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one submitted proposal and a deadline one minute ago
spec/domains/opportunities.md:524: expected a heading (### ID · vN · confidence · origin), got: - when: the deadline has passed
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is in evaluation, the proposal is under review, and the author has
spec/domains/opportunities.md:526: expected a heading (### ID · vN · confidence · origin), got:   been notified
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: - note: for Sprint With Us and Team With Us this transition also assigns each submitted
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got:   proposal an anonymous name of the form "Proponent 1", "Proponent 2" and so on. Code With
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got:   Us does not anonymise.
spec/domains/opportunities.md:531: malformed heading: ### D-opportunities-37 (v1) [confidence: inferred]
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: The deadline transition shall be driven by incoming traffic rather than by a clock: it runs
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: before handling a request, at most once per throttle window, so an opportunity whose
spec/domains/opportunities.md:534: expected a heading (### ID · vN · confidence · origin), got: deadline has passed stays published until the next request arrives.
spec/domains/opportunities.md:535: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/hooks/code-with-us.ts:17
spec/domains/opportunities.md:537: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:196
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:256
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity whose deadline has just passed and an idle application
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: - when: no request is made
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity remains published; it moves to evaluation on the first request that
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got:   arrives after the throttle window elapses
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: - note: the same check is attached to the status endpoint specifically so that a health
spec/domains/opportunities.md:545: expected a heading (### ID · vN · confidence · origin), got:   probe keeps it running when nothing else does. This is a property a rebuild has to decide
spec/domains/opportunities.md:546: expected a heading (### ID · vN · confidence · origin), got:   about deliberately — a scheduled job and a request hook are not observationally
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got:   equivalent when traffic is low.
spec/domains/opportunities.md:549: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: When every active proposal on an opportunity has been evaluated at the final evaluation
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: stage, the system shall move the opportunity to processing on its own and record the reason
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: in the history.
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:555: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:556: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity in evaluation with two proposals
spec/domains/opportunities.md:558: expected a heading (### ID · vN · confidence · origin), got: - when: the second proposal is scored
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity moves to processing and the history records that it was moved
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got:   automatically because all proposals were evaluated
spec/domains/opportunities.md:562: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: When a proposal is awarded, the system shall move its opportunity to the awarded status, mark
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: every other proposal that reached evaluation as not awarded, and show the successful
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: proponent on the opportunity.
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:567: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1080
spec/domains/opportunities.md:568: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:570: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in processing with three evaluated proposals
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: - when: one is awarded
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is awarded, the other two are marked not awarded, and the
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got:   opportunity shows the winning proponent's name
spec/domains/opportunities.md:575: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: The system shall show the successful proponent's contact email and the author of their
spec/domains/opportunities.md:577: expected a heading (### ID · vN · confidence · origin), got: proposal only to a viewer who is also permitted to see the winning score; every other viewer
spec/domains/opportunities.md:578: expected a heading (### ID · vN · confidence · origin), got: sees the proponent's name alone.
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:580: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:452
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor views it
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: - then: the successful proponent's name is shown but no email address
spec/domains/opportunities.md:586: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:587: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and only while it is
spec/domains/opportunities.md:588: expected a heading (### ID · vN · confidence · origin), got: published or in an evaluation or processing stage.
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:590: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: - when: its public sector employee author attempts to cancel it
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:597: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:598: expected a heading (### ID · vN · confidence · origin), got: The system shall keep a cancelled opportunity visible to the public rather than removing it.
spec/domains/opportunities.md:599: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:600: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:114
spec/domains/opportunities.md:601: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:602: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:603: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity
spec/domains/opportunities.md:604: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor requests it
spec/domains/opportunities.md:605: expected a heading (### ID · vN · confidence · origin), got: - then: it is shown, marked cancelled
spec/domains/opportunities.md:607: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:609: expected a heading (### ID · vN · confidence · origin), got: ## Editing, addenda and notes
spec/domains/opportunities.md:611: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:612: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited only while it is a draft, under
spec/domains/opportunities.md:613: expected a heading (### ID · vN · confidence · origin), got: review, or published, and shall refuse edits once it has entered evaluation.
spec/domains/opportunities.md:614: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:615: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:616: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:174
spec/domains/opportunities.md:617: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:618: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in evaluation
spec/domains/opportunities.md:619: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator submits an edit
spec/domains/opportunities.md:620: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is refused
spec/domains/opportunities.md:622: malformed heading: ### D-opportunities-44 (v1) [confidence: open]
spec/domains/opportunities.md:623: expected a heading (### ID · vN · confidence · origin), got: Once an opportunity is published, only an administrator shall be able to edit its details.
spec/domains/opportunities.md:624: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:625: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:626: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:627: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:628: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: conflicting
spec/domains/opportunities.md:629: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity authored by a public sector employee who is not an
spec/domains/opportunities.md:630: expected a heading (### ID · vN · confidence · origin), got:   administrator
spec/domains/opportunities.md:631: expected a heading (### ID · vN · confidence · origin), got: - when: that author edits it
spec/domains/opportunities.md:632: expected a heading (### ID · vN · confidence · origin), got: - then: the two layers disagree — the user interface withholds the edit, while the interface
spec/domains/opportunities.md:633: expected a heading (### ID · vN · confidence · origin), got:   behind it accepts an edit from the author
spec/domains/opportunities.md:634: expected a heading (### ID · vN · confidence · origin), got: - note: `canCWUOpportunityDetailsBeEdited` returns true for a published opportunity only
spec/domains/opportunities.md:635: expected a heading (### ID · vN · confidence · origin), got:   when the viewer is an administrator, and the form uses that to decide whether to send the
spec/domains/opportunities.md:636: expected a heading (### ID · vN · confidence · origin), got:   change at all; but the permission the request is actually checked against
spec/domains/opportunities.md:637: expected a heading (### ID · vN · confidence · origin), got:   (`editCWUOpportunity`) allows an administrator *or* the opportunity's public sector author
spec/domains/opportunities.md:638: expected a heading (### ID · vN · confidence · origin), got:   in every editable status. So the restriction is presentational only. Which of the two is
spec/domains/opportunities.md:639: expected a heading (### ID · vN · confidence · origin), got:   the intended rule cannot be recovered from the code; both are stated deliberately.
spec/domains/opportunities.md:641: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:642: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity is edited, the system shall notify everyone watching it, every
spec/domains/opportunities.md:643: expected a heading (### ID · vN · confidence · origin), got: vendor who has a proposal on it, and its author — unless the opportunity is a draft or has
spec/domains/opportunities.md:644: expected a heading (### ID · vN · confidence · origin), got: been cancelled, in which case no notification is sent.
spec/domains/opportunities.md:645: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:646: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:647: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:648: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:649: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:650: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it
spec/domains/opportunities.md:651: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher, the proposal's author and the opportunity's author are each notified
spec/domains/opportunities.md:653: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:654: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, add an addendum to any
spec/domains/opportunities.md:655: expected a heading (### ID · vN · confidence · origin), got: opportunity that is not a draft; the addendum shall be between 1 and 5,000 characters, shall
spec/domains/opportunities.md:656: expected a heading (### ID · vN · confidence · origin), got: be appended to the opportunity permanently, and shall notify watchers and proponents in the
spec/domains/opportunities.md:657: expected a heading (### ID · vN · confidence · origin), got: same way an edit does.
spec/domains/opportunities.md:658: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:659: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:660: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/addendum.ts:3
spec/domains/opportunities.md:661: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:982
spec/domains/opportunities.md:662: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:663: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:664: expected a heading (### ID · vN · confidence · origin), got: - when: its author adds an addendum
spec/domains/opportunities.md:665: expected a heading (### ID · vN · confidence · origin), got: - then: the addendum is shown on the opportunity and the watchers are notified
spec/domains/opportunities.md:667: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:668: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator or the opportunity's author attach a private note, with
spec/domains/opportunities.md:669: expected a heading (### ID · vN · confidence · origin), got: file attachments, to an opportunity's history, at most 1,000 characters, and shall send no
spec/domains/opportunities.md:670: expected a heading (### ID · vN · confidence · origin), got: notification when one is added.
spec/domains/opportunities.md:671: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:672: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:673: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:674: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:675: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:676: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:677: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator adds a note with an attachment
spec/domains/opportunities.md:678: expected a heading (### ID · vN · confidence · origin), got: - then: the note and its attachment appear in the history and no one is notified
spec/domains/opportunities.md:679: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us notes carry no attachments — its history record type has no attachment
spec/domains/opportunities.md:680: expected a heading (### ID · vN · confidence · origin), got:   field (`src/shared/lib/resources/opportunity/team-with-us.ts:46`), unlike the Code With Us
spec/domains/opportunities.md:681: expected a heading (### ID · vN · confidence · origin), got:   and Sprint With Us equivalents. Whether that is a deliberate difference or an unfinished
spec/domains/opportunities.md:682: expected a heading (### ID · vN · confidence · origin), got:   port cannot be determined from the code.
spec/domains/opportunities.md:684: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:685: expected a heading (### ID · vN · confidence · origin), got: The system shall record a note against every status change, of at most 1,000 characters, and
spec/domains/opportunities.md:686: expected a heading (### ID · vN · confidence · origin), got: shall show it in the opportunity's history alongside the status it accompanied.
spec/domains/opportunities.md:687: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:688: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:689: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:810
spec/domains/opportunities.md:690: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:691: expected a heading (### ID · vN · confidence · origin), got: - given: an administrator cancelling an opportunity
spec/domains/opportunities.md:692: expected a heading (### ID · vN · confidence · origin), got: - when: they supply a reason
spec/domains/opportunities.md:693: expected a heading (### ID · vN · confidence · origin), got: - then: the reason is stored with the cancellation and shown in the history
spec/domains/opportunities.md:695: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:697: expected a heading (### ID · vN · confidence · origin), got: ## Deleting
spec/domains/opportunities.md:699: malformed heading: ### D-opportunities-49 (v1) [confidence: inferred]
spec/domains/opportunities.md:700: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator permanently delete an opportunity only while it is a
spec/domains/opportunities.md:701: expected a heading (### ID · vN · confidence · origin), got: draft or under review, and shall let its public sector employee author delete it only while
spec/domains/opportunities.md:702: expected a heading (### ID · vN · confidence · origin), got: it is a draft.
spec/domains/opportunities.md:703: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:704: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:705: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:706: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:707: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:708: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:709: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:710: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:711: expected a heading (### ID · vN · confidence · origin), got: - note: the OpenAPI file describes deletion as restricted to drafts and says the request
spec/domains/opportunities.md:712: expected a heading (### ID · vN · confidence · origin), got:   "will fail if the Opportunity is not in Draft or has previously been published". The code
spec/domains/opportunities.md:713: expected a heading (### ID · vN · confidence · origin), got:   additionally permits an administrator to delete an under-review opportunity, and never
spec/domains/opportunities.md:714: expected a heading (### ID · vN · confidence · origin), got:   looks at whether the opportunity was previously published — only at its current status.
spec/domains/opportunities.md:716: malformed heading: ### D-opportunities-50 (v1) [confidence: inferred]
spec/domains/opportunities.md:717: expected a heading (### ID · vN · confidence · origin), got: For Team With Us, deletion shall be restricted the same way it is for the other two
spec/domains/opportunities.md:718: expected a heading (### ID · vN · confidence · origin), got: programs.
spec/domains/opportunities.md:719: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:720: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1139
spec/domains/opportunities.md:721: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:722: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:723: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:724: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:725: expected a heading (### ID · vN · confidence · origin), got: - then: the deletion succeeds, where the equivalent Code With Us or Sprint With Us deletion
spec/domains/opportunities.md:726: expected a heading (### ID · vN · confidence · origin), got:   would be refused
spec/domains/opportunities.md:727: expected a heading (### ID · vN · confidence · origin), got: - note: the recovered behaviour is stated in the "then" and differs from the criterion. The
spec/domains/opportunities.md:728: expected a heading (### ID · vN · confidence · origin), got:   Team With Us delete permission checks role and authorship but no status at all; the status
spec/domains/opportunities.md:729: expected a heading (### ID · vN · confidence · origin), got:   restriction to draft-or-under-review is applied one layer up, and applies equally to the
spec/domains/opportunities.md:730: expected a heading (### ID · vN · confidence · origin), got:   author and to administrators. So a Team With Us author can delete their own opportunity
spec/domains/opportunities.md:731: expected a heading (### ID · vN · confidence · origin), got:   after it has been submitted for review, which their Code With Us and Sprint With Us
spec/domains/opportunities.md:732: expected a heading (### ID · vN · confidence · origin), got:   counterparts cannot. There is no replacement criterion because whether the Team With Us
spec/domains/opportunities.md:733: expected a heading (### ID · vN · confidence · origin), got:   latitude was intentional is not recoverable from the code.
spec/domains/opportunities.md:735: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:737: expected a heading (### ID · vN · confidence · origin), got: ## Watching an opportunity
spec/domains/opportunities.md:739: malformed heading: ### D-opportunities-51 (v1) [confidence: inferred]
spec/domains/opportunities.md:740: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity and stop watching it, and shall
spec/domains/opportunities.md:741: expected a heading (### ID · vN · confidence · origin), got: show them whether they are currently watching it.
spec/domains/opportunities.md:742: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:743: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:36
spec/domains/opportunities.md:744: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:167
spec/domains/opportunities.md:745: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:746: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor viewing a published opportunity they do not watch
spec/domains/opportunities.md:747: expected a heading (### ID · vN · confidence · origin), got: - when: they choose to watch it
spec/domains/opportunities.md:748: expected a heading (### ID · vN · confidence · origin), got: - then: the control changes to show they are watching, and choosing it again stops the watch
spec/domains/opportunities.md:750: malformed heading: ### D-opportunities-52 (v1) [confidence: inferred]
spec/domains/opportunities.md:751: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to let a user watch an opportunity they authored.
spec/domains/opportunities.md:752: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:753: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:754: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:755: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee viewing their own published opportunity
spec/domains/opportunities.md:756: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to watch it
spec/domains/opportunities.md:757: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused with a message saying they cannot watch their own opportunity
spec/domains/opportunities.md:759: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:761: expected a heading (### ID · vN · confidence · origin), got: ## Notifications
spec/domains/opportunities.md:763: malformed heading: ### D-opportunities-53 (v1) [confidence: inferred]
spec/domains/opportunities.md:764: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall notify every administrator and
spec/domains/opportunities.md:765: expected a heading (### ID · vN · confidence · origin), got: the opportunity's author.
spec/domains/opportunities.md:766: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:767: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:768: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:769: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity
spec/domains/opportunities.md:770: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:771: expected a heading (### ID · vN · confidence · origin), got: - then: every administrator receives a notification, and so does the author
spec/domains/opportunities.md:773: malformed heading: ### D-opportunities-54 (v1) [confidence: inferred]
spec/domains/opportunities.md:774: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall notify every user who has opted in to
spec/domains/opportunities.md:775: expected a heading (### ID · vN · confidence · origin), got: opportunity notifications, and separately confirm the publication to the opportunity's author.
spec/domains/opportunities.md:776: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:777: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:778: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:779: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who has opted in to notifications
spec/domains/opportunities.md:780: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator publishes an opportunity
spec/domains/opportunities.md:781: expected a heading (### ID · vN · confidence · origin), got: - then: that vendor is notified of the new opportunity and the author is told the
spec/domains/opportunities.md:782: expected a heading (### ID · vN · confidence · origin), got:   publication succeeded
spec/domains/opportunities.md:784: malformed heading: ### D-opportunities-55 (v1) [confidence: inferred]
spec/domains/opportunities.md:785: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is cancelled, the system shall notify everyone watching it and every
spec/domains/opportunities.md:786: expected a heading (### ID · vN · confidence · origin), got: vendor with a proposal on it, and separately tell the author that the cancellation was
spec/domains/opportunities.md:787: expected a heading (### ID · vN · confidence · origin), got: carried out.
spec/domains/opportunities.md:788: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:789: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:790: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:791: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:792: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator cancels it
spec/domains/opportunities.md:793: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher and the proposal's author are notified of the cancellation, and the
spec/domains/opportunities.md:794: expected a heading (### ID · vN · confidence · origin), got:   opportunity's author is told it was cancelled
spec/domains/opportunities.md:796: malformed heading: ### D-opportunities-56 (v1) [confidence: inferred]
spec/domains/opportunities.md:797: expected a heading (### ID · vN · confidence · origin), got: The system shall address a recipient only once per notification even when they both watch an
spec/domains/opportunities.md:798: expected a heading (### ID · vN · confidence · origin), got: opportunity and hold a proposal on it.
spec/domains/opportunities.md:799: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:800: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:190
spec/domains/opportunities.md:801: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:802: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who both watches an opportunity and has submitted a proposal to it
spec/domains/opportunities.md:803: expected a heading (### ID · vN · confidence · origin), got: - when: the opportunity is edited
spec/domains/opportunities.md:804: expected a heading (### ID · vN · confidence · origin), got: - then: they receive one notification, not two
spec/domains/opportunities.md:27: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: The system shall publish procurement opportunities under exactly three programs — Code With
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: Us, Sprint With Us and Team With Us — each with its own creation form, its own detail page
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: and its own set of statuses.
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:77
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:105
spec/domains/opportunities.md:34: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:160
spec/domains/opportunities.md:35: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: aligned
spec/domains/opportunities.md:37: expected a heading (### ID · vN · confidence · origin), got: - given: a visitor on the "create an opportunity" page
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: - when: the page is displayed
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: - then: three programs are offered, each with a guide link and a "get started" link to its
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got:   own creation form
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: - note: the shipped prose disagrees with the shipped code. `README.md:5` describes the
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got:   service as administering "Code With Us and Sprint With Us"; `docs/database-schema.md`
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got:   documents no Team With Us tables at all; and `src/back-end/docs/` carries OpenAPI files
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got:   for the Code With Us and Sprint With Us opportunity endpoints but none for Team With Us,
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got:   although the Team With Us resource is registered in the router. Three programs is what the
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got:   code does; the documentation is stale on all three counts.
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-2 (v1) [confidence: inferred]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall record an opportunity as a chain of immutable versions with a separate
spec/domains/opportunities.md:50: expected a heading (### ID · vN · confidence · origin), got: chain of status and event records, so that every change to a published opportunity leaves a
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: history entry rather than overwriting the previous content.
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: - cites: docs/database-schema.md:156
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity that has been edited twice
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens its history
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: - then: the history shows one entry per edit, in addition to the entries for each status
spec/domains/opportunities.md:59: expected a heading (### ID · vN · confidence · origin), got:   change, and the opportunity displays the most recent version's content
spec/domains/opportunities.md:61: malformed heading: ### D-opportunities-3 (v1) [confidence: inferred]
spec/domains/opportunities.md:62: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has never been given a title as "Untitled" in
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: listings and headings.
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:150
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with an empty title
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: - when: its author opens the opportunity listing
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity appears with the title "Untitled"
spec/domains/opportunities.md:72: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:74: expected a heading (### ID · vN · confidence · origin), got: ## Who may see what
spec/domains/opportunities.md:76: malformed heading: ### D-opportunities-4 (v1) [confidence: confirmed]
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public status,
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: both in the listing and when a single opportunity is requested by its identifier.
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:84: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity and a published opportunity
spec/domains/opportunities.md:85: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor opens the opportunity listing, and then requests the draft
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got:   opportunity's address directly
spec/domains/opportunities.md:87: expected a heading (### ID · vN · confidence · origin), got: - then: the listing shows only the published opportunity, and the direct request is answered
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got:   as not found
spec/domains/opportunities.md:90: malformed heading: ### D-opportunities-5 (v1) [confidence: confirmed]
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every opportunity in a public status plus the
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: unpublished opportunities they authored, and no other unpublished opportunity.
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:98: expected a heading (### ID · vN · confidence · origin), got: - given: two public sector employees, each with one draft opportunity
spec/domains/opportunities.md:99: expected a heading (### ID · vN · confidence · origin), got: - when: the first opens the opportunity listing
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: - then: their own draft is listed and the other employee's draft is not
spec/domains/opportunities.md:102: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: The system shall show an administrator every opportunity regardless of status.
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:406
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:626
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: - given: draft opportunities authored by several different public sector employees
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator opens the opportunity listing
spec/domains/opportunities.md:110: expected a heading (### ID · vN · confidence · origin), got: - then: all of them are listed
spec/domains/opportunities.md:112: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:113: expected a heading (### ID · vN · confidence · origin), got: For Sprint With Us and Team With Us, the system shall additionally let a member of an
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: opportunity's evaluation panel open that opportunity while it is still unpublished, even
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: when they did not author it.
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:793
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: - given: a draft Sprint With Us opportunity whose evaluation panel includes a public sector
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got:   employee who is not its author
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: - when: that panel member requests the opportunity
spec/domains/opportunities.md:122: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is shown to them
spec/domains/opportunities.md:123: expected a heading (### ID · vN · confidence · origin), got: - note: Code With Us has no evaluation panel and so no equivalent rule.
spec/domains/opportunities.md:125: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: The system shall offer a way to list only the opportunities on whose evaluation panel the
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: requesting public sector employee sits, and when that view is requested it shall exclude
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: every other opportunity, including public ones.
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:172
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:640
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: - given: a panel member who also authored an unrelated published opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: - when: they request the panel-member view of the listing
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: - then: only the opportunities they sit on a panel for are returned
spec/domains/opportunities.md:137: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:138: expected a heading (### ID · vN · confidence · origin), got: The system shall withhold the identity of an opportunity's author and last editor from every
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: viewer except an administrator, the author, and the last editor.
spec/domains/opportunities.md:140: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor views it
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: - then: no author or editor name is shown
spec/domains/opportunities.md:147: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:148: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's change history only to an administrator or the
spec/domains/opportunities.md:149: expected a heading (### ID · vN · confidence · origin), got: opportunity's author.
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:151: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:478
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with several status changes
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: - when: a vendor and then the author view it
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: - then: the vendor sees no history and the author sees the full list of status changes and
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got:   events
spec/domains/opportunities.md:158: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's reporting figures — number of views, number of
spec/domains/opportunities.md:160: expected a heading (### ID · vN · confidence · origin), got: watchers, number of submitted proposals — only to an administrator or the author, and only
spec/domains/opportunities.md:161: expected a heading (### ID · vN · confidence · origin), got: once the opportunity has reached a public status.
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:163: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with two submitted proposals
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: - when: the author views it
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: - then: the view count, watcher count and proposal count are shown; a vendor viewing the
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got:   same opportunity sees none of them
spec/domains/opportunities.md:170: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: The system shall count one additional view of an opportunity each time its detail page is
spec/domains/opportunities.md:172: expected a heading (### ID · vN · confidence · origin), got: opened.
spec/domains/opportunities.md:173: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:175: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/counter.ts
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose reported view count is a known number
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: - when: any visitor opens its detail page
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: - then: the view count reported to the author increases by one
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: ## Listing, sorting and filtering
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity listing into three sections — unpublished, open and
spec/domains/opportunities.md:187: expected a heading (### ID · vN · confidence · origin), got: closed — where open means published with a proposal deadline still in the future, closed
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: means published-or-later with the deadline passed or the opportunity no longer accepting
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: proposals, and unpublished means draft or under review.
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: - given: one draft, one published opportunity with a future deadline, and one awarded
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got:   opportunity
spec/domains/opportunities.md:196: expected a heading (### ID · vN · confidence · origin), got: - when: the author opens the listing
spec/domains/opportunities.md:197: expected a heading (### ID · vN · confidence · origin), got: - then: each appears in the unpublished, open and closed section respectively
spec/domains/opportunities.md:199: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: The system shall order open opportunities by soonest proposal deadline first, closed
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: opportunities by most recently passed deadline first, and unpublished opportunities by most
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: recently changed first.
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:194
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: - given: three open opportunities with deadlines a week apart
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor opens the listing
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: - then: they appear in ascending order of deadline
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall let a visitor narrow the opportunity listing by program, by status, to
spec/domains/opportunities.md:212: expected a heading (### ID · vN · confidence · origin), got: remote-friendly opportunities only, and by a text search matched against title and location.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: - given: opportunities across all three programs, some remote-friendly
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects the Code With Us program and ticks the remote-only option
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: - then: only remote-friendly Code With Us opportunities remain listed
spec/domains/opportunities.md:221: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: The status filter on the opportunity listing shall offer a choice for every status an
spec/domains/opportunities.md:223: expected a heading (### ID · vN · confidence · origin), got: opportunity can hold.
spec/domains/opportunities.md:224: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:60
spec/domains/opportunities.md:226: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:346
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity and an opportunity in the processing status
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: - when: a visitor selects any value in the status filter
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: - then: neither opportunity can be brought back into view by any filter choice, because the
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got:   filter offers only draft, under review, published, evaluation and awarded
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: - note: this is written as the intended behaviour, not as the recovered behaviour. The
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got:   recovered behaviour is that cancelled and processing opportunities are silently excluded
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got:   whenever a status filter is applied. There is no replacement criterion because whether the
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got:   fix is to add the two missing choices or to change what the existing choices match is a
spec/domains/opportunities.md:236: expected a heading (### ID · vN · confidence · origin), got:   product decision, not something the code settles.
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: ## Creating an opportunity
spec/domains/opportunities.md:242: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator or a public sector employee to create an
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: opportunity, and shall refuse the attempt for a vendor or an anonymous visitor.
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:247: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:75
spec/domains/opportunities.md:248: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor
spec/domains/opportunities.md:250: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to create an opportunity
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused and no opportunity is created
spec/domains/opportunities.md:253: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is saved as a draft, the system shall accept it without checking any
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: field other than its attachments, and shall stand in a date fourteen days from now wherever
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: a required date is missing or invalid.
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:258: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:259: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee filling in the creation form
spec/domains/opportunities.md:261: expected a heading (### ID · vN · confidence · origin), got: - when: they save a draft with no title, no description and no dates
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: - then: the draft is created, and its proposal, assignment and start dates are set two weeks
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got:   from today
spec/domains/opportunities.md:265: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review or published rather than saved as a draft, the
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: system shall reject it unless every required field is valid, and shall say which fields are
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: at fault.
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:276
spec/domains/opportunities.md:271: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:272: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity form with an empty description
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: - when: the author submits it for review
spec/domains/opportunities.md:274: expected a heading (### ID · vN · confidence · origin), got: - then: the submission is rejected and the description field is reported as invalid
spec/domains/opportunities.md:276: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity whose title is empty or longer than 200 characters,
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: whose teaser is longer than 500 characters, whose description is empty or longer than 10,000
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: characters, or whose location is empty.
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:89
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:137
spec/domains/opportunities.md:283: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:147
spec/domains/opportunities.md:284: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:286: expected a heading (### ID · vN · confidence · origin), got: - when: its title is 201 characters long
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message naming the title
spec/domains/opportunities.md:289: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is marked as open to remote work, the system shall require a description
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: of the remote arrangement; when it is not, the description may be left empty. In both cases
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: the description shall be at most 500 characters.
spec/domains/opportunities.md:293: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:294: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:296: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity marked remote-friendly with an empty remote description
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:300: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: The system shall require at least one skill on a Code With Us opportunity and at least one
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: mandatory skill on a Sprint With Us or Team With Us opportunity, shall limit each skill to
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: 100 characters, and shall silently discard duplicate skills.
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:53
spec/domains/opportunities.md:306: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:56
spec/domains/opportunities.md:307: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published with no skills listed
spec/domains/opportunities.md:309: expected a heading (### ID · vN · confidence · origin), got: - when: it is submitted
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message asking for at least one skill
spec/domains/opportunities.md:312: malformed heading: ### D-opportunities-23 (v1) [confidence: inferred]
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: The system shall cap a Code With Us reward at $70,000 and require it to be at least $1, and
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: shall cap a Sprint With Us total budget at $5,000,000 and require it to be at least $1.
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:28
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:320: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity with a reward of $70,001
spec/domains/opportunities.md:321: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:323: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us has no upper limit on its maximum budget — only a lower bound of $1
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got:   (`src/shared/lib/validation/opportunity/team-with-us.ts:176`). Whether the absent cap is
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got:   deliberate or an oversight cannot be settled from the code.
spec/domains/opportunities.md:327: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: assignment date, then start date, then completion date — with the proposal deadline no
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: earlier than today, and shall record every one of them at 4pm Pacific time on the chosen day.
spec/domains/opportunities.md:331: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:332: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:334: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:26
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity being published
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: - when: its assignment date is set earlier than its proposal deadline
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused
spec/domains/opportunities.md:340: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: measure the new proposal deadline against the old deadline rather than against today, so
spec/domains/opportunities.md:343: expected a heading (### ID · vN · confidence · origin), got: that a closed opportunity can be re-dated without the deadline having to be in the future.
spec/domains/opportunities.md:344: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:346: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:543
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity whose deadline passed a month ago and which is no longer published
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it and sets a deadline three weeks ago
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is accepted
spec/domains/opportunities.md:352: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: The system shall require the four Sprint With Us scoring weights (team questions, code
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: challenge, team scenario, price) to total exactly 100 percent, and likewise the three Team
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: With Us weights (resource questions, challenge, price).
spec/domains/opportunities.md:356: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:357: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:615
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:436
spec/domains/opportunities.md:359: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity whose weights total 90 percent
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: - when: it is published
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying the weights must total 100 percent
spec/domains/opportunities.md:364: malformed heading: ### D-opportunities-27 (v1) [confidence: inferred]
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: The system shall not accept a Sprint With Us opportunity that defines an inception phase
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: without also defining a prototype phase; the implementation phase is always required.
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:628
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:206
spec/domains/opportunities.md:370: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:371: expected a heading (### ID · vN · confidence · origin), got: - given: a Sprint With Us opportunity with an inception phase and an implementation phase
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: - when: it is published without a prototype phase
spec/domains/opportunities.md:373: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying a prototype phase must follow an
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got:   inception phase
spec/domains/opportunities.md:376: malformed heading: ### D-opportunities-28 (v1) [confidence: inferred]
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us or Team With Us evaluation panel to have at least
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: two members, at most one chair, no member listed twice, and every member a public sector
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: employee.
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:382: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/validation.ts:429
spec/domains/opportunities.md:383: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/config.ts:32
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:385: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity being published
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: - when: its evaluation panel names two chairs
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: - then: publication is refused with a message saying only a single chair may be specified
spec/domains/opportunities.md:389: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: The system shall let a Team With Us opportunity request one or more resources, each drawn
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: from a fixed list of five service areas — full stack developer, data professional, agile
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: coach, devops specialist, service designer — with a target allocation between 1 and 100
spec/domains/opportunities.md:393: expected a heading (### ID · vN · confidence · origin), got: percent of full time.
spec/domains/opportunities.md:394: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:396: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: - when: a resource is added with a target allocation of 120 percent
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:402: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: The system shall allow at most 100 evaluation questions on a Sprint With Us or Team With Us
spec/domains/opportunities.md:404: expected a heading (### ID · vN · confidence · origin), got: opportunity, each with a word limit between 1 and 3,000 words, an available score of at
spec/domains/opportunities.md:405: expected a heading (### ID · vN · confidence · origin), got: least 1, and — where a minimum passing score is set — a minimum strictly below the available
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: score.
spec/domains/opportunities.md:407: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:14
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:78
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/team-with-us.ts:100
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us question worth 5 points
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: - when: its minimum passing score is set to 5
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is refused
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:418: expected a heading (### ID · vN · confidence · origin), got: ## Publishing, and the status lifecycle
spec/domains/opportunities.md:420: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:421: expected a heading (### ID · vN · confidence · origin), got: Every opportunity shall hold exactly one status at a time, drawn from its programme's set:
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: Code With Us — draft, under review, published, evaluation, processing, awarded, cancelled;
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: Sprint With Us — draft, under review, published, individual team-question evaluation,
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: team-question consensus, code challenge, team scenario, processing, awarded, cancelled; Team
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: With Us — draft, under review, published, individual resource-question evaluation,
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: resource-question consensus, challenge, processing, awarded, cancelled.
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:430: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:431: expected a heading (### ID · vN · confidence · origin), got: - cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:433: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in any program
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: - when: its status is read
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: - then: it is one of the values listed for that program
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: - note: each program also defines a "suspended" status marked deprecated in the code. No
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got:   transition reaches it and nothing sets it, so it exists only for records written by an
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got:   earlier version of the application. The Code With Us OpenAPI file
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got:   (`src/back-end/docs/opportunities/code-with-us.yaml:180`) documents the creatable statuses
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got:   as draft and published only, omitting under review, which the code has accepted since the
spec/domains/opportunities.md:441: expected a heading (### ID · vN · confidence · origin), got:   migration at `src/migrations/tasks/20231102143211_cwu-opp-under-review.ts`.
spec/domains/opportunities.md:443: malformed heading: ### D-opportunities-32 (v1) [confidence: inferred]
spec/domains/opportunities.md:444: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity; a public sector
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: employee shall instead submit it for review, moving it to the under-review status.
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/create.tsx:347
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity authored by a public sector employee
spec/domains/opportunities.md:451: expected a heading (### ID · vN · confidence · origin), got: - when: the author acts on it
spec/domains/opportunities.md:452: expected a heading (### ID · vN · confidence · origin), got: - then: the action offered is "submit for review", and the opportunity moves to under review
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got:   rather than published
spec/domains/opportunities.md:455: malformed heading: ### D-opportunities-33 (v1) [confidence: open]
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: When creating an opportunity, the system shall refuse a public sector employee who is not an
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: administrator the ability to create it directly in the published status.
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:463: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in public sector employee who is not an administrator
spec/domains/opportunities.md:464: expected a heading (### ID · vN · confidence · origin), got: - when: they create a Code With Us opportunity with the published status
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused
spec/domains/opportunities.md:466: expected a heading (### ID · vN · confidence · origin), got: - note: this is the Sprint With Us and Team With Us behaviour, where the create permission
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got:   takes the requested status and refuses `PUBLISHED` for a non-administrator. The Code With
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got:   Us create permission takes no status at all and permits any public sector employee, so a
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got:   Code With Us opportunity can be created directly as published by a user who would not be
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got:   allowed to publish that same opportunity a moment later. The user interface never offers
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got:   this, so it is reachable only by calling the interface directly. Marked `open` because the
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got:   three programs contradict each other and nothing in the code or documentation says which
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got:   is intended; the correction stated here assumes the two-of-three behaviour is the rule and
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got:   Code With Us is the omission, which needs a human ruling.
spec/domains/opportunities.md:476: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:477: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to submit for review or to publish an opportunity that is
spec/domains/opportunities.md:478: expected a heading (### ID · vN · confidence · origin), got: incomplete, and shall say that the opportunity must be completed and saved before it can be
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: published again.
spec/domains/opportunities.md:480: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:714
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:764
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity saved with no description
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: - then: the request is refused with a message saying the opportunity is incomplete
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: - note: the completeness check applied when submitting for review is narrower than the one
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got:   applied when publishing — it checks title, teaser, remote flag, remote description,
spec/domains/opportunities.md:489: expected a heading (### ID · vN · confidence · origin), got:   location and description, while publishing additionally checks reward, skills, submission
spec/domains/opportunities.md:490: expected a heading (### ID · vN · confidence · origin), got:   information, acceptance criteria and evaluation criteria. A Code With Us opportunity can
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got:   therefore pass review submission and still be refused at publication.
spec/domains/opportunities.md:493: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: The system shall permit only these status moves: from draft to under review or published;
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: from under review to published; from published to cancelled or to the program's first
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: evaluation stage; through the program's evaluation stages in order, each also able to move
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: to cancelled; from the last evaluation stage to processing; and from processing to awarded
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: or cancelled.
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:500: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:501: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:503: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: - when: any actor attempts to move it back to published
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: - then: the move is refused
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: - note: the Team With Us transition table omits processing-to-awarded, which its Code With
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got:   Us and Sprint With Us counterparts both list. Awarding a Team With Us opportunity still
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got:   works, because awarding writes the awarded status directly rather than going through the
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got:   transition check (`src/back-end/lib/db/proposal/team-with-us.ts:1460`). The omission is
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got:   therefore latent rather than visible, but it means the two paths to the awarded status
spec/domains/opportunities.md:512: expected a heading (### ID · vN · confidence · origin), got:   disagree about whether it is legal.
spec/domains/opportunities.md:514: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:515: expected a heading (### ID · vN · confidence · origin), got: When an opportunity's proposal deadline passes, the system shall move it out of the published
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: status into the program's first evaluation stage, move every submitted proposal on it into
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: review, and notify the author that the opportunity is ready for evaluation.
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:523: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one submitted proposal and a deadline one minute ago
spec/domains/opportunities.md:524: expected a heading (### ID · vN · confidence · origin), got: - when: the deadline has passed
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is in evaluation, the proposal is under review, and the author has
spec/domains/opportunities.md:526: expected a heading (### ID · vN · confidence · origin), got:   been notified
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: - note: for Sprint With Us and Team With Us this transition also assigns each submitted
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got:   proposal an anonymous name of the form "Proponent 1", "Proponent 2" and so on. Code With
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got:   Us does not anonymise.
spec/domains/opportunities.md:531: malformed heading: ### D-opportunities-37 (v1) [confidence: inferred]
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: The deadline transition shall be driven by incoming traffic rather than by a clock: it runs
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: before handling a request, at most once per throttle window, so an opportunity whose
spec/domains/opportunities.md:534: expected a heading (### ID · vN · confidence · origin), got: deadline has passed stays published until the next request arrives.
spec/domains/opportunities.md:535: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/hooks/code-with-us.ts:17
spec/domains/opportunities.md:537: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:196
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/index.ts:256
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity whose deadline has just passed and an idle application
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: - when: no request is made
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity remains published; it moves to evaluation on the first request that
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got:   arrives after the throttle window elapses
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: - note: the same check is attached to the status endpoint specifically so that a health
spec/domains/opportunities.md:545: expected a heading (### ID · vN · confidence · origin), got:   probe keeps it running when nothing else does. This is a property a rebuild has to decide
spec/domains/opportunities.md:546: expected a heading (### ID · vN · confidence · origin), got:   about deliberately — a scheduled job and a request hook are not observationally
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got:   equivalent when traffic is low.
spec/domains/opportunities.md:549: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: When every active proposal on an opportunity has been evaluated at the final evaluation
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: stage, the system shall move the opportunity to processing on its own and record the reason
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: in the history.
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:555: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:556: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: - given: a Code With Us opportunity in evaluation with two proposals
spec/domains/opportunities.md:558: expected a heading (### ID · vN · confidence · origin), got: - when: the second proposal is scored
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity moves to processing and the history records that it was moved
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got:   automatically because all proposals were evaluated
spec/domains/opportunities.md:562: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: When a proposal is awarded, the system shall move its opportunity to the awarded status, mark
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: every other proposal that reached evaluation as not awarded, and show the successful
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: proponent on the opportunity.
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:567: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/proposal/code-with-us.ts:1080
spec/domains/opportunities.md:568: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:570: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in processing with three evaluated proposals
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: - when: one is awarded
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: - then: the opportunity is awarded, the other two are marked not awarded, and the
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got:   opportunity shows the winning proponent's name
spec/domains/opportunities.md:575: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: The system shall show the successful proponent's contact email and the author of their
spec/domains/opportunities.md:577: expected a heading (### ID · vN · confidence · origin), got: proposal only to a viewer who is also permitted to see the winning score; every other viewer
spec/domains/opportunities.md:578: expected a heading (### ID · vN · confidence · origin), got: sees the proponent's name alone.
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:580: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:452
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: - given: an awarded opportunity
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor views it
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: - then: the successful proponent's name is shown but no email address
spec/domains/opportunities.md:586: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:587: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and only while it is
spec/domains/opportunities.md:588: expected a heading (### ID · vN · confidence · origin), got: published or in an evaluation or processing stage.
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:590: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: - when: its public sector employee author attempts to cancel it
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:597: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:598: expected a heading (### ID · vN · confidence · origin), got: The system shall keep a cancelled opportunity visible to the public rather than removing it.
spec/domains/opportunities.md:599: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:600: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:114
spec/domains/opportunities.md:601: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:602: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:603: expected a heading (### ID · vN · confidence · origin), got: - given: a cancelled opportunity
spec/domains/opportunities.md:604: expected a heading (### ID · vN · confidence · origin), got: - when: an anonymous visitor requests it
spec/domains/opportunities.md:605: expected a heading (### ID · vN · confidence · origin), got: - then: it is shown, marked cancelled
spec/domains/opportunities.md:607: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:609: expected a heading (### ID · vN · confidence · origin), got: ## Editing, addenda and notes
spec/domains/opportunities.md:611: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:612: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited only while it is a draft, under
spec/domains/opportunities.md:613: expected a heading (### ID · vN · confidence · origin), got: review, or published, and shall refuse edits once it has entered evaluation.
spec/domains/opportunities.md:614: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:615: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:616: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:174
spec/domains/opportunities.md:617: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:618: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity in evaluation
spec/domains/opportunities.md:619: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator submits an edit
spec/domains/opportunities.md:620: expected a heading (### ID · vN · confidence · origin), got: - then: the edit is refused
spec/domains/opportunities.md:622: malformed heading: ### D-opportunities-44 (v1) [confidence: open]
spec/domains/opportunities.md:623: expected a heading (### ID · vN · confidence · origin), got: Once an opportunity is published, only an administrator shall be able to edit its details.
spec/domains/opportunities.md:624: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:625: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:626: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:627: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:628: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: conflicting
spec/domains/opportunities.md:629: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity authored by a public sector employee who is not an
spec/domains/opportunities.md:630: expected a heading (### ID · vN · confidence · origin), got:   administrator
spec/domains/opportunities.md:631: expected a heading (### ID · vN · confidence · origin), got: - when: that author edits it
spec/domains/opportunities.md:632: expected a heading (### ID · vN · confidence · origin), got: - then: the two layers disagree — the user interface withholds the edit, while the interface
spec/domains/opportunities.md:633: expected a heading (### ID · vN · confidence · origin), got:   behind it accepts an edit from the author
spec/domains/opportunities.md:634: expected a heading (### ID · vN · confidence · origin), got: - note: `canCWUOpportunityDetailsBeEdited` returns true for a published opportunity only
spec/domains/opportunities.md:635: expected a heading (### ID · vN · confidence · origin), got:   when the viewer is an administrator, and the form uses that to decide whether to send the
spec/domains/opportunities.md:636: expected a heading (### ID · vN · confidence · origin), got:   change at all; but the permission the request is actually checked against
spec/domains/opportunities.md:637: expected a heading (### ID · vN · confidence · origin), got:   (`editCWUOpportunity`) allows an administrator *or* the opportunity's public sector author
spec/domains/opportunities.md:638: expected a heading (### ID · vN · confidence · origin), got:   in every editable status. So the restriction is presentational only. Which of the two is
spec/domains/opportunities.md:639: expected a heading (### ID · vN · confidence · origin), got:   the intended rule cannot be recovered from the code; both are stated deliberately.
spec/domains/opportunities.md:641: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:642: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity is edited, the system shall notify everyone watching it, every
spec/domains/opportunities.md:643: expected a heading (### ID · vN · confidence · origin), got: vendor who has a proposal on it, and its author — unless the opportunity is a draft or has
spec/domains/opportunities.md:644: expected a heading (### ID · vN · confidence · origin), got: been cancelled, in which case no notification is sent.
spec/domains/opportunities.md:645: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:646: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:647: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:648: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:649: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:650: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator edits it
spec/domains/opportunities.md:651: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher, the proposal's author and the opportunity's author are each notified
spec/domains/opportunities.md:653: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:654: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, add an addendum to any
spec/domains/opportunities.md:655: expected a heading (### ID · vN · confidence · origin), got: opportunity that is not a draft; the addendum shall be between 1 and 5,000 characters, shall
spec/domains/opportunities.md:656: expected a heading (### ID · vN · confidence · origin), got: be appended to the opportunity permanently, and shall notify watchers and proponents in the
spec/domains/opportunities.md:657: expected a heading (### ID · vN · confidence · origin), got: same way an edit does.
spec/domains/opportunities.md:658: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:659: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:660: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/addendum.ts:3
spec/domains/opportunities.md:661: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:982
spec/domains/opportunities.md:662: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:663: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:664: expected a heading (### ID · vN · confidence · origin), got: - when: its author adds an addendum
spec/domains/opportunities.md:665: expected a heading (### ID · vN · confidence · origin), got: - then: the addendum is shown on the opportunity and the watchers are notified
spec/domains/opportunities.md:667: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:668: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator or the opportunity's author attach a private note, with
spec/domains/opportunities.md:669: expected a heading (### ID · vN · confidence · origin), got: file attachments, to an opportunity's history, at most 1,000 characters, and shall send no
spec/domains/opportunities.md:670: expected a heading (### ID · vN · confidence · origin), got: notification when one is added.
spec/domains/opportunities.md:671: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:672: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:673: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:674: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:675: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:676: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity
spec/domains/opportunities.md:677: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator adds a note with an attachment
spec/domains/opportunities.md:678: expected a heading (### ID · vN · confidence · origin), got: - then: the note and its attachment appear in the history and no one is notified
spec/domains/opportunities.md:679: expected a heading (### ID · vN · confidence · origin), got: - note: Team With Us notes carry no attachments — its history record type has no attachment
spec/domains/opportunities.md:680: expected a heading (### ID · vN · confidence · origin), got:   field (`src/shared/lib/resources/opportunity/team-with-us.ts:46`), unlike the Code With Us
spec/domains/opportunities.md:681: expected a heading (### ID · vN · confidence · origin), got:   and Sprint With Us equivalents. Whether that is a deliberate difference or an unfinished
spec/domains/opportunities.md:682: expected a heading (### ID · vN · confidence · origin), got:   port cannot be determined from the code.
spec/domains/opportunities.md:684: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:685: expected a heading (### ID · vN · confidence · origin), got: The system shall record a note against every status change, of at most 1,000 characters, and
spec/domains/opportunities.md:686: expected a heading (### ID · vN · confidence · origin), got: shall show it in the opportunity's history alongside the status it accompanied.
spec/domains/opportunities.md:687: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:688: expected a heading (### ID · vN · confidence · origin), got: - cites: src/shared/lib/validation/opportunity/code-with-us.ts:89
spec/domains/opportunities.md:689: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/code-with-us.ts:810
spec/domains/opportunities.md:690: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:691: expected a heading (### ID · vN · confidence · origin), got: - given: an administrator cancelling an opportunity
spec/domains/opportunities.md:692: expected a heading (### ID · vN · confidence · origin), got: - when: they supply a reason
spec/domains/opportunities.md:693: expected a heading (### ID · vN · confidence · origin), got: - then: the reason is stored with the cancellation and shown in the history
spec/domains/opportunities.md:695: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:697: expected a heading (### ID · vN · confidence · origin), got: ## Deleting
spec/domains/opportunities.md:699: malformed heading: ### D-opportunities-49 (v1) [confidence: inferred]
spec/domains/opportunities.md:700: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator permanently delete an opportunity only while it is a
spec/domains/opportunities.md:701: expected a heading (### ID · vN · confidence · origin), got: draft or under review, and shall let its public sector employee author delete it only while
spec/domains/opportunities.md:702: expected a heading (### ID · vN · confidence · origin), got: it is a draft.
spec/domains/opportunities.md:703: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:704: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:705: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:706: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:707: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:708: expected a heading (### ID · vN · confidence · origin), got: - given: an opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:709: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:710: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused; the same attempt by an administrator succeeds
spec/domains/opportunities.md:711: expected a heading (### ID · vN · confidence · origin), got: - note: the OpenAPI file describes deletion as restricted to drafts and says the request
spec/domains/opportunities.md:712: expected a heading (### ID · vN · confidence · origin), got:   "will fail if the Opportunity is not in Draft or has previously been published". The code
spec/domains/opportunities.md:713: expected a heading (### ID · vN · confidence · origin), got:   additionally permits an administrator to delete an under-review opportunity, and never
spec/domains/opportunities.md:714: expected a heading (### ID · vN · confidence · origin), got:   looks at whether the opportunity was previously published — only at its current status.
spec/domains/opportunities.md:716: malformed heading: ### D-opportunities-50 (v1) [confidence: inferred]
spec/domains/opportunities.md:717: expected a heading (### ID · vN · confidence · origin), got: For Team With Us, deletion shall be restricted the same way it is for the other two
spec/domains/opportunities.md:718: expected a heading (### ID · vN · confidence · origin), got: programs.
spec/domains/opportunities.md:719: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:720: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/permissions.ts:1139
spec/domains/opportunities.md:721: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:722: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: defect
spec/domains/opportunities.md:723: expected a heading (### ID · vN · confidence · origin), got: - given: a Team With Us opportunity under review, authored by a public sector employee
spec/domains/opportunities.md:724: expected a heading (### ID · vN · confidence · origin), got: - when: that author attempts to delete it
spec/domains/opportunities.md:725: expected a heading (### ID · vN · confidence · origin), got: - then: the deletion succeeds, where the equivalent Code With Us or Sprint With Us deletion
spec/domains/opportunities.md:726: expected a heading (### ID · vN · confidence · origin), got:   would be refused
spec/domains/opportunities.md:727: expected a heading (### ID · vN · confidence · origin), got: - note: the recovered behaviour is stated in the "then" and differs from the criterion. The
spec/domains/opportunities.md:728: expected a heading (### ID · vN · confidence · origin), got:   Team With Us delete permission checks role and authorship but no status at all; the status
spec/domains/opportunities.md:729: expected a heading (### ID · vN · confidence · origin), got:   restriction to draft-or-under-review is applied one layer up, and applies equally to the
spec/domains/opportunities.md:730: expected a heading (### ID · vN · confidence · origin), got:   author and to administrators. So a Team With Us author can delete their own opportunity
spec/domains/opportunities.md:731: expected a heading (### ID · vN · confidence · origin), got:   after it has been submitted for review, which their Code With Us and Sprint With Us
spec/domains/opportunities.md:732: expected a heading (### ID · vN · confidence · origin), got:   counterparts cannot. There is no replacement criterion because whether the Team With Us
spec/domains/opportunities.md:733: expected a heading (### ID · vN · confidence · origin), got:   latitude was intentional is not recoverable from the code.
spec/domains/opportunities.md:735: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:737: expected a heading (### ID · vN · confidence · origin), got: ## Watching an opportunity
spec/domains/opportunities.md:739: malformed heading: ### D-opportunities-51 (v1) [confidence: inferred]
spec/domains/opportunities.md:740: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity and stop watching it, and shall
spec/domains/opportunities.md:741: expected a heading (### ID · vN · confidence · origin), got: show them whether they are currently watching it.
spec/domains/opportunities.md:742: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:743: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:36
spec/domains/opportunities.md:744: expected a heading (### ID · vN · confidence · origin), got: - cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:167
spec/domains/opportunities.md:745: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:746: expected a heading (### ID · vN · confidence · origin), got: - given: a signed-in vendor viewing a published opportunity they do not watch
spec/domains/opportunities.md:747: expected a heading (### ID · vN · confidence · origin), got: - when: they choose to watch it
spec/domains/opportunities.md:748: expected a heading (### ID · vN · confidence · origin), got: - then: the control changes to show they are watching, and choosing it again stops the watch
spec/domains/opportunities.md:750: malformed heading: ### D-opportunities-52 (v1) [confidence: inferred]
spec/domains/opportunities.md:751: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to let a user watch an opportunity they authored.
spec/domains/opportunities.md:752: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:753: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:754: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:755: expected a heading (### ID · vN · confidence · origin), got: - given: a public sector employee viewing their own published opportunity
spec/domains/opportunities.md:756: expected a heading (### ID · vN · confidence · origin), got: - when: they attempt to watch it
spec/domains/opportunities.md:757: expected a heading (### ID · vN · confidence · origin), got: - then: the attempt is refused with a message saying they cannot watch their own opportunity
spec/domains/opportunities.md:759: expected a heading (### ID · vN · confidence · origin), got: ---
spec/domains/opportunities.md:761: expected a heading (### ID · vN · confidence · origin), got: ## Notifications
spec/domains/opportunities.md:763: malformed heading: ### D-opportunities-53 (v1) [confidence: inferred]
spec/domains/opportunities.md:764: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall notify every administrator and
spec/domains/opportunities.md:765: expected a heading (### ID · vN · confidence · origin), got: the opportunity's author.
spec/domains/opportunities.md:766: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:767: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:768: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:769: expected a heading (### ID · vN · confidence · origin), got: - given: a draft opportunity
spec/domains/opportunities.md:770: expected a heading (### ID · vN · confidence · origin), got: - when: its author submits it for review
spec/domains/opportunities.md:771: expected a heading (### ID · vN · confidence · origin), got: - then: every administrator receives a notification, and so does the author
spec/domains/opportunities.md:773: malformed heading: ### D-opportunities-54 (v1) [confidence: inferred]
spec/domains/opportunities.md:774: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall notify every user who has opted in to
spec/domains/opportunities.md:775: expected a heading (### ID · vN · confidence · origin), got: opportunity notifications, and separately confirm the publication to the opportunity's author.
spec/domains/opportunities.md:776: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:777: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:778: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:779: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who has opted in to notifications
spec/domains/opportunities.md:780: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator publishes an opportunity
spec/domains/opportunities.md:781: expected a heading (### ID · vN · confidence · origin), got: - then: that vendor is notified of the new opportunity and the author is told the
spec/domains/opportunities.md:782: expected a heading (### ID · vN · confidence · origin), got:   publication succeeded
spec/domains/opportunities.md:784: malformed heading: ### D-opportunities-55 (v1) [confidence: inferred]
spec/domains/opportunities.md:785: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is cancelled, the system shall notify everyone watching it and every
spec/domains/opportunities.md:786: expected a heading (### ID · vN · confidence · origin), got: vendor with a proposal on it, and separately tell the author that the cancellation was
spec/domains/opportunities.md:787: expected a heading (### ID · vN · confidence · origin), got: carried out.
spec/domains/opportunities.md:788: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:789: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:790: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:791: expected a heading (### ID · vN · confidence · origin), got: - given: a published opportunity with one watcher and one submitted proposal
spec/domains/opportunities.md:792: expected a heading (### ID · vN · confidence · origin), got: - when: an administrator cancels it
spec/domains/opportunities.md:793: expected a heading (### ID · vN · confidence · origin), got: - then: the watcher and the proposal's author are notified of the cancellation, and the
spec/domains/opportunities.md:794: expected a heading (### ID · vN · confidence · origin), got:   opportunity's author is told it was cancelled
spec/domains/opportunities.md:796: malformed heading: ### D-opportunities-56 (v1) [confidence: inferred]
spec/domains/opportunities.md:797: expected a heading (### ID · vN · confidence · origin), got: The system shall address a recipient only once per notification even when they both watch an
spec/domains/opportunities.md:798: expected a heading (### ID · vN · confidence · origin), got: opportunity and hold a proposal on it.
spec/domains/opportunities.md:799: expected a heading (### ID · vN · confidence · origin), got: - origin: recovered
spec/domains/opportunities.md:800: expected a heading (### ID · vN · confidence · origin), got: - cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:190
spec/domains/opportunities.md:801: expected a heading (### ID · vN · confidence · origin), got: - reconciliation: implemented-only
spec/domains/opportunities.md:802: expected a heading (### ID · vN · confidence · origin), got: - given: a vendor who both watches an opportunity and has submitted a proposal to it
spec/domains/opportunities.md:803: expected a heading (### ID · vN · confidence · origin), got: - when: the opportunity is edited
spec/domains/opportunities.md:804: expected a heading (### ID · vN · confidence · origin), got: - then: they receive one notification, not two
spec/domains/opportunities.md has no criteria

## 003 · archaeology · 2026-09-07

cost $4.454979999999998 · turns 41

the agent turn reported failure with no output

## 002 · intent · 2026-09-07

cost $0.6139335 · turns 8

Two files touched, both inside my boundary: one new intent document and one row added to the constitution.

---

I read `intent/brief.md` in full — it is six sentences of prose across three paragraphs — and then walked `intent/.template.md` section by section, asking of each what the brief actually says, and writing down only that.

**What I produced.** `intent/digital-marketplace-rebuild.md`, slugged from the brief's title "Digital Marketplace rebuild". Every section is filled; no section kept its template guidance text, because the brief gave something for each one, though in two places what it gave was thinner than the section wants.

**Where the brief was strong.** Affected users, systems and constraints came almost verbatim. The brief names the three roles (staff publishing opportunities, staff evaluating and awarding, vendors registering and submitting), the systems around the work, and six explicit constraints plus two more implied by the second paragraph — sandbox-only operation and behaviour preservation. I recorded the technologies the brief names (a kept database schema, Keycloak sign-in, a design system, the deploy target of the existing application) as constraints and as system identities, and kept them out of the problem and outcome sections, where they would have started doing architecture I have no business doing.

**Where I refused to fill a gap.** Two places, and they are the substance of this run.

The first is the problem statement. The brief explains the *purpose* of the rebuild — prove the pipeline can recover a specification and rebuild to it, and produce a code base that could later replace the old one — but it never says who is currently stuck or what the existing application costs anyone. I wrote the problem from the two facts the brief does supply (a bespoke front-end framework, and no specification held anywhere but the running system) and then said plainly in the document that the brief names no user or operator pain, with a matching open question. It would have been easy and wrong to write "the legacy stack is hard to maintain and slows delivery" — nobody said that.

The second is the outcome. "Measurable parity" is the brief's own phrase, and it is an aspiration wearing a metric's clothes: no measure, no threshold, no judge. Per the discipline I recorded it as the outcome as stated, said in the document that it is not yet checkable, and opened questions on the measure and on who judges. I did salvage two conditions that *are* checkable as written — that nothing ships to the live service, and that the artifact is a code base the product owners could later choose to adopt — so the section is not entirely un-testable while the parity question is outstanding.

**Open questions.** Fifteen, all phrased as questions back to the brief's author. Two are the brief's own, carried forward deliberately rather than resolved: which recovered behaviours are bugs rather than intent, and which program variants differ only by configuration. The brief explicitly expects the pipeline to surface those rather than answer them, so treating them as settled would have contradicted it. The remaining thirteen are gaps I found: how parity is measured and who rules on it; whether all three programs are in scope and in what order; whether "keeping its behaviour" covers the whole application; what the "modern, opinionated stack" is, since the brief names it only by adjective; who rules that a criterion requires a schema change; where sandbox data comes from given that fixtures may carry no personal data; which identity provider instance the sandboxes sign in against; where the sandboxes run; whether there is a date; whether the ban on consulting the old application's tests extends past specification-writing and to its source and docs; and what the product owners would need to see to adopt the result. The count is high relative to the brief's length, which is the honest signal here — a six-sentence brief cannot answer a template this size, and a document with fewer questions would have meant I invented answers.

**Constitution.** One term of art the brief defines that the J4 table did not carry: *Digital Marketplace* itself, which the brief's first sentence defines. I added the row using the brief's own words. Every other term the brief uses — opportunity, proposal, organisation, affiliation, evaluation stage, award, the three programs — already has a row. I considered adding *parity*, and did not: the brief uses the word but never defines it, so any row would have been my definition rather than the author's. It is an open question instead.

**What I could not do.** Nobody is available to answer the fifteen questions, so none of them are closed; the intent goes forward with its outcome not yet measurable, and a later stage or the brief's author will have to settle at least the parity measure before anything downstream can claim success against it. I did not look outside the brief — no reading of the existing application, no inference from similar procurement systems — so if the brief is itself wrong or incomplete about the service, that error is faithfully reproduced in the intent and the open questions are the only place it will surface.

## 001 · probe · 2026-09-06

cost $0.224672 · turns 2

I wrote `app/PROBE.md` in the digital-marketplace-next repository. It holds two lines: today's date, 2026-09-06, and the sentence "the runner works" — nothing else, since the instruction asked for exactly that content and no more.

The `app/` directory already existed, so the file simply landed alongside whatever else lives there; I did not inspect or touch any neighbouring files. Nothing was staged, committed, or pushed, and no gate was touched — the working tree now carries this new untracked file plus the pre-existing untracked `.sdlc/run-state.json` that was there when I started.

One thing worth flagging for whoever picks this up: the date came from the session's stated current date rather than from a system clock reading, so if this probe is ever used to verify clock behaviour rather than just runner liveness, that distinction matters. There was nothing to verify beyond the write itself, and the instruction was to stop afterwards, so I did.
