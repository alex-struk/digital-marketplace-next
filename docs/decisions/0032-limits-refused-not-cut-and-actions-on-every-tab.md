# 0032 · Text limits are refused rather than cut, and the manage page's actions stay on every tab

- Status: accepted for the build (slice 7, fifth revision)
- Date: 2026-10-01

## Decision

**A text field over its limit is kept as typed and refused, naming the field.** The Code With Us
form (create page and the manage page's Opportunity tab) no longer sets `maxLength` on the title,
teaser, remote-work description or description. design/DESIGN.md ("Forms and validation") says
text limits are enforced as the person types, through `maxLength`, and the stories set it on the
title. But R-1.10 asks that an opportunity put forward with a title over 200 characters, a teaser
over 500 or a description over 10,000 be *rejected with the offending field named*. A browser
silently shortens what is typed or pasted into a field with `maxLength`, so through the form that
rejection could never happen: the opportunity went forward with a shortened title and nothing was
named (R-1.10 was returned with an empty field error). Each field's description still states its
limit before anything is typed ("Up to 200 characters."), and Submit for review, Publish and Save
changes name the field in the error summary (`field-error`) and under the field, as the service
does in its refusal.

**Submit for review, Publish and Delete stay offered on the Opportunity tab.** Decision record
0029 made the Opportunity tab the form itself, and the action bar was hidden while the form was
open, as the `editing` story draws it. That left an author who had opened the form, or saved a
change to it, with no way to put the draft forward without first leaving for another tab, and the
refusal R-1.21 describes could not be reached from there (R-1.21 was returned reading the
Opportunity tab's own text with no word of the opportunity being incomplete). The action bar now
offers the same actions on every tab, by the same rules (design/DESIGN.md, "Who is offered what on
the manage page"); only Edit is left off where the form is already open.

**What an action came to is said inside the tab's section**, directly under its heading, rather
than between the tab links and the section as the `incomplete` story places it. The message, its
`opportunity-incomplete-message` wrapper and its `role="alert"` are unchanged; it now sits in the
region being read, whichever tab that is.

## What would reverse it

A ruling that text limits must cut what is typed (which would make R-1.10's over-length cases
reachable only through the service, not the form), or that the action bar must be hidden while
the Opportunity tab's form is open, with the acceptance surface naming how an author on that tab
reaches Submit for review.
