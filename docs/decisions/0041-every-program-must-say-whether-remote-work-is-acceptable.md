# 0041 · Every program must say whether remote work is acceptable

- Status: accepted for the build (slice 8, fifth revision after the ruling that returned it)
- Date: 2026-10-01
- Amends: 0040 (what the service keeps of a Sprint With Us or Team With Us opportunity created
  under review or published)

## What was wrong

The ruling named R-1.11 again. It passed when slice 7 was approved and fails at the same point
as before: reading the opportunity list's Open group, the check found there an opportunity it
expected to have been refused. R-1.11 says an opportunity that is not a draft must *state*
whether remote work is acceptable, and must describe remote work when it is.

Code With Us refuses both. Record 0040 made Sprint With Us and Team With Us refuse the second
(remote work accepted but not described, or a description over 500 characters) but kept a
creation that said nothing about remote work, reading it as "not acceptable". So an
administrator could publish an opportunity in either program that did not say, and it was
listed as open. Of the ways R-1.11 can be broken, that was the only one still left open in any
program. Before slice 8, the other two programs could not be created at all and the list did not
exist, which is why this showed only now.

The application could not be run in this revision's workspace (starting containers needed an
approval nobody was present to give), so this was found by reading the code against the
criterion, not by reproducing the failure.

## Decision

- `POST /api/opportunities/sprint-with-us` and `.../team-with-us` refuse a creation that is not a
  draft when `remoteOk` is not one of `true`, `false`, `"yes"`, `"no"`, `"true"` or `"false"`:
  400 in record 0010's shape, worded as Code With Us words it,
  `remoteOk: Say whether remote work is acceptable.` It is listed together with any problem in
  the description. Nothing is kept. (`remoteWorkProblems` in
  `app/backend/src/rules/other-program-drafts.ts`.)
- A draft is still never refused for what it holds (R-1.9).
- The create screens show a `remoteOk` refusal on the remote work question as well as in the
  `field-error` list. Their opening sentence says that both parts of this rule are checked.
- The forms still start on **No** (record 0031), so nothing put forward from a screen is refused
  for leaving the question unanswered.

This takes back 0040's choice to keep a request that leaves the question out so that requests
made to build the staff and administrator lists would not be refused. Against the original
service, an opportunity in either program could be put forward only with a complete body, the
answer about remote work included, so a request like that could never have been accepted there.

## What would reverse it

Slice 10, which replaces this with each program's full rules for an opportunity that is not a
draft. This is one of them.
