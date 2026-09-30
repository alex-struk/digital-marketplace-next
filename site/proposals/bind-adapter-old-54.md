| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T09:14:25.251Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** `bindings.yaml` is unchanged because it already lists all three members involved as `bound`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've fixed both findings in `tests/adapters/old/index.ts`. `bindings.yaml` is unchanged because it already lists all three members involved as `bound`. I couldn't run the adapter as a test: the workspace has no Playwright install and I wasn't able to add one. So I checked each fix by repeating its steps in the browser against old at localhost:4300, and I couldn't run a type check either.

**R-1.17 (Question box on the Sprint With Us create form).** The error-reading code was not the problem; the Question value itself was being lost. I opened a fresh form, went to "6. Team Questions", pressed "Add Question" and filled the new Question box right away, as the adapter does. The box showed all 1,001 characters, but old never took the value in: no message appeared and Submit for Review stayed disabled. When I clicked into the box, typed one more character and left it, old showed "Question must be between 1 and 1000 characters long." That explains why the over-length Response Guidelines row passes: its box is filled later, once the new question has settled.

The fix: for `add_team_question` and `add_resource_question` only, each text box is now filled, then clicked into, a character typed at the end and deleted, and the box left. This covers the empty-value case you described too. On a fresh slot, an empty Response Guidelines now shows "Guideline must be between 1 and 1000 characters long." and a 1,001-character Question shows its message. Number fields and every other form's entry are unchanged. Team With Us resource questions use the same code, but I only watched this happen on the Sprint With Us form.

**R-7.26 (image on the published page).** The cause was not the one the finding suggested. I published a probe page with an uploaded `body-image.png`. The old page-walking code did reach the paragraph after the "Published … | Updated …" line, but old draws the image as an `img` named "body-image.png" whose source is empty. The file itself does exist at `/api/files/<id>`, but the published page never points to it, and the old code discarded images with an empty source, so it returned ''.

The reader now collects every image after the page title within the page's content, skipping the site header, footer and the Published/Updated line. An image with a source is reported by its address; one without is reported as `img "body-image.png" (no source)`. It never makes up an `/api/files/<id>` address the page doesn't have. So if the test expects that address inside the image, it will still fail on old — and correctly so, because old doesn't render one. A reviewer should know that this is a shortcoming of old, not of the adapter.

**Side effects.**
- I deleted the probe page afterwards, and it now shows "Not Found". I left the Sprint With Us form I tried this on unsaved.
- The browser tool created a `.playwright-mcp/` folder of console logs at the workspace root, outside my directory. I didn't create it and left it alone.

No other route or binding changed in this pass.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does bind-adapter-old-54 bind R-1.17's question and guideline field errors and R-7.26's published-image observation on old, and nothing else? Ruling: approve. It came here because each item was sent back 3 times against a rebind limit of 2. That is a loop count, not a pipeline defect, so it is ruled here and not escalated. Both fixes answer the third send-back. R-1.17: for addTeamQuestion and addResourceQuestion only, each text box is filled, a key is typed and deleted, and the box is left. Old then checks the box as it stands, so both the 1,001-character Question and an empty value show old's own message. Number fields and other forms are unchanged. R-7.26: the claim that decides it was checked against old's source. The upload writes a 'FILE_ID:<id>' marker (sources/old/src/shared/lib/resources/file.ts:80). Old uses react-markdown ^10.1.0, whose default URL transform blanks that unknown prefix before decodeImgSrc (markdown.tsx:45-47) sees it, so old draws img alt='body-image.png' with src=''. The adapter now finds the image inside the page's content region and reports it as 'img "body-image.png" (no source)' rather than inventing an /api/files address. That is the correct binding. A test that expects /api/files/<id> will fail on old because old does not show the image, not because of the adapter. The diff is confined to tests/adapters/old/index.ts and the runner typecheck passed. What would change this: a run showing the typed entry breaks a number field or another form, or evidence that old does render an image source.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `2e8fb073f11a90d0b74ea8a5f18ad8d92e48462e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
