---
stage: "contract"
title: "contract"
at: "2026-09-25T10:23:50.851Z"
cost: 0.6524484
turns: 19
session: "87c24573-b6ce-4905-814d-b31ccaebecc2"
---

I seeded a second Team With Us opportunity at the challenge stage so R-1.49 no longer shares a record with R-1.25. I could not start the oracle to prove the new rows load: the session's permission settings blocked every command that expands the CLI's path variable, and blocked the YAML parse check too.

**What changed.** The new record is `opportunities.twuChallengeLastToScoreForAward`, titled "Seeded second Team With Us opportunity at its challenge", with identifier `00000000-0000-4000-a033-000000000001`. The seeding functions create it with the same starting point as `opportunities.twuChallengeLastToScore`: the same two-person panel, the same four resource questions, and two proponents. The first, `proposals.twuAwardChallengeScored`, is already scored on the challenge (80) at a rate of 110. The second, `proposals.twuAwardChallengeLast`, is at a rate of 135 and is the last one left to score. The seed sets up the stage before the last score and nothing after it: the application still produces the scoring, the attempted move to processing, and the award. I gave it a title that doesn't contain the existing record's title, so a test finding either one by title matches only one.

The existing record's manifest entry is now `for: [R-1.25]` only, and the comment in `tests/seed/011-team-with-us-stages.sql` says the same. The file header now says three opportunities are seeded instead of two. Nothing else in `spec/contract/`, the other seed files or the oracle override changed.

**Something the test writer should know.** The ruling said R-1.49 has two tests, one for offered changes and one for the award, and both score `proposals.twuChallengeLast`. The ruling asked for one record for R-1.49, so both of those tests now point at the new record and still share it. If the offered-changes test needs the last proponent still unscored when it runs, it can still depend on test order relative to R-1.49's award test. I left that alone because the ruling didn't name it. If it bites, it takes a third record built the same way.

**Checks.** I read the edits back and confirmed the manifest identifiers match what the seed's ID helper produces for opportunity 33 (`sid(33, 1)` gives `…a033-000000000001`, and proposals get `100 + p`). No other seed file or contract file uses the `a033` range. The session blocked the YAML parse and `git diff`, so neither was run. `node $SDLC_BIN oracle up` and `oracle down` were both refused, so nothing was started and no container is left running. **Whether the new rows load and show through the application has not been shown in this run.** The next stage or the gate should run `oracle up` once before relying on it.

**Missing tests this stage owes: I supplied none of the six this run.** This revision was limited to what the ruling named, so each stays owed by this stage, with the reasons below.

- **R-6.1 (notifications switched off), R-6.2 (mail server unreachable) and R-6.24 (success reported before any mail is sent):** all three need a second target, or a variable the contract names, where the service's mail setup is different. One would start with notifications off, one would point at an unreachable mail server, and one would hold mail at the catcher. That is a change to the oracle override and the observables, which this revision didn't cover. One target with its mail settings as a variable would likely unblock R-6.1 and R-6.2 together. R-6.24 also needs a way to hold delivery at the catcher.
- **R-7.28 (two administrators) and R-5.34 (four different people on one opportunity):** both need sign-ins the old application does not seem to offer: a second administrator, and a public sector employee unconnected to the opportunity. A future run should check whether the session route can sign in as seeded users beyond the fixed accounts before recording either persona as unavailable.
- **R-7.29 (an embedded page already removed):** the screens refuse to remove a page another screen needs, but the seed could delete that page's row directly. That fits the seed's purpose of setting up a starting point the screens can't reach. It is this stage's to supply, and it was only left out because this revision was limited to the ruling.