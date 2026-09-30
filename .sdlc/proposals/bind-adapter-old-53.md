---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the two calibration findings (R-1.17 and R-7.26) in `tests/adapters/old/index.ts`."
opened: 2026-09-30T08:25:20.527Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the two calibration findings (R-1.17 and R-7.26) in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the two calibration findings (R-1.17 and R-7.26) in `tests/adapters/old/index.ts`. I couldn't type-check the file: the workspace has no `node_modules`, and I didn't have permission to run `npx`. I did check each fix against the running target where I could, but I have not run the tests themselves.

**R-1.17, the Team With Us resource questions.** `opportunityTwuEdit.resourceQuestionsTab` used to read the sidebar link "Resource Questions", which sits under proposal evaluation and shows scoring. Signed in as an administrator on the seeded closed Team With Us opportunity, I opened the "Opportunity" tab and used its step menu. It lists "5. Resource Questions", with one "Question N" block per question. Each block has boxes labelled Question, Response Guidelines, Response Word Limit, Score and Minimum Score. Reading those boxes gives the four seeded questions in order. The page is laid out the same way as the Sprint With Us "Team Questions" step, which an earlier run had already fixed. I moved that reader into one shared function, `authoredQuestions`, so both pages now read the questions this opportunity lists. Someone not offered the Opportunity tab still reads empty.

**R-1.17, `fieldError` on the two create forms.** The Sprint With Us and Team With Us create forms share one wizard. Its `fieldError` used to add "`<step>` is incomplete" whenever the save control was disabled. I removed that, along with the variable that tracked those steps, so `fieldError` now returns only the page's alerts and the messages drawn under fields. When the form refuses without saying anything, it reads empty. On the Team With Us create form I added a question and cleared both boxes. The empty guideline showed "Guideline must be between 1 and 1000 characters long." and the empty question showed no message at all. The reader now reports exactly that, so the empty-question row no longer gets the word "Questions" from a step title.

**R-7.26, embedded images.**
- **`imageRenderedInPublishedText`** now opens the published page itself. It takes the slug from the current address (`/content/<slug>/edit` after "Publish Changes", or `/content/<slug>`), or failing that from the slug the page was last opened with. It then goes to `/content/<slug>` and reads the images in the body there. If no slug is known at all it throws `unbound:`. I confirmed on the seeded "about" page that the edit screen stays on `/content/about/edit` and that the published page's first heading exists. The image reader looks only at what follows that heading, so it skips the site logo.
- **`imageInsertedIntoText`** now returns only the image references in the body: the `FILE_ID:<id>` marker the editor writes, or an `/api/files/…` address. It returns empty when no image was inserted.

I did not upload and publish a real image to check the rendered output end to end. Doing so would have changed a seeded page on the shared target. The marker format comes from an earlier observation recorded in the adapter, and my one attempt to upload from the browser tools failed on a tooling error.

`bindings.yaml` already listed every member involved as `bound`, and nothing became unbound, so I left it unchanged. No route failed to resolve, and I changed nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on old, and nothing else? Ruling: approve. The diff touches only tests/adapters/old/index.ts (nothing under tests/acceptance) and the runner's typecheck of this revision passed with no diagnostics under adapters/old. Each change is navigation or locating/reading, with no assertion and no business logic: resourceQuestionsTab now reads the Opportunity tab's '5. Resource Questions' step (the opportunity's authored questions) instead of the sidebar's same-named scoring link, via an authoredQuestions helper that is a straight refactor of the already-fixed Team Questions reader; fieldError no longer invents '<step> is incomplete' text the page never shows and now reports only alerts and under-field messages, empty when the form refuses silently, which removes the adapter speaking for the page; imageRenderedInPublishedText navigates to /content/<slug> before reading and throws unbound via nothing() when no slug is known rather than answering empty; imageInsertedIntoText returns only the image references in the body, which is the observation R-7.26 names. The replacement open() keeps the shape of the at() helper it replaces, and rememberBodyImage exists. Nothing was run end to end (no real image was uploaded and published), and establishing that is calibration's job on its next run, not grounds to hold this gate. What would change the ruling: calibration showing either reader still reads the wrong place, or any binding beginning to decide an outcome.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `fa0a1daf1c1145273baa2a5c9ac85d872f4f2670`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
