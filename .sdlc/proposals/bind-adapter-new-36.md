---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I added the seven missing members, but nothing in it has been compiled or run as a test."
opened: 2026-10-01T13:39:09.731Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I added the seven missing members, but nothing in it has been compiled or run as a test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the seven missing members, but nothing in it has been compiled or run as a test. This workspace has no TypeScript compiler, and the script that would have compared `bindings.yaml` against the contract needed an approval this session couldn't get. In place of both, I sent the same requests by hand on the running target and checked the helpers the new code uses against the rest of `tests/adapters/new/index.ts`.

**What was added.** The `opportunity-watch-request` page is now in `tests/adapters/new/index.ts` and named in `bindings.yaml`, with all seven members bound: `watch_by_request`, `stop_watching_by_request`, `request_accepted`, `refusal_status`, `refusal_reason`, `refusal_messages` and `watching`. Nothing else in either file changed. I didn't walk the target again for anything already accepted.

**What I tried on the running target.** I sent the requests from a browser session on http://localhost:4300 against the seeded published Code With Us opportunity, and they behaved like this:

| Request | Who | Answer |
|---|---|---|
| watch | signed out | 401, "You must be signed in to watch an opportunity." |
| watch | vendor (`test-vendor-1`) | 201, with the subscription |
| watch again | vendor | 400, "opportunity: You are already watching this opportunity." |
| stop watching | vendor | 200 |
| stop watching again | vendor | 400, "opportunity: You are not watching this opportunity." |
| watch an identifier that names nothing | vendor | 400, "opportunity: No opportunity you may read is held at that identifier." |
| watch one's own opportunity | creating staff member (`test-gov`) | 400, "You cannot subscribe to your own opportunity." |

The opportunity's `subscribed` flag went false, then true, then false along with these requests. I finished with the vendor's watch stopped, so nobody watches the opportunity now, which is the state the contract expects the next test to start from.

**How the adapter binds them.** The two actions send the request with the browser's session. They take the opportunity as a seed handle, an identifier, or a record. The program comes from `open()`, the input, or the seeded record.

The four answer observations read the last answer:
- `request_accepted` is empty when the request was refused.
- `refusal_status` and `refusal_messages` are empty when it was accepted. Messages come back exactly as the service wrote them, prefix included.

`watching` asks for the opportunity again and reads its `subscribed` flag, so it doesn't depend on the answer to the watch request.

**A difference a reviewer should know about.** The contract says a refusal is filed under `conflict`, `opportunity`, `notFound` or `permissions`. This target files every refusal under one generic `errors` list. Some messages carry an "opportunity: " prefix and some don't: the own-opportunity and signed-out ones don't. So `refusal_reason` returns the key the service actually uses, which on this target is always `errors`. I deliberately didn't translate message text into the contract's reason names, because that would be the adapter choosing the result. A test that expects `conflict` for a duplicate watch will fail on this target, and that failure is a real difference between the target and the contract.

**The two criteria from the ruling.** I didn't change the unbound reasons for `opportunity-cwu-edit.reporting_watchers` and `reporting_views` (criteria R-1.5 and R-1.6). The ruling accepted those reasons as real, and fixing it is addressed to the test-writing stage (read the counts through the contract's counters observable). The R-1.5 duplicate-watch gap is addressed to the contract stage. I left both alone. The new page does make the duplicate refusal visible, which is what the contract stage asked for.

**Pages that didn't resolve.** Every address this page uses answered on the target.

I wrote nothing outside `tests/adapters/new/`.
