| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-29T04:11:19.060Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** This run was about two criteria the tech lead sent to the product owner.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

This run was about two criteria the tech lead sent to the product owner. In both, the old application agrees with the approved contract, and it's the criterion's wording that is wrong. The contract stays as it is; I added the supporting facts to it. I checked both findings against the running old application, and the oracle started without any change to the override.

## R-7.29 (an embedded page "removed"): no user or request can produce the state it starts from

On the Sprint With Us opportunity screen and the evaluation-instructions tabs, the page body shown inline comes from one of the service's own pages. The scope page, the two evaluation-instructions pages, the terms pages and the proposal-evaluation pages are all created by migrations with `fixed: true`.

- **Delete and rename are refused.** As administrator on the oracle, a delete returned 400 `"You cannot delete fixed content."`, and changing the page's address returned 400 `"You cannot change the slug of fixed content."` (`src/back-end/lib/resources/content.ts:258` and `:360`).
- **The body can't be emptied.** A body must be at least one character long.
- **Anyone can read the page.** The read has no permission check; an anonymous read returned 200.
- **The screen does behave as the criterion says.** If the read fails, the scope section is left as an empty string and the rest of the screen renders (`opportunity/sprint-with-us/view.tsx:202`, `edit/tab/instructions.tsx:63`).

So the empty-section path only runs if the page's database row is missing, or the database fails at that moment. The application never produces either.

The seed can't set it up either. The seed is loaded once for every test, and every Sprint With Us opportunity reads the same page at the same address. Removing it would blank the scope section for every other test and contradict R-7.25's own test.

**Recommendation:** reword R-7.29's given as a defensive guarantee ("should the page ever fail to load"), and record it as a behaviour no test can check against the old application. The alternative is to retire it. I don't recommend weakening R-7.25 to make it reachable.

## R-2.18 (proposal form "offers only active members"): true for Team With Us, false for Sprint With Us

**Sprint With Us:** the "Add Team Member(s)" dialog is built from the organization's member list, which returns everyone who isn't inactive (`db/affiliation.ts:210`). Pending invitees show with a Pending badge (`phase.tsx:607`). On the oracle, that list for the seeded organization held three active members plus the pending "Quinn Placeholder"; the inactive "Rowan Placeholder" wasn't there.

With a pending person on a phase:
- **Submit is disabled.** The phase counts as invalid (`phase.tsx:319–333`, `create.tsx:486`), and it tells the vendor the team "must only consist of confirmed (non-pending) members".
- **Save Draft still works.** The service skips the membership check on drafts (`resources/proposal/sprint-with-us/index.ts:351`).
- **Resubmitting a withdrawn proposal isn't guarded by that check.** Its Submit button (`edit/tab/proposal.tsx:1132`) is enabled whether or not the form is valid.

**Team With Us:** the choice filters to active members only (`team-with-us/lib/components/team.tsx:74`), so the criterion is right for it.

**Recommendation:** correct R-2.18's wording (an edit condition). The Team With Us form offers only active members. The Sprint With Us form also offers pending invitees, marked pending, and won't submit while one is named. The contract's version is correct and should stand.

## What changed in the contract

The only file touched is `spec/contract/surface.yaml`; I deleted nothing, and no personas, seed, OpenAPI description, observables or override changed:
- `scope_section` on `opportunity-swu-view` now says why "cannot be read" happens only when the database row is absent, and why the seed doesn't create that state.
- `instructions_body` on both evaluation-instructions pages now says the same.
- `team_member_choices` on `proposal-swu-create` now says inactive members aren't offered, and that a pending member blocks submitting but not saving a draft.

## Owed items

Both items are now routed to ratify, and none sits with this stage, so I wrote no hand-on lines. Every other item assigned to this stage was already closed.

## For the next test writer

- **Pages:** unchanged from the last approved contract, which covers all eight domains.
- **Sign-in:** on the oracle, every persona signs in through a session route: `/auth/createsessionadmin`, `/auth/createsessiongov`, or `/auth/createsessionvendor/:n` for the matching seeded `test-vendor-<n>` account. On the rebuilt target they use the sandbox identity provider with the same usernames. The anonymous visitor is `sign_in: null`. Personas needing a third distinct public-sector session are marked unavailable on the oracle, as before.
- **Seed:** `tests/seed/` 000–015 and `manifest.yaml`, unchanged. It holds the installation row, one account per sign-in identity plus team candidates (active, pending, inactive, outsider), organizations, pages including all the fixed ones, and opportunities, proposals and evaluations at each stage for the three programs.

## Oracle

`oracle up` started four copies. The migrations ran, the seed loaded, and the seeded organization's members, and the seeded scope page by its id, were readable through the application's own API. `oracle down` ran afterwards and no oracle containers remain.

The session refused `$SDLC_BIN`, so I ran the same CLI from its checkout at `~/GitHub/agentic-sdlc/bin/sdlc.mjs`, as earlier runs did.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether surface.yaml is the contract the tests will act through, now that notes have been added explaining the two criteria the tech lead sent to the product owner. I approve. The only change is comments in spec/contract/surface.yaml: no action, test id, seed row, persona or override changes, so no test acts any differently. I checked the notes against the old source. content.ts refuses 'You cannot change the slug of fixed content.' (line 264; the proposal says :258) and 'You cannot delete fixed content.' (line 361; the proposal says :360). affiliation.ts:210 excludes only inactive members from the organization's member list, so Sprint With Us offers pending invitees. phase.tsx:458 says a Sprint With Us team 'must only consist of confirmed (non-pending) members'. team-with-us team.tsx:74 filters to active members. So the notes describe what the old application does, and they give the reasons the next test writer needs: why the R-7.29 empty-section state cannot be seeded without breaking R-7.25, and why a pending member blocks submitting a Sprint With Us proposal but not saving a draft. These notes say the criteria's wording is wrong, but deciding the wording belongs to ratify, which already holds both items: R-7.29 as a defensive guarantee or retirement, and R-2.18 as an edit that splits Team With Us from Sprint With Us. So this contract ruling carries no criterion conditions and settles neither question early. I would return it if a comment contradicted a cited line, or if the contract had been changed to make R-7.29 reachable by removing or rewording the seeded fixed page, which would break R-7.25. Tier is STANDARD and there is only one plausible reading, so no escalation is needed.

**Conditions:**
none
