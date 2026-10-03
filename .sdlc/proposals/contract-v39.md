---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added one page to the surface so the R-3.11 test can reach the sole-owner refusal."
opened: 2026-10-03T17:01:18.995Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added one page to the surface so the R-3.11 test can reach the sole-owner refusal.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added one page to the surface so the R-3.11 test can reach the sole-owner refusal. I couldn't run the oracle: the permission layer refused every command that expands `$SDLC_BIN`, so `node $SDLC_BIN oracle up` and `oracle down` never ran.

**The problem from the build-slice-12 ruling.** The surface's only way to end a membership was the team tab's Remove control, which the `organization-edit` page exposes as `remove_team_member`. The team screen never shows Remove on the sole owner's row. So no test could make the attempt and see the refusal.

**What the old service does.** `sources/old/src/back-end/lib/resources/affiliation.ts:518`: when someone asks to delete a membership (`DELETE /api/affiliations/:id`), the service first checks whether it is an owner's membership and whether the organization has exactly one active owner. If so, it refuses with status 400 and `{ affiliation: ["Unable to remove membership. This is the sole owner for this organization."] }`. This check runs before the permission check, so an administrator gets exactly this refusal. `spec/contract/openapi.yaml` already describes the route as `deleteAffiliation`.

**What I added.** A new page, `affiliation-removal-request`, in `spec/contract/surface.yaml`:
- **Route:** `/api/affiliations/:affiliationId`, domain `organizations`, title "End a membership, by request".
- **Action:** `end_membership_by_request`.
- **Observations:** `request_accepted`, `refusal_messages` and `refusal_status`.
- **Shape:** it copies the existing `affiliation-approval-request` page at the same route. The surface already has several pages sharing one route, so this is an established pattern.
- **Comment:** the page names `affiliations.qualifiedOwner` as the value for `:affiliationId`. That is the "Blake Placeholder" user's owner membership of `organizations.qualified`, which already has exactly one owner and two other active members. That is the criterion's given-clause, so the seed needed no change.
- **"The membership remains":** a test reads this afterwards from `organization-edit`'s existing `team_member_row` and `owner_badge`.

Nothing else changed: no persona, observable, seed, openapi or compose edits, and no existing page was touched.

**Oracle and checks.** The oracle override and seed are unchanged since the last approved run, but I have no fresh evidence that it starts. No container was started by this run, so none is left running. The YAML parse check also needed approval and didn't run. I read the edited region back instead, and the indentation matches the neighbouring entries.

**One thing to expect at calibration.** The criteria file notes (dated 2026-09-29) that the old application fails R-3.11. A test written against this page may therefore fail against the oracle while still being correct for the rebuild. That would be the old application's defect, not a gap in the contract.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the contract the tests will act through, now that it has one added page for R-3.11? Ruling: approve. The build-slice-12 ruling found that the surface had no way to attempt ending the sole owner's membership: the team tab offers Remove on no owner's row, so the remove_team_member binding could never reach the refusal R-3.11 asks to observe. The new affiliation-removal-request page fills exactly that gap. The evidence supports it. sources/old/src/back-end/lib/resources/affiliation.ts:518-530 refuses to delete an OWNER membership when readActiveOwnerCount is 1, with 'Unable to remove membership. This is the sole owner for this organization.', and runs that check before the permission check at :533, so an administrator sees this refusal. tests/seed/manifest.yaml:358-375 makes affiliations.qualifiedOwner the single active OWNER of organizations.qualified, alongside one active ADMIN and one active MEMBER, which matches the criterion's given-clause, so no seed change is needed. The page follows the established pattern of affiliation-approval-request, which shares the route, and gives refusal_messages, refusal_status and request_accepted to observe. The 'membership remains' clause is read from organization-edit's existing team_member_row and owner_badge. The change only adds and touches no existing page. The surface.d.ts addition matches the YAML. This settles the reviewer's contract revision request request/build-slice-12#14. The build-owed conditions build-slice-12#1 (R-3.7) and build-slice-12#2 (R-3.30) are not touched by a contract change and stay open. What would change this ruling: evidence that the oracle does not start, or that the YAML fails to parse (neither was run here); or a calibration finding that the page cannot be bound to the service. A failing R-3.11 test against the old application at calibration would not change it, because the criteria already record that the old application fails R-3.11, and that is a defect-in-old question for calibration, not a contract gap.

**Conditions:**
none
