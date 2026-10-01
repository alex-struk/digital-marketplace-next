---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I bound all seven missing members of `opportunity-watch-request` (two actions and five observations) and named each one as `bound` in `tests/adapters/old/bindings.yaml`."
opened: 2026-10-01T13:33:50.565Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I bound all seven missing members of `opportunity-watch-request` (two actions and five observations) and named each one as `bound` in `tests/adapters/old/bindings.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I bound all seven missing members of `opportunity-watch-request` (two actions and five observations) and named each one as `bound` in `tests/adapters/old/bindings.yaml`. I could not run a type-check: `tsc` needed an approval this unattended session could not give, so the new code has only been checked by reading it. Nothing else in the adapter changed.

**How the page binds.** The route `/api/subscribers/:program` resolves on the target for all three programs (code-with-us, sprint-with-us, team-with-us). It is a service request, not a screen, so I bound it like the adapter's other request pages: the request goes out from the browser's own session and carries whoever is signed in. While binding I signed in as the seeded vendor and sent each request against the seeded published Code With Us opportunity, then took every watch back off. That opportunity and the seeded closed Sprint With Us and Team With Us ones are all watched by nobody again.

What the target answered:

- **Watch** (`POST /api/subscribers/<program>` with `{ opportunity }`): 201 with the new subscription. Asked a second time it refuses with 409 under the reason `conflict` ("This user is already subscribed to this opportunity.").
- **Stop watching** (`DELETE /api/subscribers/<program>/<opportunity id>`): 200. Asked again it refuses with 404 under `notFound`.
- **Unknown opportunity:** 404 under `notFound`.
- **The author watching their own opportunity** (signed in through the public-sector staff session route): 400 under `opportunity` ("You cannot subscribe to your own opportunity.").
- **Signed out:** both requests get 401 under `permissions`.

**What each member does in `index.ts`:**

- **`open({ program })`** remembers the program and clears the previous answer, so an observation read before any request throws `unbound:` instead of picking up another page's answer.
- **Both actions** take the opportunity as a seed handle, an identifier or the seeded record. If `open` was not given a program, they use the input's program or the seed's record. Either action throws `unbound:` naming what is missing if the input gives no opportunity or no program can be found.
- **The four answer readers:**
  - `request_accepted` reads the status and body of an accepted request.
  - `refusal_status` reads the refusal's status.
  - `refusal_reason` reads the name the refusal is filed under.
  - `refusal_messages` reads the messages in the order the service gives them.

  Each of these returns empty when it does not apply (an accepted request has no refusal, and the reverse).
- **`watching`** reads the opportunity's own `subscribed` flag from `/api/opportunities/<program>/<id>`, as the contract asks. This read does not replace the watch request's answer. It returns `"true"` or `"false"`. Signed out, the target's answer carries no flag at all, so it returns empty. It throws `unbound:` only if no request has named an opportunity yet, or if the opportunity lookup does not answer 200.

**Two things to know:**

- The contract describes the signed-out refusal and the duplicate refusal in words that fit what the target sends (401 `permissions` and 409 `conflict`). It names no status codes, so I am only noting the codes the target used.
- The contract did not ask me to change anything outside `tests/adapters/old/`, and I did not.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does bind-adapter-old-58 bind every action and observation of the opportunity-watch-request surface on old, and nothing else? Approve. All seven members the contract lists at spec/contract/surface.yaml:1996 (watch_by_request, stop_watching_by_request, request_accepted, refusal_status, refusal_reason, refusal_messages, watching) are bound, and none is left unbound. The bindings only navigate and read. The actions send the POST/DELETE to /api/subscribers/<program> and assert nothing. The readers reuse the adapter's existing helpers (answer, answered, accepted, lastRefusal) and return what the service said: refusal_reason returns the top-level key the refusal is filed under, as the contract comment describes, and watching reads the opportunity's own subscribed flag from /api/opportunities/<program>/<id> without overwriting the last request's answer, as the contract asks. Nothing under tests/acceptance changed (git diff main...HEAD -- tests/acceptance is empty). The runner's typecheck reports no diagnostics under adapters/old/; its only failure is in adapters/new/, which this proposal does not answer for. The open missing-test on R-1.5 (the duplicate-watch clause) is owed by derive-tests under an earlier ruling and is not this adapter's to discharge; this binding gives derive-tests the surface it needs, since the duplicate request answers 409 conflict. The ruling would change if tsc reported errors under adapters/old/, if the diff touched tests/acceptance, or if a binding decided an outcome instead of reporting it.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `bcb195780026c94428600beb2bb4bc90ec9cfdd6`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
