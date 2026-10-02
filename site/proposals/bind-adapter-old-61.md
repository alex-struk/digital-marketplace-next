| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T17:00:54.080Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation on old, and nothing else? Ruling: approve. The diff only removes the add_note bindings for opportunity-cwu-edit and opportunity-swu-edit (bindings.yaml) and the matching addNote members and their now-unused noteIsNotOffered helper (index.ts). The generated surface.d.ts no longer declares addNote on either page. The only remaining note member, addNoteByRequest on the history-request page, is still bound (bindings.yaml:1442, index.ts:11289), and no stale add_note entry is left. The bindings are still navigation and locators only. Nothing under tests/acceptance or tests/generated changed. The runner's typecheck reports no diagnostics under adapters/old/; the 3 it reports are in adapters/new/, which this proposal does not answer for. That confirms the author's unchecked claim that the adapter still matches the surface. build-slice-9-3#6 is about app/ and is not settled by this proposal, so it stays open. What would change the ruling: a typecheck diagnostic under adapters/old/, or the surface still declaring addNote on either edit page.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cad89bccaeea404c4ae5a7eddee9d23123e648cb`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 3 diagnostics
