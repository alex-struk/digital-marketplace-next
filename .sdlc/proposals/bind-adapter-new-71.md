---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I rechecked all seven criteria on the running build at http://localhost:4300 and changed nothing."
opened: 2026-10-04T02:41:26.444Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rechecked all seven criteria on the running build at http://localhost:4300 and changed nothing.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rechecked all seven criteria on the running build at http://localhost:4300 and changed nothing. On this build every one of them is still unbound for the reason the adapter already gives, so `tests/adapters/new/index.ts` and `tests/adapters/new/bindings.yaml` are as I found them. I could not run the type-checker: this session's shell refused the command. Since nothing was edited, that check still reflects the last run that did compile it.

**How I signed in.** I signed in through the sandbox identity provider on the target's own "Sign in" page: first as the administrator (`test-admin`), then as a vendor (`test-vendor-2`). The password was typed by variable name only.

**R-1.31, R-2.25 (the `proposals_tab` observation on the Code With Us and Sprint With Us management screens).**
- As the administrator I opened the management screen of the seeded Code With Us opportunity with three proposals (…a003…0001). Its sections are only Summary, Opportunity, Addenda and History, and `?tab=proposals` falls back to the Summary. The Summary shows "Proposals submitted 3" as a number; it does not list the proposals. The status still reads "Published" even though the deadline has passed.
- The seeded Code With Us opportunities in processing (…a007…) and awarded (…a008…) show the same four sections.
- The seeded Sprint With Us opportunity at consensus with six proponents (…a013…) offers Summary, Opportunity, Addenda, History and Evaluation panel. The Evaluation panel lists only the panel's members and roles, not the proposals.
- Opening a seeded proposal directly answers "Page not found", both the Code With Us one (…a003…0101) and the Sprint With Us one (…a013…0101). So does `/proposals`.

**R-8.20 (the `add_attachment` action for Sprint With Us and Team With Us opportunities).** Both create forms have an "Attachments" part, but its "Add attachment" button is disabled. Beside it the page says "Files cannot be attached to a … opportunity in this version of the service. Code With Us opportunities take attachments." The adapter already detects the disabled button and throws `unbound:` with that text right away, rather than waiting on it.

**R-2.7, R-2.9, R-2.11, R-2.24 (the Sprint With Us and Team With Us proposal forms and the Code With Us proposal view).** As a vendor I opened the seeded Sprint With Us opportunity that is still open for proposals (…a025…0001, deadline November 2, 2026). It offers only "Watch this opportunity" and no way to start a proposal. Its `/proposals/create` answers "Page not found", and so does the same form on the seeded Team With Us opportunity (…0801). The Code With Us proposal view answers "Page not found" to the administrator, as noted above.

**What this means.** The target does not yet offer proposals screens for staff, the Sprint With Us and Team With Us proposal forms, or attachments outside Code With Us. These are missing features of the new service, not gaps in how the adapter reaches the pages. Every route in the contract still resolves on the target (where the feature is missing it answers "Page not found"), so no page is unresolved.

I did not touch any path outside `tests/adapters/new/`.
