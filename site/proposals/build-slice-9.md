| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-02T08:39:22.734Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 9 (An opportunity's author and administrators can run it after publication) do what its criteria say?

**Recommendation.** I built all eight criteria of slice 9 in the service and on the screens.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built all eight criteria of slice 9 in the service and on the screens. `npm --prefix app run check` passes: 16, 452 and 290 tests across the three workspaces. I could not start the sandbox: `docker compose up` needed an approval nobody was here to give. So nothing was seen working in a browser or against the real Keycloak and mail catcher. The new end-to-end test does run the real service in process, over a database built by the migrations with the acceptance seed loaded, and catches its mail.

**How each criterion is reached**

- **R-1.28 (cancelling):** `PUT /api/opportunities/<program>/<id>` with `cancel` and an optional note of up to 1,000 characters. Only an administrator may do it; anyone else gets a 401. On the Code With Us manage page an administrator sees "Cancel opportunity" (`opportunity-cancel-button`), which opens the catalogue's confirmation dialog with its optional note field.
- **R-1.20 (permitted changes of state):** the transition table slice 7 wrote now has a final state to refuse from. Cancelling a draft, an opportunity under review, an awarded one or a cancelled one is refused with a 400 in the path's own words, and the state stays as it was. A cancelled opportunity is also refused publishing and editing.
- **R-1.32 (addenda):** `addAddendum`, 1 to 5,000 characters, from the author or an administrator, on anything that is no longer a draft. It writes the addendum and an "Addendum added" entry in the history, and nothing removes it. The Addenda tab lists them with who added each, and the public page lists them under `opportunity-addenda` without names.
- **R-1.33 (private notes with files):** `addNote` with a note of up to 1,000 characters and file identifiers, for Code With Us and Sprint With Us. The History tab ends with the note form; its "Add attachment" stores the chosen files when the note is added. A note's files are listed against it in the history. A new file-read rule lets only the author and administrators read them.
- **R-1.30 (reporting figures and history):** reading one opportunity now answers the author and administrators with the full history (including note files) and, once published, `reporting` with views, watchers and submitted proposals. The Summary tab shows these as `reporting-views`, `reporting-watchers` and `reporting-proposals`. They are withheld while the opportunity is a draft or under review. A proposal counts as submitted unless it is a draft or withdrawn.
- **R-1.35 and R-1.36 (who is told):** an addendum, or an administrator's edit, emails the watchers, the proposal authors and the opportunity's author, once per address, in one batched blind-copy message. Nobody is emailed if the opportunity is a draft or cancelled. Cancelling sends watchers and proposal authors one message, and the author a separate one saying it was actioned.
- **R-6.17 (deactivated accounts):** every recipient lookup takes active accounts only. Watches are not touched when an account is deactivated, so reactivating it brings them back. The end-to-end test checks this with a real deactivation and reactivation.

**Choices worth checking**

- **Counter reads restricted:** `GET /api/counters` now refuses vendors and visitors with a 401. Decision record 0034 had let anyone read them. I changed it because the surface's `opportunity-counters` entry, its story and R-1.30 ("nobody else can") all say staff and administrators only. I updated slice 8's tests to read the counts as an administrator.
- **No length cap on the new text boxes:** the addendum, note and cancellation-note fields have no `maxLength`, following decision record 0032. Each states its limit, and an over-long entry is refused with a message naming the limit instead of being silently cut.
- **Sprint With Us and Team With Us got the same actions now:** the service accepts `cancel`, `addAddendum` and (Sprint With Us only) `addNote` for those programs. Slice 10 says R-1.19's test cancels through the action this slice builds, and the surface lists cancel and addendum on those manage pages. The interim manage page now has Summary (with the figures), Addenda and History tabs, plus Cancel for administrators. Any other change on those programs is still answered 400 "not yet available".
- **Schema:** a new migration adds the three programs' addenda tables and the Code With Us and Sprint With Us note-file tables, and I re-pulled the Prisma schema from it.

All of this is recorded in `docs/decisions/0043-running-an-opportunity-after-publication.md`. The shared screen pieces are in `app/frontend/src/screens/opportunity-running.tsx` and the service logic in `app/backend/src/opportunities/opportunity-running.service.ts`.

**Tests added**

- **Rules:** who may cancel, add an addendum or a note, or see the figures; from which states cancelling is allowed in every program; the length limits; and sending each address only once.
- **End to end:** addenda and their email, refusals, notes with files, Sprint With Us notes, the figures and who sees them, cancelling with its two emails and the refusals that follow, Sprint With Us cancellation, and the deactivated watcher.
- **Screens:** the cancel dialog (confirm and keep), who is offered Cancel, the figures, the Addenda tab and its form checks, addenda on the public page, the note with a file, the interim Sprint/Team With Us page, and accessibility checks on the Summary and Addenda tabs.

**What I could not do or did not touch**

- **Sandbox not run:** nothing was watched working in the composed sandbox. The compose file did not need changing, since the migrate and seed services pick up the new migration on their own.
- **Left for later slices:**
  - the Proposals tab (R-1.31);
  - the full report (R-1.40);
  - the Sprint/Team With Us program tabs, editing and stage moves (slice 10);
  - the message reference page (slice 21), which must add the three new messages in `app/backend/src/mail/notifications/running-opportunity.ts`.
- **A gap the next slice will meet:** the Code With Us list still answers without addenda; only reading a single opportunity includes them.
- Nothing outside `app/` and `docs/decisions/` needed changing.

_Ruled: return by runner:verify_
