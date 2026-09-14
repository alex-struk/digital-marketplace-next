| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T20:18:29.676Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I revised `tests/adapters/old/index.ts` against every calibration finding, working from the running target at localhost:3000.

# Journal: rebinding the "old" adapter after calibration

I revised `tests/adapters/old/index.ts` against every calibration finding, working from the running target at localhost:3000. Every page in `spec/contract/surface.yaml` still resolves on the target. I didn't change `tests/adapters/old/bindings.yaml`: every finding was about a member already marked bound, and none turned bound into unbound or the other way round.

**Not verified.** No dependencies are installed under `tests/`, so the typecheck couldn't run, and the Node syntax check needed an approval that wasn't given. I re-read the new form-filling helpers by eye. I also reproduced their core locators in the browser against the live pages, and they found what they should.

## What the browser showed

- **Code With Us form.** It's a wizard: 1. Overview, 2. Description, 3. Details, 4. Attachments. The current step's name opens a menu that jumps to any step.
  - Overview: Title*, Teaser, Remote OK?* (Yes/No radios; Yes reveals Remote Description*), Location*, Fixed-Price Award*, Cost Recovery, Required Skills* (a picker).
  - Description: Description*.
  - Details: date-typed Proposal Deadline*, Assignment Date*, Proposed Start Date* and Completion Date, plus Project Submission Info, Acceptance Criteria* and Evaluation Criteria*.
- **Sprint and Team With Us forms.** Both start with 1. Agreement and 2. Evaluation Panel. The earlier forward-only walk could never reach the panel step once it was past it.
  - Added questions carry Question*, Response Guidelines*, Response Word Limit*, Score* and Minimum Score.
- **Disabled controls.** Publish, Submit for Review, Create Organization, proposal Submit, the dialog's Disqualify and the export dialog's Export are anchors. When disabled they have tabindex -1 and no href.
- **Proposal create.** 1. Proponent: Individual/Organization. Individual reveals Legal Name, Email Address, Phone, the address fields and Country. 2. Proposal: Proposal* and Additional Comments. 3. Attachments.
- **Organization create.** Legal Name*, Website Url, two Street Address boxes, City, Province/State, Postal / ZIP Code, Country, Contact Name, Job Title, Contact Email, Phone Number. Administrators and staff get "Not Found" here.
- **Other screens.**
  - Reporting figures sit in cards ("26" beside "Total Views").
  - The opportunity list's Unpublished and Closed groups start folded and open when their header is clicked.
  - The dashboard's "View all opportunities" leads to /opportunities.
  - An administrator's view of someone else's profile has no tab strip.
  - A saved avatar is shown from `/api/files/<id>?type=blob`, below the top bar, where the logo and small header avatar sit.

## What changed in the adapter

- **Shared helpers**
  - `press()` fails straight away on a disabled control, naming it and quoting any message the page shows. That error is deliberately not marked `unbound:`.
  - `settle()` now also waits for "Loading..." to disappear, which covers the findings about reading mid-save or mid-load.
  - Tabs are only taken from a screen's own "?tab=" links, never from the site-wide top bar. A tab the reader isn't offered reads as "" instead of throwing.
  - Wizard steps are reached directly through the step menu.
  - A new form filler matches each input key to a field label, walks the wizard from step 1, and throws `unbound:` naming any key with no field.
- **Opportunities**
  - Create: save draft, submit for review and publish all enter the input first. Save waits until the page reaches the record's own address.
  - A public sector employee who is offered no Publish control gets a quiet return, so the test can read the refusal.
  - `editDetails` fills the form and saves with whichever control the top bar offers.
  - Team and resource questions are filled from their input, and the evaluation panel goes straight to its step.
  - Group readers open a folded group before reading it. The administrator reader follows "View all opportunities".
  - Reporting figures are read from their cards.
- **Proposals and organizations**
  - Proposal save and submit fill Proposal and Additional Comments first; accepting terms ticks boxes instead of toggling them.
  - Choosing Individual fills the individual's details.
  - Disqualify types the reason into the dialog.
  - Exports read "" on a Not Found screen.
  - Organization names come back as every name in the "Organization Name" or "Legal Name" column, in page order.
  - Organization create fills the form, and stays quiet on Not Found.
  - Edit waits for the page to render; save waits for the save to finish.
  - The image chooser waits for its preview.
- **Profiles, content and files**
  - Profile save fills Name, Email Address and Job Title.
  - The profile tab reads the whole profile screen, top-bar controls included, when there is no tab strip.
  - `notFoundPage` only returns text when "Not Found" is shown.
  - Export reads "disabled" only while Export is disabled.
  - The "Vendors Notified" alert is read wherever it appears, after the dialog closes.
  - Content: slug and body are now read from the input, `pageTitle` reads the h1, and `updatedDate` no longer matches "Updated By".
  - `uploadFile` sends no metadata when no read access is given.
  - `downloadFile` reuses the file id passed to `open()`.
  - Attachment readers go to the Attachments step first.
  - Image readers ignore the top bar.

## Not fixed

**The deactivated-vendor sign-in (R-4.4) stays unbound.** The adapter now sends that persona through the identity-provider button. On this target, though, "Sign In Using GitHub" goes to github.com itself, not a sandbox. The sandbox account isn't a GitHub account, and I won't send the sandbox password to a third party. So `signIn` throws `unbound: signIn.deactivated-vendor` and explains this. The session route does reach the account, but it ignores deactivation, so it can't show the refusal.

## Side effects on the target

While looking, I saved a profile picture on the file-uploader account (vendor 6). I opened and then cancelled edit and disqualify dialogs without saving anything.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the revised tests/adapters/old/index.ts binds every surface action and observation on old and nothing else. Ruling: approve. The adapter still only moves around pages and finds things on them. The diff adds no assertion, and nothing in it decides whether a test passes. Readers that now return '' do so for a withheld tab, the Not Found screen, or Export once it is enabled, and these match what the tests expect: R-4.32 wants truthy before the selection and falsy after, and R-4.12, R-4.25 and R-4.9 read notFoundPage the same way. Each defect named in calibrate-triage-old-3 has a matching change. Forms are now filled from their input before anything is pressed, and press() reports a disabled control at once instead of clicking it until the 120 s timeout. Saves wait for the record's own address before its identifier is read. The evaluation panel is reached through the step menu. Folded opportunity groups are opened before they are read. Reporting figures are read from their cards. Disqualify types its reason into the dialog. asText reads slug and body. downloadFile reuses the file id passed to open(). profileTab reads the whole screen where there is no tab strip. Tabs are taken only from a screen's own ?tab= links, never from the top bar. Nothing under tests/acceptance changed, and config.yaml defines no protected paths. The authoring agent could not run the typecheck, but the runner ran it on revision 0eddc29 and it passed with no diagnostics under adapters/old/. The single new unbound, signIn.deactivated-vendor, has a real reason. On this target 'Sign In Using GitHub' goes to github.com itself, not to a sandbox identity provider, and the session route that reaches the account ignores deactivation, so the refusal R-4.4 needs cannot be observed. The adapter also stops before typing the sandbox password anywhere. Tier is STANDARD and the receipt marks no risk as unaccepted, so this does not escalate. What would change the ruling: a calibration run showing that a binding hides a failure. That would be a quiet return, or a '' reader, that makes a criterion pass while the page does not do what the criterion says. It would also change if the fill helpers turn out to report a missing field as unbound when the field is on the page.

**Conditions:**
- Re-run calibrate against old before this adapter is relied on. The new form filler and step navigation were checked by eye and by browser locator probes, not by running the suite. Any criterion that still fails at the same assertion goes to the product owner as a product-question.
- Change signIn so it chooses the identity-provider path from the persona's id or its sandbox-idp entry, not by matching 'sign in and be refused' in the persona's can text. Today, if that wording changes, the deactivated vendor silently goes back through the session route, which cannot show the refusal.

### Runner-owned typecheck evidence

Proposal revision: `0eddc291a564513cf7c172232435cd67ae6a2e93`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
