---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "A previous run had already written `tests/adapters/old/index.ts` and `bindings.yaml`."
opened: 2026-09-14T14:33:29.302Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** A previous run had already written `tests/adapters/old/index.ts` and `bindings.yaml`.

# Journal: adapter for the "old" target

A previous run had already written `tests/adapters/old/index.ts` and `bindings.yaml`. I checked them against the running target at `http://localhost:3000`, working in the browser only, and fixed them in place rather than rewriting from scratch. The bindings file names every page, action and observation in `spec/contract/surface.yaml` once, spelled as the contract spells it. It now has 775 bound and 34 unbound. My changes altered no names and no bound/unbound verdicts, so the file is unchanged. The unbound entries are listed below.

I could not run the type-checker or a syntax check. The harness has no installed dependencies. An install into the scratchpad and a Node syntax check both needed approval that wasn't given. The edits were written with the compiler's rules in mind, but that is untested. The first thing the next stage should run is `npm run typecheck` in `tests/`.

## Routes

Signed in as the administrator, every route I opened loaded, using the seeded records' identifiers wherever a route needs one. That covers the home page, dashboard, opportunity lists and create pages, `/status`, `/proposals`, organizations, users, `/users/me`, and content list, view and edit. It also covers the email reference page, the Code With Us learn-more page, `/notice/authFailure`, and the Code With Us opportunity's view, edit, report and export pages. For Sprint With Us and Team With Us it covers the evaluation, consensus, panel and instructions tabs, plus the proposal pages and exports. No page's route failed to resolve. `/sign-up/complete` does load, but always redirects away (see below).

## What I changed

1. **Empty answers now throw.** Many observations returned `""` when they found nothing; they now throw `unbound:` naming what was missing and the address.
   * **Identifiers:** opportunity, proposal, organization and user identifiers.
   * **Labelled values:** label-and-value readers (Created By, Proposal Deadline, Value, and the like), table cells and column marks, checkbox states, and the latest History author.
   * **Links and footer:** footer links, the footer itself, and the service-level-agreement link and its target.
   * **Attachments and images:** attachment addresses, stored images and their measured sizes, the current picture, and the chosen-image preview.
   * **File answers:** the stored file identifier, the file description fields, file contents and saved name.

   The refusal readers throw only when no request was made at all. Otherwise they return the status and body, or an empty string when the request went through. Empty strings are still returned where the page genuinely shows nothing: no dialog open, a tab this reader isn't offered, no validation message, no upload fault.

2. **Missing route parameters.** Calling `open()` without a needed parameter now fails with a plain error naming the route and what was passed. It no longer calls itself unbound.

3. **File uploads.** Every file chooser (attachments, logo and avatar, the image in formatted text) now builds its file with `uploadFile` from the name, content or size the test gives. It no longer treats the name as a path.

4. **Labels corrected against the live pages.**
   * **Sprint With Us public page:** its phases heading is "Phases of Work".
   * **Team With Us public page:**
     * The deadline is "Closing Date".
     * The budget is "Maximum Contract Value".
     * Resources are listed under "Service Areas".

5. **Evaluation and panel screens, rebuilt from what they show.**
   * **Individual evaluation form:** the Evaluator Notes and Score boxes stay disabled until "Edit" in the top bar is pressed, so the adapter presses it first.
   * **Consensus form:** its score and notes boxes have no labels, so they are taken by kind and position under "Consensus Score".
   * **Proponent rows:** on the evaluation and consensus lists they are opened through the "Edit" link at the end of the row, not by clicking the proponent's name.
   * **Evaluation panel:**
     * It is read-only until "Edit" is pressed.
     * The chair is a "Panel Chair" checkbox on each evaluator, not a dropdown.
     * `choose_panel_chair`, `mark_member_as_chair`, `chair_field` and `panel_member_row` now work from each evaluator's picked name and that checkbox.

   I replayed the row-link and panel-reading logic against the seeded closed Sprint With Us opportunity without clicking anything, and it matched.

## What is unbound, and why

These are the previous run's findings; I did not re-walk each of them this session.

* **Created by / last changed by, on the three public opportunity pages:** the public page shows only published and updated dates. Both are bound on the management pages.
* **Add note, on the Code With Us and Sprint With Us management pages:** the History tab has no control for adding a note.
* **Organization list pager and pagination:** no pager is drawn.
* **Leave organization, on both memberships tabs:** an affiliated organization's row offers no leave control.
* **All eleven members of `user-sign-up-complete`:** `/sign-up/complete` redirects signed-in visitors to `/dashboard` (confirmed this session), and no sign-in route creates an account with an unfinished profile.
* **Admin check on the user list:** the mark is an icon with no text or name to read.
* **Capability checked, on both capability tabs:** held capabilities are shown only by an icon.
* **Confirm unsubscribe, cancel unsubscribe and the unsubscribe dialog, on both plain notification tabs:** turning notices off there takes effect at once with no confirmation. The confirmation belongs to the unsubscribe landing page, where it is bound.
* **"Only JPEG and PNG offered", on the image picker and the formatted-text editor:** nothing on the page says which image types are accepted.

## Other limits

* **Personas:** sign-in reads each persona's session route. The two personas marked unavailable (administrator-other and public-sector-staff-other) throw `unbound: signIn.<persona id> — <reason>`.
* **Not verified live this session:** most of the remaining bound members, including the proposal wizards, organization team management, content publishing, and the scoring actions on the proposal view pages. The code challenge, team scenario and interview/challenge stages can't be reached on the seeded records, which are still in the questions stage.
* **Mail catcher:** I could not confirm it was reachable (the check needed approval). The adapter never reads mail, so this has no effect on it.
* **Environment:** no environment value or password appears in the adapter, the bindings file or this entry.

## Ruling

**Verdict:** return
**By:** agent:reviewer

The question is whether this adapter binds every surface action and observation on old and nothing else. It does not stay an adapter. Many readers that returned "" when they found nothing now throw `unbound:`, and results record that as a failed test. Several existing tests check for absence with toBeFalsy(), so a correctly empty page now fails and the adapter decides the outcome. Confirmed cases: storedFileIdentifier() throws when an upload is refused, which files/R-8.18:27,43, R-8.17:66, R-8.23:28, R-8.24:23,38 and R-8.1:32 expect to be empty. panelMembers() throws when no evaluators are shown, which evaluation/R-5.18:143,156 expect for a vendor or unrelated staff. valueBefore() and valueAfter() throw on a missing label, which opportunities/R-1.8:29,31,51,71 (totalMaxBudget and maxBudget on other programs' pages) and R-1.2:33-34,38-39 (status and proposalDeadline on a draft opened by a visitor or vendor) expect to be empty. The rest of the diff is legitimate navigation and locator work: row links, the Panel Chair checkbox, pressing Edit before editing, uploadFile, and label corrections. Typecheck passed on the runner and nothing under tests/acceptance changed. Keep that work and fix only the absence behaviour.

**Conditions:**
- Readers must not throw when the page loaded and correctly shows nothing, or when a refused request stored nothing. Return empty there, and throw unbound only when the page, route or control cannot be reached.
- storedFileIdentifier returns empty, not unbound, when the latest upload was refused.
- panelMemberRow and chairField return empty when the panel shows no evaluators.
- valueBefore and valueAfter, as used by opportunity view status, proposalDeadline, totalMaxBudget and maxBudget, return empty when the label is not on a loaded page.
- The journal lists each acceptance test that expects emptiness from a changed reader, including R-1.2, R-1.8, R-5.18, R-8.1, R-8.17, R-8.18, R-8.23 and R-8.24, and shows each still gets empty.

### Runner-owned typecheck evidence

Proposal revision: `00267f2bf7379a5d99fcb79ce85faf0a4865c6d9`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
