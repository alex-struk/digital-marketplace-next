---
gate: G3
question: "Does slice 5 (An administrator can write and manage the service's pages) do what its criteria say?"
recommendation: "I fixed the two image-upload criteria (R-7.26 and R-8.29) at their cause."
opened: 2026-10-01T04:27:24.264Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 5 (An administrator can write and manage the service's pages) do what its criteria say?

**Recommendation.** I fixed the two image-upload criteria (R-7.26 and R-8.29) at their cause.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the two image-upload criteria (R-7.26 and R-8.29) at their cause. R-7.8 I changed on a likely guess, not a confirmed cause. I couldn't drive the running app: this session needed approval to start the compose stack and to read the sandbox password, so nothing here has been checked in a browser. The other fifteen criteria were not touched. `npm --prefix app run check` passes: typechecks plus 16 migrations tests, 315 backend tests and 177 frontend tests.

**R-7.26 and R-8.29: "Insert image" opened no file chooser.** The design-system package (`@bcgov/design-system-react-components` 0.8.1) bundles its own copy of React Aria inside its build. The editor wrapped the design system's `Button` in the app's own `FileTrigger`. That `FileTrigger`'s press handler never reaches a `Button` built from the other copy, so clicking it did nothing. The profile picture picker had already hit this and worked around it.

I applied the same workaround in `app/frontend/src/screens/content-form.tsx`. The editor now keeps a hidden file input that accepts only JPEG and PNG, and the "Insert image" button's `onPress` clicks it. The button, its `content-body-image-button` test identifier, the rule text and the upload-and-insert logic are unchanged. A new frontend test checks that pressing the button clicks the file input and that the input accepts only JPEG and PNG. With the chooser opening, the rest of those flows (upload, the `@file/<id>` marker at the cursor, the image on the published page) runs on code that was already there. The acceptance run never got past the chooser, though, so this is the first time those steps will be exercised in a browser.

**R-7.8: a value read back empty.** The ruling doesn't say which value. The managing screen, the public page and the list all show what R-7.8 asks for, and the last revision's guess (showing dates to the minute) didn't clear the failure.

The one real gap I found was in the service. A change request that left out the title or body was treated as sending them empty. A request carrying only a new body was therefore refused ("Title: Enter a title") and the page stayed as it was. Nothing in the contract makes those fields required, and R-7.20 refuses an *empty* title, not a missing one. A field left out now keeps the page's current value, as a missing address already did. A field sent empty is still refused. The change is in `app/backend/src/content/content.service.ts`, with two new unit tests: one for a body-only change, one confirming an empty title is still refused.

If R-7.8 still fails, the empty value is one I couldn't identify by reading the code. Watching the acceptance run's actual steps, or a ruling that names the observation, would settle it. I did consider rendering a version history, but rejected it: R-7.23 and the design both say no element with that identifier may appear.

**Records and cleanup.** I added both decisions to `docs/decisions/0025-managing-pages.md`: the file input standing in for `FileTrigger`, and missing fields keeping their current values. I installed packages to run the checks and removed every `node_modules` directory afterwards, since none existed beforehand and there is no ignore file. Nothing outside `app/` and `docs/decisions/` was changed.

**For the next slice:** any other screen that uses `FileTrigger` with the design system's `Button` (an organisation logo, attachments) will hit the same dead button and needs the same workaround.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Does slice 5 do what its criteria say? 17 of 18 criteria pass. The two image-upload criteria, R-7.26 and R-8.29, now pass, so the file-input workaround in content-form.tsx fixed the real cause. R-7.8 fails at line 38 of tests/acceptance/content/R-7.8.spec.ts, and the fault is in the adapter, not the application. The new-target adapter's contentView.updatedDate (tests/adapters/new/index.ts:698) calls datedLine("Updated"). That looks for a line written as 'Published <date> | Updated <date>' (its regex needs a capital 'Updated' at the start of a line or after a pipe). The design (design/DESIGN.md:1614; design/catalogue/content-view.default.stories.tsx:30) and the app (app/frontend/src/screens/content-view.tsx:81) both show the date under a separate 'Last updated' label. So the adapter reads '' before and after the change, and not.toBe('') fails. 'Published' only binds because that word starts its own line. Three builds changed the application for an adapter fault, which is why verify escalated, and a fourth build could not clear it. Ruling: return, with the fix addressed to bind-adapter. The build's own changes are sound and need no revision: the image-chooser fix is confirmed by verify, and letting a missing title or body keep the current value matches R-7.20, which refuses an empty title, not a missing one. What would change the ruling: once bind-adapter rebinds contentView.updatedDate to the 'Last updated' value and verify passes R-7.8 against this tree, the slice can be approved. If R-7.8 still fails after the rebind, the application is at fault again.

**Conditions:**
- addressed-to bind-adapter: contentView.updatedDate for target new (tests/adapters/new/index.ts:698) reads datedLine("Updated"), which expects a 'Published <date> | Updated <date>' line. The public page at /content/<address> shows its dates as a definition list, with 'Published' and 'Last updated' as terms and the date in the next element (design/DESIGN.md:1614, design/catalogue/content-view.default.stories.tsx:30, app/frontend/src/screens/content-view.tsx:68-91). The regex never matches 'Last updated', so updatedDate returns '' both before and after a change, and R-7.8's not.toBe(readerUpdatedBefore) fails with Expected: not "". Bind updatedDate (and publishedDate, for consistency) to the value after the 'Last updated' / 'Published' term on the public page, as contentEdit.updatedDate already does with contentFact("Last updated"). If the term is missing, throw an unbound error rather than returning ''.
