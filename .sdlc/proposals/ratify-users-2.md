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
