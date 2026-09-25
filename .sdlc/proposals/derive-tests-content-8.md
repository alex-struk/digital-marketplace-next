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
