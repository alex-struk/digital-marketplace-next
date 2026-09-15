---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "All seven criteria in the users domain got a test file, and none went into `not-testable.yaml`."
opened: 2026-09-15T02:47:58.068Z
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** All seven criteria in the users domain got a test file, and none went into `not-testable.yaml`.

All seven criteria in the users domain got a test file, and none went into `not-testable.yaml`. Each file already existed from an earlier derivation. I rewrote them all under the new spec header, and six had redo notes that I addressed. Nothing has been run: `tests/` has no `node_modules`, so neither the type check nor Playwright could run. The only check done was a scan of the seven files for what the separation check refuses (page handles, locators, test ids, navigation calls, URLs and route-like strings), and it found nothing. The tsconfig targets ES2022, so the bare `catch {}` blocks are valid.

**What changed, per criterion**

- **R-4.5:** The redo said the second sign-in didn't go through a person's ordinary sign-in. The return now goes through the sign-in screen (`surface.userSignIn.open()` then `signInAsVendor(persona.vendor)`), not the fixture's `signIn`. The action's input is untyped, so passing the persona assumes the adapter will accept it. Before the return, the test shows the account was active and then inactive. "Active" means the badge reads the same as the signed-in administrator's own. There are three tests: let back in, active again, and emailed. The email test clears the catcher after the deactivation, then looks for "reactivated" in the subject and snippet of a message to the vendor.
  - This is the one place I read message wording from the snippet. An earlier entry (R-4.20) rejected the snippet because a phrase missing from it proves nothing. Here a match is positive evidence, but a correct message whose subject and opening lines don't use the word would fail.
- **R-4.9:** Three tests: session ends at once, told by email, record kept. As the redo asked, the "deactivated by them" marking is no longer inferred from the missing reactivation control. It is left unasserted, like the recorded date, because no observation shows either.
- **R-4.12:** Administrator rights are now read from `adminCheckbox` before and after, not from the account-type label. The account type is only checked where the criterion names it: withdrawal returns an ordinary public sector employee account. For the vendor, and for an employee trying on their own account, the test attempts the toggle and treats "no control offered" and "offered then refused" the same. What it checks is that the account is unchanged. It no longer demands a refusal message or a permissions label.
- **R-4.14:** The file already met most of its redo. I added a check that the three accounts compared with the inactive one are still active when the list is read. The narrowing test now also waits for a public sector employee's name to drop out.
- **R-4.27:** Invalid-field marks are now polled rather than read at once. A save the screen withholds counts as a refusal. Each refusal is followed by reopening the profile to check nothing was stored. I added boundary cases: a 1-character and a 100-character name save, 101 is refused, and the same for the job title.
- **R-4.31:** The comparison profile is proven active before the test relies on it. Whether a deactivation control is offered is now read from whether using it brings up the confirmation, not from a guessed word in the tab text. The test ends by confirming nothing was deactivated.
- **R-4.32:** The sweep that finds the state where no kind and no field are ticked is kept. The test now asserts export is unavailable in that state before building up to one kind and one field. It then chooses both kinds and all four fields.

**Parts of criteria that are still unasserted, and what would reach them**

- **R-4.9, date and who deactivated:** user-profile needs a `deactivated_on` observation and a `deactivated_by` observation (or a status badge the contract says distinguishes "deactivated by owner" from "deactivated by administrator").
- **R-4.31, second deactivation refused:** needs a way to send a deactivation against an already inactive account and read the answer. That could be a refusals entry for the deactivation request plus an `already_inactive_message` observation, or a mail/HTTP fixture over observables. The same gap covers the clause that the service accepts a deactivation of the requester's own account.
- **R-4.32, the exported file:** its contents (active vendor and administrator present, deactivated vendor absent, administrator labelled, organization legal name) need an observation that returns the document. observables.yaml already names `exports.contact_list` and `document_contents`, but nothing on the user-list page or in any fixture exposes them.
- **R-4.5 and R-4.9, message wording:** asserting it reliably needs a `mail` accessor over `read_one_message` that returns a message's text or HTML body.
