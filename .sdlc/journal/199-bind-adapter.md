---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-28T20:34:54.619Z"
cost: 7.660313800000001
turns: 136
session: "3ca2b993-281b-4f75-833d-0bb6a172c5a0"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

I've added the 20 missing members and gone through all nine findings. But the work is unverified: npm and node were both blocked, so I couldn't install Playwright, type-check or run the adapter. My probing also left records behind on the running target, so I think it needs resetting before calibration.

**What I left on the target at localhost:4300.** These come from sending requests to the live service to learn its request shapes:
- **Seeded published Code With Us opportunity:** the vendor persona (vendor one) now has a submitted proposal on it, under Northern Pines. If the target isn't reset, any test in which that vendor proposes there will be refused with "You already have a proposal for this opportunity."
- **Two throwaway opportunities**, "Adapter probe TWU" and "Adapter probe SWU", both published by the administrator.
- **On the Team With Us probe:** a draft proposal by the organization owner and two attachments.
- **On the Sprint With Us probe:** a half-stored proposal by the organization owner. It was left by the request that the service answers with a 503. Its edit page shows Not Found.

**New members, all reported bound:**
- **proposal-cwu-request and proposal-team-request:** these don't drive a screen. They send the same request the forms send, from the signed-in browser session, and I checked each body shape against the service first.
  - For Code With Us: an organization the vendor doesn't belong to is accepted (201). An organization identifier that names nothing comes back as a blank individual's refusal, which the contract predicts.
  - For Team With Us: a pending, a former and an outside member each come back 400 "User is not an active member of the organization." A person named twice comes back "Please select unique team members."
  - For Sprint With Us: one person named twice in a phase comes back 503 "Database error."
  - refusal_by_field names each message by where the service reports it ("legal name", "organization", "team #2 member"). refusal_status is the status code.
  - When a test gives no answers, rates, costs or Sprint With Us references, the adapter fills them in so a refusal is about what the test gave. Nothing the test gives is changed.
- **team_member_choices:** on Sprint With Us it reads the "Add Team Member(s)" dialog, which leaves out people already on that phase. On Team With Us it reads the "Resource Name" chooser.
- **submission_refusal (both edit pages):** captures the "Unable to Submit Proposal" notice straight after the submit, since it fades, plus any field messages.
- **field_errors_by_field:** reads each field's message from every step of the Code With Us form, as "field: message".

**The nine findings.** The file I started from already had fixes for most of them; the line numbers in the findings point at an older copy. I checked each against the target:
- **Already correct, left as they were:**
  - **R-2.4:** a submitted proposal shows only Edit and Withdraw with status "Submitted", and the delete action returns quietly.
  - **R-5.16:** a locked panel is left for panel_locked_after_consensus to report.
  - **R-2.17:** the organization chooser is read back after choosing, and Backspace does clear it.
  - **R-2.22:** save_changes applies the named organization.
  - **R-8.20:** Team With Us attachments are saved by confirming "Publish Changes", and the stored /api/files/ links then appear.
- **Changed:**
  - **R-2.10 and R-2.20:** I couldn't make the terms dialog stay open; its Cancel worked every time I tried. A press made while a dialog is still sliding in may be what goes astray. So every dialog is now given a moment before anything in it is pressed, closing is checked and retried, and a dialog that won't close is reported by name instead of as a click timing out.
  - **R-2.28:** the refused score's notice is also remembered, so wrong_stage_error reads it after the tab is left.
  - **R-2.31:** price is read from the Proposals table. A vendor gets Not Found there, so it now falls back to the exported proposal's "Price" line ("-", read as empty, until award).

Every route in surface.yaml resolved on the target.

I changed nothing outside `tests/adapters/old/`.