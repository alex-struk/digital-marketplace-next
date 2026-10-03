# 0049 · The organization form submits while invalid, and Archive sits inside the Organization tab

## Context

The catalogue stories for organization-create and organization-edit (default and invalid states)
draw the submit button disabled while a field is invalid, and draw "Archive this organization" as
a section beside the Organization tab's section rather than inside it.

R-3.22 is phrased as a submission: when a vendor submits a profile with an invalid field, each
offending field is reported and nothing is created or saved. With the button disabled the
submission the criterion describes could never happen. R-3.18 says the owner and a service
administrator are offered Edit and Archive on the Organization tab; with Archive outside the tab's
section, a reading of the tab did not contain it. The slice-11 ruling asked for both to change.

## Decision

- The "Create organization" and "Save changes" buttons are disabled only while a save is in
  flight. Submitting with a problem marks every field as touched, so every offending field is
  reported inline and in the "Fix N fields…" list, moves focus to that list, and sends nothing to
  the service. The list still appears as fields are left, as before.
- The archive section is a subsection (level-3 heading) of the Organization tab's own section, so
  the tab offers both controls together. An organization administrator who is not the owner still
  sees neither.

## Consequences

The markup departs from the catalogue stories in these two places only: the disabled attribute and
the nesting of the archive section. Every test id the stories carry is unchanged.
