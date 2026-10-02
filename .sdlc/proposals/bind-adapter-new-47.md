---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I removed the two members the contract dropped."
opened: 2026-10-02T17:05:35.105Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I removed the two members the contract dropped.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I removed the two members the contract dropped. The Code With Us proposal form that R-1.35 and R-1.36 need is still not served by the target, so those two criteria stay unbound.

**Removed.** `add_note` is gone from `opportunity-cwu-edit` and `opportunity-swu-edit` in `tests/adapters/new/bindings.yaml`. In `tests/adapters/new/index.ts` I removed its two implementations: the Code With Us management screen's `addNote`, and the Sprint With Us one along with the line that wired it into `opportunitySwuEdit`. `tests/generated/surface.d.ts` no longer declares `addNote` on any page. A few remaining mentions of `addNote` belong to `add_note_by_request` (on a separate page of the contract), which sends the service's own `addNote` request. That member is still in the contract, so it stays, bound as before.

**R-1.35 and R-1.36 (`proposal-cwu-create`).** I checked again on the running target. I signed in as the seeded vendor (`test-vendor-1`) through the identity provider's form ("Sign in as a vendor", then the provider's Username / Password / Sign In). Then:
- `/opportunities/code-with-us/00000000-0000-4000-8000-000000000601/proposals/create`, the form's route with the seeded published opportunity, still shows "Page not found".
- That opportunity's public page shows a Proposal deadline, Description, Skills, Key dates and Addenda. Its only control is the "Watch this opportunity" tick box, with no link or button to start a proposal.
- The vendor's header offers only Dashboard, My profile and Sign out, and the dashboard shows only "You are signed in as …".

That matches the existing reason, which already covers the other roles, the alternative addresses and the profile tabs from earlier walks. I left all thirteen `proposal-cwu-create` members unbound with that reason unchanged. The route exists in the contract, but on this target it shows "Page not found" to every persona tried. That is the only page here whose route did not resolve; the rest of the adapter's bound and unbound members are as the earlier run left them.

**Checks.**
- I couldn't run either full check. The type check (`tsc`) and a small script comparing the bindings file against the surface both needed approval that this session doesn't have.
- By hand: the bindings file and `surface.yaml` both list 112 pages. The action and observation lists of the two edited pages match the contract exactly, and `add_note` no longer appears anywhere except as `add_note_by_request`. The code I removed was self-contained, and the tsconfig doesn't reject unused helpers.

The password field only ever received the variable's name, as instructed, and no password or environment value is written in the adapter, the bindings or here. One snapshot file the browser tool saved into the workspace root, by a filename I gave it, has been deleted. Its other snapshots sit under `.playwright-mcp/`, which I didn't touch.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-47 adapter bind every action and observation the contract lists for the new target, and nothing else? Ruling: approve. spec/contract/surface.yaml no longer lists add_note on opportunity-cwu-edit or opportunity-swu-edit; only add_note_by_request remains, and it stays bound. The proposal removes add_note from bindings.yaml and both of its implementations from index.ts, and no test under tests/acceptance references add_note. The remaining addNote mentions in index.ts belong to add_note_by_request's service request, which is still in the contract. The diff only deletes code, adds no assertion or business logic, and leaves tests/acceptance unchanged. The runner's type check on this revision passed with no diagnostics under adapters/new. R-1.35 and R-1.36 stay unbound through proposal-cwu-create, with the reason unchanged and checked again on the running target as the seeded vendor: the form's route shows 'Page not found' and the published opportunity offers no control that starts a proposal. That names a surface the target does not serve, so it is a real unbound reason. Open instruction build-slice-9-3#6 is the build stage's work, and this adapter proposal does not settle it, so it stays open. The ruling would change to a return if the contract still listed add_note on either page, if a test called it, or if the target turned out to serve the proposal form.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `f7a4c3a5a84df135792e8923801ecdd6f7d71739`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
