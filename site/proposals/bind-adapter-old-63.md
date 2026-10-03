| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T00:09:56.584Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the one observation that was missing.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the one observation that was missing. `opportunity-swu-view.page_messages` is now bound in `tests/adapters/old/index.ts` and listed as `bound` in `tests/adapters/old/bindings.yaml`. The type check didn't run because the command needed an approval this session couldn't give, so I have only read the new code over, not compiled it.

**What I saw on the target.** I signed in as vendor 1 through the session route and opened the seeded closed Sprint With Us opportunity (`…-8000-000000000701`). It is in its evaluation stage. The page has no notices at all, either when it first loads or after opening its "Scope & Contract" tab. That matches the contract, which says this opportunity with this persona should show nothing. To see what a notice looks like when one is there, I opened the seeded awarded Sprint With Us opportunity (`…-a020-000000000001`). There the page puts a single alert above the header that reads "This opportunity was awarded to Northern Pines Digital Ltd..". Notices on this screen are elements the browser reports with the alert role.

**How it reads.** The new reader waits for the page to finish loading. It then returns the text of every visible alert on the screen, one line each, in the order they appear. It doesn't stop at the space above the header, because a notice caused by the missing scope page could be drawn somewhere else. I could not see the target in that state; it needs a separately started instance (`service_page_absent`). When the page loads and shows no alerts, the reader returns an empty string, and that empty answer is what the criterion checks for. If the opportunity shows "Not Found", or the page never loads a heading, it throws `unbound:` instead, because the page the contract describes was never reached. It uses only alert roles and visible text, no CSS selectors.

**Changes.** The only edits are the new reader in `index.ts` and its line in `bindings.yaml`. All earlier bindings are unchanged. Every route I opened loaded, so no page's route failed to resolve.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation, and nothing else? It does not yet. The new opportunity-swu-view.page_messages reader stays an adapter: it only navigates and locates, uses alert roles and visible text, throws unbound: when the page is never reached, and adds no assertion. No file under tests/acceptance changed, and the runner's typecheck on this revision passed with no diagnostics under adapters/old. But the reader returns what everyAlert() finds anywhere on the page. The contract defines the observation as every notice, alert, error message or pop-up message the screen shows 'anywhere outside its own sections (scope_section, phases, addenda and the rest above)'. An alert drawn inside the Scope & Contract tab body or another bound section would be reported as a page message, so the binding reads something other than what the observation names. That fault is in tests/adapters/old/index.ts, which bind-adapter owns. The contract's definition needs no change, so the condition goes back to bind-adapter and not to design. The ruling changes to approve once the reader excludes alerts inside the screen's bound section regions and still reads late-drawn alerts everywhere else.

**Conditions:**
- opportunity-swu-view.page_messages (tests/adapters/old/index.ts, the new pageMessages reader) must read only the notices, alerts, error or pop-up messages the screen shows outside its own sections. The contract defines the observation as messages shown 'anywhere outside its own sections (scope_section, phases, addenda and the rest above)'. The reader currently returns every role=alert element on the page via everyAlert(), so an alert rendered inside the Scope & Contract tab body (the region scopeSection/embeddedSection reads) or inside phases, addenda or another bound section would be reported as a page message. Exclude alerts that sit within those section regions, keep reading alerts anywhere else on the screen including late-drawn ones, and update the comment above the reader to say what is excluded and why.

### Runner-owned typecheck evidence

Proposal revision: `9e6ecab7b446f1028479e631002b2f16809d3da9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
