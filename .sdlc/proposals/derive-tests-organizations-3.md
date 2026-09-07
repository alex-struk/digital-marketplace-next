---
gate: G3
question: "Do the revised organizations tests now follow from their criteria and from nothing else?"
recommendation: "All three conditions are acted on; one of them could only be satisfied in substance, not byte-for-byte, and that needs stating plainly."
opened: 2026-09-07T14:59:14.790Z
---

# Do the revised organizations tests now follow from their criteria and from nothing else?

**Recommendation.** All three conditions are acted on; one of them could only be satisfied in substance, not byte-for-byte, and that needs stating plainly.

Done. All three conditions are acted on; one of them could only be satisfied in substance, not byte-for-byte, and that needs stating plainly.

**Condition 1 — the deleted `not-testable.yaml` entries.** The reviewer is right about the defect: the file as I received this run holds only the header comment and the three R-3 rows, and every R-6.\* and R-8.\* entry is gone. It is also right about the count. Cross-checking the two domain specs against the spec files on disk, sixteen R-6 criteria (1, 2, 3, 4, 5, 8, 9, 11, 12, 15, 16, 18, 20, 24, 25, 27) and eighteen R-8 criteria (3, 4, 5, 6, 7, 8, 9, 11, 13, 15, 16, 17, 18, 19, 22, 24, 26, 31) have neither a spec file nor, until now, an entry — exactly the thirty-four that were lost. The earlier journal's claim that nothing in that file changed was wrong, and I withdraw it: the file was rewritten, not appended to.

What I could not do is restore the original text. This workspace is not a git repository and holds no prior copy of the file, so the ratified wording of those thirty-four reasons is unrecoverable from here. Rather than leave thirty-four criteria with no recorded reason at all, I re-derived a reason for each from the same sources a first derivation would use — the two domain specs, `spec/contract/surface.yaml`, and the `Mail` fixture — and inserted all thirty-four ahead of the R-3 rows, which are untouched, as is the header comment. The file now carries thirty-seven entries. **Whoever rules on this should know the thirty-four reasons are freshly written prose, not the ratified originals**; if the originals exist in the history outside this workspace, restoring them over mine is the better outcome and my insertion should be treated as a placeholder.

The re-derived reasons cluster around two real shortfalls. In notifications, the `Mail` fixture exposes only a message's subject, snippet, recipient and id, so every criterion about a message's body, its sender, its reply-to, its plain-text form, or its visible-versus-hidden recipients is unreachable; and several givens — notifications switched off, an unreachable mail server, a test-marked environment, a brand-new account, a narrow screen — cannot be brought about through any page in the contract. In files, the recurring blocker is that no observation anywhere yields an attachment's identifier or a file's record apart from its bytes, and no upload action carries a read-access statement or a declared size the test chooses.

**Condition 2 — R-3.27's vacuous assertion.** Test 1 now reads `swuRequirementTermsAccepted()` on the qualification page *before* the terms are accepted, then accepts, then asserts the reading is `not.toBe` the earlier one — the same differential technique R-3.25 and R-3.26 use, which needs no guess at the page's wording and can genuinely fail if acceptance leaves the qualification page unchanged. `acceptedOnNotice()` is still asserted truthy alongside it, covering the recorded half of the clause. Test 2 is untouched.

**Condition 3 — R-3.10's "team size falls to one" clause.** The criterion's third outcome now has a check. `organizationUserMemberships.teamMemberCount()` is read from the owner's own memberships page while both people are active, and read again after the member leaves, with the two asserted different. It has to be the owner's page rather than the departing member's: once the membership ends, the organization is no longer on the member's affiliated table, so the count would be unreadable from there. The observation takes no arguments and returns a string, so the assertion rests on the reading changing rather than on any particular number or wording.

Nothing else was edited. No `derived` date was rewritten — both files I changed already carried today's date. The remaining thirty spec files in `tests/acceptance/organizations/` and the three R-3 entries stand as I found them.

One thing I want to name for whoever writes the contract next, since it is what forced most of the thirty-four entries: a mail observation of a message's **body** would unblock roughly a third of the notifications shortfall on its own, and an observation of an **attachment's identifier** would unblock most of the files shortfall. Those two additions are worth more than any other pair I could name.
