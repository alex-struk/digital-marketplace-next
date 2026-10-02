---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "R-1.35 and R-1.36 are still unbound."
opened: 2026-10-02T14:27:45.782Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** R-1.35 and R-1.36 are still unbound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The type check and the YAML parse check both need approval that this session can't get, so I'm finishing without them. The edits only lengthen text inside existing strings.

## Journal: Code With Us proposal form (`proposal-cwu-create`) on target "new"

R-1.35 and R-1.36 are still unbound. The screen they need does not exist on the running build. I could not run the type check or the bindings-file parse check, because both needed an approval this session could not get.

**What I did to look.** I signed in through the identity provider as the seeded vendor (`test-vendor-1`), typing only the variable name into the password field. Then I opened the form's route for the seeded published Code With Us opportunity, `/opportunities/code-with-us/00000000-0000-4000-8000-000000000601/proposals/create`. It answers with the "Page not found" screen.

I then looked for another way in:
- **The opportunity's own page:** its deadline is June 1, 2030, so it is open for proposals. It shows the details, skills, key dates and addenda. Its only control is a "Watch this opportunity" tick box; nothing starts a proposal.
- **The `/opportunities` list:** each entry offers only its title link and a Watch tick box. There is a new "New opportunity emails" panel at the top, but nothing in it leads to a proposal.
- **The vendor's own screens:** the dashboard shows only "You are signed in as …", and the header offers only Dashboard, My profile and Sign out.
- **Sprint With Us, as a check on the whole build:** the open opportunity listed as having a submitted proposal answers "Page not found". So this build serves no proposal screens at all, not just this one.

Earlier passes, as recorded in the existing reasons, had already tried this route signed out and as the administrator, public sector staff and a vendor. They also tried other routes (`.../proposals`, `.../proposals/new`, `.../apply`, `/proposals/create?opportunityId=…`, `/proposals/code-with-us/create?opportunityId=…`). Every one answered "Page not found". This recheck agrees with them.

**What changed.** I made two edits, both in `tests/adapters/new/`:
- In `index.ts`, I added this recheck to the end of the reason the form's `open()` and its members give when they throw `unbound:`.
- In `bindings.yaml`, I added the same text to all 13 entries under `proposal-cwu-create`.

Every member is still unbound, and nothing else in the adapter or the bindings file changed.

**Routes that did not resolve.** `/opportunities/code-with-us/:opportunityId/proposals/create` does not resolve on this target. Neither does the open Sprint With Us opportunity's public page. The earlier finding still stands that the other proposal, organization and evaluation screens answer "Page not found" too.

Nothing asked me to change any file outside `tests/adapters/new/`, and I did not. No password or environment value was written anywhere.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this bind-adapter proposal for target new binds every surface action and observation it can and nothing else. It does: the only change adds a recheck to the reasons on the 13 proposal-cwu-create members, in tests/adapters/new/index.ts and tests/adapters/new/bindings.yaml. Every member stays unbound, there is no locator, assertion or logic, nothing under tests/acceptance changed, and the runner's type check passed for adapters/new. The unbound reasons are real. The seeded vendor, signed in through the identity provider, is answered 'Page not found' at the form's route and at every alternative route tried. The opportunity's public page and the /opportunities list offer only Watch controls, and even the Sprint With Us opportunity that has a submitted proposal answers 'Page not found'. This build serves no proposal screen, so the gap is in the application, not the adapter, and the test does not demand more than its criterion. R-1.35 and R-1.36 stay unverified, and that is already asked of plan in request/build-slice-9-3#1, so it is not repeated here. build-slice-9-3#6 is a build instruction this proposal does not touch, so it stays open. What would change the ruling: a reason that misdescribes what the build serves (for example, a proposal screen that is in fact reachable), or any edit outside tests/adapters/new.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5a5de55de77e20cef066d31641b50fb3e1999ec9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
