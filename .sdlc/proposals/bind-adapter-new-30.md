---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I fixed how the adapter reads the file size a test asks for, which is the only cause of R-8.17's empty read I could reproduce."
opened: 2026-10-01T10:07:10.365Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I fixed how the adapter reads the file size a test asks for, which is the only cause of R-8.17's empty read I could reproduce.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed how the adapter reads the file size a test asks for, which is the only cause of R-8.17's empty read I could reproduce. But I couldn't re-run R-8.17 itself: its test isn't in this workspace and the suite's dependencies aren't installed. So I can't say for certain which of its steps read the empty string. Nothing was type-checked or run after the edit; I only read it through. The Sprint With Us and Team With Us create pages still don't exist on the target, so they stay unbound.

**What the running target does with a file over 10 MB.** I signed in as the administrator through the identity provider's form.
- **The service directly:** sending 11 MB, 10.5 MB and 30 MB files to `/api/files` each got a 413 with "The file is larger than 10 MB. Upload a file of 10 MB or smaller." The limit is 10 × 1024 × 1024 bytes: one byte over is refused for size, and exactly 10 MB is not. With no one signed in, the same upload gets a 401.
- **The attachment control on screen:** on the seeded draft Code With Us opportunity's form, the attachments area says "Any type of file, up to 10 MB each." before any file is chosen. Offering an 11 MB file there lists it and shows an alert: "big.pdf is too large to attach — It is 11.0 MB. Attachments must be 10 MB or smaller. Remove it, then attach a smaller file."

So `size_limit_stated_before_choosing`, `upload_refused_for_size` and `refused_for_size` all read something whenever a file that really is over the limit reaches the target. `refused_for_size` returns empty only when the service accepted the upload, so the file the adapter sent must have been small.

**Why the file was small.** The two upload paths in the adapter read the test's size badly:
- The direct upload read `bytes`, `size`, `sizeBytes` or `size_bytes` with a plain integer parse. A size written with a unit, like "11 MB", became 11 bytes, and a key like `sizeMB` was ignored.
- The attachment control's path read only a numeric `bytes` key and ignored every other way of giving a size.

Either way the harness wrote a tiny file, the service or the form accepted it, and the refusal reader correctly reported that nothing was refused.

**The change.** In `tests/adapters/new/index.ts` I added one shared helper, `bytesGiven`, used by both paths. It accepts:
- a number of bytes under the usual names;
- a size written with its unit ("11 MB", "10.5MB", "512 KB"), counting a megabyte as 1024 × 1024 bytes like the service does;
- a number under a name that carries the unit (`sizeMB`, `megabytes`, `sizeKB`).

A size it can't read is left out rather than guessed. Nothing else in the adapter changed, and `bindings.yaml` is unchanged because every member involved was already bound.

**Something I noticed and left alone.** `refused_for_size` treats any refusal below 500 as a size refusal. The service sends a 400 for a missing read-access statement, which would read as a size refusal even though it isn't one. The condition didn't name this, so I didn't change it; tightening it to 413 or to the size message is a decision for a later revision.

**The two unbound pages (R-1.9, R-1.48).** I looked again as the administrator. `/opportunities/create` still offers "Create a Sprint With Us opportunity" and "Create a Team With Us opportunity". Following either link, and opening `/opportunities/sprint-with-us/create` or `/opportunities/team-with-us/create` directly, lands on "Page not found". The existing unbound reasons already describe this, and I left them unchanged.

deferred-request 1: R-8.17's test isn't in this workspace and the suite can't run here, so I couldn't re-run it to name the step that read empty. On the live target, both size readers and the size-limit reader return text when a genuinely oversize file arrives. The empty read matches the adapter sending a small file because it misread the requested size, which this revision fixes. Whether that was R-8.17's actual input needs a run of the criterion itself.
