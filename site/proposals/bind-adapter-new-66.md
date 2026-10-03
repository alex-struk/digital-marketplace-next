| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T19:22:56.061Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I fixed request 1 (from build-slice-13-3).

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed request 1 (from build-slice-13-3). The service-area reader on the organization edit page in the new target now returns only the approved service areas. I couldn't type-check or run it here: the shell wouldn't run the compiler without approval.

**What was wrong.** The reader, `organizationEdit.serviceAreaCheckbox` in `tests/adapters/new/index.ts` (around lines 5518–5548), printed every service-area box with ": checked" or ": unchecked" after it. Tests R-3.26 and R-3.28 decide an area is approved when its words appear anywhere in that text. So every area named in the output looked approved, including unticked ones.

**What it returns now.** One area name per line, in two cases:
- **Editor open, or offered and opened by the reader:** only the areas whose boxes are ticked. Unticked areas are left out entirely. When the reader opened the editor itself, it still cancels it afterwards, as before.
- **Editor not offered:** the items under "Approved service areas", without the ": checked" suffix the old version added. This is how the request describes the old target's reader; I couldn't check that myself, because the old target's file wasn't in this workspace.

**Unchanged.** It still returns empty when the section isn't there, and the way it reaches the page and finds the boxes is the same. No other member of the adapter changed, and neither did `bindings.yaml` (the member was already bound and still is). Another reader elsewhere in the file also writes ": checked", but it belongs to a different control and wasn't part of this request, so I left it alone.

**Not checked.** I didn't reopen the target in the browser for this change, since the request was only about the output format. One gap follows from that: if an organization with no approved areas shows a placeholder as a list item under "Approved service areas", that text would come back instead of nothing. This branch reads the list the same way it did before this change.

Nothing outside `tests/adapters/new/` was changed or asked to be changed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the new target's adapter bind organizationEdit.serviceAreaCheckbox so that it reports which service areas an organization is approved for, as R-3.26 and R-3.28 read it, and nothing else? Ruling: approve. The revision answers the request build-slice-13-3 sent to bind-adapter. The member now returns only approved areas, one per line: the ticked boxes when the editor is open, or opened and then cancelled by the reader, and the plain items under 'Approved service areas' when no editor is offered. The ': checked'/': unchecked' suffixes that made every named area look approved to both tests are gone. The change only alters output formatting inside a locator-and-read member. Navigation, locators and the cancel step are unchanged, the member contains no assertion or pass/fail logic, bindings.yaml is unchanged, and nothing under tests/acceptance was touched. The runner's typecheck on this revision passed with no diagnostics under adapters/new. The residual risk the author names, a placeholder list item in an empty 'Approved service areas' section, is a reading of the page that a verify run will expose. It does not show the binding is wrong. The owed conditions build-slice-13-3#2 and #3 are documentation changes owed by build and are not settled by this adapter proposal, so they stay open. What would change the ruling: a verify of slice 13 on this adapter showing R-3.26 or R-3.28 still reading an unticked area or placeholder text as approved, or evidence that the member now hides a ticked box.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5cb32e64e53e215ef015de298d5f0cfd7d2fe751`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
