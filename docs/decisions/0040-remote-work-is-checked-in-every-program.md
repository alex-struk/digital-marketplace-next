# 0040 · Remote work is checked in every program, before slice 10

- Status: accepted for the build (slice 8, fourth revision after the ruling that returned it)
- Date: 2026-10-01
- Amends: 0036 (what the service keeps of a Sprint With Us or Team With Us opportunity created
  under review or published)

## What was wrong

The ruling named R-1.11, which passed when slice 7 was approved: reading the opportunity list's
Open group, the check found there what it expected to have been refused. R-1.11 holds in every
program: an opportunity that is not a draft and accepts remote work must describe it.

Record 0036 had the service keep a Sprint With Us or Team With Us opportunity created under review,
or published by an administrator, exactly as it was sent, leaving every content rule to slice 10.
So an administrator could publish one in either program that accepted remote work and said
nothing about it, and it was listed as open. Until the previous revision the list was read as
empty at that point (records 0038 and 0039), which is why this showed only now.

## Decision

- `POST /api/opportunities/sprint-with-us` and `.../team-with-us` refuse a creation that is not a
  draft when it accepts remote work (`remoteOk` true, or "yes") and its `remoteDesc` is empty or
  only spaces, and refuse a `remoteDesc` over 500 characters whatever `remoteOk` says. The answer
  is 400 in record 0010's shape, in Code With Us's words and with its field prefix:
  `remoteDesc: Describe the remote work, because remote work is acceptable.` or
  `remoteDesc: Enter a remote work description of up to 500 characters.` Nothing is kept.
  (`remoteWorkProblems` in `app/backend/src/rules/other-program-drafts.ts`.)
- A draft is still never refused for what it holds (R-1.9).
- (Replaced by 0041: such a request is now refused.) A request that says nothing about remote
  work is still kept, as not acceptable. The create
  forms always say yes or no, so no screen sends such a request. Requests made directly to build
  the staff and administrator lists (R-1.3, R-1.38) may leave it out, and refusing them would
  empty those groups again. Whether an opportunity in these programs is otherwise complete enough
  to review or publish is still slice 10's question.
- The create screens list the refusal under `field-error`, naming the field by its label ("Remote
  work description: …"), and mark the description field invalid. Their opening sentence now says
  that this one rule is checked.

## What would reverse it

Slice 10, which replaces this with each program's full rules for an opportunity that is not a
draft, of which this is one part. That includes refusing a request that does not say whether
remote work is acceptable.
