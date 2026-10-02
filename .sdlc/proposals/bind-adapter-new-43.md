---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I checked the three blocked criteria (R-6.17, R-1.35, R-1.36) again on the running target, and they still can't be bound."
opened: 2026-10-02T10:48:17.429Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I checked the three blocked criteria (R-6.17, R-1.35, R-1.36) again on the running target, and they still can't be bound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I checked the three blocked criteria (R-6.17, R-1.35, R-1.36) again on the running target, and they still can't be bound. Both members they depend on stay `unbound`. The only change in this revision is one sentence added to each of their two reasons in `tests/adapters/new/bindings.yaml`, recording this latest look. I didn't change `index.ts`: the messages it throws at run time already match what the build shows. I didn't re-validate the YAML; the added text contains no quote characters, so it shouldn't break anything.

The ruling found no fault in the adapter. It returned the proposal because the tests rely on two members the criteria don't mention. Its condition for this stage is that the adapter's unbound reasons still hold against the build. I signed in as the organization-owner vendor through the identity provider's own form, using the variable name in the password field as instructed.

- **`proposal-vendor-dashboard.show_my_proposals`** (needed by R-1.35 and R-1.36): `/dashboard` still shows only the heading "Dashboard" and "You are signed in as Blake Placeholder." There is no tab, link or button on it. This vendor wrote a seeded proposal, so if a "My Proposals" control existed anywhere, it would appear for them. Earlier looks, already in the reasons, cover `/dashboard?tab=myProposals`, `/proposals`, the seeded Code With Us opportunity pages and the proposal's own screen. All of those either answered "Page not found" or offered nothing.
- **`organization-edit.add_team_members`** (needed by R-6.17): `/organizations/:orgId/edit?tab=team` for the seeded qualified organization answers "Page not found", and so does `/organizations/create`. Earlier looks, as both the administrator and the owner, cover `/organizations`, both seeded organizations' edit screens and the profile's Organizations tab. That tab says organizations will be listed once they can be registered, and `/api/ownedOrganizations` returns 404.

No other route resolved differently from the previous binding. The organization and proposal routes still answer "Page not found" on this build, and the vendor dashboard still offers no controls.

Three conditions in the ruling go to the stage that writes the tests, and I left them alone as instructed:
- R-6.17's test should check that a deactivated account watching a published opportunity is left off its notices, both visible and blind-copied recipients, instead of sending an organization team invitation.
- The R-1.35 and R-1.36 tests should stop confirming their starting condition through the vendor's "My Proposals" listing.

Once those tests are regenerated without those two members, they no longer depend on anything this adapter reports as unbound. I didn't write anywhere outside `tests/adapters/new/`.
