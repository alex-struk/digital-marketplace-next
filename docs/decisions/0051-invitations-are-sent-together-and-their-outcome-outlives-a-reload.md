# 0051 · Invitations are sent together, and their outcome outlives a reload of the team tab

- Status: accepted for the build (slice 12, revision)
- Date: 2026-10-03

## Context

The first build of the team tab (0050) sent the invite dialog's addresses one after another and
kept what came back — refusals, the unregistered-address warning (R-3.30), the invalid membership
type — only in the tab's own state. Verify then found the owner's two-address invitation listing
one invitee (R-3.7), and the warning for an unregistered address missing from the page (R-3.30).
The backend answered both correctly in its own tests; what was lost was on the page: a second
invitation still waiting on the first, and an outcome that vanishes whenever the page is drawn
afresh.

## Decisions

**All the dialog's invitations leave at once.** The tab sends every address in parallel and
reports once all are answered. No invitation waits on another's answer, so an invitation is never
left unsent because the page moved on while an earlier one was answered.

**The outcome is kept for this browser tab until the inviter's next action.** It is written to
`sessionStorage`, keyed by organization, when the answers arrive, and read back when the team
tab is drawn. Opening the invite dialog again, or making any other change on the tab, forgets it.
Anything kept for more than ten minutes counts as an earlier visit's and is not shown. Storage
that cannot be read or written is skipped, and the page then behaves as it did before. Only
addresses the inviter typed are kept.

**A field may hold several addresses.** Addresses pasted into one field, separated by commas,
semicolons or white space, are each invited. Each must be valid before anything is sent. Leaving
fields empty still means "Add another email address" is optional.

## Consequences

The warning naming an unregistered address, and any refusal, stay above the team after a reload
(`app/frontend/src/lib/invitations.ts`, used by `TeamTab` in
`app/frontend/src/screens/organization-team.tsx`). Since the answers can now come back in any
order, the refusal and warning lists follow the order the addresses were given, not the order the
answers arrived.
