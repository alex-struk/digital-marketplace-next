---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I made the one required fix and both optional ones, but I could not run the typecheck, so nothing I changed has been compiled."
opened: 2026-09-14T00:16:16.211Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I made the one required fix and both optional ones, but I could not run the typecheck, so nothing I changed has been compiled.

I made the one required fix and both optional ones, but I could not run the typecheck, so nothing I changed has been compiled.

**The required fix.** In `tests/adapters/old/index.ts`, `fileAttachmentControl.open` now reads only `params.program` and `params.opportunityId`, the two fields the generated `FileAttachmentControlPage.open` declares. I removed the `params.programme` and `params.id` fallbacks that caused the two errors at lines 2933–2934. It still defaults the program to `code-with-us` when none is given. It still throws `unbound: file-attachment-control.open` when no opportunity id is given. Nothing else about how the page opens changed.

**First optional change.** `fileAttachmentControl.uploadRefusedForSize` no longer keeps only messages that match a size pattern; it returns every message the step shows. I didn't copy the form the other refusal readers use, which reads the status of the adapter's last direct request. The attachment control uploads through the page's own file chooser, so no request answer comes back to read. The step's own messages are the only honest source, read the same way `fieldError` reads them.

**Second optional change.** `bindings.yaml` now has a comment on `organization-edit.add_team_members`. It says ordinary members are invited through the Team tab's "Add Team Member(s)" dialog, and any other membership type is posted directly to `/api/affiliations` because that screen cannot send one. The entry stays `bound`, and no name was added, removed or renamed.

Everything else from the previous binding is untouched. Nothing was rebound, no page was walked again, and no route was re-checked. No page's route was found missing this time, because none was visited. The adapter still asserts nothing, defines no test, and holds no password or other value read from the environment.

**What I could not do.** The workspace has no installed packages, and installing the runner's pinned TypeScript and Playwright versions into the scratchpad needed an approval this session couldn't get. The only TypeScript installs on the machine are inside other project folders, one of which may hold the target's source, so I didn't use them. Instead I did a narrower check by hand. After the fix, the adapter reads a field off `params` in exactly two places, `params?.program` and `params?.opportunityId`, and both are declared in the generated signature. That rules out the two errors the ruling cited, but it is not the runner's typecheck.

Approval still depends on a runner typecheck under `adapters/old/` with no errors, which has yet to happen. The earlier point also still stands: the chunked upload from the previous revision has never been sent against the target.
