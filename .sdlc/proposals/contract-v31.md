---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I removed the `add_note` action from the two opportunity management pages, as the design-gate ruling asked."
opened: 2026-10-02T16:55:16.969Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I removed the `add_note` action from the two opportunity management pages, as the design-gate ruling asked.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I removed the `add_note` action from the two opportunity management pages, as the design-gate ruling asked. Starting the oracle was blocked, so I couldn't confirm it still starts.

**What changed.** In `spec/contract/surface.yaml`, the `add_note` line (bound to `history-add-note-button`) is gone from `opportunity-cwu-edit` (the Code With Us manage page) and from `opportunity-swu-edit` (the Sprint With Us one). Nothing else in that file or any other contract file changed; the diff is two deleted lines. Both pages still have their other actions and their History tab. `opportunity-history-request` still has `add_note_by_request`, which is now the only way the contract offers to add a note. Its comment already said the edit pages offer no way to add a note, so it now matches the pages.

The ruling also said to keep `add_attachment` on those pages, but neither page ever had that action. There was nothing to keep, and I did not add one, since the ruling only asked for a removal.

**Stale references in other stages' files.** The old and new adapter bindings, `tests/generated/surface.d.ts` and `app/frontend/src/api/contract.d.ts` still mention `add_note`. Those belong to bind-adapter and to generation, so I left them alone; they need regenerating against this surface.

**The R-1.33 item.** The owed list holds a missing-test item for R-1.33 (the private-note criterion), and it is currently with ratify, not this stage. It asks for more than this removal: a seed of a note-bearing opportunity for each programme, an observation of whether any add-note control is offered, and a restated acceptance clause. That is a different and larger set of changes, and the item isn't mine to hand on, so I wrote no re-address line.

**Oracle.** `node $SDLC_BIN oracle up` was refused before it ran: the permission layer rejected the variable expansion, both quoted and unquoted. Printing the variable's value needed approval, which this unattended session can't get. So I can't say whether the application started this run. The Compose override, the seed and the manifest are unchanged from the approved version, and this change touches only the contract surface, not anything the oracle loads. Because nothing started, I did not run `oracle down`, and no container was left running.

The one request in this revision was taken up; nothing is deferred.
