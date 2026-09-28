---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-28T19:58:14.969Z"
cost: 2.7696184
turns: 52
session: "2284ba3c-92cd-4e57-8a8b-9699bc5e14b1"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

I rewrote the three tests the ruling sent back and re-derived R-2.18 at v3, so all four criteria now have a test file. Two of them (R-2.14 and R-2.18) also have entries in `not-testable.yaml` for the clauses nothing in the surface reaches. The workspace has no installed packages and I wasn't allowed to run a checker, so none of this has been typechecked or run. I checked the imports and handles against `tests/generated/*` by hand, and the new YAML entries were not parsed either.

**R-2.14 (v2).** The old test made ten proposal attempts in one test and ran out of time. It is now twelve tests of one attempt each: one per missing field (legal name, email, street, city, province, postal code, country), one each for a malformed email and a malformed phone number, one for a complete individual being accepted, one for an archived organization being refused and one for an active organization being accepted. They all use the seeded Code With Us opportunity that stays open until 2030, so no test has to build an opportunity first. A proposal counts as refused when the opportunity's title is missing from the proponent's own proposal list. If every step of the attempt went through, the test also waits for a field error to be shown. The not-testable entry names three clauses:
- "each offending field is named in the response": the one error observation doesn't say which field an error belongs to.
- an organization being checked for existence.
- the service not checking that the vendor belongs to the organization. The form only offers the vendor's own organizations, so neither organization case can be put to the service through it.

**R-2.18 (v3).** The criterion now says neither refusal can be reached through the form, so the old test (written at v2, relying on the form) had to go. One refusal can still be reached another way:
- A Team With Us draft is saved naming a person while they are still a member.
- That person is then removed from the organization, and the draft is submitted from its own management screen.
- The test asserts the draft keeps its status.

A second draft, naming someone who stays a member, is submitted the same way and must go through. That second check isn't stated by the criterion, but without it a management screen that submits nothing would pass the refusal half as well. Whoever rules on this may see it as asserting more than the criterion states. The not-testable entry names:
- the wording "User is not an active member of the organization."
- pending and inactive memberships.
- the Team With Us "Please select unique team members." refusal.
- Sprint With Us applying no such uniqueness check.
- what the form offers as team members.

**R-2.30 (v1).** The ruling said the price score was read from a page that doesn't show it. The test now reads it from every place the administrator sees a proposal's scores: the proposal's own score and team scenario tab, its export, and the opportunity's proposals and team scenario tabs. Some of those places list the other proposals too, so it compares before and after: a standalone 50 must appear in more places after the higher bid's scenario score is entered than before. It also checks that the proposal's history mentions the price once more than before, and has one more "evaluated" entry than before.

**R-2.35 (v1).** This now uses the seeded Sprint With Us proposal that has passed consensus and is waiting for its code challenge score, which avoids walking a whole evaluation. The administrator enters a score of 63 and then disqualifies the proposal with a written reason. The two entries are found in the history by what the test put there, the score's value and the reason's text, not by a label. The test checks:
- the reason and the score are both there.
- the administrator's name (read off their own profile) and the current year each appear at least twice more than before.
- the reason comes before the score, which shows newest first.

The year stands in for "when" because the history comes back as one piece of text. That is a coarse reading.

**What the contract would need so the recorded clauses can be tested** (owner `contract` for each):
- On `proposal-cwu-create`, an observation giving each refusal together with the field it is against.
- A request-level proposal page for each program, like the existing evaluation-*-request pages, that submits a proposal with the organization or team given directly and reports whether it was accepted and the refusal's message.
- On `proposal-swu-edit` and `proposal-twu-edit`, an observation of why a submission from that screen was refused.
- On `proposal-swu-create` and `proposal-twu-create`, an observation listing the people the team-member choice offers.

Nothing asked me to change anything outside `tests/acceptance`, and I didn't.