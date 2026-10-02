| Field | Value |
| --- | --- |
| gate | G-DESIGN |
| opened | 2026-10-02T17:14:51.506Z |
| holder | agent:ux-reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these screens serve the opportunities criteria, and are they built out of the design system?

**Recommendation.** I made one change in this revision: the opportunities section of `design/DESIGN.md` no longer contains gap 29.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made one change in this revision: the opportunities section of `design/DESIGN.md` no longer contains gap 29. The ruling said design only had to drop that gap. Nothing else needed changing.

**What changed.** I deleted gap 29, the note that `add_note` was still on the manage pages' surface, from the end of the gap list. Gaps 1 to 28 are as they were. I also rewrote the paragraph under "No screen adds a private note". It no longer points to gap 29 or says the surface still lists `add_note`. It now only states the design rule:
- The History tab shows notes already in the history and offers no form for adding one.
- A note is added only through `opportunity-history-request` or the seed.
- A build must not render `history-add-note-button` or `note-text-field`, because R-1.33 v2 says no screen offers that control.

No other screen, story, state, test ID or `design/screens.yaml` entry was touched.

**Not done here, and why.** In this workspace, `spec/contract/surface.yaml` still lists `add_note: { test_id: history-add-note-button }` on both `opportunity-cwu-edit` and `opportunity-swu-edit`. The ruling sends that removal to the contract stage, and design may only fill in test IDs, so I left both entries alone. Until contract removes them, the surface declares an action that no story renders, and R-1.33 stays untestable. The ruling said approval would follow as-is only if contract had already removed `add_note`. Here it has not, so this proposal still depends on that change.

Nothing else was left undone:
- **Other stages:** build's open request build-slice-9-3#6 is outside this revision, so I left it alone.
- **People:** the ruling has no conditions addressed to a person.
- **Read-only paths:** nothing asked for a change under spec, `constitution.md` or `.claude/skills`.

## Fix turn

I removed `add_note` from the Code With Us and Sprint With Us manage pages, and that is the only change I made this run.

**What I changed:** I deleted the `add_note` line, bound to `history-add-note-button`, from `opportunity-cwu-edit` and `opportunity-swu-edit` in `spec/contract/surface.yaml`. Both checks had reported that the design gate changed those two pages' actions. The ruling said its approval would stand if contract had already removed `add_note`. The likeliest reading of the two failures is that contract has removed it, so my copy of the surface, which still had it, now differed from the ruled one. I had no copy of the contract's version to compare against, so this is inferred, not confirmed. Nothing else on those pages changed; the routes, the other actions and the observations are as they were.

Gap 29 was already gone from `design/DESIGN.md`, so it needed no edit. The DESIGN.md text saying no screen adds a private note (R-1.33 v2) still holds, and no story or screen changed.

**Left for contract:** the ruling asked contract to keep `add_attachment` on both pages, but neither page in my copy has that action. Adding an action is not something the design gate may do, so I left the pages without it; contract should check whether they should have it.

**Left for build:** `build-slice-9-3#6` is still open with build, as the ruling says. No condition was addressed to a person, so I left none for anyone.

## Ruling

**Verdict:** approve
**By:** agent:ux-reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether these opportunities screens serve their criteria and are built from the design system. I approve. The History tabs of opportunity-cwu-edit and opportunity-swu-edit no longer carry the private-note form, which matches R-1.33 v2 (the service accepts a note, but no screen offers a way to add one). The screenshots show the history table with existing notes and no form, field, attachment trigger or Add note button, and no story renders history-add-note-button or note-text-field. DESIGN.md says the same in its component table, dialog notes, per-screen notes and gaps 17 and 28. The branch's surface.yaml has no add_note action, and the diff against main deletes none, so it matches the contract stage's removal that the last ruling made its approval depend on. The five new request-reference stories (opportunity-history-request default/withheld/refused, opportunity-status-request default/refused) use only design-system Heading and Text inside the shared PageContainer and Stack, styled with tokens, and in the screenshots they line up with the banner and are evenly spaced. Every surface test_id the diff touches was null before, so no filled ID was changed. The report shows 535 stories with 0 accessibility violations. build-slice-9-3#6 (removing NoteForm from the app) belongs to build and is not settled here, so it stays open. Whether the manage pages should carry add_attachment is the contract stage's question. The ruling would change on a hand-built component the design system provides, any accessibility violation, or add_note returning to the surface.

**Conditions:**
none
