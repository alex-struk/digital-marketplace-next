| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T14:47:01.872Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I changed the two readers the last ruling returned this binding for, and nothing else.

I changed the two readers the last ruling returned this binding for, and nothing else. I couldn't run a typecheck because this workspace has no TypeScript compiler or tsconfig. Both edits swap one string expression for another, so the return types haven't changed, but the runner's typecheck is still the real check.

The first change is to `fileDownload.readableWhenSignedOutIfPublic` in `tests/adapters/old/index.ts`. It now returns the downloaded body only when the latest answer was a 200, and an empty string otherwise. In the previous revision a refusal came back as "status plus body", which is never empty. So a signed-out refusal passed the `toBeTruthy()` checks in R-8.7, R-8.28 and R-8.29 that are meant to show the file was readable. With empty on refusal, those assertions depend on what the target returns, not on the adapter. I also rewrote the comment above that reader, which still described the old behaviour.

The second change is to `scheduledTransitionTrigger.serviceIsUp`. When it has to request the status address, it now returns the trimmed body only on a 200 and an empty string otherwise, instead of the status and body.

One thing a reviewer may want to look at: `serviceIsUp` has an earlier branch that I left alone because the conditions don't mention it. If the browser is already on `/status`, it returns the page's visible text without making a request, so it never sees a status code. If that page ever loaded with an error, its text would still read as truthy. The condition covered the requested path, and that is the path I fixed.

I didn't touch anything else. The fixes that return empty on loaded but empty pages, the Value readers that check the programme badge, the row links, the Panel Chair checkbox, pressing Edit before editing, `uploadFile` and the label corrections all stay as they were. I didn't change `bindings.yaml` either, because both members were already "bound" and still are. I didn't reopen the running target, since neither fix needed a new look at a page. This revision finds no new unbound members and no route that fails to resolve.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether this adapter binds every surface action and observation on old, and nothing else. Approve. The last ruling (bind-adapter-old-8) returned the binding over two readers and said reverting them would make it approve. Diffing returned/bind-adapter-old-8 against f693686 shows exactly those two changes and nothing else. fileDownload.readableWhenSignedOutIfPublic now returns the body only on a 200 and an empty string otherwise, so a signed-out refusal no longer passes the toBeTruthy() checks in R-8.7, R-8.28 and R-8.29. scheduledTransitionTrigger.serviceIsUp returns the trimmed body only when the /status request answers 200, and an empty string otherwise. The only other change is the comment above the first reader, which now describes what it does. The third condition also holds: the absence fixes, the programme-badge Value readers, row links, the Panel Chair checkbox, pressing Edit before editing, uploadFile and the label corrections are byte-identical to old-8. Both readers now only locate and hand over what the target returned, so neither one decides a test. Nothing under tests/acceptance, tests/generated or tests/fixtures differs from main. The runner's typecheck passed on f693686 with no diagnostics under adapters/old. The earlier branch of serviceIsUp, which reads visible text when the browser is already on /status, is already on main, was not in the returned conditions, and reads the page rather than judging it, so it does not block. Tier is STANDARD and no residual risk is marked unaccepted, so there is nothing to escalate. The ruling would change to return if a later revision touched tests/acceptance, or made either reader return non-empty text for a non-200 answer again.

**Conditions:**
- Note for a future revision, not required for this approval: serviceIsUp's early branch returns document.body.innerText when the browser is already on /status, without seeing a status code. If a test ever reaches that reader after navigating to /status, an error page would read as truthy. Route that branch through the same 200-only request.

### Runner-owned typecheck evidence

Proposal revision: `f693686d9072d0b2c863098f2bfbc65b8f4a500e`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
