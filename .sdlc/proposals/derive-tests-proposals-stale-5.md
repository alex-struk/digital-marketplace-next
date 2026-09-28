---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "R-2.27 now has a full test, and I removed its entry from `tests/acceptance/not-testable.yaml`."
opened: 2026-09-28T05:37:37.077Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** R-2.27 now has a full test, and I removed its entry from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

R-2.27 now has a full test, and I removed its entry from `tests/acceptance/not-testable.yaml`. It is the only criterion in this run, so one criterion has a test and none are recorded as untestable.

**What changed.** The previous derivation had already written `tests/acceptance/proposals/R-2.27.spec.ts` with two tests. One shows that a disqualified proposal is not counted and the other that a withdrawn one is not. The clause "draft proposals are not counted" was recorded as blocked, because no seeded opportunity past its deadline had a draft next to a proposal that could be scored. The contract stage has now supplied that record: `seed.opportunities.cwuLapsedWithSubmissionAndDraft`. It has one submitted proposal (`seed.proposals.cwuSubmissionBesideDraft`, from users.organizationOwner) and one draft (`seed.proposals.cwuDraftBesideSubmission`, from users.proponentTwo). I added a third test to the same file, titled with the criterion's statement plus "(a draft proposal is not counted)". It signs in as `persona.administrator` and closes the opportunity using the scheduled-transition trigger, as the other two tests do. It then scores the submission, the only proposal still in contention. It checks that the opportunity's status moves on from evaluation and that `opportunityCwuEdit.historyTab()` carries the note "Automatically moved to Processing as all proposals have been evaluated." It reuses the file's existing helpers and only the named seed handles, with no raw ids. I also updated the file's opening comment, which had said this clause was recorded as untestable.

**Decision.** The test does not read the draft's own status. users.proponentTwo exists in the seed but has no persona, so nobody can sign in as that vendor, and the criterion does not need it. What counts is that the opportunity moved on while the draft stayed unevaluated. If a later stage wants the test to also confirm that the draft stayed a draft, it would need a persona for users.proponentTwo. That is an optional addition, not something blocking this test.

**Not checked.** I could not type-check or run the file: both `tsc` commands needed approval that this session could not get. The new code only uses helpers already defined in the file and seed handles I confirmed exist in `tests/generated/seed.ts`.

**Surface gaps.** I needed no surface actions or observations that the contract lacks. I changed nothing outside `tests/acceptance`.
