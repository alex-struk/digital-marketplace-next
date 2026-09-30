---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "There's no `node_modules` in this workspace, and running node on the file needs approval I don't have, so it hasn't been type-checked or run."
opened: 2026-09-30T20:47:38.474Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** There's no `node_modules` in this workspace, and running node on the file needs approval I don't have, so it hasn't been type-checked or run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've changed the adapter for R-1.10, but I couldn't reproduce the failure, and I couldn't run the changed file at all. There's no `node_modules` in this workspace, and running node on the file needs approval I don't have, so it hasn't been type-checked or run. The only proof it works will be the next calibration run.

**What I checked in the browser.** I signed in as the administrator and as the government user, opened `/opportunities/code-with-us/create`, and put 501 characters into the Teaser box:
- **The fill:** the box keeps all 501 characters. It has no length limit, and nothing cuts the value short, including when it is filled right after the form appears.
- **The message:** old draws "Teaser must be between 0 and 500 characters long." directly under the box, inside the Teaser field's own group, a moment after the box is left. It stays there after moving through all four steps and back.
- **Publish:** with every other field valid, the teaser alone keeps Publish disabled. Cutting it to 500 characters makes Publish available again.
- **The adapter's own read:** I copied its step-menu toggle, its walk back to step 1, and its per-field reading into the page and ran them there. They found the teaser message on "1. Overview" and nothing on the other three steps.

So the reading logic does reach the Teaser group. The empty read in calibration most likely came from the page's state at the moment of reading: the message not drawn yet, a value that didn't take, or a walk that never got back to step 1. I've hardened those three places:
- **Fill check:** after filling any text box, the adapter confirms the box holds the whole value. If it holds only the beginning, it fills again, then types it key by key (for values up to 2,000 characters). If the box still falls short, it throws, saying how many of the characters it took. Spaces the box trims from either end don't count as cut short, and boxes that reformat their value are left alone.
- **Getting back to step 1:** the walk back to step 1 now checks where it ended up. If "Previous" didn't bring it to step 1, it opens the step menu and picks step 1 there.
- **Second look when empty:** the create forms' `fieldError` (Code With Us, Sprint With Us and Team With Us) now has a fallback when it would return nothing. It walks the steps again and reads the group of each text box the test gave a value. It waits up to two seconds per box for old's message to appear. When the first read finds something, this never runs. When a test expects no message, it adds up to two seconds per named box before returning the same empty answer.

All my changes are in `tests/adapters/old/index.ts`. `bindings.yaml` is unchanged: `opportunity-cwu-create` still has every action and `field_error` bound. Every page route I opened resolved on the target. Nothing outside `tests/adapters/old/` was touched, and nothing asked for such a change.
