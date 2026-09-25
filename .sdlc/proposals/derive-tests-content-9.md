---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I rewrote both files the ruling named."
opened: 2026-09-25T12:59:07.022Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I rewrote both files the ruling named.

I rewrote both files the ruling named. The one clause the ruling asked me to record as not-testable is recorded only in the R-7.17 test's comments and in this journal, not in `tests/acceptance/not-testable.yaml`. I couldn't run the typecheck: approval to run the compiler wasn't given. All my edits are under `tests/acceptance/content/`, and I left `not-testable.yaml` and every other file untouched.

**Condition 1, R-7.27.** Only the second test changed; the first test and the header are as I found them. The old test checked only that two non-"System" names differed. The new one reads the seeded administrators, `seed.users.administratorOne` as publisher and `seed.users.administratorTwo` as last editor. It asserts:
- the `publishedBy` and `updatedBy` observations equal those two people's seeded names;
- `publishedByLink` and `updatedByLink` each contain the matching person's seeded `id`.

The contract says each link goes to the named person's profile, and a profile is addressed by the person's identifier. So containing the `id` is how the test shows the link leads to that person's profile without writing a route into the test. I also removed the helper that swallowed read failures and returned an empty string. It is no longer needed, and a missing observation should now fail the test rather than read as blank.

**Rewritten test, R-7.17.** I replaced the file. The new test no longer requires the `<strong>` and `<em>` spans to reach the reader as literal text, and it no longer checks for leftover `**`, since the ruling asked for the never-executed and identical-rendering clauses only. It asserts only that the body renders identically in its own place and where it is embedded:
- An administrator publishes the seeded markup body onto the Sprint With Us scope page and the Team With Us terms page.
- Each is read on its own address and on the opportunity screen that embeds it (the scope section and the terms section).
- The two readings must match exactly after collapsing whitespace.
- As a guard against two empty screens matching each other, the own-address readings must contain the words inside the tagged spans. Those words survive every rendering the criterion allows, whether the tags are executed, removed or shown literally.

**What I could not do: the never-executed clause of R-7.17.** No observation can test it. `pageBody` returns the rendered text, and markup that was executed leaves the same words behind as markup that was taken out. The only thing the text can show is whether tags came through literally, and requiring that is exactly what the ruling rejected. The ruling asked for this clause to go in `not-testable.yaml`. My own instructions say a check refuses a criterion that has both a test file and a `not-testable.yaml` entry, and R-7.17 keeps its test file for the identical-rendering clause. So I didn't add the entry; the reason is written in the test file's comments and here instead.

Whoever rules next should decide whether the entry is still wanted despite that check. If it is, it would be `unobservable:` with owner `ratify`, because the clause could only be tested if the criterion were restated in terms something can observe. Alternatively the contract could add an observation that reports whether any markup in the body took effect, which would make it `blocked:` with owner `contract`.

**Surface additions this would need:** an observation on `content-view`, and on the screens that embed page bodies, reporting whether markup in the body took effect.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised R-7.27 and R-7.17 tests follow from their criteria and nothing else? Approve. R-7.27 now asserts published_by and updated_by equal the seeded names of administratorOne and administratorTwo and that each link carries that person's identifier, which is what the criterion's 'names the two people, each linked to their profile' asks and what derive-tests-content-8#3 required, with no route written into the test. R-7.17 no longer demands a literal rendering of markup; it asserts only the identical-rendering clause (own address vs the SWU scope section and TWU terms section, whitespace-collapsed), guarded against empty-matches-empty by the tagged words, and every assertion follows from the criterion. Tests that overwrite service pages (R-7.17, R-7.25) do not contaminate R-7.12 or R-7.27 because the fixture resets the target to seed before every test. The runner's typecheck reports no diagnostics under acceptance/content; its single failure is in adapters/new, outside this proposal. The remaining gap is R-7.17's never-executed clause: it is genuinely unobservable through page_body, and derive-tests cannot record it in not-testable.yaml while the criterion keeps a test file, so a passing R-7.17 result will establish only the identical-rendering clause. That is recorded below rather than returned, because derive-tests cannot act on it. What would change the ruling: a content-edit or content-view observation reporting whether markup in a body took effect. Once the contract offers one, the never-executed clause should be derived and asserted.

**Conditions:**
- condition-met derive-tests-content-8#3: tests/acceptance/content/R-7.27.spec.ts second test asserts publishedBy/updatedBy equal seed.users.administratorOne.name and administratorTwo.name, and publishedByLink/updatedByLink contain each person's seeded id, read through the contract observations with no route in the test.
- R-7.17's clause 'markup embedded in it is never executed' is not asserted by any test and is not recorded in not-testable.yaml: a pass on R-7.17 establishes only the identical-rendering clause. It stays open until the contract offers an observation reporting whether markup in a page body took effect.

### Runner-owned typecheck evidence

Proposal revision: `c38be5c360fa5f8bc201c321614a1a3995ae290e`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
