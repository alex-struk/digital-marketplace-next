| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T00:16:16.211Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I made the one required fix and both optional ones, but I could not run the typecheck, so nothing I changed has been compiled.

I made the one required fix and both optional ones, but I could not run the typecheck, so nothing I changed has been compiled.

**The required fix.** In `tests/adapters/old/index.ts`, `fileAttachmentControl.open` now reads only `params.program` and `params.opportunityId`, the two fields the generated `FileAttachmentControlPage.open` declares. I removed the `params.programme` and `params.id` fallbacks that caused the two errors at lines 2933–2934. It still defaults the program to `code-with-us` when none is given. It still throws `unbound: file-attachment-control.open` when no opportunity id is given. Nothing else about how the page opens changed.

**First optional change.** `fileAttachmentControl.uploadRefusedForSize` no longer keeps only messages that match a size pattern; it returns every message the step shows. I didn't copy the form the other refusal readers use, which reads the status of the adapter's last direct request. The attachment control uploads through the page's own file chooser, so no request answer comes back to read. The step's own messages are the only honest source, read the same way `fieldError` reads them.

**Second optional change.** `bindings.yaml` now has a comment on `organization-edit.add_team_members`. It says ordinary members are invited through the Team tab's "Add Team Member(s)" dialog, and any other membership type is posted directly to `/api/affiliations` because that screen cannot send one. The entry stays `bound`, and no name was added, removed or renamed.

Everything else from the previous binding is untouched. Nothing was rebound, no page was walked again, and no route was re-checked. No page's route was found missing this time, because none was visited. The adapter still asserts nothing, defines no test, and holds no password or other value read from the environment.

**What I could not do.** The workspace has no installed packages, and installing the runner's pinned TypeScript and Playwright versions into the scratchpad needed an approval this session couldn't get. The only TypeScript installs on the machine are inside other project folders, one of which may hold the target's source, so I didn't use them. Instead I did a narrower check by hand. After the fix, the adapter reads a field off `params` in exactly two places, `params?.program` and `params?.opportunityId`, and both are declared in the generated signature. That rules out the two errors the ruling cited, but it is not the runner's typecheck.

Approval still depends on a runner typecheck under `adapters/old/` with no errors, which has yet to happen. The earlier point also still stands: the chunked upload from the previous revision has never been sent against the target.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Does this adapter bind every surface action and observation on old, and nothing else? Approved. The previous ruling (bind-adapter-old-4) returned it for a single reason: two TypeScript errors in fileAttachmentControl.open, which read params.programme and params.id when the generated type declares only program and opportunityId. The runner's typecheck at 313c40c lists no errors under adapters/old/. The non-zero exit comes entirely from errors in tests/acceptance/, which this proposal does not own and did not touch. The source no longer reads either undeclared field. Because the adapter satisfies every generated page type with no errors, it declares every action and observation the surface names. Nothing under tests/acceptance or tests/generated changed. The adapter contains no assertion, no expect call and no read from the environment. Both optional fixes are in: uploadRefusedForSize now returns the step's messages unfiltered, and bindings.yaml records that non-member invitations are posted to /api/affiliations. The upload that sends no Content-Length has never been sent against the target, but a failure there throws an unbound error instead of producing a result, so it cannot fake a pass. The tier is STANDARD and no risk is marked unaccepted, so nothing needs escalating. The ruling would change if a later runner typecheck reports errors under adapters/old/, if a binding is found asserting an outcome rather than locating one, or if the first run shows the no-size-header upload never reaches the target while its binding stays marked bound.

**Conditions:**
- The first run against the target should show whether file-upload.upload_file_without_declaring_its_size actually reaches the target. If it cannot, mark that binding unbound with the real reason instead of leaving it bound.

### Runner-owned typecheck evidence

Proposal revision: `313c40c43499cfcbbb56e65a5f4efe71f288d3f5`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/users/: 89 diagnostics
    acceptance/opportunities/: 73 diagnostics
    acceptance/evaluation/: 19 diagnostics
    acceptance/files/: 13 diagnostics
    acceptance/notifications/: 13 diagnostics
