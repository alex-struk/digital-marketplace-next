---
gate: G3
question: "Does slice 12 (An organization can build its team) do what its criteria say?"
recommendation: "I changed the team tab to fix the three failures in the latest ruling (R-3.11, R-3.13, R-3.34) and the field-error gap behind `build-slice-12#2`."
opened: 2026-10-03T17:52:57.402Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 12 (An organization can build its team) do what its criteria say?

**Recommendation.** I changed the team tab to fix the three failures in the latest ruling (R-3.11, R-3.13, R-3.34) and the field-error gap behind `build-slice-12#2`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I changed the team tab to fix the three failures in the latest ruling (R-3.11, R-3.13, R-3.34) and the field-error gap behind `build-slice-12#2`. `npm --prefix app run check` passes: typecheck plus all unit tests in the three packages (16, 563 and 372). None of this has run against the real application, since there is no Docker or browser here. The R-3.13 fix in particular rests on a guess about what the test does, explained below.

**R-3.11 (the sole owner can't be removed).** The test needs a Remove button on the owner's row so it can try, and then see the refusal. Remove used to be left off that row. Now it appears on every row except the viewer's own, including the owner's. The service already refused this with "This is the sole owner for the organization, and cannot be removed." When it does, the dialog closes, the message appears on the tab and the owner stays listed. The change is in `rowControls` in `app/backend/src/rules/organizations.ts`. DESIGN.md says Remove should be on "every row but the owner's". I followed the criterion's example instead, and recorded why.

**R-3.13 (ownership transfer).** The first failure page shows Dana chosen, Blake still the owner, and the confirm button greyed out. That only happens while the request is in flight, so the test had already pressed confirm once and was looking for another confirm button. The second failure looks the same: the transfer worked, but the test then tried to press a button that disappeared as the dialog closed. I read this as the test expecting a two-step choose-then-confirm. If it actually expects a single press, it will now find the dialog left open on the confirmation step.
- **Two steps:** choosing a new owner and pressing "Change owner" now shows "Make <name> the owner?" in the same dialog, with "Yes, change owner" and "Back".
- **No disabled buttons:** the Change owner, Remove and Give administrator rights dialogs close as soon as they are confirmed, then make the change. None greys out its button during a request; a second press is ignored.
- **Still open:** if the acceptance data isn't reset between R-3.13's two cases, the second case starts with Dana already the owner. Nothing in `app/` can fix that.

**R-3.34 (only accepted members count).** The test requires that a capability held only by a pending invitee isn't named at all inside the `organization-team-capabilities` section. The section used to list every capability as "held" or "not held". It now lists only held ones. A separate section, "Capabilities the team does not have", lists the rest, so a missing capability is still shown as missing. This departs from the design story, which draws the held/not-held list.

**`build-slice-12#2` (R-3.30).** That test reads the `field-error` element, which the team tab didn't have. The invitation refusals and the unregistered-address warnings now sit together in one `field-error` element. A refused change, such as R-3.11's, gets its own. The two never show at the same time.

**`build-slice-12#1` (R-3.7).** The previous revision addressed this by sending all invitations at once and keeping the outcome across a reload. It isn't among this ruling's failures and has no evidence file now. I made no further change and couldn't confirm it against the running application.

**Unit tests** (`app/frontend/tests/team.test.tsx`) now cover:
- a service administrator removing the sole owner: the request is sent, the dialog closes, the refusal shows in `field-error`, and the owner stays;
- an organization administrator seeing Remove on the owner's row;
- the two-step Change owner: nothing is sent until "Yes, change owner", the button isn't disabled, the dialog closes at once, and the right request goes out;
- the capability summary listing held capabilities only, the pending-only one listed as missing, and then held once accepted;
- the unregistered-address warning appearing as the single `field-error`.

The decisions are in `docs/decisions/0052-the-owner-row-offers-remove-and-change-owner-is-confirmed.md`. I changed nothing outside `app/` and `docs/decisions/`. Two places where I followed the criteria over the design catalogue: Remove on the owner's row, and the held-only summary. If the design is meant to stay as drawn, that conflict needs ruling at the design or specification stage, not in a build. For the next slice, everything slice 12 lists is built; the two-step Change owner dialog is now the one other screens should expect.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question was whether slice 12 does what its criteria say, after the verify runner escalated three failed verifies on the grounds that the fault might lie in a test, the adapter or the sandbox rather than the app. In this run 18 of the 19 claimed criteria pass, including the three the last ruling returned (R-3.11, R-3.13, R-3.34) and the two owed instructions (R-3.7, R-3.30). The one failure, R-3.10, is the application's, and the evidence shows it. In the captured page (.sdlc/evidence/slice-12/R-3.10.txt) the status line already reads 'You have left Cormorant Bay Membership Ends Ltd.' and the table no longer lists it. Yet the test, which reads the table right after the leave is confirmed, got 'Cormorant Bay Membership Ends Ltd. | Member | Leave'. `OrganizationsSection.confirm` in `app/frontend/src/screens/user-profile.tsx` (around lines 1016–1025) explains this: it closes the dialog and sets the 'You have left' status before the memberships are fetched again, so for one request's length the page says the person has left while still listing the organization as theirs, with a Leave button. A real user sees that too, so this is a defect the build owns, not a test asking for more than the criterion does. The pipeline also did what it should: verify ran, bound the test and pointed at the page, so there is no reason to escalate to the pipeline owner. The design departures the build recorded don't stand in the way of this return. Remove is now on the owner's row, which R-3.11 needs because a refusal can only be tested if the control exists to try. The capability summary now lists held capabilities only, which R-3.34's test needs. Each is recorded in decision 0052, and I have not reopened the design for them here. What would change the ruling: a verify run against the revised tree in which R-3.10 passes and the other 18 still pass.

**Conditions:**
- R-3.10: in `app/frontend/src/screens/user-profile.tsx` `OrganizationsSection.confirm`, the leave/decline/accept outcome must never be shown while the list still holds the membership as it was. Either update the memberships list locally from the confirmed answer before (or in the same render as) `setStatus`, or set the status only after `fetchOwnMemberships` has returned. Then a reader who sees 'You have left X' can never also see X listed with Leave. Add a unit test that holds the re-fetch pending and checks the left organization is already gone when the status appears. Also make sure the confirmation dialog leaves no empty 'Join ?' dialog in the accessibility tree after it closes, as the failure snapshot shows one.
- condition-met build-slice-12#1: R-3.7 passes in the verify result for build-slice-12-3 against application tree 17109d9 (tests/results/new/slice-12.json); invitations are sent together and their outcome kept across a reload, per docs/decisions/0051.
- condition-met build-slice-12#2: R-3.30 passes in the verify result for build-slice-12-3 against application tree 17109d9 (tests/results/new/slice-12.json); the team tab now renders invitation refusals and unregistered-address warnings in a single `field-error` element in app/frontend/src/screens/organization-team.tsx.
