---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote the test for one criterion, R-1.33 (v2), at `tests/acceptance/opportunities/R-1.33.spec.ts`."
opened: 2026-10-03T02:17:45.626Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the test for one criterion, R-1.33 (v2), at `tests/acceptance/opportunities/R-1.33.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the test for one criterion, R-1.33 (v2), at `tests/acceptance/opportunities/R-1.33.spec.ts`. I did not add or change anything in `tests/acceptance/not-testable.yaml`. I could not type-check or run the test here: the type-check command needed an approval this session could not give.

**What the ruling found.** The earlier test stored each note's attachment with the plain file upload, which does not say who may read the file. The service refuses an upload that does not say this, so no file was stored and the note was never added.

**The fix.** The test now stores the attachment through `uploadFileStatingItsReadAccess`, the same action the files tests use for an upload that succeeds. It sends the file, its name and a statement of who may read it in one request. That statement is an empty list. This matches R-8.19, which says an opportunity's attachment records no read access of its own, so the opportunity decides who may read it. The test then adds the note through `opportunityHistoryRequest.addNoteByRequest`, passing the file's identifier. Last, it reads the opportunity's history again and checks that it shows `NOTE_ADDED`, the note's text, and the file's name and identifier.

**Everything else is unchanged,** apart from the derivation date in the header and one comment line:
- **Adding a note at different points in the opportunity's life:** the opportunity's author on a published Sprint With Us opportunity and on a published Code With Us one, and an administrator on a cancelled Code With Us one.
- **Who sees the seeded note on `seed.opportunities.cwuWithPrivateNote`:** an administrator and the author do. Another public sector staff member, a signed-in vendor, and a reader who is not signed in are not shown the note or its file. The signed-out check is exactly as it was written, as the ruling asked.
- **The final clause, that no screen offers a way to add a note:** read through `noteControlOffered` on the Code With Us and Sprint With Us edit pages, for both an administrator and the author.

**One part of the criterion stays unchecked.** Its "with files" clause is checked only with a single attachment per note, because the given/when/then it states names "attachments" without a count. I judged that enough and wrote no partial entry for it.

Every page, action and observation the criterion needs already exists in the surface. I found nothing to ask the contract stage for.
