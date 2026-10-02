---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-02T18:20:29.008Z"
cost: 0.26796800000000004
turns: 8
session: "79bc3f96-4db1-41a5-a577-056afe72a290"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I acted on the reviewer's one condition, and the change is confined to `tests/acceptance/opportunities/R-1.33.spec.ts`. I did not compile or run it: the type check needed an approval this session could not get.

**Condition 1: the non-author staff reader.** I added the case the reviewer asked for. It signs in as `persona.publicSectorStaffOther`, opens the history of `seed.opportunities.cwuWithPrivateNote`, and expects the seeded note's text, its file's name and its file's identifier to be absent. It uses the same `expectSeededNoteWithheld` check as the vendor and signed-out cases, and sits just before the vendor case. Its title is the criterion's statement followed by "a public sector staff member who is not the opportunity's author is not shown a private note or its file."

I wrote a test rather than a `not-testable.yaml` entry because the surface does reach this clause. The persona is defined in `tests/generated/personas.ts` and signs in on `sandbox-idp` as `gov-second`. Only the oracle's session route cannot sign it in, and as the reviewer said, that is settled at calibration rather than by leaving the clause unasserted. So the oracle should be expected to fail this case at sign-in and the run will need to record that limit at calibration.

I also updated the file's opening comment, which had said "only the author and administrators" was checked against a vendor and a signed-out reader only. It now names all three excluded readers. The header lines are unchanged; the "derived 2026-10-02" date is today's date and the file's content did change.

Unchanged: every other file in `tests/acceptance/opportunities/`, all of `tests/acceptance/not-testable.yaml` (including the existing R-1.33 entry for "but no screen of the application offers a way to add one", which still stands), and `tests/generated`. Nothing asked me to touch a path outside this stage's boundary.

The contract needs no new surface action or observation for this.