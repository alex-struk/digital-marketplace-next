---
gate: G3
question: "Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?"
recommendation: "I made no changes to the application in this revision."
opened: 2026-10-01T08:58:17.725Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 7 (Staff can draft, submit and publish a Code With Us opportunity) do what its criteria say?

**Recommendation.** I made no changes to the application in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes to the application in this revision. Both conditions owed from the earlier ruling are already met in this build. When I went back over R-8.17, R-8.19, R-8.25, R-1.10 and R-1.21, the code and unit tests showed nothing that departs from the criteria. One thing I could not do: drive the running application. Docker is not permitted in this session, so I could not start the compose stack. I also never saw what the rebound adapter reported, so this recheck rests on reading the code and running the unit tests, not on a live walk.

**Checks.** After installing dependencies with `npm ci`, `npm --prefix app run check` typechecks all three packages and passes: migrations 16 tests, backend 394, frontend 227. Every `test_id` that `surface.yaml` gives the dashboard, the program chooser, the Code With Us create, view and manage pages, and the attachment control is in the markup, on the element the design stories put it on.

**`build-slice-7-3#1` (dashboard table): met.** For staff and administrators, `/dashboard` (`app/frontend/src/screens/dashboard.tsx`) shows a table (`dashboard-opportunities-table`):
- Each row (`dashboard-opportunity-row`) carries the title as a link to the manage page (`dashboard-opportunity-link`), the program, a status badge (`opportunity-status`) and the last-updated date.
- Staff see only the opportunities they created. An administrator sees all of them, with an extra "Created by" column.
- With nothing listed it shows `dashboard-empty-message`.

The dashboard design for staff has no tabs, so I added no Opportunities tab. The only dashboard tab in the surface belongs to the evaluation panel (`dashboard-show-my-opportunities`), which a later slice builds. Unit tests in `frontend/tests/code-with-us-opportunities.test.tsx` cover the staff list, the administrator list and the empty state.

**`build-slice-7-3#2` (Publish on a draft): met.** On the manage page, Publish is offered on any unpublished opportunity to anyone allowed to publish, which means administrators (`opportunity-cwu-edit.tsx:132-133`). Submit for review is withheld from administrators. So an administrator looking at a draft sees Edit, Publish and Delete. The backend allows DRAFT→PUBLISHED on the Code With Us path. The unit test "offers an administrator Publish on a draft too, with no Submit for review, and publishes it" covers this.

**The five criteria:**
- **R-1.10:** Submitting for review or publishing anything other than a draft is checked against the full rules. Each problem appears in a `field-error` line that starts with the field's name, for example "Title: enter a title.". The service names each field in its refusal the same way.
  - The over-length cases (title over 200 characters, teaser over 500, description over 10,000) cannot be typed into the form. The design catalogue and DESIGN.md require `maxLength` at exactly those limits, so the browser stops the extra characters at entry. A test that tries to type an over-long title through the screen will find no error.
  - Removing that cap would break the design. If the rebound adapter fails on that case, the fix is a design question for another stage, not this build's to settle.
- **R-1.21:** Submitting an incomplete draft for review is refused with the fixed message "This opportunity is incomplete. Please edit the opportunity, complete and save the form, and then submit it again.". The manage page shows it as `opportunity-incomplete-message` and does not name a field.
  - Ours checks every field, not only the five the spec's note lists for the old system. A Code With Us draft missing a reward is therefore refused at this point instead of at publication.
  - That is stricter than the old behaviour the note describes, but the criterion's own given/when/then still holds.
- **R-8.17:** The size limit ("Any type of file, up to 10 MB each.", `attachment-size-limit`) is stated before a file is chosen, and the Add attachment button points to it.
  - A file over the limit is refused on its own row (`attachment-size-error`) with its size and the limit. If an oversized upload reaches the service anyway, it is refused with a 413 whose message names 10 MB.
- **R-8.19:** The attachment control uploads with an empty read-access list. Who may read the file is decided entirely by the opportunity it is attached to.
- **R-8.25:** `CwuAttachmentReadPath` checks the current version and current status of the attaching opportunity on every read.
  - Before publication, only the opportunity's creator and administrators can read the file. A vendor asking for it gets a 401 "not authorized" refusal.
  - Once an administrator publishes it (including straight from a draft), anyone can read it.

**Next steps.** The next run should take the rebound adapter's results for these five criteria. If one still fails, the result should say what the running application did, and that is where to look. The two items addressed to other stages I left alone:
- The rebind is bind-adapter's.
- Moving R-1.9, R-1.53, R-1.56 and R-8.22 to a slice whose screens exist is the plan's.
