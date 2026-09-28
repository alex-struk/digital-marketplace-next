---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "None of it has been run as a whole: the workspace has no installed dependencies, and I wasn't given approval to install them in the scratchpad or to syntax-check the file with node."
opened: 2026-09-28T14:39:20.478Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** None of it has been run as a whole: the workspace has no installed dependencies, and I wasn't given approval to install them in the scratchpad or to syntax-check the file with node.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I've fixed all nine findings in `tests/adapters/old/index.ts`. None of it has been run as a whole: the workspace has no installed dependencies, and I wasn't given approval to install them in the scratchpad or to syntax-check the file with node. So there was no type check or test run, only a read-through of every edited region. I checked the underlying page behaviour directly in the browser against the running target where I could, as noted below.

**Mail reads went to the wrong worker's catcher (R-1.34, R-1.36, R-5.17, R-6.15, and the delivery-fault half of R-6.2).** The adapter read the unnumbered `SDLC_MAIL_API`, so every worker after the first used the first worker's catcher. It now reads `SDLC_MAIL_API_<TEST_PARALLEL_INDEX>` first and falls back to the unnumbered name, the same way the harness's own mail fixture does. Every mail reader goes through that one function: the message list and count, opening a message, the delivery-fault switch and the delay proxy.

**History tab on opportunity management pages (R-6.2).** It returned the whole screen, including the opportunity title. It now reads only the rows of the History tab's table, as the proposal history reader already did. I opened the seeded published Code With Us opportunity as an administrator and confirmed the tab is a table (entry type, note, created) with one row per entry.

**Consensus submit buttons (R-6.15).** `submit_final_consensus_scores` and `confirm_submit_consensus` now try "Submit Final Consensus Scores" first. The confirm now waits up to five seconds for its dialog to appear instead of reporting "no dialog" straight away.

**Publish refused by the form (R-1.15).** On both the Sprint With Us and Team With Us create forms, a disabled "Publish" or "Submit for Review" that comes with the form's own message now ends the action quietly, so `score_weight_error` can read the message. A disabled control with no message still throws at once. On the Sprint With Us Scoring step, "The scoring weights should total 100% exactly." appears directly after the Total Score field, which is where the field-error reader looks.

**Proposal field errors after a refused submit (R-2.14).** I could not find why the old path read nothing. In the browser, "Please enter a valid email." and "Please enter a valid phone number." render under their fields and stay there when you move between steps, and the adapter's message filter matches them. So I made the path sturdier rather than fixing a confirmed cause:
- When Submit stays disabled, the adapter now goes through every step collecting what the form says.
- If nothing shows, it enters and leaves each field (values untouched) so the form draws its messages, then collects again.
- `field_error` returns what is on screen plus what was collected at the moment of refusal.

Because the cause is unconfirmed, this is the fix to check first in the next calibration.

**Removing a stored attachment never saved (R-8.31).** `remove_existing_attachment` now saves the form afterwards with whichever save the top bar offers: "Publish Changes", "Save Changes" or "Submit Changes for Review". If none is there it throws `unbound:` naming what it looked for. I confirmed that editing the seeded published opportunity shows "Publish Changes".

**Code With Us proposal save (R-8.31).** `proposal-cwu-edit.save_changes` (and the other proposal edit pages) uses "Save Changes" when offered. Otherwise it presses "Submit Changes", ticks every box in the terms dialog, then presses the dialog's "Submit Changes". I built this from the finding's description without seeing it: no seeded Code With Us proposal is in the submitted state, and I didn't create one on the shared target.

**User list (R-4.14).** Before reading, the adapter now scrolls the virtualized user table, and everything around it, back to the top. I scrolled `/users` to its tail, ran the reset, and got the first rows back ("Casey Placeholder" and so on).

**Deactivated vendor sign-in (R-4.14).** Its unconditional refusal in `signIn` is gone; it now signs in through its session route like every other persona. No observation in this adapter depended on that refusal, so there was nothing else to restrict.

`tests/adapters/old/bindings.yaml` needed no change: every member touched was already listed as bound. Every page route I opened resolved; the only "Not Found" was from my own mistake of using an organization id as an opportunity id. I changed nothing outside `tests/adapters/old/`.
