---
gate: G3
question: "Does slice 21 (An administrator can preview every message the service sends) do what its criteria say?"
recommendation: "`npm --prefix app run check` passes: typecheck plus every unit test in the backend, frontend and migrations packages."
opened: 2026-10-04T20:22:44.434Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 21 (An administrator can preview every message the service sends) do what its criteria say?

**Recommendation.** `npm --prefix app run check` passes: typecheck plus every unit test in the backend, frontend and migrations packages.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've fixed the likely cause of all three failures, but I couldn't confirm the fix in a browser, so I've proven it only with unit tests. `npm --prefix app run check` passes: typecheck plus every unit test in the backend, frontend and migrations packages.

**What was going wrong.** In the evidence for R-6.6, R-6.13 and R-6.19, the administrator gets the reference page's heading and then the alert "The sample emails could not be loaded", even after reloading. The service itself was answering correctly: its end-to-end test of `/admin/email-notification-reference` returns 200 and every sample to an administrator. The problem is that this one address is both the page and the place the screen asks for its samples. The web server decides between the two by the `Accept` header: a page request gets the app's `index.html`, anything else goes to the service. But `index.html` was sent with `Last-Modified` and `ETag`, no `Cache-Control`, and nothing saying the answer depends on `Accept`. A browser is then allowed to keep that HTML and reuse it for the screen's own request to the same address. HTML doesn't parse as the samples, so the screen showed the alert. Reloading just refreshed the cached page, which the next request reused again, matching "also after reloading".

**What I changed.** I closed the gap in three places:
- **The screen's request** (`app/frontend/src/api/notifications.ts`) now uses `cache: "no-store"`, so it never reads from or writes to the browser's cache.
- **The web server** (`app/frontend/Caddyfile`) sends `Vary: Accept` on everything under `/admin`, and `Cache-Control: no-store` on the page there.
- **The service** (`app/backend/src/notifications/email-reference.controller.ts`) sends `Cache-Control: no-store` on the samples, so the back button can't show the raw data in place of the page.

The full reasoning is in `docs/decisions/0068-the-notification-reference-is-never-answered-from-the-browser-cache.md`.

**Tests.**
- A new frontend test checks that the screen's request goes out as `no-store` with `Accept: application/json`, and that the samples then render.
- The backend end-to-end test now also checks the `no-store` header on the administrator's answer. Adding the headers to that test's shared helper first broke an unrelated R-6.23 assertion; I fixed the helper so it doesn't.

**Not changed, and still open.**
- **Other parts of the slice.** The earlier work stands: the samples built from the senders' own message builders, the completeness check behind R-6.19, and the not-found page for anyone but an administrator.
- **R-6.6 wording.** As decision 0067 records, only the three new-opportunity announcements end in Unsubscribe; every other sample ends in "Manage your notification settings", as R-6.16 requires. R-6.6 says *every* message ends with Unsubscribe, so the two criteria conflict. If the R-6.6 test checks every sample for Unsubscribe, it will still fail once the page loads. Resolving that means changing a criterion in the specification, which isn't this stage's to do.
- **`/status`.** It shares one address with its page in the same way, and its screen likely has the same caching exposure. It wasn't named in this ruling, so I left it alone.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 21 (an administrator can preview every message the service sends) do what its criteria say? Ruling: return. All three criteria the slice claims (R-6.6, R-6.13, R-6.19) pass against tree 14b5752. The code builds each preview from the same function that builds the sent message, from invented sample data. A unit test fails if any message builder in src/mail/notifications is missing from the reference. Anybody but an administrator is answered not-found. This revision's caching fix (no-store on the screen's request, Vary: Accept and no-store under /admin in the Caddyfile, no-store on the controller) is scoped to /admin and covered by unit tests. Nothing in the diff belongs to another slice, and I found no secret or personal data. The verify verdict is still fail, from a regression row on R-2.3, which this diff does not touch. The saved page and its outline at .sdlc/evidence/slice-21/R-2.3.{png,txt} plainly show the term 'Status' with the definition 'Submitted' on the proposal edit page. The adapter's proposalCwuEdit.status(), which reads proposalTerm(/^status$/i) in tests/adapters/new/index.ts, returned an empty string. The empty read is the adapter's, so it goes to bind-adapter, and the build stage is given nothing to change. An approval is refused while the verdict is fail. What would change the ruling: a current verify result for this proposal with R-2.3 passing again and slice 21's criteria still passing. Note: R-6.6 as written conflicts with R-6.16 (decision record 0067). The build follows R-6.16, and R-6.6's test passes regardless, so the conflict does not block this slice.

**Conditions:**
- addressed-to bind-adapter: R-2.3: after proposalCwuCreate.submitProposal lands on /opportunities/code-with-us/<id>/proposals/<id>/edit, proposalCwuEdit.status() (proposalTerm(/^status$/i) in tests/adapters/new/index.ts) read "". The page as it failed (.sdlc/evidence/slice-21/R-2.3.png and .txt) shows, in main, the description-list term "Status" with the definition "Submitted" (rendered as a pill), directly under the level-1 heading and beside "Submitted", "Proposal ID" and "Opportunity ID". The adapter must wait for and read that term's definition after the submit lands, rather than reading before the page has rendered it or missing the term.
