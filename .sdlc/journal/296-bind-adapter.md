---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-30T05:24:02.628Z"
cost: 0.9095004
turns: 27
session: "9b70e216-8299-453c-a102-3fd0d6fa1563"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I changed one member, `proposal-cwu-edit.proposal_tab` in `tests/adapters/old/index.ts`, to fix the calibration finding R-2.2. I could not run the type check or the test suite: every attempt to run `tsc` was refused permission. The code has not been run. What I checked is by hand in the browser, below.

**What was wrong.** The member clicked the "Proposal" tab and returned whatever step the edit wizard was showing, which was "1. Proponent". It also read only the text visible on the screen, which leaves out what is typed in a text box. So the proposal text itself never reached the test.

**What I checked on the target.** I signed in through the organization owner's session route. I opened the seeded submitted Code With Us proposal (`cwuSubmissionBesideDraft` on `cwuLapsedWithSubmissionAndDraft`) at its `/edit` route. The route opens, and the "Proposal" tab link is there. The wizard has three steps: "1. Proponent", "2. Proposal" and "3. Attachments". Clicking the current step's name opens a menu of all three. On "2. Proposal" the proposal text sits inside a text box labelled "Proposal", which is read-only until Edit is pressed. It holds "The seeded proposal text of proponent 1.", and that text appears nowhere else on the screen.

**The fix.** The member now:
- opens the "Proposal" tab;
- goes to the "Proposal" step, through the step menu, or by the Previous/Next buttons if the menu fails;
- returns the step's visible text plus the value of each text box, so the proposal text comes back as "Proposal: …".

It still returns empty text when the reader isn't offered the tab at all, as before. If the tab opens but the wizard has no "Proposal" step, it now throws `unbound:` with that reason. I didn't find that case on the target.

**Scope.** I only overrode the Code With Us edit page. The Sprint With Us and Team With Us edit pages, and the review pages, still use the shared reader, because the finding only named this page. They may have the same problem if their proposal text also sits inside a text box on a later step. That's worth checking in the next calibration.

**Bindings.** `bindings.yaml` already listed `proposal_tab` as bound for this page, and I left it unchanged. Every page route I opened resolved on the target. I edited nothing outside `tests/adapters/old/`.