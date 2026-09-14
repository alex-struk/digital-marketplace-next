---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I changed the two readers the last ruling returned this binding for, and nothing else."
opened: 2026-09-14T14:47:01.872Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I changed the two readers the last ruling returned this binding for, and nothing else.

I changed the two readers the last ruling returned this binding for, and nothing else. I couldn't run a typecheck because this workspace has no TypeScript compiler or tsconfig. Both edits swap one string expression for another, so the return types haven't changed, but the runner's typecheck is still the real check.

The first change is to `fileDownload.readableWhenSignedOutIfPublic` in `tests/adapters/old/index.ts`. It now returns the downloaded body only when the latest answer was a 200, and an empty string otherwise. In the previous revision a refusal came back as "status plus body", which is never empty. So a signed-out refusal passed the `toBeTruthy()` checks in R-8.7, R-8.28 and R-8.29 that are meant to show the file was readable. With empty on refusal, those assertions depend on what the target returns, not on the adapter. I also rewrote the comment above that reader, which still described the old behaviour.

The second change is to `scheduledTransitionTrigger.serviceIsUp`. When it has to request the status address, it now returns the trimmed body only on a 200 and an empty string otherwise, instead of the status and body.

One thing a reviewer may want to look at: `serviceIsUp` has an earlier branch that I left alone because the conditions don't mention it. If the browser is already on `/status`, it returns the page's visible text without making a request, so it never sees a status code. If that page ever loaded with an error, its text would still read as truthy. The condition covered the requested path, and that is the path I fixed.

I didn't touch anything else. The fixes that return empty on loaded but empty pages, the Value readers that check the programme badge, the row links, the Panel Chair checkbox, pressing Edit before editing, `uploadFile` and the label corrections all stay as they were. I didn't change `bindings.yaml` either, because both members were already "bound" and still are. I didn't reopen the running target, since neither fix needed a new look at a page. This revision finds no new unbound members and no route that fails to resolve.
