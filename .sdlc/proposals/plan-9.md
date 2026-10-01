---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I moved all four criteria to the slices that build the screens their tests use."
opened: 2026-10-01T01:50:16.384Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I moved all four criteria to the slices that build the screens their tests use.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I moved all four criteria to the slices that build the screens their tests use. This answers request 1, so nothing is deferred. I couldn't run the coverage check (`plan/check-coverage.mjs`) because the command needed an approval nobody was here to give. Instead I searched `plan/tasks.md` by hand: each of the four criteria now appears on exactly one criteria line, and none is left in Slice 3. Because I only moved criteria between slices, the total stays at 248.

**What moved.** The ruling found R-8.17, R-6.6, R-6.16 and R-4.33 unbound in Slice 3, because each test acts through a screen Slice 3 doesn't serve. The behaviour each one describes is still built in Slice 3: the file store's size limit, the message footer and notification settings, and the vendor's legal section. Only the slice that answers for it changes:

- **R-8.17 → Slice 7.** Slice 7 builds the attachment control on the opportunity's management screen. Its description now says the size limit is stated before a file is chosen, and that an oversize upload is refused with a message naming the limit.
- **R-6.6 → Slice 21.** Slice 21 builds the email notification reference. Its description now says each sample ends with the Unsubscribe offer.
- **R-6.16 → Slice 11.** Slice 11 builds `/organizations/:orgId/edit`. The archive notice sent there is a message the notification preference doesn't govern, so it links to settings without offering to unsubscribe.
- **R-4.33 → Slice 6.** Its test starts at `/content/terms-and-conditions/edit`, which is the screen Slice 6's changed-terms announcement is on. Slice 6 already depends on Slices 5, 3, 2 and 1, so the vendor's profile is available there.

There are still 21 slices; none was added, removed or reordered, and every other placement is as I found it.

**One change the ruling didn't name.** Moving R-6.6 showed that Slice 21's dependencies didn't reach every slice that sends a message. Slices 4 (account notices), 6 (the changed-terms broadcast) and 9 (addendum and cancellation notices) were outside them, even though the slice's description already claimed every message from slices 2 to 19. I added those three to Slice 21's depends-on line. I judged that this is part of placing R-6.6 soundly, not a separate change, but the gate may see it otherwise.

**Notes in `plan/plan.md`.** I added an entry on these four moves to the list of criteria that sit awkwardly. It explains why each moved, why the Slice 21 dependencies changed, and that R-6.6 and R-4.33 fit uneasily: like the service-wide mail rules already in Slice 14, they are answered for where their tests can first run. I also rewrote the note on the conflict between R-6.6 and R-6.16. They are now in different slices (21 and 11), so they can no longer be reconciled by one builder. The note says the reconciliation lives once, in the shared message footer from Slice 3. It also warns that R-6.6's test may expect an Unsubscribe offer on every sample, which R-6.16 forbids for messages the preference doesn't govern. If so, the builder should raise it rather than satisfy it. The constitution check is unchanged, because no rule's bearing on the plan changed.

**Decision records.** I wrote no new record. I edited one: `docs/decisions/0013` said the footer criteria R-6.6 and R-6.16 belonged to Slice 3. It now says they are built there but answered for in Slices 21 and 11.

**What I left.** No condition was addressed to a person, and nothing asked me to change spec, design, constitution.md or the skills, so I left nothing for anyone else. I made no new assumptions about the stack or the platform.
