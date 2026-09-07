---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I made no edits this run."
opened: 2026-09-07T15:35:11.877Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I made no edits this run.

I made no edits this run. Here is my journal.

---

**Journal — content domain, remediation round**

I could act on only one of the two conditions. Nothing in the workspace changed as a result of this run; the file state is byte-for-byte what I was handed.

**Condition 1 — restore the eighteen R-8.\* entries verbatim: not done, blocked.**

I first confirmed the reviewer's finding independently, and it is exactly right. `spec/criteria-index.json` carries thirty-one files-domain criteria, R-8.1 through R-8.31. `tests/acceptance/files/` holds thirteen spec files — R-8.1, .2, .10, .12, .14, .20, .21, .23, .25, .27, .28, .29, .30. The complement of that set within the thirty-one is precisely the eighteen IDs named in the condition, and `not-testable.yaml` now contains zero R-8 rows. So on main every files-domain criterion was accounted for as either a spec file or a documented not-testable row, thirteen plus eighteen making thirty-one, and this proposal breaks that invariant: eighteen criteria that were documented now report as missing tests.

What I could not do is restore the rows. The condition asks for them verbatim as they stand on main, and main is not reachable from where I run. This workspace is spec-only and is not a git repository — there is no history, no packfile, no second checkout. I searched the entire workspace for any surviving copy of those rows and there is none; the eighteen IDs appear only in the spec's own criteria text, never as prior not-testable entries. Filesystem search outside the workspace is blocked by sandbox policy, and the session scratchpad and memory directories are both empty. The text is a few hundred characters of prose per entry, written by an earlier stage; it cannot be reproduced from what I can see.

That left the question of whether to write eighteen fresh reasons instead, and I decided deliberately not to, for two reasons I want on the record rather than buried. The first is that it would not satisfy the condition and would repeat the fault that caused this return: a reviewer diffing against main would find eighteen rows whose wording I had silently replaced, which is the same species of collateral damage, and the instruction to re-derive nothing points the same way. The second reason matters more. This file's own header states that an entry stands in for a spec file — an entry suppresses the missing-test report. Fabricating eighteen plausible-sounding justifications would therefore certify eighteen criteria as untestable on grounds I invented, for a domain I did not analyze and whose surface coverage I have not examined, in a run scoped to content. A missing row fails loudly and gets fixed; a fabricated row passes the gate and hides the loss permanently. Making a gate pass is not worth a false attestation, so I left the rows absent and am reporting them instead.

The recovery is mechanical for anyone holding the repository: take `tests/acceptance/not-testable.yaml` as it stands on main, reinstate the eighteen entries R-8.3, .4, .5, .6, .7, .8, .9, .11, .13, .15, .16, .17, .18, .19, .22, .24, .26 and .31 with their `version` and `reason` fields unaltered, and keep this slice's seven R-7 rows — R-7.11, .14, .15, .16, .23, .28, .29 — together with the R-7.18 removal. The result is checkable without reading the prose: the file should then carry forty-one entries, and thirteen R-8 spec files plus eighteen R-8 rows should again account for all thirty-one files-domain criteria.

**Condition 2 — correct the receipt and state the real effect: done here, in the journal.**

There is no receipt file in this workspace to edit; the receipt is assembled downstream from this journal, so the correction belongs in these words. The earlier claim that nothing outside the three files named by the original conditions was touched is false, and I am withdrawing it rather than restating it.

What the `not-testable.yaml` change in this proposal actually does is three things, not one. It adds seven R-7 rows for the content criteria that have no path through the surface. It removes the R-7.18 row, correctly, because that criterion now has a spec file. And it deletes all eighteen R-8 rows, which was not intended by any condition, was not mentioned in the previous journal, and is the sole reason this proposal came back. The first two changes are within this slice and are the work that was asked for; the third is damage to the files domain's records and is still present in the tree as I leave it.

**The content slice itself.** I confirmed it is whole and I did not touch it. Twenty-nine content criteria, twenty-two spec files and seven not-testable rows, with no gaps and no duplicates. I re-derived nothing, rewrote no header dates, and left every existing file and every surviving entry exactly as I found it.

**Surface gaps worth carrying into the contract.** These come from the seven content rows that remain and are unchanged from the earlier round, repeated here because whoever writes the contract next reads this journal rather than the YAML. Nothing returns the shape or status of a refused page request — `refused_for_non_administrator` and `field_error` are free text on each surface, so two refusals can be shown to have happened but not to have answered in the same shape, which blocks R-7.11 and R-7.16. No surface addresses the learn-more index, and no action anywhere follows a service level agreement link; the program cards exist only as the observation `opportunity_program_select.program_card`, which has nothing to follow, and this is what left the five links in R-7.18 unfollowable and R-7.15 untestable outright. The pages the service creates for itself carry no seed handle, so a body written through content-create or content-edit cannot be got into an embedded rendering, which blocks R-7.14. Content-edit names no observation of a version history, an earlier version or a comparison and offers no restore action, so R-7.23 cannot assert that none exists. The target carries a single administrator sign-in and the surface drives one session, so the two-editor window R-7.28 starts from cannot be produced, and no observation reports a version-key collision. And R-7.29 needs an embedded page to have been removed, which R-7.25 records the service refuses to allow.
