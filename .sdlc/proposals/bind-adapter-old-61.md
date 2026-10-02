---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "Nothing else was changed, and I did not reopen the target, because nothing new needed binding."
opened: 2026-10-02T17:00:54.080Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** Nothing else was changed, and I did not reopen the target, because nothing new needed binding.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've removed the two actions the contract no longer declares from the "old" adapter. Nothing else was changed, and I did not reopen the target, because nothing new needed binding. I could not run a type-check, because the workspace has no installed packages, and I also could not run my own check that every name in the contract appears exactly once in the bindings file. So whether the adapter still matches `tests/generated/surface.d.ts` was confirmed only by searching the files.

**What was removed:**
- **`add_note` on `opportunity-cwu-edit` and `opportunity-swu-edit`:** both entries are gone from `tests/adapters/old/bindings.yaml`. Both had been recorded as unbound: an administrator looking through the History, Opportunity and Addenda tabs found no control for adding a note.
- **The matching code in `index.ts`:** the two `addNote` members on the Code With Us and Sprint With Us edit pages are gone, along with the helper that threw for them, which nothing else used. The generated surface no longer declares an `addNote` member on either page.

**What stays:** `add_note_by_request` on the history-request page is still declared by the contract and is still bound, so it was left alone. The leftover "addNote" text in `index.ts` belongs to that binding: a short comment and the name of the change it sends in its request.

**How far it was checked:** I compared the contract against the bindings file only for the members this run named. The run gave me only these two removals and no new members to add. I relied on that list and did not check the rest of the bindings independently.

The adapter's other bindings were carried over unchanged. Every route was already handled before, and this run did not reveal any page whose route fails to open on the target. Nothing outside `tests/adapters/old/` was touched.
