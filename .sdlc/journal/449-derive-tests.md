---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-03T14:50:26.763Z"
cost: 0.39725819999999995
turns: 11
session: "f5412d95-88ac-4216-9761-16ac19d4648c"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I acted on both conditions. I changed only `tests/acceptance/organizations/R-3.18.spec.ts` and the R-3.2 entry in `tests/acceptance/not-testable.yaml`; every other file and entry is as I found it.

**Condition 1 (R-3.18).** I added a second test to `R-3.18.spec.ts`, titled with the criterion's own clause: "the Edit and Archive controls on an organization's management page are offered to a service administrator". It signs in as `persona.administrator`, opens `organizationEdit` with `seed.organizations.qualified.id`, reads the `organizationTab` observation and asserts it contains both "Edit" and "Archive". It is a separate test, not more assertions on the existing one, because it is a separate outcome of the criterion. The existing owner/organization-administrator test, the header (including its derived date, which is already today's) and the R-3.18 entry for the server-side refusal clause are unchanged.

**Condition 2 (R-3.2).** I first checked whether the surface can show the refusal for a vendor who has not accepted the current terms (`persona.vendorWithTermsReset`). It cannot:
- **No refusal observation:** organization-create reports only `field_error` and `submit_disabled_until_valid`, so nothing says a registration was refused for want of accepted terms.
- **No usable fallback:** the only other place to look is that vendor's own owned-organizations table, and a missing organization there cannot tell a refusal apart from a form that was never shown or never sent.

So the clause stays `blocked:` with owner `contract`, and no new assertion went into `R-3.2.spec.ts`. I extended the entry's `reason` to give this explanation for the terms-reset vendor alongside the public-sector-staff one. I also widened `missing` so the suggested observation (such as `refused_when_not_permitted`) covers both kinds of person, so the contract stage can supply one observation for both.

**Gap for the contract stage.** One gap is still missing from the surface: organization-create has no observation that reports a refusal, and there is no request page that sends a registration as the signed-in person and reports its refusal. The R-3.18 refusal clause stays owed to the contract stage as it was before.

**Checks.** I could not run the YAML parser or the TypeScript compiler, because those commands were not approved in this session. I checked the edited YAML by eye instead: the reason is still one double-quoted string and `missing` contains no stray `: `. The new test uses only methods that `tests/generated/surface.d.ts` declares, and `persona.administrator` and `seed.organizations.qualified` exist in the generated personas and seed.