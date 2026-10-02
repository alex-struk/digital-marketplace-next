---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I made the one change the ruling asked for."
opened: 2026-10-02T10:52:58.006Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I made the one change the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made the one change the ruling asked for. In `tests/acceptance/opportunities/R-1.36.spec.ts`, the author test ("— its author is told separately that the cancellation was actioned") now passes only if a message is visibly addressed to the author, names the opportunity's title, and mentions the cancellation in its subject or body. That is the same "cancel" check the watcher-and-proponent test already uses. A message to the author that names the opportunity for some other reason, such as a late notice about the proposal submitted during setup, no longer satisfies it. I also changed the comment at the top of the file so it describes this check for the author's message.

Nothing else changed. The header lines stay as they were: the "derived" date was already today's date, so it needed no rewrite. The R-1.35 file, the watcher-and-proponent test and `tests/acceptance/not-testable.yaml` are untouched, and no criterion needed a new not-testable entry.

I could not run the typecheck: running the compiler needed an approval this unattended session cannot get. The change adds one more condition of the same form as the one beside it, using the same field and string, so I don't expect it to break the typecheck. Even so, the runner's typecheck is the first real check of it.

No surface action or observation was missing for this change.
