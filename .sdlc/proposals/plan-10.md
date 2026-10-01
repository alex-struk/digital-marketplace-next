---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I moved R-6.16 from Slice 11 to Slice 12, which is the correction the ruling asked for."
opened: 2026-10-01T01:52:26.631Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I moved R-6.16 from Slice 11 to Slice 12, which is the correction the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I moved R-6.16 from Slice 11 to Slice 12, which is the correction the ruling asked for. No other slice changes. The plan still has 21 slices in the same order. I couldn't run my script to check that each of the 248 accepted criteria sits in exactly one slice, because the command needed approval and nobody was here to give it. A text search shows R-6.16 now appears in Slice 12's criteria list and nowhere else, and that edit is the only change to any criteria list. The other three earlier moves (R-8.17 to Slice 7, R-6.6 to Slice 21, R-4.33 to Slice 6) are unchanged.

**What changed**
- **`plan/tasks.md`:**
  - R-6.16 is out of Slice 11's criteria, and its clause is gone from Slice 11's delivers line. That line still lists the owner's archive notice, since Slice 11 builds that notice.
  - R-6.16 is now in Slice 12's criteria. Slice 12's delivers line now says the invitation to join the organization is a message the notification preference does not govern. So the invitation links to the reader's notification settings (built in Slice 3) without offering to unsubscribe.
  - Slice 12 already depends on Slice 11, which depends on Slice 3, so no dependency had to change.
- **`plan/plan.md`, awkward-placement entry:** it now explains the move from the test's own steps. The test signs in as the owner, opens `/organizations/:orgId/edit`, adds a team member by email and reads the invitation. Slice 12 builds both the team tab and that invitation, so R-6.16 sits there. I first wrote a note that it used to be in Slice 11, then removed it, because the ruling asked that no Slice 11 / archive-notice wording be left for R-6.16.
- **`plan/plan.md`, the note on R-6.6 vs R-6.16:** it is now headed "slices 21 and 12". It names Slice 12's builder as the one who must not change the shared message footer without knowing Slice 21 reads it for R-6.6. It also names the organization invitation, instead of the archive notice, as an example message that lacks the Unsubscribe offer.
- **Decision 0013 (`docs/decisions/0013-the-mail-path.md`):** it now places R-6.16 in Slice 12, through the organization's edit screen, where adding a team member by email sends the invitation.

I wrote no new decision record. Nothing under the spec, the design, the constitution or the stack profile was touched. I assumed nothing new about the stack or the platform; the earlier assumptions in `plan/plan.md` stand as they were.

**Left for others:** instructions build-slice-3-3#1 and #2 belong to the build stage, as the ruling says, and remain open for build to act on. None of the conditions was addressed to a person.
