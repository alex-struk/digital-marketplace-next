---
gate: G1
question: "Should R-4.10 and R-4.11 become obsolete in favour of their already accepted replacements?"
recommendation: "Route the spec-state conditions from the returned G3 review to G1; obsolete only R-4.10 and R-4.11, then let ratify regenerate the spec."
opened: 2026-09-08T23:45:23.989Z
---

# Should R-4.10 and R-4.11 become obsolete in favour of their already accepted replacements?

**Recommendation.** Route the spec-state conditions from the returned G3 review to G1; obsolete only R-4.10 and R-4.11, then let ratify regenerate the spec.

## Source feedback

This is a cross-stage follow-up to the returned G3 proposal `derive-tests-users-4`, recorded in `.sdlc/gates/derive-tests-users-4.yaml` and its proposal page. The reviewer found that the receipt claimed spec changes which were absent from the branch. The test derivation stage cannot change the spec, so this decision is routed to the G1 owner rather than sent back to that stage.

## Decision sought

R-4.10 v1 remains accepted but already carries `superseded-by: R-4.19`; it describes a reactivation control that the accepted replacement says should not be offered. R-4.11 v1 remains accepted but already carries `superseded-by: R-4.20`; it describes notification wording contradicted by the accepted replacement. Review those four criteria in `spec/domains/users.md` and decide only whether the two replaced records should become obsolete.

No new behaviour, replacement criterion, test, contract surface, or seed is proposed. Preserve the existing supersession links and notes. The other superseded criteria are outside this follow-up.

## Ratification conditions

If approved, return these two machine-readable conditions, one per string in the ruling conditions array:

- obsolete R-4.10: superseded by R-4.19
- obsolete R-4.11: superseded by R-4.20

Those reason strings already occur in the respective notes, so ratify will not add a duplicate note. Use the ratification grammar, not prose instructions to edit a file. If either change is unwarranted, return this proposal with the reason rather than adding unrelated conditions.

## Completion

After a G1 approval, `sdlc run ratify --domain users` will apply the approved conditions and regenerate `spec/spec.md` and `spec/criteria-index.json`. No claim is made that these changes have already happened. The returned test proposal stays historical; acceptance work resumes only after the spec owner has completed this follow-up.

## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is whether the two users criteria whose behaviour has already been replaced should be recorded as not carried forward, and the ruling is approve on exactly the two the proposal names, with nothing else touched. I read the domain file rather than the receipt: R-4.10 v1 and R-4.11 v1 both still read '- state: accepted' at lines 153 and 168, both carry 'superseded-by' and a matching note at 154-156 and 169-171, and their replacements R-4.19 and R-4.20 are present at 268-276, accepted, and each carries a 'replaces' link back. So the branch state matches what the proposal claims and no spec edit has been smuggled in ahead of the ruling - the diff is the proposal page and the run record alone. Obsolete is the right verb and not a soft one: the recovered rows stay, with their statements, citations, reconciliation and notes intact, so the record of what the old application did survives, while the behaviour itself stops being a thing anything downstream can build against. Nothing is lost in the substitution, which is the test I applied to each. R-4.10's whole content is that the interface offers a reactivation control the service will always refuse for a self-deactivated account; R-4.19 both hides that control and states in terms that the service continues to refuse such a request, so the refusal - the part a rebuild could actually get wrong - is carried, not dropped. R-4.11's content is that the wrong notification is sent; R-4.20 says which message is sent for an administrator reactivation and confines the self-reactivation wording to the case where the person really did sign back in, so the defect is answered rather than forgotten, and R-4.9's note at line 140 independently preserves the distinction between the two kinds of inactivity that both rows depend on. The two reason strings requested are already the note text on each row, so ratify adds no duplicate. I am not raising anything to confirmed here and there is nothing to spike: both rows were recovered confirmed, this is their first ruling, and neither is being decided on hope. Two things to carry forward that are not conditions. R-4.7 and R-4.15 carry the identical structure - accepted, superseded by an authored R-4.18 and R-4.21 - and are left accepted by this ruling, which leaves the users domain treating five superseded rows in two different ways; the proposal scopes them out openly rather than quietly, so I am ruling as asked, but that inconsistency should be settled in its own follow-up before acceptance work resumes, not left to whoever next reads the file. And the generated and tests checks fail on this branch; they fail because spec/, tests/ and the generated surface are untouched here, so those failures are inherited from main and are not evidence about this proposal, but they are real and the ratify regeneration this approval unblocks does not fix them. Not escalating: the tier is STANDARD, the stage reported no confidence shortfall, and there is only one plausible reading of the intent. What would change this ruling: R-4.19 or R-4.20 turning out not to be accepted, either replacement failing to carry the refusal or the corrected wording that its predecessor recorded, or a spec edit to these rows already present in the branch, which would make the ruling a rubber stamp on work already done rather than a decision.

**Conditions:**
- obsolete R-4.10: superseded by R-4.19
- obsolete R-4.11: superseded by R-4.20
