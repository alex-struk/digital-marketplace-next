| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T10:03:45.516Z |
| holder | agent:reviewer |

# 4 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.10, R-1.17, R-7.26, R-8.31 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

4 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters. (a teaser over 500 characters)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters. (a description over 10,000 characters)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.17 · v3

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (an empty question is refused on submission for review, naming the question)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (a question over 1,000 characters is refused on submission for review, naming the question)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (a question whose position would fall beyond 100 is refused on submission for review)** — failed

```
Error: Timeout 15000ms exceeded while waiting on the predicate
```

### R-7.26 · v1

A page's body is written as marked-up text with an editor offering formatting shortcuts, a link to the guidance page, and image upload that places the uploaded image into the body.

- given: an administrator editing a page's body
- when: they use the image control to choose an image file
- then: the image is stored by the service and a reference to it is inserted into the body at the cursor, and the published page shows the image
- test: tests/acceptance/content/R-7.26.spec.ts

**the editor's image control stores the image, places a reference to it in the body, and the published page shows it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

```
Error: file-attachment-control.attachment_address — on the Attachments step of http://localhost:4300/opportunities/code-with-us/59271071-6ff4-46d7-9c5c-309c6a5427ad/edit?tab=opportunity there is neither a stored /api/files/ link nor a blob: preview of an added file; the page shows no message
```

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is which of the four criteria failing against old were caused by this project's own adapter. Ruling: approve, with all four sent back as adapter-wrong. I read each failure against tests/adapters/old/index.ts and the test; no page snapshot survives from this run. R-1.10: the title-over-200 row passes with the same stepFormErrors/fieldErrors reader, while the teaser and description rows read '' for 15s. Old validates both limits on the client and draws the message after the box, and the adapter's own comment quotes 'Teaser must be between 0 and 500 characters long.'. saidAfterField stops climbing as soon as an ancestor holds more than one field, and the description editor's image 'Choose File' input sits in the same group, so the message beneath is never reached. R-1.17: the empty-question and over-length-question rows fail exactly as ruled in calibrate-triage-old-39, while the over-length-guideline row using the same LongText widget passes, so addTeamQuestion's Question entry or its message is still lost. The position row goes with them so the binding run can report what old actually shows. R-7.26: imageSources discards any image whose ancestor's innerText begins with 'Published'. On old the body follows the 'Published … | Updated …' line inside the content region, so the reader can drop the body image the previous triage saw rendered. R-8.31: attachmentAddress itself reports that the Attachments step holds neither a stored /api/files/ link nor a blob: preview, so addAttachment left no file on the form without raising. Earlier triage recorded that old stores and links the file once 'Publish Changes' is confirmed. What would change this: a snapshot showing old's page with no field message on the teaser, description or question, or no image in the published body, would make that row a product-question.

**Conditions:**
- adapter-wrong R-1.10: for the over-length teaser (501 chars) and description (10,001 chars) rows, opportunityCwuCreate.fieldError() returned '' although old draws 'Teaser must be between 0 and 500 characters long.' / 'Description must be between 1 and 10000 characters long.' directly under the textarea, and the title-over-200 row passes with the same reader; saidAfterField stops climbing when an ancestor holds more than one field, which the description editor's own image 'Choose File' file input causes, so the field's message is never reached; confirm the value is actually entered into both textareas (Teaser and the Description markdown editor) and read the message drawn in the field's own form group, not counting the editor's file input as a second field
- adapter-wrong R-1.17: on submission for review, opportunitySwuCreate.fieldError() still returns '' for an empty Question and a 1,001-character Question, while the over-length Response Guidelines row using the same widget passes; addTeamQuestion must enter the Question value so old validates it (for an empty value, type then clear then leave the box so a change fires), and fieldError must read the message old draws under that Question box; for the 102-question row, submitForReview must report whether 'Submit for Review' was pressed or left disabled, and fieldError must include any alert or message old shows after it, rather than ending quietly with nothing read
- adapter-wrong R-7.26: fileEmbeddedImage returned '' after uploading a body image and publishing; imageSources skips any image with an ancestor whose innerText begins with 'Published', and on old's /content/<slug> page the body paragraph follows the 'Published … | Updated …' line inside the content region, so the body image is dropped; exclude only the date line itself, not containers that start with it, and check that imageInsertedIntoText reads the Body box after the upload finished writing '![name](FILE_ID:<id>)' into it
- adapter-wrong R-8.31: after fileAttachmentControl.addAttachment on a just-published Code With Us opportunity, attachmentAddress found neither a /api/files/ link nor a blob: preview on the Attachments step of /opportunities/code-with-us/<id>/edit?tab=opportunity, so the file was never added to the form; addAttachment must enter editing on the published opportunity if it is read-only, hand the file to the attachment input, save it through 'Publish Changes' and its confirmation, and raise when no file appears, rather than returning silently
