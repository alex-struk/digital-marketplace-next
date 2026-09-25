---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I reworked R-1.35 so the watcher and the proponent are set up only once on the shared record."
opened: 2026-09-25T10:27:50.656Z
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I reworked R-1.35 so the watcher and the proponent are set up only once on the shared record.

I reworked R-1.35 so the watcher and the proponent are set up only once on the shared record. That was the only condition, and I didn't touch any other file. I couldn't run the typecheck: this session wasn't allowed to run commands.

**R-1.35 (`tests/acceptance/opportunities/R-1.35.spec.ts`):** The file used to have two tests, and each one called `arrangeWatcherAndProponent` on `seed.opportunities.publishedCodeWithUs`. That record is loaded once and never reset. So the second test's `toggleWatch` as `persona.competingVendor` turned the first test's watch back off, and `persona.vendor` submitted a second proposal to the same opportunity. The file now has one test, titled with the criterion's own statement, and it works through the setup once:

1. It sets up the watcher and the proponent a single time. This keeps the existing check that the administrator's reporting shows more watchers and more proposals than before.
2. It clears the mail catcher, changes the opportunity's details, and checks that the watcher, the proponent and the author are each reached.
3. It clears the catcher again, adds an addendum, and runs the same check on all three.

This follows the reviewer's suggested shape. One test fits because the criterion has a single given, with "edits it or adds an addendum" as one when. The helper functions, the recipient-matching logic and the assertions are unchanged. I only merged the two test bodies and rewrote the explanatory comment to say why the setup happens once. The header stays as it was: the file's content did change, and its derived date was already today's, 2026-09-25.

**Not verified:** I couldn't confirm the reviewer's result that the typecheck shows no diagnostics under `acceptance/opportunities/`. The edit only rearranges calls that were already in the file and already typechecked, so I don't expect new diagnostics, but the next run should confirm that.

I changed nothing in `tests/acceptance/not-testable.yaml`, `tests/generated`, or any other opportunities spec. No criterion became untestable, and I found no surface action or observation missing for this criterion.
