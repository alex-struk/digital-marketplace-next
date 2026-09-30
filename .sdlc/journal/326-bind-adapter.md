---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T21:51:14.573Z"
cost: 2.077942000000001
turns: 56
session: "67a3359c-e53e-44cb-a5e6-e388cd1b796f"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed the R-1.10 finding in `tests/adapters/old/index.ts`. I checked each piece of the fix by replaying it in the browser against the running target. I could not run the adapter itself: running Node needed an approval nobody was here to give, and the browser tool's sandbox can't load TypeScript. So the edited file has not been typechecked or run end to end; the next calibration run is the real test. `bindings.yaml` is unchanged, because `opportunity-cwu-create.fieldError` was bound before and still is.

**Why the Teaser message was missed.** The reader was never at fault. On the Code With Us form (`/opportunities/code-with-us/create`, signed in as the administrator), old draws the Teaser message in an ordinary `<small>` right after the box, and the reader finds it whenever it is there. The problem was that the message was never drawn:
- Old checks each box about half a second after its last change.
- The Teaser and Remote Description checks are linked: changing Remote Description within that half-second cancels the Teaser's pending check, and nothing rechecks it afterwards.
- The adapter enters Remote OK first, then Title, Teaser and Remote Description back to back, so the 501-character Teaser was never judged.

I isolated this by filling the Teaser and then changing one other field straight after, in separate tries. Only Remote Description cancelled the message; Title, Location and Fixed-Price Award did not. That is why the Title and Description messages were found and the Teaser one wasn't.

**Fix to entering values.** After a text box is given a value longer than 200 characters, or an empty one, the adapter now waits out old's check before touching the next field. Short, ordinary values carry no wait, so long forms stay fast. With the adapter's fill order plus this wait, "Teaser must be between 0 and 500 characters long." now appears and stays.

**Fix to the reader's speed.** `fieldError()` now goes through the wizard once instead of twice:
- It jumps to "1. Overview" from the step menu, so the Teaser's step is read first.
- It moves forward with "Next", reading each step as soon as its name changes, rather than waiting for the network to go quiet.
- Boxes the test filled that show nothing share a single 1.2-second wait, and only while nothing has been found yet. Before, each box got 2 seconds.

I removed the old fallback that went through the steps a second time. The shared step reader that the publish and submit actions call when their control stays disabled uses the same quicker walk. Replayed in the browser from step 3 of a filled form, the walk read the Teaser message in about 2 seconds, so one call should finish in roughly 3 seconds.

Nothing else was asked of this stage, no page route failed to resolve during this work, and I changed nothing outside `tests/adapters/old/`.