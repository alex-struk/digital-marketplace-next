# 0048 · A read-only organization profile is text, and a list row the viewer is not told about has no blank cells (slice 11)

- Status: accepted for the build (slice 11, revision)
- Date: 2026-10-02

## Context

The stories for organization-edit (`default`, `org-admin`) draw the read-only profile as design
system `TextField`s with `isReadOnly`. A text box's value is not part of the text of the page
around it: read as a whole, the Organization tab said "Legal name Website … Contact phone
number" with none of the values, so a reader of the tab could not find the organization's
contact phone number, legal name or any other field there (R-3.3, R-3.18, R-3.19 were returned
for this).

The organization-list story draws a vendor's view with all five columns and empty cells on the
rows the vendor neither owns nor administers. A row read as a whole then carries the cells'
whitespace after the legal name, and a column read down the table finds empty cells rather than
nothing; R-3.21 was returned with a whitespace-only value where nothing was expected.

## Decisions

**The read-only profile is a description list.** Each field is a `dt` (its label, in the bold
`term` style the opportunity facts use) and a `dd` holding the value as text, in three `dl`
stacks under the same headings the story has (the profile, Address, Contact). The field's
`data-testid` (`organization-…-field`) sits on the `dd`. An empty optional field reads
"Not entered", the wording the opportunity screens already use for an absent value. Editing is
unchanged: Edit organization opens the same form of text fields as before.

**A row without details is one cell across the table.** For a vendor, a row the service sends
without owner, team size and qualification has a single cell with `colSpan` 5 holding the logo
and the legal name; rows with details keep five cells. Since the cells had no borders of their
own beyond the row's bottom rule, the table looks the same as the story. The name cell no longer
wraps the name in a stack when there is no logo, so the row reads as the legal name alone.

## Consequences

The accessible outline of the Organization tab now shows terms and definitions rather than
read-only text boxes. A later slice that draws a read-only profile elsewhere should do the same.
