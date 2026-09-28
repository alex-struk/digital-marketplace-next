| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T16:08:50.177Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I rebound most of the members this list named in `tests/adapters/old/` and checked them by driving the live target at http://localhost:4300.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rebound most of the members this list named in `tests/adapters/old/` and checked them by driving the live target at http://localhost:4300. A few stay unbound, with reasons that now say where I looked. Every page route in `surface.yaml` that I opened resolved; none failed to resolve.

**How I checked.** `tsc` isn't installed in the workspace and installing packages wasn't permitted, so I couldn't run the typechecker. Instead I loaded a copy of the finished adapter into the browser tool's process. It parsed, and I called the rebound members against the target as the right personas. I did not run the acceptance suite, so calibration is the first real run. Those checks changed data on the target (an award, several scores, a withdrawn proposal, the "about-us" page renamed, a member removed, invitations answered, one organization left, a draft opportunity). The harness reseeds before each test, so this shouldn't matter, but anyone looking at 4300 by hand before then will see it.

**Most failures were the adapter giving up too early.** The top-bar controls ("Award", "Finalize Consensus Scores", "Edit" on the evaluation panel, "Title") only appear once the record has loaded, a moment after the page. Actions now look for a missing control for up to five seconds before reporting it. Other misses were real binding faults, now fixed:

- **Scoring (Code With Us score, team scenario, challenge, code challenge, resource questions):** there is never a "Score" field on the page. Scores go in through an "Enter Score" dialog, or "Edit Score" under Actions once a score exists. The dialog holds one number box and a "Submit Score" button.
- **Awarding:** "Award" is sometimes in the top bar and sometimes under "Actions". The confirmation button is "Award Opportunity".
- **Withdraw and delete on a vendor's own proposal:** these sit directly in the top bar; there is no Actions menu there.
- **Choosing the organization on Sprint and Team With Us proposals:** the form opens on "1. Evaluation". The "Organization" chooser is on "2. Team" / "2. Team Members". Organizations can now be given as seed records, and one the chooser doesn't offer is left unchosen as the refusal. The phase cost is the "<Phase> Cost" box on "3. Pricing".
- **Panel chair:** the panel has its own "Chair" chooser offering every public sector person, so a chair need not already be an evaluator. The chair reader now reads it.
- **Saving a score sheet as a draft:** after the first save, the sheet moves to its `/edit` address in read-only mode. Saving again means "Edit" then "Save Changes".
- **Opening a proponent from the evaluation list:** it now accepts a position (0), a proposal id or a seeded proposal.
- **Row controls that only appear on hover:** "Approve"/"Reject" beside a pending invitation, "Approve" beside a pending member (offered to administrators only), "Remove" beside a team member, and "Leave" beside an affiliation. The contract's `leave_organization` was also marked unbound and is now bound. A row that offers no such control is treated as the refusal.
- **Requests and inputs:**
  - Organization and person can be given as seed records.
  - Evaluation scores are accepted in several shapes.
  - A rename can be given as a `slug` different from the opened page's.
  - "Accept"/"Decline" match the invitation email's "Approve"/"Reject" links.
  - An unnamed body image uploads the harness's own PNG.
- **Contact export:** "public sector employee" maps to the "Government Users" box.
- **Page editor images:** the Body box stays read-only until "Edit" while "Choose File" still accepts a file, so the upload went nowhere. It now presses "Edit" first and waits for the image to appear in the text.
- **A 34-second stall when adding a Sprint With Us phase:** position reads on a box mid-animation waited out the whole action timeout. Bounding them brought it under 4 seconds, and every phase date and budget now lands.
- **Score readers that returned the wrong thing:** the Code With Us score read "1st" (the ranking) and the Sprint With Us scenario score read a tab name. They weren't on the list, but tests read them straight after scoring, so I fixed them. The adapter now reads only a figure drawn above its label, opening the stage's tab when needed.

**Places reached that show nothing now read empty instead of throwing.**
- The public opportunity pages carry no creator and no "last changed by", so `created_by_name` and `last_changed_by_name` return empty rather than unbound.
- A vendor gets "Not Found" when creating a page or an opportunity. Those actions now end quietly so the test reads the refusal, instead of reporting a missing field.

**Judgement call for review.** `only_jpeg_and_png_offered` returns the file types the "Choose File" control tells the browser's file picker to offer (`.jpg`, `.jpeg`, `.png`), read from the control after finding it by role and name. Nothing else on the page states the rule.

**Still unbound:**
- **Adding a note to an opportunity (Code With Us and Sprint With Us):** as administrator, on published, open and processing opportunities, History is a plain table and the Actions menu offers only Edit and Cancel.
- **`capability_checked`:** whether a capability is held shows only in an unlabelled icon's colour and shape.
- **The profile-completion page:** it never shows its form.
- **Personas the persona table marks unavailable:** first-time vendor, first-time public sector employee, first-time vendor without email, and self-reactivating vendor.
- **The deactivated vendor's sign-in:** its route lets the account straight in without checking its status, so it can't show the refusal. I kept the earlier decision to report it unbound.

**Stays unbound after the fix, pointing at an earlier step:**
- Seeded 701 still shows "Evaluators have not completed their evaluations yet." and no finalize control. Finalize now says so rather than blaming a missing label, so the earlier failing step is visible.
- The invitation email's Reject link points to `tab=organization` (singular) and lands on the profile tab without a confirmation. That's the application's behaviour; `reject_invitation` now answers from the Organizations tab.

I changed nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether this adapter binds every surface action and observation on old, and nothing else. Approved. The diff touches only tests/adapters/old/ and nothing under tests/acceptance. The changes are navigation and locators: the score dialogs, the top bar or Actions menu, row controls that appear only on hover, the choosers on the proposal steps, the panel's Chair chooser, the Edit then Save Changes path on a saved score sheet, and bounded position reads. None of them decides whether a test passes. The runner's typecheck exited 2, but it reported no diagnostics under adapters/old/; the two it reported are in adapters/new/, which this proposal does not answer for. The new silent refusal paths are safe: a row offering no Approve, Remove or Leave, and a vendor shown 'Not Found' on a create form. The refusal tests that use them (R-3.9, R-3.11) also require a visible error, so a click the adapter skipped still fails and goes to the product owner at calibration rather than passing falsely. The remaining unbound reasons are specific and real: add_note, capability_checked, the profile-completion form and the personas the persona table marks unavailable. created_by_name and last_changed_by_name now read empty on a public page that shows neither name, which honestly turns an unbound into a failure calibration will route to the product owner. Reading the file types the Choose File control offers the browser's picker is a fair observation of what the person is offered. The receipt says plainly that the suite was not run, so calibration is the first real test. The last calibration review blamed no failure on the adapter, so nothing is owed. What would change this: a calibration run showing a refusal test passing only because the adapter skipped the click, or any typecheck diagnostic under adapters/old/.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `c3125659d9d11f4c630dc2c203865fe529b71075`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
