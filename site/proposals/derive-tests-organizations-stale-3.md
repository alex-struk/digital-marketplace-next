| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-15T05:46:56.435Z |
| holder | agent:reviewer |

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote tests for three of the four organizations criteria (R-3.3, R-3.12, R-3.13).

I rewrote tests for three of the four organizations criteria (R-3.3, R-3.12, R-3.13). R-3.28 can't be tested with what the contract and seed give me, so I deleted its old test and recorded it as blocked in `not-testable.yaml`. None of the new tests has been run or typechecked: both the typecheck and a parse of the YAML file needed approval I didn't have. The only check I could run was a text search of the three new files for the patterns the separation check refuses, and nothing matched. Each file starts with the requested header at spec 2d9a83e and imports only from the fixtures.

All three rewrites answer the notes that sent the earlier tests back. They start from the seed rather than re-checking state, because the fixtures restore the seed before every test. Where the criterion promises a refusal but no message, an attempt the page won't let through doesn't fail the test. What the test checks is that nothing changed.

**R-3.3 (who can open an organization's full record): five tests.** Each uses the seeded qualified organization. The ordinary member and the public sector staff member are each refused. The owner, the organization's administrator and a service administrator each see it. The earlier version stopped early because it relied on staff being shown a permissions statement, which staff without administrator rights aren't shown. Refusal is read as the organization's name not appearing on its management page, following the criterion's note that the member gets a "not found" page.

**R-3.12 (granting and withdrawing administrator rights): three tests.**
- The owner grants administrator rights to the ordinary member.
- The existing administrator tries to withdraw their own rights.
- A service administrator tries to change the owner's rights.

Nothing on the team surface shows a member's role. So I read administrator rights by what they allow: opening the management page, which R-3.3 says an ordinary member is refused. After the grant, the member can open it. After the self-withdrawal attempt, the administrator still can. After the attempt on the owner, the owner still owns the organization and can still open it.

**R-3.13 (transferring ownership): four tests.** The seeded organization with a pending invitation already has an owner and a pending invitee. Each test adds the active member the criterion's starting state describes: the owner invites them and they accept from their own organizations list.
- A service administrator transfers ownership, and the member becomes the owner.
- The previous owner no longer owns it, still belongs to it, and is refused the management page. That last check is the only way to tell an ordinary member from an administrator.
- Transfer to the pending invitee leaves ownership unchanged.
- The owner trying the transfer themselves leaves ownership unchanged.

The earlier note said accepting an invitation couldn't be done; `approve_invitation` on the signed-in person's own organizations list now does it. I dropped the organizations the previous version created for itself.

**R-3.28 (setting approved service areas): blocked.** The criterion's starting action ticks a third service area next to the two already approved. The seed only ever names two (full-stack developer and agile coach), and the contract names none. Using any other value would mean inventing one. Testing with only the two known areas can't tell a save that replaces approvals from one that adds to them, which is the whole claim. It would be unblocked by either of these:
- a seed record carrying a third service area;
- an observation on `organization-edit` listing the service areas offered for selection.

The other half of the criterion, that the owner is offered no editing control, has no observation either.

Surface additions that would firm these up:
- **`organization-edit.member_role`** (or similar): reads whether a named team member is owner, administrator or ordinary member. R-3.12 and the previous-owner check in R-3.13 currently infer the role from being let into the management page, which ties them to R-3.3.
- **`organization-edit.service_areas_editable`**: whether the service-area editing control is offered to the signed-in person.
- **Service areas offered** on `organization-edit`, or a seed handle carrying a third area.
- **Change-owner candidates**: an observation of who `change_owner` offers, and whether the action is offered at all. R-3.13 currently infers both from ownership staying put.
- **A refusal observation** on `organization-edit`, so a refused read can be told from a page that hasn't loaded. The refusal tests in R-3.3 would currently also pass on a page that simply hadn't loaded yet.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the organizations tests follow from their criteria and nothing else, and is every not-testable reason real? Ruling: return. R-3.3, R-3.12 and R-3.13 follow from their criteria. The seed matches each starting state. Administrator rights are read through what R-3.3 says they allow, so a refused change that went through would fail the test. Accepting an invitation is now bound. Every action and observation the tests use is bound, so the catch-and-ignore wrapper cannot hide an unbound error, and approved tests for R-6.17 and R-7.25 already use it. No implementation detail leaks in, and the runner's typecheck passed. R-3.28's not-testable reason is not real as written. It says a test built on the two seeded service areas cannot tell a save that replaces approvals from one that adds to them. It can: start from both seeded areas, clear one and save; replacement leaves only the kept area and addition leaves both, and service_area_checkbox, edit_service_areas and save_service_areas are all bound. It also blocks the owner half for lack of an observation, while this same proposal tests refusals by trying the action and confirming nothing changed. Only the criterion's example of ticking an unnamed third area is genuinely out of reach; the spec mentions five recognised areas but names none. Caveat, not a reason to return: the refusal checks in R-3.3 and the last check in R-3.13 read the page once and would pass on a page that has not loaded; the proposal's requested refusal observation would close that. What would change the ruling: an R-3.28 test on the two seeded areas, or a not-testable reason that names only the missing third area and drops the false claim, with R-3.3, R-3.12 and R-3.13 unchanged.

**Conditions:**
- R-3.28: write the test for what the surface reaches. Start from the two seeded approvals on seed.organizations.qualified. A service administrator clears one and saves, and service_area_checkbox shows exactly the kept area and not the cleared one. The organization's owner then tries to edit and save the service areas, and the approvals are unchanged.
- R-3.28: if the block is kept instead, its reason must say only that the criterion's example ticks a third service area that no seed record or contract entry names. Remove the claim that two areas cannot tell replacement from addition, and remove the claim that the owner half needs a new observation.
- R-3.3, R-3.12 and R-3.13 need no change and should come back as they are.

### Runner-owned typecheck evidence

Proposal revision: `6947a9e80c600cf15263761aaec9dfcd259f970b`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/organizations/`, which this proposal answers for.

    No diagnostics.
