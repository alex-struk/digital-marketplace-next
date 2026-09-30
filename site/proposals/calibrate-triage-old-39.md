| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T08:45:11.310Z |
| holder | agent:reviewer |

# 2 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.17, R-7.26 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

2 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

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

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (an empty guideline is refused on submission for review, naming the guideline)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/guideline/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (a Team With Us question outside the limits is refused on publication, naming the offending field)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/guideline/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position (0 to 100) is set by its place in the opportunity's list of questions and is never entered by the person. These limits are enforced when the opportunity is submitted for review or published, where a question outside them is refused and the offending field is named; saving the opportunity as a draft does not apply them, so a draft may be saved holding a question outside these limits. (a question whose position would fall beyond 100 is refused on submission for review)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question|position|order/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
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

Question: which of R-1.17's and R-7.26's failures against old were caused by this project's adapter. Ruling: approve, sorting both as adapter-wrong. R-7.26: the error context shows the failing line is fileEmbeddedImage.imageRenderedInPublishedText (spec line 36). The page snapshot taken at that moment is the published /content/<slug> page, and it shows img "body-image.png" inside the paragraph directly after the 'Published … | Updated …' line under the level-1 heading. Old stored and rendered the image, and the adapter still returned ''. imageSources (index.ts:8434) collects images only from the heading's next element siblings, which on this markup never reaches that paragraph. R-1.17: this criterion was re-run in full against the rebound adapter. In old the Question and Response Guidelines boxes are the same LongText widget with the same validateGenericString check, which refuses with '<Name> must be between 1 and 1000 characters long.' In this same run the over-length guideline row passed while the over-length question row read '' from fieldError, with Submit for Review disabled (per the snapshot). Old's message for the question names 'Question', so the adapter is losing that box's message, either by filtering it or by filling the wrong box. The empty-question and empty-guideline rows (Sprint With Us submission and Team With Us publication) also read '': enterValue fills '' into a box that is already empty, which fires no change, so old's check never runs, whereas a person clearing the box would trigger it. The 102-question row goes through the same fieldError reader and cannot be judged until that is fixed. The R-1.17 attribution is inferred from the guideline-versus-question comparison, not from a rerun. What would change this: if the rebound readers reliably surface old's message for the over-length question and the empty-value or 102-question rows still fail, R-1.17 returns here as a product-question.

**Conditions:**
- adapter-wrong R-1.17: opportunitySwuCreate.fieldError returned '' for a 1,001-character question with Submit for Review disabled, although old's Question box uses the same LongText widget and check as Response Guidelines and shows 'Question must be between 1 and 1000 characters long.' (the over-length guideline row passes in the same run); find why addTeamQuestion's Question value or its field message is lost and return it. Also, a value given as empty for Question or Response Guidelines is filled into an already-empty box, which fires no change, so old never validates it: enter it as a person clearing the box would (type, then clear, then leave the box) so old's own refusal is shown, for both addTeamQuestion and addResourceQuestion.
- adapter-wrong R-7.26: fileEmbeddedImage.imageRenderedInPublishedText returned '' on the published /content/<slug> page, whose body visibly holds img "body-image.png" in the paragraph right after the 'Published … | Updated …' line; imageSources walks only the level-1 heading's next element siblings, which does not reach that paragraph on old's markup. Collect img elements from the page's content region after the heading (excluding site header and footer), and match the /api/files/<id> the body's FILE_ID marker names.
