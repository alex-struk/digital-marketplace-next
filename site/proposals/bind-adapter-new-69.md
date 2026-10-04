| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T02:26:21.110Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't bind any of the seven criteria on this run.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I couldn't bind any of the seven criteria on this run. I reopened every screen they need on the target at :4300, as the administrator and as a vendor, using the seeded identifiers, and the app still doesn't offer any of them. I made one change to `tests/adapters/new/index.ts` and updated two reasons in `bindings.yaml`. I couldn't type-check the edited adapter: the sandbox needed approval to run the TypeScript compiler, and with nobody here to approve it, that check is still open.

**What I rechecked**
- **R-8.20, `file-attachment-control.add_attachment` on Sprint With Us and Team With Us.** This is new since earlier runs. Both programs' create forms now draw an "Attachments" section with an "Add attachment" button, but the button is disabled. Beside it the page says "Files cannot be attached to a … opportunity in this version of the service. Code With Us opportunities take attachments." The edit form of the seeded open Sprint With Us opportunity (`…a025-…0001`, `?tab=opportunity`, after "Edit") still has no Attachments section at all.
  - The change: the attachment action now checks whether "Add attachment" is disabled. If it is, it throws `unbound:` at once, quoting the page's note and saying where it looked. Before, it would have clicked a disabled button until the test timed out.
  - The Code With Us binding is unchanged and still `bound`, which is why `add_attachment` stays `bound` in `bindings.yaml`.
- **R-1.31 and R-2.25, `proposals_tab`.** I opened the seeded lapsed Code With Us opportunity with three proposals (`…a003-…0001`) and the seeded open Sprint With Us one (`…a025-…0001`) as the administrator.
  - Code With Us shows only the sections Summary, Opportunity, Addenda and History. Sprint With Us shows those plus Evaluation panel.
  - `?tab=proposals` falls back to the Summary, which only counts "Proposals submitted".
  - Neither the management screen nor the public page links to any proposal. I added this recheck to both `proposals_tab` reasons in `bindings.yaml`.
- **R-2.24, `proposal-cwu-view.open`.** `…/proposals/:proposalId` answers "Page not found" to both the administrator and the vendor (test-vendor-2) for the seeded proposal `…a003-…0101`. The only screen that proposal has is `…/proposals/:proposalId/edit`, and only its author can open it.
- **R-2.7, R-2.9, R-2.11, R-2.24, `proposal-swu-create.open` and `proposal-twu-create.open`.** Signed in as test-vendor-2:
  - Both proposal forms answer "Page not found", including the form for the Sprint With Us opportunity still open for proposals (deadline November 2, 2026).
  - I went through all 30 Sprint and Team With Us public pages listed under `/opportunities`. None offers a vendor any way to start a proposal. `/proposals` is also "Page not found".
  - These reasons in `bindings.yaml` already said this accurately, so I left them as they were.

Every page route in `surface.yaml` that I opened resolved on the target. The proposal and evaluation screens above load but answer "Page not found", and the reasons say so. I touched nothing outside `tests/adapters/new/`, and no password or environment value appears in anything I wrote.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the new adapter bind every surface action and observation it can, and nothing else? Approve. The only code change, in addAttachmentFile, is a locator check: when 'Add attachment' is present but disabled (as on the Sprint With Us and Team With Us create forms), it reports unbound at once and quotes the page's note, where before it would have clicked until the test timed out. It decides nothing about whether a test passes. It uses the existing isDisabled helper (disabled or aria-disabled) and the existing unbound helper, which never returns, and the runner's typecheck on this revision passed with no diagnostics under adapters/new/. The two edited proposals_tab reasons (R-1.31, R-2.25) and the unchanged reasons for R-2.7, R-2.9, R-2.11 and R-2.24 each name a screen or action the target does not offer: no Proposals section on either management screen, and 'Page not found' on the proposal view and create routes for both the administrator and the vendor. These are application gaps to be built, not tests asking for more than their criteria, so the reasons are real. Nothing under tests/acceptance changed and no protected path is touched. What would change the ruling: evidence that the target does render any of these surfaces, under another label, behind another step or for another persona, while the adapter still reports it unbound.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `cfd5a4068764eaad3cf9112adc3c6826e5e2eff2`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
