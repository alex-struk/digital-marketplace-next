---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I made the one change the ruling asked for."
opened: 2026-10-02T18:41:09.280Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made the one change the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for. In `tests/adapters/new/index.ts`, the shared helper `noteControlsIn` no longer answers `"false"` when it misses the History section.

**What changed.** Before, once the "History" link in the section navigation had been followed, the helper counted note controls inside the region named History. If that region was missing, or its table never appeared within the 5-second wait, the count was zero and the helper returned `"false"` ("no control offered") without ever having found the section. Now the helper takes the member's location (for example `opportunity-cwu-edit.note_control_offered`) and does two checks:
- It waits for the region named History. If no such region is on the page, it throws `unbound:` with the page URL and the acting persona's id.
- It then waits for that region's history table. If the table never becomes visible, it also throws `unbound:` with the URL and persona.

Only once both are confirmed does it count text boxes, buttons and attach/upload controls inside the region, returning `"true"` or `"false"`. So an answer of absence now always comes from a section the adapter actually reached.

**Where it applies.** The Code With Us caller (`opportunity-cwu-edit`) and the shared Sprint/Team With Us caller now pass in their own location. That shared caller serves `opportunity-swu-edit` and, through the same factory, `opportunity-twu-edit`. The paths before the helper are unchanged:
- A non-administrator whom the management screen refuses with "Page not found" still reads `"false"`, and the refusal is logged.
- A screen with no History link at all is still reported unbound.

**Bindings file.** `tests/adapters/new/bindings.yaml` already listed `note_control_offered: bound` under both `opportunity-cwu-edit` and `opportunity-swu-edit`, so I left it unchanged. The binding is still bound; it is just stricter about when it may answer absence.

**What I could not check.** I could not run the TypeScript typecheck: the sandbox needed an approval for it that nobody was there to give. I re-read the edit by hand: `unbound` is typed `never`, and the locator calls are the same ones used elsewhere in the file. The change is small, but it has not been compiled. I also did not re-walk the target. The earlier walk recorded each History section as the region with its table and nothing else, as the owning staff member and as the administrator on the seeded opportunities, so the stricter check should still return `"false"` there. That is inferred from that walk, not re-observed in this run. No page's route failed to resolve; this revision touched no other member, and I changed no file outside `tests/adapters/new/`.
