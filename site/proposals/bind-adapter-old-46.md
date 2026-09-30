| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T02:29:38.699Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the R-8.31 finding in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the R-8.31 finding in `tests/adapters/old/index.ts`. `bindings.yaml` did not change, because both members were already `bound` and still are. I could not type-check or run the adapter: this workspace has no `node_modules`, and I wasn't allowed to look for a Playwright install elsewhere. What I checked was the same sequence of steps, run through the browser tools against the live target.

**What the target does.** I signed in as the administrator and opened the seeded published Code With Us opportunity on its management screen (`/edit?tab=opportunity`). Its form starts read-only on "1. Overview"; the Attachments step shows only the size note and any stored links. Choosing "Edit" from the Actions menu and going to "4. Attachments" offers the "Choose File" input. A file given to it appears straight away as a `blob:` link. "Publish Changes" in the top bar opens "Publish Changes to Code With Us Opportunity?", and confirming it saves the form. The form returns to read-only on the same step, and the file now appears as an `/api/files/<id>` link. The stored links are only drawn while that step is on screen, and a moment after it.

**The oversized-file case.** I gave the chooser a file over 10MB. It also got a `blob:` preview. On publish, the page said "Opportunity Changes Published", but the file was dropped: no stored link and no refusal message.

**What changed in `add_attachment`:**
- It now waits up to five seconds for the `blob:` preview. Before, it checked once and quietly gave up if the preview hadn't appeared yet, which is the likeliest cause of the empty address in the calibration run.
- If no preview appears and the page shows no message, it raises an error that lists any links already stored. If a message is shown, it returns, so a refusal test can still read that message.
- On a `/create` form it returns without saving, because the create action stores the file.
- On a saved record it waits for the top bar to offer "Publish Changes", "Save Changes", "Submit Changes for Review" or "Submit Changes". It saves through the existing save routine, which confirms the dialog, then waits for the stored link.
- If none of those saves is offered, it returns only when the page offers a later save the test's next action will use: "Submit", "Save Draft", "Publish" or "Submit for Review". Otherwise it raises `unbound:`, naming the controls it looked for.

**What changed in `attachment_address`:**
- `open()` now records which opportunity it was given. If the page has moved away from that opportunity's address, the read goes back to its management screen. A proposal made against the opportunity sits under the same address, so proposal pages are left where they are.
- It then goes to the Attachments step, first by the step menu and then by Previous/Next, and checks the step heading. If it can't get there, it raises `unbound:` naming the step the page shows instead.
- It waits up to three seconds for stored links. If there is only a preview, it saves first, as before.
- As the finding asked, it now raises instead of returning an empty string when the step links nothing, and includes whatever message the page shows.

**Side effect on the target.** My checks added three small probe files to the seeded published Code With Us opportunity; two were stored and the oversized one was dropped. If the seed isn't reloaded before the next run, that record will show them.

**Risks for the next calibration:**
- **Oversized files.** The target stores nothing and shows no message for an oversized file. So `attachment_address` will now raise, not return empty, for that file on an opportunity that holds no other attachment. That is what the finding asked for, but it could affect any size-refusal criterion that reads the address.
- **Rename before saving.** On a saved record, `add_attachment` now always saves where a save is offered. A criterion that adds a file on a saved record's edit screen and then renames it before saving would find the file already stored.

Every page route I used resolved on the target. I changed nothing outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this revision of the old adapter bind the file-attachment control's actions and observations for R-8.31, and nothing else? Ruling: approve. The escalation came from the rebind loop limit (5 sends against a limit of 2), not from a pipeline defect: each send narrowed the binding (the removal path, proposal editing, saving after a removal, storing on a published opportunity, then no silent empty returns), which is progress on one binding and not a stage unable to produce what G3 needs. The fifth send decided it, and the diff meets each of its three asks in tests/adapters/old/index.ts. (1) add_attachment waits up to 5s for the blob: preview and raises when neither a preview nor a message appears, and raises unbound: naming the controls it looked for when no save or later save is offered. (2) open() records the opportunity it was given; attachment_address goes back to that opportunity's route if the page has left it, walks to the Attachments step and checks the step heading. (3) attachment_address raises, with any message the page shows, instead of returning an empty string. The 'message shown, so return' branch is bounded: messages() keeps only lines matching the message pattern and excludes prose, and alertMessages() reads only alert regions, so it cannot hide a failed upload. The runner's typecheck of adapters/old passed with no diagnostics, and the change stays inside tests/adapters. The two risks the worker names (the target silently dropping files over 10MB, and probe files left on the seeded record, which the oracle's seed reload clears) are target behaviour, not binding faults. What would change this ruling: the next calibration showing add_attachment returning with the file only previewed on a record whose save it skipped, or attachment_address reading a different record's attachments.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `caeae0ca80c4fe93443f9781f6fd084a220a9a5e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
