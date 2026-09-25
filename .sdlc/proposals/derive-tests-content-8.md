---
gate: G3
question: "Do the revised content tests now follow from their criteria and from nothing else?"
recommendation: "I changed one file, `tests/acceptance/content/R-7.16.spec.ts`, to carry out condition 1."
opened: 2026-09-25T12:46:13.871Z
---

# Do the revised content tests now follow from their criteria and from nothing else?

**Recommendation.** I changed one file, `tests/acceptance/content/R-7.16.spec.ts`, to carry out condition 1.

I changed one file, `tests/acceptance/content/R-7.16.spec.ts`, to carry out condition 1. I couldn't run the typecheck: running the TypeScript compiler here needed an approval that was never given, so the file has only been checked by reading it.

**Condition 1 (R-7.16).** Both tests used to require each refusal to match `/403|forbidden/i`. That check is gone. The test now shows that a refusal is a permission refusal by comparing it with a known refusal, without naming any status code. R-7.16 replaces R-7.11, and R-7.11's defect was a permission refusal answered as if the submission were faulty. So each test starts by signing in as the administrator and creating a page through the content-request page at the address `Not_A_Slug`. R-7.21 says that address is refused as invalid. The test checks that this create is refused and has a status, keeps that answer as the malformed-submission refusal, then signs out.

It then signs in as the vendor. In the first test, the refusals for reading the list, creating, changing, renaming and removing must each be:
- not accepted, and have a status and a shape;
- a different status from the malformed-submission refusal;
- the same status and the same shape as each other, compared against the refused list read as before.

The second test now checks that the vendor's refused list read is not accepted, has a status, and differs from the malformed-submission refusal. The conditional comparison for reading one page (R-7.1 allows anyone to read a page) is unchanged. A new comment in the file explains why the contrast stands in for a status code.

The header keeps its criterion line and spec sha. Its "derived 2026-09-25" date already matched today, so it did not change. I touched no other file under `tests/acceptance/content/` and did not touch `tests/acceptance/not-testable.yaml`.

**One limit of this approach.** "Different from a malformed-submission refusal" is the strongest thing the contract lets a test say without naming a status. It does not prove the refusal is specifically for missing permission, as opposed to some other kind of refusal. A contract observation such as `refused_for_lack_of_permission` on content-request would let a later version say that directly. `user-list-request` and `organization-acting-for-list` already have a similar `refused_when_not_permitted` observation; content-request does not.

**Conditions I left alone:**
- **R-7.17** (the literal-tag rendering) is addressed to derive-tests. It is not one of the conditions this return listed as mine and was filed separately, so the test is unchanged.
- **R-7.27** is addressed to contract: the administrators' display names in the seed and where their links point on content-edit. Those files are outside what this stage delivers.

I did nothing about the reviewer's minor note on R-7.12, which was not a condition.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the revised content tests follow from their criteria and from nothing else? Returned. The one condition this revision owed is met: R-7.16 no longer names a status code and instead shows a vendor's refusal is a permission refusal by contrast with the service's refusal of a malformed submission (an administrator creating at the address R-7.21 refuses), which follows from R-7.16 superseding R-7.11, whose defect was exactly a permission refusal answered as a faulty submission; the same-status and same-shape comparisons across read-the-list, create, change, rename and remove are kept, the conditional read-one comparison still honours R-7.1, and the runner's typecheck reports no diagnostic under acceptance/content/. But the proposal still carries tests/acceptance/content/R-7.17.spec.ts unchanged, and the prior ruling found it overreaches its criterion: both tests require the seeded <strong>/<em> spans to reach the reader verbatim, where the criterion asks only that markup is never executed and that the body renders identically on its own address and where embedded. That condition was treated as filed elsewhere, but nothing open on the ledger shows it pending, and approving would merge a test already ruled as asserting what its criterion does not say. Separately, the seed now names both administrators and content-edit offers publishedByLink and updatedByLink, so R-7.27's second test can assert the two people and their profile links instead of only that two non-System names differ. Would approve once R-7.17 asserts only the never-executed and identical-rendering clauses (keeping the whitespace-normalised equality, and recording as not-testable any clause no observation can separate) and R-7.27 reads the seeded names and their links.

**Conditions:**
- condition-met derive-tests-content-stale-5#2: tests/acceptance/content/R-7.16.spec.ts no longer matches /403|forbidden/i; both tests take an administrator's malformed-submission refusal (a create at the address 'Not_A_Slug') as the contrast and require each vendor refusal to be a refusal whose status differs from it, keeping the same-status and same-shape comparisons across read-the-list, create, change, rename and remove.
- test-overreaches R-7.17: both tests require the tagged spans in the seeded body (<strong>these words bold</strong>, <em>these words emphasised</em>) to appear verbatim as literal text in the rendered body, on the page's own address and in the scope and terms embeddings; the criterion requires only that embedded markup is never executed and that the body renders identically on its own address and wherever it is embedded, so a rendering that removes the tags without executing them satisfies it and must not fail the test. Keep the own-address versus embedded equality; where no observation can distinguish executed from removed markup, record that clause as not-testable with that reason instead of asserting a literal rendering.
- R-7.27: tests/acceptance/content/R-7.27.spec.ts checks only that the second page's publisher and last editor are two different names other than 'System'. The criterion says the managing screen names the two people, each linked to their profile, and the generated seed now carries each administrator's name and content-edit now offers publishedByLink and updatedByLink. Assert that published_by and updated_by are the seeded names of the administrator who published the page and the one who changed it, and that each name carries a link to that person's profile, read through those observations without writing a route into the test.

### Runner-owned typecheck evidence

Proposal revision: `c320f299bceaa05f95c5956f359a0d89c5be5755`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
