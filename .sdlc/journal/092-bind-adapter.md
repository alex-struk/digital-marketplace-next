---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-15T01:52:31.487Z"
cost: 5.699868500000001
turns: 72
session: "18823553-d16b-472d-949c-81109fbc5852"
---

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