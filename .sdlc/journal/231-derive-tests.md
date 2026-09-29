---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T03:00:34.590Z"
cost: 0.5199358000000001
turns: 18
session: "1692fdfb-815a-4e79-9da6-0af74682e5ee"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

R-8.30 now tests both halves of its criterion, so nothing about it remains in `tests/acceptance/not-testable.yaml`. I couldn't compile or run the test: both requests to run the TypeScript compiler were refused permission.

**What I did.** Of the one criterion handed back, one now has a test and none remain untestable. Before this run, `tests/acceptance/files/R-8.30.spec.ts` only covered the profile picture. It sat beside an entry saying the organization-logo clause was blocked. The contract has since given `organization-edit` a `change_logo` action and two observations, `current_logo` and `logo_refused_error`. Its comments say the logo is offered after `edit_organization` and stored on `save_changes`. With those, the logo clause can be reached.

**The test file** now holds two `test()`s. The criterion has one worked example, but its statement covers two places, and one test per place fails with a title that says which half broke. The profile-picture test is unchanged except that its title now names only the profile picture.

The new logo test works like this:
- It signs in as `persona.organizationOwner` and opens the edit page for `seed.organizations.qualified`, which the seed says that person owns.
- It reads the current logo, opens the form, offers `{ file: "logo.gif", content: PNG }` and saves. The content is a real 1×1 PNG, so the file's name is the only reason it could be refused.
- A save that the screen itself refuses to make also counts as a refusal.
- It then expects `logoRefusedError()` to report something. It reopens the page and expects `currentLogo()` to equal the value read before, which is how it checks that no file was stored.

A refused logo changes nothing, so the test leaves the shared seeded organization as it found it. I also updated the provenance header to `spec@8272c1b989e3bad64c78ae540830a62747dadf42`.

**The not-testable entry.** I deleted R-8.30's entry, the whole block for the logo clause. No other entry changed.

**Missing from the surface:** nothing for this criterion.

I wrote only under `tests/acceptance/`.