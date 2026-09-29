---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "`node` (so `tsc`) needs an approval nobody is here to give, so nothing was compiled or run."
opened: 2026-09-29T18:52:10.538Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** `node` (so `tsc`) needs an approval nobody is here to give, so nothing was compiled or run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've revised the "new" adapter and bindings on all three conditions, but I couldn't typecheck or run it. `node` (so `tsc`) needs an approval nobody is here to give, so nothing was compiled or run. I proofread the new code by hand and checked the key readers by running the same logic in the browser against the live target. The first typecheck will be the runner's.

**The ruling's three conditions**
- **Nothing made up any more.** The proposal requests now send only what the test gives. Unanswered questions stay unanswered. There is no default hourly rate or proposed cost, no placeholder references, and nobody becomes scrum master unless the input says so. A Team With Us member's resource is also left out when none is given; it used to default to the opportunity's first resource. The one remaining lookup turns a service-area name the test gave into that resource's identifier.
- **Not-found check.** It now recognises "Not Found" as well as "Page not found".
- **Published page and footer.** Dates are read from the "Published … | Updated …" line, whether it renders as one line or three. The footer is now found as the block holding "Owned and operated by the B.C. Government." (it has no landmark role). While re-walking I also found that the page's "main" landmark wraps the banner and footer too. So all page-text reading now strips them off, and the published page's body-link finder only looks in the body.

**The re-walk.** The "175 members not named" list was already out of date: the file named all 984 members before I started. I opened every earlier route again, signed out, using seeded identifiers where a route needs one. Every "not a page on this target" reason has been replaced, either with a binding or with what was tried this time.
- **Now bound, from what a signed-out visitor sees:**
  - the opportunity list (program filter, Remote OK, search, the open and closed groups, statuses, deadlines)
  - the earlier members of the three public opportunity pages: identifier, status, published date, deadline, reward and budgets, phases, resources, addenda, winner
  - the home page's two awarded figures, which exist now
  - the organization list
  - the sign-in, sign-up and signed-out screens, both notices, and `/proposals`
  - the public attachments list on an opportunity page
  - `file-upload`, `file-description` and `file-download` as requests: `/api/files` now answers (401 signed out) instead of 404
- **Refusals now read instead of reported as unbound:** the content screens' `refused_for_non_administrator`, the email reference's 401 answer, and `sign_in_required` on `/users/me` and the unsubscribe landing.
- **Still unbound, with the reason naming what the screen did:** every screen that needs a session. Each answers a signed-out visitor with the "Not Found" screen, a redirect to `/sign-in`, or (for `/dashboard`) a redirect home. The same goes for watch, start-proposal and the notification control, which only a signed-in person gets.
- **Nobody can sign in.** Both "Sign In Using GitHub" and "Sign In Using IDIR" still hand off to a sign-on service that answers "Login Error: Invalid parameter: redirect_uri" and shows no form.
- **Service level agreement link.** It no longer exists on `/learn-more/code-with-us`, the other explainers or the program cards. Following it is now unbound, and the link readers return empty rather than the explainer's own text.

**Every contract route resolves on the target.** Each one either renders or answers with a refusal.

**Choices a reviewer should see**
- For the two uploads named for a bad read access (unrecognised, malformed), I send the read access the test gives. If it gives none, I send an unknown tag or a non-list, because that value is what the action is named for.
- `created_by_name` and `last_changed_by_name` on the public opportunity pages read empty: the page opens and names nobody.
- In bindings.yaml each page's reason is written once as a YAML anchor and repeated by alias, to keep the file readable. Names still match the contract: 108 pages, 984 members. Only files under `tests/adapters/new/` were changed.

## Fix turn

I fixed the one failed check. `tests/adapters/new/bindings.yaml` failed to parse because many members shared a reason through YAML anchors and aliases (`&name` / `*name`), and the parser refused the file once the alias count passed its limit. I expanded all 35 anchors so each member now carries its full reason in its own quoted string, and deleted the anchor markers. I also updated the header comment that described the anchor scheme.

No reason's wording changed, and no member was added, removed, renamed, or switched between bound and unbound. `index.ts` was not touched. After the change, a search found no anchors or aliases left, and every member line is either `bound` or one complete quoted `"unbound: …"` string. I could not load the file with a real YAML parser to confirm it now parses, because running a script here needs an approval I didn't have.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the new adapter bind every surface action and observation on the target, and nothing else? Ruling: approve. It settles all three open conditions. teamProposalBody (index.ts:1906-1971) sends a rate, cost, scrum master, reference or answer only where the input carries one; the only lookup left maps a service-area name the test gave to that resource's id. notFoundShown now recognises 'Not Found' too. Every stale 'not a page on this target' reason was replaced after a re-walk: public screens are now bound, and screens that need a session are unbound with what the target answered a signed-out visitor plus the single sign-on redirect_uri failure. The adapter stays an adapter: its only Playwright import is types, there is no expect(), and readers return text for the test to judge. Nothing under tests/acceptance changed. The runner-owned typecheck passed with no diagnostics. The YAML anchors that broke parsing are gone (no anchor or alias found) and no check now fails. That parse was not confirmed with a real parser in this session; a parse failure in the first run would change the ruling.

**Conditions:**
- condition-met bind-adapter-new-2#1: teamProposalBody in tests/adapters/new/index.ts (lines 1906-1971) sets hourlyRate, proposedCost, scrumMaster and references only from what the input gives, and answersFor sends only the answers given; there are no defaults or placeholders.
- condition-met bind-adapter-new-2#2: notFoundShown in tests/adapters/new/index.ts matches /^(page )?not found$/i, so it recognises both 'Not Found' and 'Page not found'.
- condition-met bind-adapter-new-2#3: tests/adapters/new/bindings.yaml and index.ts no longer carry any 'not a page on this target' reason. Public screens are bound, and screens that need a session name what they answered signed out plus the sign-on redirect_uri failure. datedLine reads the 'Published … | Updated …' line, and siteFooter finds the footer by 'Owned and operated by the B.C. Government.'

### Runner-owned typecheck evidence

Proposal revision: `05a73e289552c0597cb2376e73b39b6baaa02254`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
