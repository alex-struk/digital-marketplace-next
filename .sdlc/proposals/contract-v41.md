---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "This run reopens the contract for G1 as contract-v41."
opened: 2026-10-04T01:52:20.159Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** This run reopens the contract for G1 as contract-v41.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The permission guard in this session refuses any command that expands `$SDLC_BIN`, and it won't let me read the variable's value either. So I could not run `oracle up` or `oracle down`. Since nothing was started, no container was left running.

## Journal

This run reopens the contract for G1 as contract-v41. It changes exactly one thing: the sentence that G1 returned in contract-v40.

**What changed.** The fix is in the block comment on the `proposal-cwu-request` page in `spec/contract/surface.yaml`. That comment tells the test writer how to reach R-2.2, the criterion that a second proposal request is refused with "You already have a proposal for this opportunity." and that no second proposal gets created. The returned version said the service checks for an existing proposal "before it looks at any field." That was wrong.

I checked the old create handler (`sources/old/src/back-end/lib/resources/proposal/code-with-us.ts`). It checks things in this order:
1. The `status` field. If it is missing or invalid, the request is refused under `status` (lines 296–304).
2. The opportunity lookup (line 306).
3. If the status is Submitted and the opportunity is no longer accepting proposals, the request is refused with "This opportunity is no longer accepting proposals." (lines 321–328).
4. An organization proponent that already has a proposal on the opportunity is refused with "Please select a different organization." (lines 331–351).
5. Only then does it check for the vendor's own existing proposal. If one exists, the request is refused under `conflict` with the R-2.2 message (lines 355–369).

The new wording follows the ruler's direction. The second request must carry a valid status, with Draft the safest, and must name a published opportunity that is still accepting proposals. Once it does, the other fields don't change the outcome: the proposal text, the attachments and the individual proponent's details. The refusal comes back under `conflict`, and `refusal_messages` reads it.

The rest of the comment stands as the ruler allowed:
- Send the request with an individual proponent, so the organization refusal can't come first.
- The proposal the vendor already holds may be in any state.
- That no second proposal was made is read on `proposal-vendor-dashboard`, which lists the opportunity once.

The pointer comment on `proposal-cwu-create` is also unchanged. No pages, actions or observations were added or removed. Personas, OpenAPI, observables, the seed and the oracle override are all as the previous draft left them.

**What I could not do.** I did not run `oracle up` or `oracle down`. The command-permission guard in this session refuses any command that expands `$SDLC_BIN`, and it also refuses to print the variable. So this run gives no new evidence on whether the oracle starts. Since nothing was started, nothing was left running. This run edited only a YAML comment, which changes neither the override nor the seed, so whatever the last successful oracle run showed still applies. A later stage, or a person, should still run the start-up check where the CLI is reachable. I didn't run a YAML parse check either (that was blocked too). The edit only touches `#` lines inside an existing comment block.

**Missing test.** The guidance on `proposal-cwu-request` now tells the test writer exactly how to send the second create request and read its refusal. That supplies what R-2.2 lacked.

re-address missing-test/R-2.2 to derive-tests: proposal-cwu-request now says how to reach the refusal. Use submit_with_individual_proponent to send a second create request with a valid status (Draft) against a published opportunity still accepting proposals, then read the "You already have a proposal for this opportunity." refusal under conflict through refusal_messages. Read "no second proposal" on proposal-vendor-dashboard.
