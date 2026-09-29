| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T03:00:34.616Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** R-8.30 now tests both halves of its criterion, so nothing about it remains in `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-8.30 tests follow from the files criterion and from nothing else? Ruling: approve. R-8.30 says a profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused, and no file is stored. The branch now has one test for each half. The profile-picture test is unchanged apart from its narrower title. The new logo test signs in as persona.organizationOwner, who the seed manifest says owns organizations.qualified. It reads current_logo, opens the form with edit_organization, offers 'logo.gif' whose content is a real PNG, so the ending is the only thing that could cause a refusal, and saves. It then asserts that logo_refused_error reports something, which is the refusal, and that current_logo read on a freshly opened page equals the value read before, which is 'no file is stored'. Every call it makes is declared on organization-edit in spec/contract/surface.yaml: the change_logo action and the current_logo and logo_refused_error observations, with comments saying the logo is offered after edit_organization and stored on save_changes. The test asserts nothing the criterion does not state. It checks no message text, no status code and no selector; it uses only the contract's own action and observation names. Catching a save the screen will not make is consistent with 'refused'. Deleting the not-testable entry for the logo clause is right, because the reason it gave (no action or observation on organization-edit) is no longer true, and no clause of R-8.30 is now left unasserted. The runner's typecheck exited with code 2, but none of its diagnostics are under acceptance/files/. Both are in adapters/new/, which this proposal does not answer for. The open missing-test/R-8.30 condition is closed by the new test's first run at v1, not by this ruling. What would change the ruling: a typecheck diagnostic under acceptance/files/, or evidence that organizations.qualified is not owned by persona.organizationOwner.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8955d555071882a63163d7cb847569b3219928e4`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/files/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
