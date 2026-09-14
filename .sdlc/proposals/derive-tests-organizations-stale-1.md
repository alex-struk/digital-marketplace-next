---
gate: G3
question: "Do these tests follow from the organizations criteria and from nothing else?"
recommendation: "# All five organizations criteria now have a test; none were set aside as untestable\n\n**The files:** `R-3.3`, `R-3.7`, `R-3.8`, `R-3.15` and `R-3.32` under `tests/acceptance/organizations/`."
opened: 2026-09-14T23:41:37.583Z
---

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** # All five organizations criteria now have a test; none were set aside as untestable

**The files:** `R-3.3`, `R-3.7`, `R-3.8`, `R-3.15` and `R-3.32` under `tests/acceptance/organizations/`.

# All five organizations criteria now have a test; none were set aside as untestable

**The files:** `R-3.3`, `R-3.7`, `R-3.8`, `R-3.15` and `R-3.32` under `tests/acceptance/organizations/`. I added nothing to `not-testable.yaml`. Each file already had a test derived from an older spec commit. I rewrote every one with the new header and fixed several places where the old test didn't match the criterion's given/when/then.

**Checks:** a scan of the five files found no selectors, locator calls, test ids, routes or imports from outside `fixtures` and `generated`. I could not type-check them because the TypeScript compiler isn't installed in `tests/`. Every action on the surface takes an untyped input and every seed field I use exists in `generated/seed.ts`, so I don't expect type errors. Nothing has been run against a target.

## What changed and why

- **R-3.3 (who may open an organization's full record):** the old file had five tests, one per person. The criterion has one scenario with two outcomes, so it is now two tests.
  - One test: the ordinary member and public sector staff are refused.
  - The other: the owner, the organization's administrator and a service administrator each see the organization.
  - The page has no refusal or not-found observation. Refusal is read as the organization tab not showing the legal name. The second test shows that same reading does show the name to someone allowed to see it.
- **R-3.7 (invitations are created pending):** the old test only checked the pending badge after inviting, which would pass even if the badge was always there. It also used a Sprint With Us requirement as a stand-in for team size. Now, on the seeded organization whose owner is its only member, the test checks:
  - no pending badge before inviting and one after;
  - both invited addresses appear on the team list;
  - the owner's own team count on their memberships page (`organizationUserMembershipsSelf.teamMemberCount`) reads the same before and after.
- **R-3.8 (only active vendors, never twice):** still two tests.
  - Each now checks that the team list is unchanged by the refused invitation.
  - Each checks the refusal gives the criterion's reason: the error mentions "member" for the repeat invite and "vendor" for the public sector invite. These word matches are a guess at the wording; if the target words its errors another way, only that line needs changing.
- **R-3.15 (organizations a vendor may act for):** the criterion describes one vendor who owns one organization, administers one, is a plain member of one and owns an archived one. The old test spread this across three people. The new test builds it for the organization administrator persona:
  - the owner of the unqualified organization invites them, and they accept;
  - they register one organization, and register and archive another.
  - The test then reads the "my organizations" filter on the organization list. Only the owned and administered ones should appear.
  - I took that filter to be the "organizations one may act for" list because of the contract's comment on `organization-list`.
- **R-3.32 (owner told of a declined invitation):** the old test created a new invitation. The new one uses the seeded pending invitation, which is the criterion's given.
  - It confirms the invitation is on the team list and clears the mail catcher.
  - The invited vendor declines from their own memberships page.
  - It then waits for a message to the owner whose subject or snippet mentions a rejection, and checks the invitation is gone from the team list.

## Gaps in the contract

None of these blocked a test, but each weakens one:
- **`organizationEdit.refusedWhenNotPermitted`** (or a not-found observation), the way the file pages have them. Without it, R-3.3's refusal can only be read as a missing name, which can't tell a refusal from a page that failed to load.
- **Per-row team observations on `organizationEdit`**, such as a membership status for a given member. `pendingBadge` and `teamMemberRow` read the whole list, so R-3.7 can't show that each invitee is pending, only that someone is.
- **A mail accessor that reads one message's body.** R-3.32 matches "reject" against the subject and snippet only. If the target puts that word only in the body, the test fails for the wrong reason. The contract already names this read (`read_one_message`), but the mail fixture doesn't offer it.
