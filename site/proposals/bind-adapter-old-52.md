| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T07:08:54.034Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the four `evaluation_question_fields` readers the contract was missing to `tests/adapters/old/index.ts`, one each for the Sprint With Us and Team With Us create and edit pages.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the four `evaluation_question_fields` readers the contract was missing to `tests/adapters/old/index.ts`, one each for the Sprint With Us and Team With Us create and edit pages. All four are named `bound` in `tests/adapters/old/bindings.yaml`, spelled as the contract spells them. The existing bindings are unchanged, and every page route I used opened on the target. I could not run the TypeScript type-check: the command needed an approval that was not available in this session. So the new code has not been compiled, and the Playwright suite was not run against it.

**What I saw on the target.** I signed in through the administrator's session route and opened all four places:
- **Create forms:** on the new Sprint With Us form I went to step "6. Team Questions", and on the new Team With Us form to step "6. Resource Questions". Neither step has any question until "Add Question" is pressed. Each press adds a block headed "Question N" with five boxes: Question, Response Guidelines, Response Word Limit, Score and Minimum Score.
- **Edit pages:** I opened the seeded closed Sprint With Us opportunity (`…8000-000000000701`) and the seeded closed Team With Us opportunity (`…8000-000000000801`). On each, the Opportunity tab's "5. Team Questions" or "5. Resource Questions" step lists the seeded questions with the same five boxes, shown disabled.
- **No extra field:** no box for a position or order appears anywhere, which matches what the contract says.

**How the reader works.** It goes to the right step, using the step menu first and the form's own Previous/Next buttons as a fallback. On the edit pages it opens the Opportunity tab first. It then reads the boxes under the "Question N" heading for the place asked and returns them in the criteria's words, one per line: `question`, `guideline`, `response_word_limit`, `maximum_score`, `minimum_score`.
- A box with any other label is reported under its own label, so an unexpected field would show up rather than be hidden.
- The generated interface gives this reader no argument, but the contract says it reads "the question at a given place". So it takes an optional place (a number, or an object with `order`/`index`/`position`) and defaults to question 1.

**When it returns empty and when it throws.** It returns empty when:
- the list has no question at that place (for example, a new form before "Add Question" is pressed);
- the reader is shown the "Not Found" screen instead of the form;
- the reader is not offered the Opportunity tab on an edit page.

It throws `unbound:` only when no step with the right name can be reached.

**Checks.** I ran the same heading-and-box parsing in the browser against the live pages:
- The closed Sprint With Us opportunity's question 3 gave the five names; question 9 gave empty.
- A new Sprint With Us form gave empty before any question was added.
- After two presses of "Add Question", places 1 and 2 gave the five names and place 3 gave empty.

The edit pages were tested only on closed opportunities, where the boxes are read-only; the reader counts them either way. Nothing outside `tests/adapters/old/` was changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the adapter binds every surface action and observation on old and nothing else. Approved: the four evaluation_question_fields readers navigate to the Team/Resource Questions step (via the Opportunity tab on edit pages), locate the boxes under the requested 'Question N' heading, and map their labels to the criterion's vocabulary. Unknown labels are passed through under their own name rather than suppressed, so the reader decides nothing about pass or fail. The optional place argument defaults to 1 and stays compatible with the generated zero-argument interface. All four are named bound in bindings.yaml, none is unbound, the diff touches only tests/adapters/old/ (nothing under tests/acceptance or any protected path), and the runner's typecheck on this revision passed with no diagnostics under adapters/old/. Tier is STANDARD, so no escalation. The R-1.17 clause about position never being entered stays owed by derive-tests under its existing condition. A calibration failure traced to these readers not reaching the step would change this, as adapter-wrong.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `bd7dc2d6b9a39246fd4533d1d355dcbd18f7b5d3`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
