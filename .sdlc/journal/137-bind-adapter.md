---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-25T09:46:48.562Z"
cost: 0.3323314
turns: 11
session: "363ba3df-d7b9-4ceb-8af3-9896feba765c"
---

I changed one method, `fileAttachByIdentifier.attachStoredFile` in `tests/adapters/old/index.ts`. I could not verify the change: the sandbox needed approval to run the typecheck, a script comparing `bindings.yaml` against the contract, and a direct request to the target.

**The fix.** The ruling returned the adapter because, when the signed-in person could not read the record, the attach binding sent a read of the record instead of the attach. `attachment_refused` then reported the refusal of a read, not of an attach. A service that refused the read but accepted the write would have passed, which is the gap the file criteria are meant to close.

The binding now always sends the attach, a PUT to the opened record:
- **Readable record:** the full record goes back with the new file identifier added to its attachments, as before.
- **Unreadable record:** only the attachment goes, as `{tag: "edit", value: {attachments: [<fileId>]}}`, the body the ruling named.

So `attachment_accepted` and `attachment_refused` now read the service's answer to the attach itself, whoever is signed in. `attached_file_identifiers` still reads the record afterwards and is unchanged. Nothing else in the adapter changed; the other bindings and the six calibration fixes the ruling accepted stay as they were.

**The 66 listed members.** These were already in `bindings.yaml` as `bound` from the earlier pass, and the ruling accepted them, so I did not walk the target again. I spot-checked the file for the listed pages and names: all were present. The full comparison against the contract did not run.

**Unverified.** None of these checks ran:
- **Typecheck:** the runner's own typecheck should confirm the edit compiles; it reuses helpers already in the file (`send`, `peek`, `editValue`, `fileIdFor`).
- **Bindings comparison:** the script checking that every contract name appears in `bindings.yaml` exactly once.
- **Probe of the target:** an anonymous PUT with the reduced body, to see what the target answers to it.

One thing to watch: the service may reject the reduced body as malformed before it checks permission. `attachment_refused` would then report a refusal that is about the body's shape rather than access. What it reports is still the service's own answer to the attach, which is what the ruling asked for.

**Pages that did not resolve.** I found none in this revision. The earlier pass reported none either, and I opened no pages this time.

**Outside this stage.** As the ruling noted, `tests/generated/surface.d.ts` does not match the contract, so the newer pages still typecheck loosely. Regenerating it is not this stage's work, and I left it untouched.