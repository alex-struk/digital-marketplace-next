---
gate: G3
question: "Do the revised organizations tests now follow from their criteria and from nothing else?"
recommendation: "I acted on both conditions."
opened: 2026-10-03T14:50:26.804Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** I acted on both conditions.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I acted on both conditions. I changed only `tests/acceptance/organizations/R-3.18.spec.ts` and the R-3.2 entry in `tests/acceptance/not-testable.yaml`; every other file and entry is as I found it.

**Condition 1 (R-3.18).** I added a second test to `R-3.18.spec.ts`, titled with the criterion's own clause: "the Edit and Archive controls on an organization's management page are offered to a service administrator". It signs in as `persona.administrator`, opens `organizationEdit` with `seed.organizations.qualified.id`, reads the `organizationTab` observation and asserts it contains both "Edit" and "Archive". It is a separate test, not more assertions on the existing one, because it is a separate outcome of the criterion. The existing owner/organization-administrator test, the header (including its derived date, which is already today's) and the R-3.18 entry for the server-side refusal clause are unchanged.

**Condition 2 (R-3.2).** I first checked whether the surface can show the refusal for a vendor who has not accepted the current terms (`persona.vendorWithTermsReset`). It cannot:
- **No refusal observation:** organization-create reports only `field_error` and `submit_disabled_until_valid`, so nothing says a registration was refused for want of accepted terms.
- **No usable fallback:** the only other place to look is that vendor's own owned-organizations table, and a missing organization there cannot tell a refusal apart from a form that was never shown or never sent.

So the clause stays `blocked:` with owner `contract`, and no new assertion went into `R-3.2.spec.ts`. I extended the entry's `reason` to give this explanation for the terms-reset vendor alongside the public-sector-staff one. I also widened `missing` so the suggested observation (such as `refused_when_not_permitted`) covers both kinds of person, so the contract stage can supply one observation for both.

**Gap for the contract stage.** One gap is still missing from the surface: organization-create has no observation that reports a refusal, and there is no request page that sends a registration as the signed-in person and reports its refusal. The R-3.18 refusal clause stays owed to the contract stage as it was before.

**Checks.** I could not run the YAML parser or the TypeScript compiler, because those commands were not approved in this session. I checked the edited YAML by eye instead: the reason is still one double-quoted string and `missing` contains no stray `: `. The new test uses only methods that `tests/generated/surface.d.ts` declares, and `persona.administrator` and `seed.organizations.qualified` exist in the generated personas and seed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the revised organizations tests follow from their criteria and from nothing else, and they do, so I approve. R-3.18 now has a test asserting that a service administrator's reading of the organization management page contains Edit and Archive. Together with the existing test, which checks the owner's reading has both and the non-owner organization administrator's reading shows the profile with neither, every person the criterion names is covered. The clause that the service refuses a profile change or archive request remains a not-testable entry owed by the contract stage, with a real reason: the only way the surface sends those requests is through controls the criterion requires to be absent. R-3.2 asserts the accepted-terms vendor's organization is created. Its refusal entry now covers both the public sector staff member and the terms-reset vendor, and the reason is real: organization-create offers only field_error and submit_disabled_until_valid, and a missing organization cannot tell a refusal from a request never sent. Removing the old refusal tests is correct, because they inferred a refusal from absence, which the criterion does not support. Every assertion follows from the criterion text, no implementation detail leaks in, and the runner's typecheck passed. This would become a return if the contract stage supplies a refusal observation and these tests are not then extended to assert it.

**Conditions:**
- condition-met derive-tests-organizations-stale-10#1: tests/acceptance/organizations/R-3.18.spec.ts adds the test 'the Edit and Archive controls on an organization's management page are offered to a service administrator', which signs in as persona.administrator, opens organizationEdit for seed.organizations.qualified and asserts the organizationTab reading contains 'Edit' and 'Archive'
- condition-met derive-tests-organizations-stale-10#2: the R-3.2 entry in tests/acceptance/not-testable.yaml now gives the reason for persona.vendorWithTermsReset (no observation on organization-create reports a refusal for want of accepted terms, and absence from the owned-organizations table cannot tell a refusal from a form never sent), and its missing field covers both kinds of person

### Runner-owned typecheck evidence

Proposal revision: `c1e8aacd200a5cf6e2c2dc68ed2c3905ee26e0a7`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
