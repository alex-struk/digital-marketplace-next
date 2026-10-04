---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I rechecked all seven criteria on the running target at :4300."
opened: 2026-10-04T02:37:43.106Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rechecked all seven criteria on the running target at :4300.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rechecked all seven criteria on the running target at :4300. None of them can be bound on this build, so I left `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml` exactly as they were. The adapter's existing reasons already describe what the target shows, and an edit would have changed nothing but wording.

I signed in through the sandbox identity provider's own form, as the vendor test-vendor-1 and as the administrator test-admin. I typed only the variable name into the password field. I navigated with the identifiers from `tests/generated/seed.ts` and the opportunity lists on the dashboard and the public opportunities page.

**Sprint With Us and Team With Us proposal forms (R-2.7, R-2.9, R-2.11, R-2.24): still unbound.**
- **Sprint With Us:** as the vendor, the seeded opportunity still open for proposals (`…a025-000000000001`, deadline November 2, 2026) offers only "Watch this opportunity" and no way to start a proposal. `/opportunities/sprint-with-us/<id>/proposals/create` answers "Page not found" both for that opportunity and for the seeded closed one (`…8000-000000000701`). `/proposals` answers "Page not found" too.
- **Team With Us:** every seeded Team With Us opportunity on the public list has passed its proposal deadline, so none offers a way in either. `/opportunities/team-with-us/<id>/proposals/create` answers "Page not found" for `…a038-000000000001`.

**Code With Us proposal view (R-2.24): still unbound.** As the administrator, `/opportunities/code-with-us/00000000-0000-4000-a003-000000000001/proposals/00000000-0000-4000-a003-000000000101` answers "Page not found". That is the seeded lapsed opportunity with three proposals, and its first submitted proposal. The opportunity's public page offers only "Watch" and "Manage this opportunity".

**Proposals section on the management screens (R-1.31, R-2.25): still unbound.**
- **Code With Us:** as the administrator, the edit screen for that same opportunity offers only the sections Summary, Opportunity, Addenda and History, plus the actions "Edit" and "Cancel opportunity". The summary shows "Proposals submitted 3" as plain text, not a link. `?tab=proposals` falls back to the summary.
- **Sprint With Us:** the seeded opportunity at consensus (`…a011-000000000001`) offers Summary, Opportunity, Addenda, History and Evaluation panel. The Evaluation panel lists only the members ("Casey Placeholder", Evaluator; "Robin Placeholder", Evaluator and chair). `?tab=proposals` again falls back to the summary.

**Attachments on Sprint With Us and Team With Us opportunities (R-8.20): still unbound.**
- **Create forms:** `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create` both have an "Attachments" part. Its "Add attachment" button is disabled, it opens no file chooser, and the page has no file input. The part says files cannot be attached to that program's opportunity "in this version of the service. Code With Us opportunities take attachments."
- **Edit screens:** the seeded opportunities' edit screens (Opportunity section of `…a025`, Addenda section of `…a036`) have no attachment control at all.

The adapter already handles both cases with a reason built from the page:
- **Disabled button:** it throws `unbound:` quoting the note (around `index.ts:4537`).
- **No Attachments part:** it throws `unbound:` naming the form (around `index.ts:8241`).

`file-attachment-control.add_attachment` stays "bound" in `bindings.yaml`, because it works on Code With Us forms. On the other two programs it throws `unbound:` as described.

Every route I opened loaded the app on this target. The missing screens come back as the app's own "Page not found" page. These are things this build does not offer, not something hidden behind a step or another persona. Binding them needs a change to the target, not to the adapter. I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the new adapter bind every surface action and observation the target offers, and nothing else? Approve. The proposal changes nothing under tests/acceptance, tests/adapters or app/; it rechecks the seven criteria (R-2.7, R-2.9, R-2.11, R-2.24, R-1.31, R-2.25, R-8.20) on the running target and leaves the adapter unchanged because each remains unbound for a reason that names what the surface lacks. The existing reasons in bindings.yaml record that the Sprint With Us and Team With Us proposal-create routes and /proposals answer 'Page not found' when walked signed in as the administrator, public sector staff and a vendor with seeded identifiers. index.ts throws unbound for attachments by quoting the target's own disabled 'Add attachment' note on the Sprint With Us and Team With Us create forms, or by naming the edit form that has no Attachments part. The management screens offer no Proposals section, and ?tab=proposals falls back to the summary. None of these is a capability behind another step or persona; each is absent from the build, so binding it needs a change to the target, not to the adapter. The bindings stay navigation and locators only, typecheck passed with no diagnostics under adapters/new/, the tier is STANDARD and no residual risk is marked unaccepted. What would change the ruling: evidence that the target serves any of these screens under another route, label or persona, which would make the adapter wrong and the proposal a return.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `35be3b290f4fd76b5fc82a4ef7ccfafec2f76c38`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
