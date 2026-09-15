| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T23:53:06.225Z |
| holder | agent:reviewer |

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I rewrote the tests for all three criteria (R-4.14, R-4.31 and R-4.32), so each now has a test file and none goes in `not-testable.yaml`.

I rewrote the tests for all three criteria (R-4.14, R-4.31 and R-4.32), so each now has a test file and none goes in `not-testable.yaml`. I haven't run or type-checked them: there are no installed packages under `tests/`, and running the type checker through `npx` wasn't approved. A scan of the three files found nothing the separation check refuses (no page handle, locator, test id, `goto(`, URL or route string). The headers now carry spec@1c3743e and all the old redo notes are dealt with. Parts of R-4.31 and R-4.32 still can't be reached, as described below.

**R-4.14, the user list (three tests).** The redo note said the old test assumed two accounts were active and read the list before it had narrowed. The tests no longer assume anything about account status. The signed-in administrator's own status badge is used as the "active" reading, since a deactivated account couldn't have signed in. Any other account whose badge reads differently is reactivated, and the test then checks that its badge matches. Every read of the list now waits and retries until the list has updated.

The seed gives no one a name, and only people can name themselves. So the tests name four people through their own profiles:
- two active vendors;
- a public sector employee;
- the deactivated vendor, who is reactivated, names themselves, and is deactivated again.

That lets the ordering test check all three levels, where the old one only checked name order:
- **Status:** the inactive account comes after every active one, even though its name sorts first.
- **Account kind:** the public sector employee doesn't land between the two vendors. The criterion doesn't say which kind comes first, so the test doesn't either.
- **Name:** the two vendors appear in name order.

**R-4.31, deactivation (one test).** The redo note said the comparison profile, the one that should show a "Deactivate" control, might belong to an inactive account. That account is now made active first, using the same badge comparison. The test then checks that the administrator's own profile shows no "Deactivate" control, whether opened by account id or as their own profile. Two parts of the criterion remain out of reach and are explained in the file's comments:
- **Refusing a second deactivation:** nothing in the surface can ask to deactivate an account that is already inactive, and no observation reports an "already inactive" refusal.
- **The service accepting a self-deactivation request:** the only way to send one is the control the criterion says is hidden.

**R-4.32, contact-list export (one test).** The redo note asked the test to prove that nothing is ticked when the export dialog opens. The user list has no observation of which boxes are ticked, and every choice is a toggle. So the test works it out from whether the export button is available in four states: as opened, vendor kind only, email field only, and both. Unavailable, unavailable, unavailable, then available is the only pattern consistent with nothing being ticked at the start, and it also checks the rule itself. The file's contents can't be checked: nothing returns the downloaded document. That covers active accounts only, the administrator label, and the organization's legal name.

**What the contract needs, so these can be tested in full:**
- An observation on the user list of the exported contact-list file's contents. `observables.yaml` already describes the export and its contents, but no page returns them.
- An observation on the user list of which account kinds and fields are ticked in the export dialog. Without it, the starting state has to be inferred as above.
- A way to request deactivation of an account that is already inactive, or of one's own account as an administrator, without using the profile control. Plus an observation on the user profile of the "already inactive" refusal.

A smaller point for the contract: the list's status, account kind and administrator observations can only be checked as non-empty, because the contract doesn't say what they read for a given person. This was judged from the method names only, since `surface.yaml` has no descriptions for these observations.

## Ruling

**Verdict:** return
**By:** agent:reviewer

The question is whether the rewritten tests for R-4.14, R-4.31 and R-4.32 follow from their criteria and from nothing else. R-4.14 does. Its status, account-kind and name-order checks and its narrowing check all come from the criterion, and it now makes the accounts active and waits for the list to update, which answers its redo note. R-4.31 does too. It makes the comparison vendor active before looking for the Deactivate control, and both of its not-testable reasons are real: the user-profile contract has no observation of an already-inactive refusal, and the withheld control is the only way to request self-deactivation. R-4.32 does not. calibrate-old-4 ruled test-wrong because the test assumed nothing is chosen when the export choices open, and the new test's first assertion is still that export is unavailable as the dialog opens. The four-reading reasoning is logically sound, but it only confirms that assumption when it already holds and does not put the dialog into that state. If the dialog opens with anything ticked, the test fails at the same point as before, so the redo reason is not addressed, and removing R-4.32 from redo.yaml and applied.yaml is not backed by a check. The ruling becomes approve once R-4.32 puts the dialog into a known empty state before its checks, or records that clause as not-testable, naming the missing observation of which choices are ticked.

**Conditions:**
- R-4.32: do not assert that export is unavailable as the dialog opens. First put the dialog into a known state where no kind and no field is ticked. Availability alone is enough to find it: export is available only when at least one kind and one field are ticked, so the toggle combination that leaves export unavailable whatever is toggled on the other axis is the empty one. Then check kind only (unavailable), field only (unavailable), and one of each (available). If that cannot be done, record the rule's check in not-testable.yaml, naming the missing user-list observation of which kinds and fields are ticked, and do not assert the opening state.
- R-4.32: keep its redo.yaml and applied.yaml entries until the rewrite above is done. The R-4.14 and R-4.31 removals may stand, since their redo reasons are met.
- R-4.14 and R-4.31 need no change.
- Carried forward to the adapter owner, not the test writer: R-4.14 now signs in the deactivated-vendor persona after reactivating the account, and bind-adapter-old-10 noted that signIn sends that persona down the path expecting a refused sign-in, chosen by matching the persona's description text. Make sure an active account signs in normally, or R-4.14's setup will fail for a reason that is not the product's.

### Runner-owned typecheck evidence

Proposal revision: `77fa4292afa8d618ba8a08917a35e45833b39d70`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    No diagnostics.
