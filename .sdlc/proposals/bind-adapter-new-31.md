---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I changed how the adapter reads a file size from a test's input."
opened: 2026-10-01T10:31:14.649Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I changed how the adapter reads a file size from a test's input.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I changed how the adapter reads a file size from a test's input. R-8.17 was not re-run as a test: this workspace has no `tests/acceptance/` and no installed `node_modules`, so I can't confirm the change fixes it. Request 1 is answered from the running target instead. R-1.48 and R-1.9 stay unbound because both create screens are still missing.

**Which step read '' in R-8.17.** It was `fileUpload.refusedForSize`, not `sizeLimitStatedBeforeChoosing`. Signed in as the administrator, I checked both readers against the target:

- **The size-limit reader works.** On the seeded published Code With Us opportunity's form (`/opportunities/code-with-us/00000000-0000-4000-8000-000000000601/edit?tab=opportunity`) and on `/opportunities/code-with-us/create`, the "Attachments" section contains the line "Any type of file, up to 10 MB each." The reader's own pattern returns exactly that line on both pages.
- **The on-screen refusal works too.** I attached an 11 MB file through the form's own file input. The section showed "big.pdf is too large to attach … Attachments must be 10 MB or smaller." in an alert inside the section, which is where `uploadRefusedForSize` looks.
- **The upload service draws the line at exactly 10 MB, counted as 10 × 1024 × 1024 bytes.** `POST /api/files` stored files of 100, 10,000,001 and 10,485,760 bytes (201). It refused 10,485,761 bytes and up with 413: "The file is larger than 10 MB. Upload a file of 10 MB or smaller."
- **So `refusedForSize` returns '' only when the service stored the file.** It reports any refusal in the 400s and returns nothing when the file was stored. With no read access stated, even a small file is refused with 400, which reads as non-empty. An empty reading therefore means the request was sent with valid read access and a file of 10 MB or less.
- **The most likely cause is the adapter not recognising the test's size.** When it can't read a size from the input, it sends a few-byte placeholder file, which the service stores. A size written in decimal megabytes that lands between 10,000,000 and 10,485,760 bytes would also be stored.

**What I changed.** I only changed the function that reads a size from a test's input (`bytesGiven` in `tests/adapters/new/index.ts`). It now also reads:
- any key whose name says it is a size, such as `fileSize`, `sizeInMegabytes` or `approxSizeMB`, using the unit the name carries;
- units spelled out, such as "11 megabytes";
- sizes stated relative to the limit, such as "over 10 MB", "> 10 MB" or "10 MB + 1 byte" (the limit plus one byte);
- flags like `oversized`, `tooLarge` or `exceedsLimit`, which become an 11 MB file.

I checked the new parsing by running the same logic as plain JavaScript against sample inputs. I couldn't typecheck it because no TypeScript compiler is installed here. `refusedForSize` still returns '' when the service really did store the file, because that empty result is a correct answer. Nothing else in the adapter or in `bindings.yaml` changed.

**R-1.48 and R-1.9 stay unbound.** I signed in again as the administrator and then as the public sector employee. `/opportunities/create` offers "Create a Sprint With Us opportunity" and "Create a Team With Us opportunity". Following each link lands on "Page not found" at `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create`. I also tried `/new` and the short `swu`/`twu` forms of both addresses, and every one answers "Page not found". The existing reasons for `opportunity-swu-create.open` and `opportunity-twu-create.open` still hold, so I left them as they were.

The administrator's dashboard has changed since the earlier walk. It now has "Create an opportunity" and an "All opportunities" table that lists only the seeded Code With Us opportunities. The stored unbound reasons still describe `/dashboard` as "a greeting and nothing else". I didn't rewrite them because this revision was limited to the named conditions; whoever picks this up next may want to.

These routes in `surface.yaml` did not resolve on the target: `/opportunities/sprint-with-us/create` and `/opportunities/team-with-us/create`.
