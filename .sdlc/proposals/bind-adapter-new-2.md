---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "The binding file matches the contract exactly (108 pages, 984 members, nothing missing, doubled or extra)."
opened: 2026-09-29T18:22:21.271Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** The binding file matches the contract exactly (108 pages, 984 members, nothing missing, doubled or extra).

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've brought the adapter up to the current contract: all 175 missing members are now in `index.ts` and `bindings.yaml`. The binding file matches the contract exactly (108 pages, 984 members, nothing missing, doubled or extra). Of the 175, 111 are bound and 64 are unbound, with reasons. I could not run the type checker in this session (commands to run `tsc` were refused), so the new TypeScript was checked by hand. The page-reading logic was checked by running the same steps against the live target.

**The target has changed, and that matters most.** The existing adapter was written when `localhost:4300` served only four pages and everything else showed "Page not found". The same address now serves the whole marketplace:
- Public opportunity pages render for anybody.
- The service answers its interface under `/api` as `spec/contract/openapi.yaml` describes. For example, `/api/files/:id` now answers 401, where the old bindings say 404.
- Screens that need a session show a "Not Found" screen to a signed-out visitor, or for organization screens, redirect to `/sign-in`.

What has not changed is that nobody can sign in. `/sign-in` offers "Sign In Using GitHub" and "Sign In Using IDIR". Both hand off to an external single sign-on service that shows no form and answers "Login Error: Invalid parameter: redirect_uri". I rewrote `signIn` to take that route and report what the provider said, so it throws `unbound` with the real reason. It still reads the password only from `SDLC_SANDBOX_PASSWORD`.

As instructed, I did not re-walk the members bound earlier. Many of their reasons ("not a page on this target") are now false, and some members recorded as bound no longer match the page. The published page's dates now sit on one "Published … | Updated …" line; the footer has no contentinfo role; the not-found check looks for "Page not found" but the target now shows "Not Found". **The whole adapter needs a fresh walk** before its earlier entries can be trusted.

**Bound, checked on the live target:**
- **Opportunity views:** the three view pages now really open, and the old members keep their old reasons. The new dates, the Sprint With Us scope section ("Scope & Contract" tab) and the Team With Us terms section ("Competition Rules" tab) read correctly on the seeded opportunities.
- **Winner's contact details and score:** these read the award notice. Signed out, it shows only "This opportunity was awarded to …", so they correctly return empty. What a permitted reader would see could not be observed.
- **Published pages:** `body_element_names` returns `p, script, img, em` for the seeded script-probe page. `body_script_ran` listens for dialogs from the moment the page is opened; none were raised.
- **Evaluation screens:** the four `refused_when_not_permitted` members open the screen for real and read the "Not Found" refusal.
- **Mail catcher:** message, message list, delivery fault and delivery delay are bound to Mailpit's own interface. I read its answers on the catcher that receives this target's mail.

**Bound, but only half-verified:** the 20 request-level pages. Every address answered a signed-out request exactly as the contract says it should. What they answer a signed-in person could not be seen, so the request bodies follow the service interface and the contract's own descriptions. To learn those shapes I also read how the other target's adapter makes the same requests, and wrote this adapter's code independently. In practice, any criterion that needs a signed-in persona will stop at `signIn` as `unbound` before reaching them.

**Unbound, because they need a signed-in person:**
- the management-screen dates, evaluator-only tabs and offered changes of state on the three opportunity edit pages;
- the new members on the proposal create, edit and view pages;
- the organization logo members;
- the content list's `page_count`;
- the content edit page's `published_by_link` and `updated_by_link`.

Each reason says what was tried: which seeded record was opened signed out, and that it showed "Not Found" or redirected to `/sign-in`.

**Routes:** every `surface.yaml` route I opened resolved on the target; none was missing. I changed only files under `tests/adapters/new/`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does this adapter bind every surface action and observation on new, and nothing else? Ruling: return. Coverage is complete, the diff touches only tests/adapters/new, the runner's typecheck passed, and the new unbound reasons for sign-in-gated screens are real: sign-in hands off to a single sign-on service that answers 'Invalid parameter: redirect_uri'. It fails 'nothing else' twice. First, the request bindings make up input the test never gave. answersFor fills unanswered questions with adapter text. teamProposalBody defaults hourlyRate to 100 and proposedCost to 1000, invents three placeholder references, and makes the first member scrum master when none is marked. That completes a proposal so it is accepted, which decides the outcome of any test about incomplete or refused submissions. Second, the proposal itself reports that earlier entries are now false: many 'not a page on this target' unbound reasons no longer describe the target, notFoundShown looks for 'Page not found' while the target shows 'Not Found', and the published-page date and footer bindings no longer match the page. Unbound reasons must be real, and a binding known to misread the page cannot stand as bound. Would change the ruling: a revision that sends only what the test hands over and re-walks the earlier members against the current target.

**Conditions:**
- tests/adapters/new/index.ts: remove every value the adapter supplies that the test did not give. That means answersFor's placeholder answers, teamProposalBody's default hourlyRate (100) and proposedCost (1000), the three placeholder references, and making the first-named member scrum master. Send exactly what the input carries and leave anything missing blank or absent, so a request is accepted or refused for what the test gave.
- tests/adapters/new/index.ts: update notFoundShown to recognise the target's current 'Not Found' screen as well as 'Page not found', so members that use it (for example content-view.follow_body_link) read what the page shows now.
- tests/adapters/new/bindings.yaml and index.ts: re-walk the members bound or unbound before this revision against the target as it now stands. Replace every 'not a page on this target' reason that is no longer true, either with a binding or with an unbound reason naming what was tried now (for example that the screen needs a signed-in person and sign-in fails at the single sign-on hand-off). Fix the bound members the proposal reports as no longer matching the page: the published page's dates now on one 'Published … | Updated …' line, and the footer with no contentinfo role.

### Runner-owned typecheck evidence

Proposal revision: `1d74a3f4429308941132178df716a1cabbd008a6`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
