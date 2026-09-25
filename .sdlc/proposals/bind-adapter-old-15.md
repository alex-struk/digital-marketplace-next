---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I changed one method, `fileAttachByIdentifier.attachStoredFile` in `tests/adapters/old/index.ts`."
opened: 2026-09-25T09:46:48.593Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I changed one method, `fileAttachByIdentifier.attachStoredFile` in `tests/adapters/old/index.ts`.

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: does this adapter bind every surface action and observation on old, and nothing else? Approved. The last ruling returned the adapter for one reason: when the record could not be read, `fileAttachByIdentifier.attachStoredFile` sent a read of the record in place of the attach. So `attachment_refused` would have reported the refusal of a read, and a service that refused reads but accepted writes would have passed. This revision always sends the PUT to the opened record. A readable record gets the full edit body with the file added. An unreadable one gets `{tag: "edit", value: {attachments: [<fileId>]}}`, the smallest body the ruling asked for. The earlier `peek` is a side read that does not change `lastAnswer`, so `attachment_accepted` and `attachment_refused` now read the service's answer to the attach itself. The typecheck the runner ran on this revision passed with no diagnostics under `adapters/old/`, which covers the check the author could not run. The adapter is still only an adapter. The new bindings navigate pages, make requests from the signed-in session, and read or reshape what comes back. The places that filter lines (the award banner, the refusal screen, the refusal shape) choose which text to report and do not decide whether a test passes. The diff touches no protected path and nothing under `tests/acceptance`. The other bindings and calibration fixes were accepted last round and are unchanged. The tier is STANDARD and no risk is marked unaccepted, so nothing needs escalating. The author notes one risk: the target might reject the reduced body as malformed before it checks permission. That is still the service's own answer to the attach, and it is what the condition asked for. The failing generated check (`surface.d.ts`, `personas.ts` and `seed.ts` do not match the contract) is not work this stage can deliver, and it is why the adapter uses the `PageOf`/`Open` types. What would change this ruling: a binding run against the target shows the attach binding reaching something other than the attach, or a regenerated surface shows a listed member missing from `bindings.yaml` or listed twice.

**Conditions:**
- condition-met bind-adapter-old-14#1: tests/adapters/old/index.ts fileAttachByIdentifier.attachStoredFile now always sends PUT {tag: "edit", ...} to openedRecord. It sends the full edit value when the record is readable and {attachments: [fileIdFor(named)]} when it is not, so attachment_accepted and attachment_refused read the service's answer to the attach itself. The runner's typecheck of revision 7f565820 passed.

### Runner-owned typecheck evidence

Proposal revision: `7f565820ad23833f683dd660dc7e8afc36f5d6e9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
