---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "R-1.35 and R-1.36 are still unbound."
opened: 2026-10-02T13:25:41.194Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** R-1.35 and R-1.36 are still unbound.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-1.35 and R-1.36 are still unbound. The Code With Us proposal form at `/opportunities/code-with-us/:opportunityId/proposals/create` does not exist on the running target. I looked for it again and found it nowhere, so I only updated the recorded reason to describe this new search.

**How I looked.** I signed in through the identity provider as the seeded vendor (`test-vendor-1`), typing only the password variable's name, and checked the target four ways:
- **The opportunity page.** I opened the seeded published Code With Us opportunity (`…0601`, proposal deadline June 1, 2030). The page shows its details, skills, key dates and an empty addenda section. Its only control is a "Watch this opportunity" tick box; there is no link or button to start a proposal.
- **The menus.** The vendor's header offers only Dashboard, My profile and Sign out, and the dashboard shows only a greeting.
- **The profile tabs.** I walked Profile, Capabilities, Organizations, Notifications and Legal. On Legal, the Code With Us terms are a link to read, with nothing to accept that might unlock a proposal. The Organizations tab still says organizations "will be listed here once organizations can be registered".
- **Other addresses.** With that opportunity's identifier, all of these answer "Page not found":
  - the contract's route
  - `…/proposals`, `…/proposals/new` and `…/apply` under the opportunity
  - `/opportunities/:id/proposals/create`
  - `/proposals`, `/proposals/create?opportunityId=<id>` and `/proposals/code-with-us/create?opportunityId=<id>`

Earlier runs had already tried this page as the administrator and as a public sector employee, and signed out; all got the same "Page not found".

**What I changed.** I added this search to the reason in two places:
- the `proposal-cwu-create` entry in `tests/adapters/new/index.ts`, where the change is only inside the reason string;
- all 13 members of `proposal-cwu-create` in `tests/adapters/new/bindings.yaml`. I confirmed exactly 13 lines changed, which matches the page's 8 actions and 5 observations, so no other page's entry was touched.

Nothing else in the adapter changed: no bindings were added or removed, and every other page keeps its earlier status.

**Not done.** I could not run the TypeScript type-check because the command was not approved here. Since the edit is confined to text inside an existing string, it should not affect compilation, but it has not been checked.

**Route not on the target.** In this run, `/opportunities/code-with-us/:opportunityId/proposals/create` is the page whose surface route did not resolve on the target.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Does this adapter bind every surface action and observation on new, and nothing else? Approve. The diff only rewrites the unbound reason on the proposal-cwu-create page: one template string in tests/adapters/new/index.ts and the matching 13 action and observation entries in bindings.yaml. No binding is added or removed, no other page changes, nothing under tests/acceptance changed, and the runner's typecheck on revision 1b3e09f passed with no adapter diagnostics. The unbound reason is real. It names a page the target does not serve: signed in as the seeded vendor through the identity provider, the seeded published Code With Us opportunity offers only a 'Watch this opportunity' control, the header, dashboard and profile tabs (Legal included) start nothing, and the contract route plus eight alternative addresses answer 'Page not found'; earlier runs confirmed the same as administrator, public sector employee and signed out. R-1.35 and R-1.36 call proposal-cwu-create only to arrange their stated given, a published opportunity with submitted proposals, starting from a seed with none, so the tests do not reach past their criteria. The criteria stay unverified until the build supplies the proposal form. The ruling would change if the target were shown to offer proposal creation under another label, step or persona (adapter-wrong), or if submitted proposals were judged to belong in the seed rather than the UI, which is a matter for the contract stage, not this adapter.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `1b3e09f7c51a26e492d28a7bfcbc99cdca096075`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
