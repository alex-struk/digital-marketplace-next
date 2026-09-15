---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "The adapter has not been typechecked or run: `tests/` has no `node_modules`, and I couldn't reach a TypeScript compiler from this session."
opened: 2026-09-15T01:52:31.500Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** The adapter has not been typechecked or run: `tests/` has no `node_modules`, and I couldn't reach a TypeScript compiler from this session.

I've fixed every finding in `tests/adapters/old/index.ts` and checked the key new interactions against the running target. The adapter has not been typechecked or run: `tests/` has no `node_modules`, and I couldn't reach a TypeScript compiler from this session. `bindings.yaml` is unchanged, because every member these findings touch was already bound and still is.

**Proposal submission** (R-2.3, 2.4, 2.14, 2.23–2.25, 2.36–2.38, 1.31, and the proposal parts of 8.20, 8.25, 8.31). The adapter now remembers which terms boxes an action ticked, and ticks them again when the dialog reopens after values are typed. When Submit stays disabled after every required field the test didn't name has been filled, that is the refusal (R-2.13, 2.14). The action returns quietly and leaves the form on the first step showing an error. `termsModal` and `submitDisabledUntilTermsAccepted` report unbound in that case, since the dialog was never reached.

**Evaluation panel** (R-5.1, 5.9, 5.16, 5.18, 5.19, 1.48, 1.55, and the panel parts of 2.24, 2.37, 8.20, 8.25, 1.56).
- **Who is named:** a seed user, identifier, persona id or address is turned into an email, and the chooser option containing that email is picked. On a draft's panel step, typing `staff.two@example.test` left only that one option.
- **`addPanelMember`:** reads `input.member` and fills the first empty slot, or makes a new one with "Add an evaluator".
- **`removePanelMember`:** finds the named member's slot and presses its "Remove this evaluator". That is one control holding both the icon and the words; pressing it took a panel from three slots to two. A panel of two shows no remove control, which is treated as the refusal.
- **Vendors:** if the test names a vendor, the chooser doesn't offer them, and that absence is treated as the page refusing.

**Score sheets** (R-5.10, 5.13, 5.14, 5.16, 5.24, 5.25, 5.27, 5.28, 5.32, 5.36). The test's `order` now picks the question, counted from 0 as the seed stores it. "Submit Scores for Consensus" returns quietly when disabled. `readOnlyAfterSubmitted` reads empty when the top bar offers Edit or an enabled Save Changes.

**Opportunity forms.**
- **Errors across steps** (R-1.10, 1.11, 1.12, 1.14): `fieldError` gathers errors from every step. On the Code With Us form, an overlong title shows its error on step 1 with Next still enabled.
- **Remote OK?** is no longer answered for the test (R-1.11).
- **Empty values:** an empty value for a field the form doesn't show is dropped rather than failing (R-1.39, R-3.26), and `addressLineTwo` maps to the second "Street Address" box.
- **Team questions** no longer treat `order` as a slot number (R-1.17).
- **Opportunity tab** is read step by step, field values included (R-1.4, 1.56).
- **`editDetails`** returns quietly when no Edit is offered (R-1.56).
- **Deadline:** read from the "Closes … at … PDT" line (R-1.14).
- **Addenda:** read by opening the list-item tab ending in "Addenda", and a disabled "Publish Addendum" cancels quietly (R-1.32).
- **Status filter:** types into the unnamed status chooser (R-1.39). That chooser offers only Draft, Under Review, Published, Evaluation and Awarded, so "open" is looked for as Published and evaluation codes as Evaluation.

**Organizations.** Team rows now end in "Admin: yes/no" (R-3.12). Service areas report only ticked boxes, in seed code form (R-3.28). The Organization tab includes its read-only field values (R-3.19). A "—" in a qualification column reads as empty (R-3.21).

**Files.**
- **Body image** (R-8.29): the file goes straight to the "Choose File" input, which is a real file input. On the About page this worked and put an image reference into the body.
- **`addAttachment`** also tries the top-bar Edit when the record has no Actions menu (R-8.19).
- **Saving** (R-8.19, 8.20, 8.25, 8.31): when only an unsaved preview exists, `attachmentAddress` presses Save Changes and waits for a stored `/api/files/` link. I put the save in that reader rather than in `addAttachment` so the rename and remove steps for new, unsaved attachments still see the file as new.

**Not done, and risks.**
- R-3.21 also asked to read a named row, but `swuQualifiedMark` and `twuQualifiedMark` take no input, so there is no row to name. They still read the first data row.
- Tests that publish without giving Remote OK? will now be refused, as R-1.11 asked.
- A test that adds an attachment and reopens the page before reading its address will find it gone.

**Routes.** Every route I opened resolved. The only "Not Found" pages are the Team With Us evaluation pages the reviewer already cleared as not a binding fault.

**Effect on the target.** My Choose File check uploaded one small text file, `probe.txt`, to its file store. I left the About page without saving it, and saved no drafts or panels.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: does the old adapter bind every surface action and observation, and nothing else? Approve. What I checked: (1) Nothing under tests/acceptance changed, and neither did tests/adapters/old/bindings.yaml. A git diff against main for those paths came back empty. (2) The runner compiled the proposal checkout itself and reports no errors under adapters/old/ (exit 0). That settles the author's own note that it could not typecheck. (3) The change leaves less decided by the adapter, not more. The old code ticked 'No' on any 'Remote OK?' question the test left blank. That was the adapter answering a question the criteria ask the author to answer, and it is gone. The other new behaviours only move around or find things: a question's 'order' now picks that question on the score sheet, a named person or seed user becomes their email so the chooser can find them, and errors are collected from every step of the form. Where the page refuses an action, the adapter now stops quietly instead of throwing: Submit stays disabled, 'Publish Addendum' stays disabled, a panel of two shows no remove control, a vendor is not offered in the chooser, or 'Submit Scores for Consensus' is disabled. The test then reads the page and makes the pass-or-fail call itself. The only place the adapter produces a word of its own is readOnlyAfterSubmitted. It returns 'read-only' when the top bar offers neither Edit nor an enabled Save Changes, which is how that page shows it cannot be changed. The status filter maps OPEN to Published and evaluation codes to Evaluation, and service areas are written as seed codes. Both translate the test's words into the page's words and decide nothing. (4) The two 'unbound' reasons added are real. termsModal and submitDisabledUntilTermsAccepted report unbound only when Submit is still disabled after every required field is filled, so the terms dialog never appears. (5) One point I checked more closely: attachmentAddress, a reader, now presses Save Changes when the file has only a browser preview and no stored link yet. A reader that saves could hide a criterion about files not being stored before a save. I read every test that calls attachmentAddress (R-8.19, 8.20, 8.25, 8.31). Each one uses it only to get the stored file's id right after adding the file, and none asserts anything about the unsaved state. So today the save is just a way to reach the stored link. The residual risks the author lists are stated openly and none is marked unaccepted: R-3.21's reader still takes no row name, and an attachment that is never saved disappears when the page is reopened. Tier is STANDARD, so this does not go to a human. What would change the ruling: a test or criterion that checks an attachment before it is saved, or that expects nothing to be stored until the author saves. The save inside attachmentAddress would then be deciding that outcome and would have to move into an explicit action. The same applies if the runner's typecheck turns out to be from a different revision than 8fab995.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `8fab9959695e7f3c7b69550ffbcdac3cfd16912f`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
