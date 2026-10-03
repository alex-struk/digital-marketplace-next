| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T14:48:40.143Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote both tests the ruling sent back.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote both tests the ruling sent back. Neither one now has a person drive a control the criterion says they must not have. Each criterion got a test for the part the surface can reach. The rest of each criterion has an entry in `tests/acceptance/not-testable.yaml`, owed by `contract`. I could not run the type check or a YAML parse: both commands needed approval, and there is nobody here to give it. The tests use only surface members and seed fields that the previous version already used and that appear in `tests/generated`.

**R-3.2.** The test signs in as `persona.vendor` and registers an organization through `organizationCreate`. It then confirms the organization appears in that vendor's owned organizations, opened with `seed.users.vendorOne.id`. I removed the public-sector-staff test entirely. The criterion only says staff's request is refused, and the application refuses by not offering the screen at all. `organizationCreate` only offers `fieldError` and `submitDisabledUntilValid`, and no request-level page sends a registration as the signed-in person. So nothing the surface offers can read that refusal. The `not-testable.yaml` entry for R-3.2 names the clause "a request from anyone else is refused" and marks it `blocked:`.

**R-3.18.** The test keeps the earlier read-only check. The owner's organization tab is read first, so we know the Edit and Archive controls are offered on the page at all. Then the organization administrator's tab must show the organization's name and contain neither "Edit" nor "Archive". I dropped the two old tests that had that administrator press `editOrganization`/`saveChanges` and `archiveOrganization`, which the ruling objected to. The only way the surface sends a profile change or an archive is through those controls, so the clause "the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator" cannot be asserted today. Its entry is marked `blocked:`.

**What the contract would need to add:**
- On `organization-create`: an observation such as `refused_when_not_permitted`, reporting the screen or the registration refused to signed-in public-sector staff (on the old application this was the not-found page). Alternatively, an organization-create request page that sends a registration and reports a refusal.
- An organization request page, opened with `orgId`. It would have actions that send a profile change and an archive as the signed-in person (for example `change_profile_by_request` and `archive_by_request`), and observations `request_accepted` and `refusal_status`. This would work like `content-request` or `affiliation-approval-request` in other domains.

Nothing in this run required touching any of the read-only paths.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten organizations tests follow from R-3.2 and R-3.18 and from nothing else? Ruling: return. R-3.2 is sound: its test asserts only the vendor half (the vendor registers and the organization appears among that vendor's owned organizations), and the not-testable entry for 'a request from anyone else is refused' names a real gap, because organization-create offers no observation that reports a refusal. R-3.18's test is faithful in what it asserts: the owner's tab offers Edit and Archive, and the organization administrator's tab shows the profile with neither. The refusal clause's not-testable entry is genuine, because the only way the surface sends a change or an archive is through controls the criterion requires to be absent. But the criterion also says the controls are offered to 'the organization's owner or a service administrator', and no test asserts the service-administrator half and no not-testable entry names it. The surface reaches it with the same organizationEdit.open/organizationTab reads under persona.administrator, which the suite already uses, so this is a clause the writer could assert and did not. That is a return, not a note on an approval. The R-3.2 not-testable reason also explains only public-sector staff, while the clause 'anyone else' also covers a vendor who has not accepted the terms. What would change the ruling: the R-3.18 test also reads the organization tab as a service administrator and finds both Edit and Archive offered, and the R-3.2 entry's reason accounts for a vendor without accepted terms, or a test asserts that refusal if the surface reaches it. This proposal settles neither build-slice-11-3#1 nor #2, so both stay open.

**Conditions:**
- R-3.18: the clause 'the Edit and Archive controls … are offered … to a service administrator' is asserted by no test and has no not-testable.yaml entry. In tests/acceptance/organizations/R-3.18.spec.ts, sign in as persona.administrator, open organizationEdit with seed.organizations.qualified.id, and assert that the organizationTab reading contains both 'Edit' and 'Archive'.
- R-3.2: the not-testable.yaml entry for the clause 'a request from anyone else is refused' gives a reason only for a signed-in member of public sector staff. Extend the reason to cover a signed-in vendor who has not accepted the terms and conditions (persona.vendorWithTermsReset), saying what the surface lacks to read that refusal. If the surface does reach that refusal, assert it in R-3.2.spec.ts instead.

### Runner-owned typecheck evidence

Proposal revision: `8192a6c2ed62a7fdfaea12e0c95ade88598b0bc9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
