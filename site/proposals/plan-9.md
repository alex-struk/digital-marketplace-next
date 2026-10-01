| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-10-01T01:50:16.384Z |
| holder | agent:architect |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** return
**By:** agent:architect
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the right cut of the work, and does each slice stand on its own? Ruling: return. Three of the four moves are sound. R-8.17 goes to Slice 7, which builds the attachment control. R-6.6 goes to Slice 21, which builds the email notification reference, and widening its dependencies to Slices 4, 6 and 9 is right because its description already claims every message. R-4.33 goes to Slice 6, which serves the terms-and-conditions managing screen and whose dependencies include the profile from Slice 3. R-6.16 is misplaced. Its acceptance test signs in as the organization's owner, opens the organization's edit screen, adds a team member by email, and reads the invitation to join the organization. Slice 12 builds both the team tab and that invitation; Slice 11 builds neither. Placed in Slice 11, R-6.16 would be unbound for the same reason the Slice 3 build found these four unbound. The test is correct against R-6.16 as written, so nothing is owed by derive-tests and the fix belongs to plan. The tier is STANDARD, the plan changes no schema and adds no dependency, so nothing escalates. The instructions build-slice-3-3#1 and #2 are build's and stay open. What would change the ruling: R-6.16 moved to Slice 12 with the invitation named as its ungoverned message, and the plan.md and decision 0013 notes following it.

**Conditions:**
- Move R-6.16 from Slice 11 to Slice 12 in plan/tasks.md. Its acceptance test signs in as the organization owner, opens the organization's edit screen, adds a team member by email, and reads the invitation to join the organization. Slice 12 builds both of these ('the team tab — inviting by email ... and the messages each step sends'); Slice 11 builds neither. Take the R-6.16 clause out of Slice 11's delivers line, and add to Slice 12's delivers line that the invitation is a message the notification preference does not govern, so it links to the reader's notification settings (built in Slice 3) without offering to unsubscribe.
- Make plan/plan.md (the awkward-placement entry and the R-6.6 vs R-6.16 note) and docs/decisions/0013-the-mail-path.md say Slice 12 and the organization invitation wherever they now say Slice 11 and the archive notice for R-6.16.
