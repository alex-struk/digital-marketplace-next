---
gate: G3
question: "Do these tests follow from the proposals criteria and from nothing else?"
recommendation: "I rewrote all five tests and each now has a file."
opened: 2026-09-29T00:11:43.822Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** I rewrote all five tests and each now has a file.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote all five tests and each now has a file. Two of them also have an entry in `not-testable.yaml` for one clause no test can assert. I could not type-check them: TypeScript isn't installed in this workspace, and a command to parse-check the YAML was not approved. The separation check's forbidden patterns (selectors, `page.`, routes, URLs) don't appear in any of the five files, and every seed handle and persona they use exists in the generated files.

**R-2.17 (qualified supplier with every service area).** The ruling said the old test saw no outcome at all. The new test submits through the team-proposal request page (`proposalTeamRequest.submitTeamProposal`), waits for the service to answer, and only then reads the refusal. For the service-area half, the seed's `proponentTwo` organization is already a qualified Team With Us supplier that provides only Full Stack Developer. Its owner (`competingVendor`) bids on a published opportunity that calls for an Agile Coach. The test checks that the submission was not accepted and that the refusal contains the criterion's exact message. A second test covers the "qualified supplier" half with an organization it builds itself: approved for Full Stack Developer, with its program terms never accepted. The criterion quotes no message for that case, so the test only checks that the submission was refused.

**R-2.21 (question responses).** The ruling said the old test depended on filling in unrelated parts of the proposal. Now every test sends the same complete proposal through the request page, and only the answer to the one question (word limit 30) changes. The three cases are an empty answer, an answer three times over the limit, and an extra answer numbered against a question the opportunity doesn't ask. The last must be refused with "No matching opportunity question.", and the over-limit case must be refused with some other message.

**R-2.22 (organization locked once submitted).** The ruling said the old proposal was incomplete, so no change could be saved at all. The submitted proposals now go through the request page, and the test confirms the service accepted each one as submitted before changing anything. The draft is filled in completely on the form. The organization it is moved to is built so it would be valid for the same proposal: owned by the same vendor, qualified for the program, and with the team member as an active member. There are five tests:
- A submitted proposal still names its original organization after the change is attempted, on both Team With Us and Sprint With Us.
- A withdrawn proposal takes the change, on both programs.
- A draft Team With Us proposal takes the change. There is no Sprint With Us draft test.

**R-2.28 (stages one at a time).** The ruling said the old test failed when a control wasn't on screen. Now the out-of-stage action is attempted and a missing control is tolerated. The test then checks that no score was recorded, and that any wrong-stage message shown carries the criterion's wording. The two cases are a team scenario score on a Sprint With Us opportunity still at its code challenge, and a challenge score on a Team With Us opportunity still at question consensus. I treat these refusals to skip ahead as the evidence for "one at a time".

**R-2.31 (weighted total and rank).** The ruling said the old test timed out reading a rank it couldn't parse as a number. The total test first enters the last missing stage score, so every stage score exists before anything is read. It then checks each proposal's total against its four stage scores in the seeded weights (25/40/15/20). The rank test reads rank where the contract actually shows it: on each vendor's own proposal screen on the seeded awarded opportunity, where both proposals are fully evaluated. The proposal with the higher total must rank first and the other second.

**Clauses recorded as blocked, both owed by `contract`:**
- **R-2.22**, the quoted refusal message. The test shows the refusal from the proposal's state, but it can't read the reason.
- **R-2.31**, "ranked only once fully evaluated". The only rank shown appears after an award, and on the awarded opportunity, the only proposal left behind before the last stage belongs to a vendor with no persona.

**Missing from the surface, for the contract stage:**
- A `choose_organization` action on `proposal-twu-edit` and `proposal-swu-edit`. Today the change is carried only by what `save_changes` is handed, which the contract doesn't describe.
- An observation on those two screens reporting why `save_changes` was refused. `submission_refusal` covers only the submit actions.
- A rank observation an administrator can read during evaluation, on `proposal-swu-view` and `proposal-twu-view` or as a per-proposal rank in the opportunity's proposals tab. Alternatively, a seeded awarded opportunity whose left-behind proposal belongs to a vendor with a persona.
- An observation of the word-limit refusal tied to the specific response. `refusal_by_field` locates refusals only by team, phase, organization or "other fields".

I changed nothing outside `tests/acceptance`.
