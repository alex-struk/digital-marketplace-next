---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "I rewrote the tests for all three criteria (R-4.14, R-4.31 and R-4.32), so each now has a test file and none goes in `not-testable.yaml`."
opened: 2026-09-14T23:53:06.225Z
---

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
