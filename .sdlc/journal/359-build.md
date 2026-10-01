---
stage: "build"
title: "build slice 7"
at: "2026-10-01T09:20:34.588Z"
cost: 4.899782399999999
turns: 88
session: "50242e4e-f85c-4040-ae6a-4a4f8f7839ae"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Slice 7, fifth revision: Code With Us drafting, submitting and publishing

I fixed two places where the application departed from its criteria: R-1.10 and R-1.21. I could not show that R-8.17, R-8.19 or R-8.25 will now pass; the likely reasons are below. I could not start the stack, because `docker compose` needed an approval this session could not get. So everything here comes from reading the code and from unit tests, not from walking the running application. `npm --prefix app run check` passes: typecheck, 394 backend tests and 230 frontend tests.

## What changed

**R-1.10 (over-long text refused, naming the field).** The form capped the title, teaser, remote-work description and description with `maxLength`. A browser silently shortens what is typed or pasted into such a field. So an opportunity with a 201-character title went forward shortened, and no field error ever appeared, which matches the empty field error in the ruling. Those caps are gone. Each field still states its limit in its description. On Submit for review, Publish or Save changes, the over-long text is kept as typed and refused, with the field named in the error summary (`field-error`) and under the field. This departs from DESIGN.md, which says limits are enforced as the person types; it is recorded in `docs/decisions/0032`.

**R-1.21 (incomplete draft told it is incomplete).** The manage page hid its whole action bar on the Opportunity tab, because that tab is the open form. An author on that tab, or one who had just saved a change there, had no Submit for review. The ruling's received text began "Opportunity" and then a new line, and the only thing on that page that reads that way is the Opportunity tab's own section. So the test was evidently reading that tab and finding no refusal. Now:
- Submit for review, Publish and Delete are offered on every tab, by the same permission rules. Only Edit is left off where the form is already open.
- The result of an action (including the "This opportunity is incomplete" alert) appears inside the tab's section, just under its heading, rather than above the section where the story puts it. Its test id and `role="alert"` are unchanged.

## Earlier conditions

- **`build-slice-7-3#1` (dashboard table): met.** `/dashboard` lists the person's own opportunities in `dashboard-opportunities-table`; each row has the title linking to the manage page and the status. An administrator sees every opportunity with a Created by column. The design has no tabs here, so there is no Opportunities tab.
- **`build-slice-7-3#2` (administrator can publish a draft): met.** An administrator is offered Publish on a draft as well as on one under review, and is not offered Submit for review. A unit test covers it.
- **`build-slice-7-4#3` (recheck the five criteria): partly met.** The recheck found and fixed R-1.10 and R-1.21. For R-8.17, R-8.19 and R-8.25 I found no fault on the Code With Us path. Choosing a file over 10 MB shows `attachment-size-error` at once, the 10 MB limit is stated before choosing, files upload with an empty read-access list, and a saved attachment appears as `attachment-download-link`.

  I could not confirm these against the running application. Two explanations seem likely, and neither is this slice's to fix:
  1. **The tests probably cover Sprint With Us and Team With Us too.** R-8.19 says "for all three programs alike", R-8.25 names Sprint With Us, and the attachment control's surface route is `/opportunities/:program/…`. Those programs' forms and manage pages belong to slice 10, so here they show the not-found page and read as empty. If this is the cause, these criteria cannot pass before slice 10. That is a matter of where `plan/tasks.md` places them, which this stage cannot change.
  2. **A test may use the seeded published opportunity as its own author.** If it signs in as `test-gov` (who created that opportunity) and opens its Opportunity tab, the form is read-only with no attachment control. That is what R-1.56 and DESIGN.md's "who is offered what" table require, so I did not change it.

## Unit tests added

- A title or teaser over its limit is kept as typed, and Submit for review names Title and Teaser without sending anything.
- On the Opportunity tab, Submit for review is offered without Edit, and the incomplete alert appears inside that tab's section.
- A file attached on a draft's Opportunity tab is uploaded when the form is saved, sent with the change, and then shown as a download link to its own address.

## What the next slice will find

Sprint With Us and Team With Us opportunities are still answered "not yet offered" (decision record 0030), and their attachment controls and read rules do not exist yet. Slice 10 will need to add them, along with any program-spanning tests for R-1.10, R-8.17, R-8.19 and R-8.25.