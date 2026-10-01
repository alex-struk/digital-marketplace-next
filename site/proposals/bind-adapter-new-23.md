| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T07:19:21.114Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound most of the reported criteria, but nothing has been type-checked or run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rebound most of the reported criteria, but nothing has been type-checked or run. The workspace has no `node_modules` and running the type checker needed approval, so the edits to `tests/adapters/new/index.ts` were only checked by rereading them. Every locator in them was tried by hand in the browser first.

**What changed on the target.** Several screens earlier runs reported as "Page not found" now open, signed in as the administrator or as a public sector employee:
- the program chooser at `/opportunities/create`
- the Code With Us create form
- a Code With Us opportunity's management screen at `/opportunities/code-with-us/:opportunityId/edit`
- the public Code With Us page, which also opens signed out and has been redrawn

A vendor still gets "Page not found" on all of the staff screens.

**Newly bound:**
- **Program chooser (R-1.8):** the three "Create a … opportunity" links, the program cards and the "Maximum budget" lines.
- **Code With Us create form (R-1.4, 1.7, 1.14, 1.19–1.23, 1.34, 1.37, 1.56, 6.8, 8.25):** the `remoteOk` failure was real. The form now asks "Is remote work acceptable?" as Yes/No radios, which ignore an ordinary check, so the adapter clicks the label. Skills is a multi-pick popover. Every other input key goes to the field its label names, and a key nothing takes is still reported unbound by name. The administrator gets "Save draft" and "Publish" (with a "Publish opportunity" confirmation the old code would not have pressed). Staff get "Save draft" and "Submit for review". A refused submit stays on the form with an alert listing each problem, which `field_error` reads.
- **Management screen (R-8.19, 8.22, 8.25, 1.9):** the identifier, created-by and last-changed-by, the Summary, Opportunity, Addenda and History sections, the four dates read from the form, and Edit, Publish, Submit for review and Delete. Which actions appear depends on the state:

| State | Actions offered |
|---|---|
| Draft | Edit, Publish (administrator) or Submit for review (staff), Delete |
| Published | Edit |
| Awarded | none |

- **Attachment control (R-8.27):** every member, on a Code With Us opportunity's `?tab=opportunity` form. I checked adding, renaming (with the "Will be saved as" preview), the 10 MB refusal alert, saving, the stored `/api/files/` link, and the read-only name on a stored file. A newly added file is only stored when the form is saved. So `add_attachment` leaves it listed as new, and the readers that need it stored (the address, download and the public list) press "Save changes" first.
- **Public Code With Us page:** rebound as well, though no criterion named it. The old readers expected the previous layout and would have misread the new one. It now reads the status, dates, reward, people, Key dates and Addenda.

**Still unbound, after looking again:**
- **Sprint With Us and Team With Us:** the create forms, every edit and view screen, and the Team With Us evaluation screens (R-6.15). These answer "Page not found" to the administrator, staff and a vendor, tried with the seeded closed, awarded and at-consensus opportunities. The Sprint With Us page R-1.19 needs is one of them.
- **Code With Us proposal form (R-8.22):** "Page not found" to a vendor using the seeded published opportunity, and that opportunity's page offers no way to start a proposal.
- **On the Code With Us screens:**
  - `toggle_watch`: no control exists on the public page.
  - `cancel_opportunity`: no cancel action in any state I saw.
  - `add_addendum` and `add_note`: the Addenda and History sections have no add controls.
  - `proposals_tab`: there is no Proposals section, even on the seeded opportunity with three proposals.
  - The three reporting counts: never shown on a published opportunity. A draft's summary says counts begin at publication, and there they read as empty.
  - An awarded opportunity names no winner, so the successful-proponent readers return empty rather than unbound.
- **Code With Us report screen** (`/complete`): "Page not found".

I rewrote the stale "only /dashboard" reasons to describe the current build. `bindings.yaml` marks all of the above, with the reasons spelled as in the contract.

While binding I created two opportunities on the target and they are still there:
- "Probe CWU …", published by the administrator, with one stored attachment, `probe-notes.pdf`.
- "Probe staff draft", a draft by the public sector employee.

I opened the seeded draft's Publish and Delete dialogs but cancelled both, so no seeded record was changed. I wrote nothing outside `tests/adapters/new/` apart from a scratch file.

## Fix turn

I fixed the single failed check: the adapter no longer contains anything the check reads as a `test()` block. The flagged line, `tests/adapters/new/index.ts:5578`, was not a test at all. A small helper, `itemsMatching`, lists the items in a form's attachments section, and it took a match function as a parameter named `test`. Calling that parameter as `test(words)` matched the pattern the separation check looks for.

I renamed the parameter to `matches` in its declaration and at its one call site. The helper behaves exactly as before, and its two callers pass their match functions by position, so neither needed changing. A search of `tests/adapters/new/` now finds no bare `test(` call; every other occurrence is a regular-expression `.test(...)` method call.

Nothing else in the adapter or in `bindings.yaml` changed. That includes the unbound members the rerun request listed, so they stay unbound with the same reasons. I did not compile the adapter or run it after the rename.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Approved. The diff touches only tests/adapters/new (no tests/acceptance, app or spec changes) and adds no assertions; the new bindings for the program chooser, the Code With Us create form, the management screen, the attachment control and the redrawn public page are navigation and locators only. Every remaining unbound reason names the roles and seeded records it was walked with and what was missing from the page (no cancel control, no addendum or note controls, no Proposals section or reporting counts, Sprint With Us/Team With Us/proposal/report screens answering 'Page not found'), so each one is real. The runner's typecheck passed with no diagnostics under adapters/new, which covers the author's caveat that nothing had been compiled, and the separation check now passes. The egress failure is about older .sdlc and site files from earlier build slices that this diff does not touch. Saving the form inside the attachment readers is normalisation the surface needs, since it has no save member. Reading the draft's 'counted once published' note, and an awarded page that names no winner, as empty is reporting what the page shows; neither is a pass/fail decision. Would change if a reader were shown to decide an outcome rather than report the page, or if an unbound reason were contradicted by a page that offers the control.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `0f5d076417df1267690e9aad6020002e9085c521`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
