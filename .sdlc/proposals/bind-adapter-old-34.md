---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed all five calibration findings in `tests/adapters/old/index.ts`."
opened: 2026-09-29T01:23:24.148Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed all five calibration findings in `tests/adapters/old/index.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed all five calibration findings in `tests/adapters/old/index.ts`. I checked the user-list change live against the running target. I could not type-check any of it or re-run the failing tests: both `tsc` and the test runner need approval that isn't available in this unattended session. The reviewer should expect the next calibration run to be the first real test of these fixes.

**R-2.19 (`opportunity-swu-create.publish` overwrote phase dates).** When the test has already dated a phase with `add_phase`, publish now leaves the opportunity-level `startDate`/`completionDate` alone. Previously it wrote them onto the starting phase and made Prototype overlap Implementation. When no phase has been dated, the dates still go on the phase the form starts with, as before.

**R-1.16 (publish threw on a silent refusal).** If Publish (or Submit for Review) is disabled once every given value has been entered, and the step menu marks steps incomplete, the action now ends quietly on the form. That is how it already behaved when the form showed a message. `fieldError` now reports those steps, for example "5. Phases is incomplete", after any messages on the form. I checked on the target that this form shows no text at all when Phases is incomplete: overlapping dates leave no message on the step, only the warning icon in the step menu. So the step-menu marking is the only thing there is to report.

The action still throws when the disabled control comes from dates the adapter itself could not place: the input gave opportunity-level dates, named no phase, and the form held none. That is a gap in the adapter, not a refusal by the form.

**R-2.37 (`anonymous_proponent_name` read the vendor's own name).** It now returns empty unless the screen shows an anonymised "Proponent N" name. The text under the "Proponent" label is used only when it contains one. I made the same change to the reader for pages that list several proponents, because it had the same fallback.

**R-4.23 (sign-up-complete readers).** When `/sign-up/complete` sends the visitor elsewhere (to `/dashboard` when signed in, `/sign-in` when signed out), `terms_checkbox` now returns empty instead of "redirected to …". `complete_disabled_until_terms_accepted` also returns empty there instead of throwing unbound. It returns "disabled" only if the form ever appears with its terms box unticked and "Complete Profile" disabled; I couldn't see that form, because no sign-in route on this target reaches an account with an unfinished profile. I changed that entry in `bindings.yaml` from unbound to `bound`. The page's other members stay unbound for the same reason.

**R-4.14 (`/users` column readers came back empty).** `user_row`, `status_badge`, `account_type` and `admin_check` now all read from one row reader over the users table. Each row starts at its Active/Inactive badge and spans the four columns. `status_badge` and `account_type` return that column, one line per row. `user_row` output is unchanged ("Status | Account Type | Name").

`admin_check` now returns every row as "Name: Yes" or "Name: No", from the tick or cross icon in the Admin? column. Before, it listed only the ticked names, which is empty for a list of non-administrators. On the target the first twenty rows read correctly: Morgan Placeholder and Robin Placeholder show "Yes", everyone else "No". A test expecting the old ticked-names-only answer would now see the non-administrators' names too.

Every route I opened this run resolved on the target. I changed nothing outside `tests/adapters/old/`, and no password or environment value is written in the adapter, the bindings file or this entry.
