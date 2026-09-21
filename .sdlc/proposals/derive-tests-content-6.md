---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "The condition is addressed."
opened: 2026-09-21T16:55:20.639Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** The condition is addressed.

The condition is addressed. Here is my journal entry.

---

**What the condition named.** The G3 ruling on build-slice-1-3 pointed at one assertion in the content domain's test for R-7.17: `expect(rendered).not.toMatch(/[<>]/)`. The objection was correct on both counts. A page whose wording legitimately reads "a < b" is rendered as text, executes nothing, and satisfies the criterion — yet fails that assertion. And run the other way, against the seeded page whose wording carries no markup at all, the assertion passes whatever the service does with markup, so it stood in for the "never executed" clause while establishing nothing about it. The ruling offered two ways out: a sound assertion in its place, or recording the never-executed clause as not testable.

**What I did.** I took the second. I deleted `tests/acceptance/content/R-7.17.spec.ts` and added one `blocked:` entry for R-7.17 v1 to `tests/acceptance/not-testable.yaml`, placed in the content run between R-7.16 and R-7.23.

**Why not the first.** I looked for a sound assertion before giving up on one. The criterion has three clauses. The only observation of a rendered body anywhere in the surface is `content_view.page_body`, which hands back one string.

For *markup embedded in a body is never executed*: a body whose markup ran and a body whose markup was stripped come back through that string identically — `<b>bold</b>` reads as "bold" either way, and stripping is itself a conforming way to never execute. So no assertion on `page_body` can pass against a conforming service and fail against one that executes what a body embeds. That is the precise property an assertion for this clause would need, and nothing reachable has it. The deleted test's own note had already argued this; the ruling is right that the note and the assertion contradicted each other.

For *the same body renders identically on its own address and wherever another screen embeds it*: there is no second rendering to compare. The screens that embed a body — the two program qualification terms screens, the two evaluation instructions screens — embed pages the service creates for itself in its migrations. The seed names only `content.ordinaryPage`, and no surface addresses those service-owned pages by handle, so a body a test authors cannot be got into an embedded rendering. This is the same wall that put R-7.14, which R-7.17 replaces, into `not-testable.yaml` already.

That leaves only *the body is rendered as formatted text*. I could have kept the file on the strength of that clause alone, and that was the path the ruling's first option pointed at. I did not, for a reason I want to be explicit about: R-7.1 already opens the same seeded page, reads the same `page_body`, and asserts the same two things — that a body comes back and that the formatting marks around its emphasised word did not reach the reader literally. An R-7.17 file reduced to that would have been a copy of R-7.1 wearing R-7.17's title, and a passing run would have named the whole of R-7.17 as met while touching neither clause that distinguishes it from R-7.1. That is the same defect the ruling flagged, moved one line down. Better to say plainly that the criterion is not reachable than to keep a file whose green is borrowed from another criterion.

**Blocked, not unobservable.** Both gaps are things the contract could close. The execution clause needs an observation on content-view that reports whether markup embedded in a body took effect in the rendering rather than reaching the reader as text — something that distinguishes an executed body from a stripped one, which the current single string cannot. The two-renderings clause needs a seed handle for one of the pages another screen embeds, together with an observation of that embedded rendering. The entry names both. If the contract stage adds the first, R-7.17's security-relevant clause becomes testable on its own; the second additionally unblocks R-7.14, which is sitting in the same file for the same reason, so one seed handle plus one embedded-body observation buys two criteria.

**Surface gaps for the contract stage, by name.** An observation on `content-view` distinguishing markup that took effect from markup that reached the reader as text. A seed handle for one of the service's own embedded pages — the program qualification terms or evaluation instructions bodies — and an observation of that body as the embedding screen renders it.

**Scope.** Nothing else was touched. One file deleted under `tests/acceptance/content/`, one entry added to `tests/acceptance/not-testable.yaml`. No other spec file was re-derived, no header date rewritten, no existing not-testable entry altered. Nothing under `spec/`, `tests/seed/`, `tests/fixtures/` or the other read-only paths was modified, and `tests/acceptance/attestations.yaml` neither needed nor received a change — it is empty and names no file. I was not able to run a YAML parse to confirm the file loads, as the sandbox declined the interpreter; I verified the entry by reading it back instead. It is a plain double-quoted scalar with no embedded double quotes, matching the style of every entry around it.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Verified against the branch: spec/contract/surface.yaml:1410 gives content-view only page_address, page_title, page_body, the two dates, readable_when_signed_out and not_found_for_unknown_address, with no observation that distinguishes markup which took effect from markup shown as text, so no assertion on page_body can pass against a conforming service and fail against one that executes an embedded body. The screens that embed a body (organization-swu-terms.terms_body, organization-twu-terms.terms_body, evaluation-instructions-swu/twu.instructions_body) embed pages no surface addresses by handle, and tests/seed/003-content.sql seeds only about-us, so no second rendering of an authored body can be produced — the same wall already recorded for R-7.14. The remaining clause is already asserted by tests/acceptance/content/R-7.1.spec.ts against the same page and observation, so a reduced R-7.17 file would have reported the whole criterion met on borrowed evidence, which is the defect the previous ruling named. Both blocked reasons name real missing surface, the entry matches the file's established blocked/Unblocked form, and the diff touches only the deleted spec and that entry; typecheck passed with no diagnostics under acceptance/content and the tests-check warnings are pre-existing and in other domains. Noted for the spec stage, carried as no condition: R-7.14 and R-7.17 are opposed on both clauses and both sit accepted at v1, which only matters once the contract unblocks them.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `59c489137730a034857d889304e74ba8a9c8f586`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
