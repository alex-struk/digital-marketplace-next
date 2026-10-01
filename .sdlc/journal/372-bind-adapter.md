---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T13:33:50.530Z"
cost: 0.9965362
turns: 31
session: "537376b7-6bb3-49e4-8192-cc1b82636fbe"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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