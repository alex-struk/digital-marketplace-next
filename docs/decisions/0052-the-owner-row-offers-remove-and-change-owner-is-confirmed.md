# 0052 · The owner's row offers Remove, Change owner is confirmed, and the summary names only held capabilities

- Status: accepted for the build (slice 12, second revision)
- Date: 2026-10-03

## Context

Verify found three departures on the team tab. A service administrator could not try to remove the
sole owner because the owner's row had no Remove (R-3.11). After choosing the new owner in Change
owner, the confirm button was shown disabled while the request was in flight. The step that drove
it then found a disabled control, or a control that vanished as it pressed it (R-3.13). And the
capability summary named every capability with "held" or "not held", so a capability only a pending
invitee holds was still named inside it (R-3.34).

## Decisions

**Remove is on every row but the viewer's own, the owner's included.** The service refuses ending
the only active owner's membership (`400`, "This is the sole owner for the organization, and cannot
be removed."). The tab shows that refusal, and the owner stays on the team. DESIGN.md's "who is
offered what" table says "on every row but the owner's". The criterion's own example (an
administrator tries, and is refused) replaces that line. `rowControls` in
`backend/src/rules/organizations.ts` decides it.

**Change owner chooses, then confirms, in the same dialog.** "Change owner" with a member chosen
turns the dialog into "Make <name> the owner?", whose "Yes, change owner" makes the transfer. Both
buttons carry `organization-change-owner-confirm`. Only one is drawn at a time. "Back" returns to
the choice.

**A confirmed dialog closes at once.** Change owner, Remove and Give administrator rights close
when confirmed and then make the change. What the service answers is shown on the tab. No dialog
button is shown disabled while a request is in flight. A second press made while one is in
flight is ignored. Give administrator rights stays disabled until its statement is confirmed.

**The summary names only the capabilities the team holds.** The `organization-team-capabilities`
section lists the held ones. A separate section, "Capabilities the team does not have", lists the
rest, so the page still shows each missing capability as missing.

**The tab's messages are its `field-error`.** The invitations' refusals and the warnings naming
unregistered addresses are wrapped together in one `field-error` element (R-3.30). A refused change
(such as R-3.11's) is wrapped in its own. They never show together.

## What would reverse it

A design ruling that the owner's row must stay without Remove, or that the summary must keep the
held/not-held list, would conflict with R-3.11's and R-3.34's examples as verify reads them. That
ruling would need to go back to the specification first.
