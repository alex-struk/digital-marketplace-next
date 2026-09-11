| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-11T00:03:02.997Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I wrote the adapter for the "old" target, but I could not observe the running application at all, so nothing is bound.

I wrote the adapter for the "old" target, but I could not observe the running application at all, so nothing is bound.

**What blocked the work.** The browser tooling in this workspace is pinned to the Google Chrome channel, and no Chrome is installed on the machine. Every navigation attempt fails before a page is ever created. Playwright's own Chromium builds are present in the user cache, so the tooling is misconfigured rather than missing, but nothing I can reach from here changes which browser it launches. The session was also refused shell and network access, so I could not install the browser, read the target URL from the environment, or fetch a single page another way. That left no path to the application.

**What I wrote.** The adapter file exports the create function the fixture expects and supplies every page the generated surface declares. Navigation and sign-in are implemented for real, because both are defined by the contract rather than by what a page looks like. Each page's open method goes to that page's route with its path parameters substituted and any query string carried through unchanged, since a query string there names a tab. Sign-in clears any leftover session and visits the route that mints one directly on this target, with no form involved. The anonymous visitor is left signed out. The one public sector persona whose session route is recorded as unavailable throws the unbound sign-in error carrying that recorded reason, so criteria needing it report as unbound rather than as a behavioural failure.

**What is bound.** Nothing. Every action and every observation throws the standard unbound error naming its page and member, and the bindings file records each one unbound with the same reason.

| Pages in the surface | Actions and observations, all unbound |
| --- | --- |
| 79 | 680 |

I deliberately did not fill the adapter with locators guessed from familiarity with this kind of application. A guessed binding recorded as bound would be a claim I never checked, and on a target that is supposed to be the behavioural oracle it would turn into false failures that discredit correct criteria. Unbound is the honest signal and is the one the calibration step is built to absorb.

**Routes.** I cannot name any page whose route fails to resolve, because I could not open any of them. Equally, I cannot vouch for a single route. The route table in the adapter is transcribed from the contract and is unverified against the running service.

**To finish this.** Point the browser tooling at the bundled Chromium or install Chrome, then rerun this stage. The page table, the route substitution, and the sign-in behaviour are already in place, so the rerun is about finding each control on each real page and replacing the unbound throws one at a time. I verified that the bindings file names every page, action, and observation of the contract exactly once, spelled as the contract spells them, so that file is ready to be edited entry by entry as bindings are made.

_Ruled: return by tech-lead_
