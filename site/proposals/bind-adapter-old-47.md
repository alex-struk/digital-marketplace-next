| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T04:01:52.312Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed all three problems in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed all three problems in `tests/adapters/old/index.ts`. `bindings.yaml` needed no changes, since it already lists all these members as bound. No type checker is installed in this workspace, so the adapter has not been compiled or run as a suite. I checked the new logic by running the same steps by hand against the running target.

**R-8.13 (stored image width and height).** The helper that lists a page's pictures used to count the images, then read each one by position on a page that was still changing. On the organization edit page, pictures moved or disappeared before it finished, and one read waited 15 seconds and failed. It now reads every picture's address, visibility and position in one pass, so a redraw can't leave it waiting. On the seeded qualified organization's edit page that pass returned the site logo, the avatar and the default organization logo without stalling. I also made two small related changes:
- The reader looks again for up to five seconds for a picture served from `/api/files/`, because a just-saved screen draws it a moment late.
- Loading the image to measure its natural size now gives up after ten seconds instead of waiting indefinitely.

A cost of that five-second recheck: on a page with no stored picture, `imageAddress` now takes about five seconds before it correctly returns nothing.

**R-2.18 (Sprint With Us pending team member).** This used to return every page line containing "pending", including the form's standing instructions. I signed in as the organization owner, opened the proposal form on the seeded open Sprint With Us opportunity and chose Northern Pines. Then I added the pending invitee with a confirmed member to Implementation. Each member gets their own row in the team table, and the pending invitee's name cell reads "Quinn Placeholder" with "Pending" on the line below. The observation now goes to the Team step, unfolds every phase and reads the visible table rows in one pass. It returns one line per member marked pending, as "Quinn Placeholder — Pending". Once the Team step is reached with an organization chosen and nobody pending, it returns empty. On the live page it returned exactly that one line, and the confirmed member was left out. I didn't save that draft, so the seeded data is unchanged.

**R-2.2 (Code With Us start proposal).** The control does exist, so it stays bound. On the seeded published Code With Us opportunity, vendors 1, 2, 5 and 8 each see two "Start Proposal" links, one in the top bar and one in the page header. Both lead to the opportunity's `/proposals/create`, and they appeared about 40ms after loading. Visitors, public-sector staff and administrators see neither. The old binding only looked in the top bar and gave up after five seconds. The failing run used an opportunity the test had just created, on a different port, and I couldn't open that record here. My best guess is that the link was slow to appear there, or that the record wasn't open to a vendor. The action now waits up to 15 seconds for either link and prefers the top-bar one. If neither appears, its error says what the page showed instead: Not Found or the opportunity's status, whether anyone was signed in, what the top bar held, and any other proposal links. That will show whether a future failure is the adapter or the opportunity's state. I couldn't see what a vendor who already has a proposal is shown, because that meant creating one on shared seeded data.

Every route I opened loaded. I made no changes outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the old adapter binds every surface action and observation on old, and nothing else, now that R-2.18 has been sent back to bind-adapter past policy.loops.rebind. Ruling: approve. The runner escalated because it hit the loop limit, not because the pipeline could not produce what G3 asks for. Each of the three sends asked for something different (the Organization chooser, then the phase team-member boxes, then the pending-member reading), which is progress rather than a stage that cannot converge, so there is no pipeline defect to escalate. The proposal answers the third send directly: proposalSwuCreate.pendingTeamMember no longer returns every line containing 'pending' from linesMatching(/pending/i). It reads the visible team-table rows in one pass and returns '<name> — Pending' only for members whose cell carries the Pending marker, and the author reports it returned exactly the pending invitee on the seeded Sprint With Us opportunity and excluded the confirmed member. For R-8.13, the picture reader now reads in one evaluateAll pass so a redraw cannot stall it, and the natural-size measurement has a 10s timeout. For R-2.2, the Start Proposal control still exists, so it stays bound; the action now accepts either Start Proposal link and fails with a diagnostic that tells an adapter fault apart from the opportunity's state. The diff is confined to tests/adapters/old/index.ts, binds no new member, and the runner's typecheck of this revision passed with no diagnostics under adapters/old/. The tier is STANDARD and no platform article is touched. The known cost is that storedImageAddress now takes about 5s to report no stored picture, which slows the answer but does not change it. What would change this ruling: a run of the R-2.18, R-8.13 or R-2.2 tests on old that fails because of these bindings, for example swuPendingMembers returning empty while a member is shown as Pending, or startProposal failing where a vendor is offered the link.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `65e3619d497741cd94ce965a366268f3bd2c3508`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
