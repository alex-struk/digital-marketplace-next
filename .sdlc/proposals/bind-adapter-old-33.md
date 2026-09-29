---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "But none of it has been run as a test or typechecked."
opened: 2026-09-29T00:00:14.013Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** But none of it has been run as a test or typechecked.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've corrected all ten findings and rebound the one unbound member, R-3.9. But none of it has been run as a test or typechecked. The workspace has no `node_modules`, and running `tsc` or `node --check` needed approval that nobody here could give. I checked each piece of new page logic by running it against the live target at localhost:4300. I didn't run the adapter as a whole, and I checked the TypeScript only by reading it.

**What changed in `tests/adapters/old/index.ts`:**

- **R-2.7, R-2.9, R-2.11, R-2.16, R-2.37 (add_reference):** The Sprint With Us proposal form's step 5, "References", has three blocks headed "Reference 1" to "Reference 3". Each has boxes labelled Name, Company, Phone Number and Email. The action now opens that step and fills block N (the input's order + 1) from its name, company, phone and email; a list of references fills blocks in turn. An input key with no box throws `unbound:` naming the key. A value given as empty stays empty. A filled box no longer stops the required-field filler from completing the other blocks. I confirmed on the live form that the values land in the right block.
- **R-2.16 (add_phase_team_member):** When the organization is withheld, it now returns with no team added instead of throwing "refused", as the Team With Us binding does. The test can then read the refusal.
- **R-2.20:** The required-field filler no longer touches boxes labelled Resource Name, Hourly Rate or Team Member(s). If Submit stays disabled, the adapter now falls through to the page's own refusal.
- **R-2.35:** The history reader now reads each cell's text as written. The Created cell gives "Robin Placeholder", not the capitals the page draws ("ROBIN PLACEHOLDER").
- **R-4.14 (admin_check):** The Admin? cell holds a dark, square tick for an administrator and a pale, narrow cross for everyone else; neither has text or an accessible name. The reader scrolls the whole list, finds each row from its name link, and returns the ticked names one per line. On the live list that gave Robin Placeholder and Morgan Placeholder out of 146 rows.
- **R-2.19 (Sprint With Us publish):** Publishing by hand with Proof of Concept and Implementation phases landed on the new record, so the page accepts them. I never saw the adapter's own run fail. My best explanation fits all three clauses of the finding. The adapter found each phase's date boxes by their position on screen. That could put one phase's dates into another's and leave the other empty for the filler to invent dates.
  - Each phase's boxes are now found inside that phase's own section on the page. I checked this with each phase open and folded.
  - Once the test gives phase dates, the filler never adds any of its own.
  - A confirmed publish that doesn't land on a record now throws with what the page shows, instead of leaving "create" to be read as the identifier.
  - The start-phase choice already goes to the earliest phase the test names ("Prototype" means "Proof of Concept").
- **R-4.23 (terms_checkbox):** It now returns `redirected to <path>`: `/sign-in` when signed out, `/dashboard` for the administrator, the public sector employee and the seeded vendors, who have all agreed. If the form ever renders, it returns whether the box is ticked.
- **R-3.9 (approve_invitation):** As the invited vendor, the pending Salt Marsh Labs row is there and shows Approve when pointed at. The same address signed in as the organization owner or the administrator shows no rows. So in calibration either another persona was signed in or an earlier test had already answered the invitation.
  - The adapter now waits up to 15 seconds for the row.
  - If there is still no row, it opens the invitation's own address using the seeded pending invitation for that organization. I confirmed on the live page that this address opens "Approve Request?".
  - If neither works, it throws `unbound:` saying both things it tried.

In `bindings.yaml`, `user-list.admin_check` and `user-sign-up-complete.terms_checkbox` are now `bound`. Every other entry was already right. The other `user-sign-up-complete` members stay unbound: no sign-in route on this target reaches an account with an unfinished profile.

**Left behind on the target:** reproducing R-2.19 by hand, I published one Sprint With Us opportunity titled "Adapter repro SWU phases" on localhost:4300. It is still there. I opened the approval confirmation for the seeded invitation but cancelled it, so the invitation is still pending.

Every route I opened in `surface.yaml` resolved. I changed nothing outside `tests/adapters/old/`.
