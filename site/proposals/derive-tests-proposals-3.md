| Field | Value |
| --- | --- |
| gate |  |
| opened |  |
| holder |  |

---
gate: G3
question: "Do the revised proposals tests now follow from their criteria and from nothing else?"
recommendation: "I made no change to any file in the workspace."
opened: 2026-09-07T14:43:29.571Z
---

# Do the revised proposals tests now follow from their criteria and from nothing else?

**Recommendation.** I made no change to any file in the workspace.

I made no change to any file in the workspace. Here is why.

---

**Journal**

The two conditions attached to the return are narrow, and only one of them called for an edit.

**Condition 2 — leave `tests/acceptance/proposals/` unchanged.** Done, by doing nothing. I opened no proposals spec file for editing and rewrote no header date. I did confirm the domain's coverage arithmetic independently: `spec/domains/proposals.md` carries 38 accepted criteria, R-2.1 through R-2.38; there are 35 files under `tests/acceptance/proposals/` and three not-testable rows (R-2.6, R-2.7, R-2.8), which accounts for all 38 with nothing double-counted. The derivation needed no further work, as the review found.

**Condition 1 — restore the 34 deleted `not-testable.yaml` entries byte for byte as they stand on main.** I could not act on this, and I want to be precise about why rather than approximate it.

This workspace is not a git repository, and the shell is confined to the workspace root — an attempt to list anything outside it is refused. What the workspace holds is the returned proposal's working tree, not main: `tests/acceptance/not-testable.yaml` here contains the header comment, the three proposals rows, and the trailing example comment, and nothing else. I searched the whole workspace for the missing text — every `.md`, `.json` and `.yaml`, plus `tests/generated/`, `tests/seed/` and `attestations.yaml`. The strings `R-6.1` and `R-8.3` appear only in `spec/criteria-index.json`, `spec/spec.md`, `spec/domains/notifications.md` and `spec/domains/files.md`, all of which state the criteria themselves, never a not-testable reason. The reasons written by the notifications and files slices exist nowhere I can reach. There is no `.orig`, no backup, no run artifact.

So the byte-for-byte restore the condition asks for is not available to me. The alternative — writing 34 rows with reasons I derive myself from the spec and `tests/generated/surface.d.ts` — I deliberately did not do. It would miss the condition's actual point twice over: the resulting diff against main would modify those rows rather than leave them untouched, which is the opposite of the "purely additive" property the condition exists to guarantee; and it would replace two already-approved slices' recorded reasoning with my own words under their name, in domains outside my slice. A silent substitution of that kind is harder for the next reviewer to spot than an honest gap, so I left the gap and am naming it here.

I did confirm the review's enumeration is exactly right, which should make the mechanical fix safe for whoever holds the repo. Notifications is R-6.1–R-6.28: twelve have spec files (R-6.6, R-6.7, R-6.10, R-6.13, R-6.14, R-6.17, R-6.19, R-6.21, R-6.22, R-6.23, R-6.26, R-6.28), and the sixteen named in the condition are the exact remainder. Files is R-8.1–R-8.31: thirteen have spec files (R-8.1, R-8.2, R-8.10, R-8.12, R-8.14, R-8.20, R-8.21, R-8.23, R-8.25, R-8.27, R-8.28, R-8.29, R-8.30), and the eighteen named are the exact remainder. Both sets partition their domain cleanly, so no criterion is unaccounted for and none is listed twice. From `spec/criteria-index.json`, three of the 34 are at version 2 — R-6.4, R-6.25 and R-8.24 — and the other 31 are at version 1; a restore that carries a wrong `version` would fail calibrate just as a missing row does, so that is worth checking against main's text rather than trusting my list.

What is needed to close this: take `tests/acceptance/not-testable.yaml` as it stands on main, append the three proposals rows R-2.6, R-2.7 and R-2.8 exactly as they read in this workspace, and change nothing else. That is a mechanical operation for anyone with the repo, and it makes the file's diff additive as the condition requires. The more durable fix is upstream of me: this stage should be handed a workspace built from main with the slice applied on top, or at least a readable base revision, so that a shared file like this one cannot be regenerated out from under other slices without the stage being able to notice or repair it.

I also recorded two notes for future runs: that `not-testable.yaml` is shared across every domain slice and must be appended to rather than regenerated, and that this workspace has no access to main, so "restore from main" conditions cannot be honoured inside it.

_Ruled: return by tech-lead_
