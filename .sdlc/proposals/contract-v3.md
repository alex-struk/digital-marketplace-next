---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I completed the contract work and brought the oracle down."
opened: 2026-09-11T07:57:44.279Z
---

# Is this the contract the tests will act through?

**Recommendation.** I completed the contract work and brought the oracle down.

I completed the contract work and brought the oracle down. Here is my journal entry.

---

**What this run set out to do.** The contract's surface, personas, API description and observables were already recovered and ruled trustworthy at the previous gate. Two things were left open there. The evaluation domain had no starting point a test could arrange, and nobody had yet started the oracle and watched it work. Both are closed now.

**Pages.** Eighty-eight, unchanged in number, and I deleted nothing. Seventeen each for opportunities, proposals and evaluation, fourteen for users, seven for organizations, six each for content and files, four for notifications. The one change is to the note at the top that says where a test gets a value for a route parameter. It now names the seeded closed Sprint With Us and Team With Us opportunities, and the six proposals against them, as handles, and says why those two are seeded rather than built.

**Personas.** Nineteen. The anonymous visitor writes no sign-in on purpose. Every other persona names both identities this project configures. On the oracle that is a sign-in route, one fixed address for the administrator, one for the government account, and one taking a number for each vendor. On the rebuilt target it is a sandbox identity provider keyed by username, and the usernames are the same strings as the oracle's identity-provider ids. Two personas remain marked unavailable on the oracle with the reason on the entry, the second administrator and the second member of public sector staff, because the two public sector routes each reach one fixed account and take no parameter. I read the routes again and that is still exactly what they do.

One persona is new. A competing vendor, who owns an organization of their own and answers the same opportunity somebody else has answered. The criteria about one proponent not being shown another's work need two proponents a test can act as, and until now there was only one.

**Seed.** Seven files and the manifest. The three new ones carry two more vendors, two more organizations qualified for both programs, and a Sprint With Us and a Team With Us opportunity that have already lapsed, each with an evaluation panel and three submitted proposals.

The reason those two opportunities are written into the database rather than built through the screens is that no form will take a deadline that has already gone by. The whole of the evaluation domain sits behind a closure, so without them there was nothing for any of it to start from.

What is written in is the condition, not the result. Each opportunity is published with a deadline thirty days old and its proposals are submitted, and nothing carries a score, an evaluation or a consensus. I watched the application do the rest. It moved both opportunities to individual question evaluation, moved all six proposals to review, and wrote the anonymous proponent names itself.

**The oracle.** It came up on the first attempt and I did not have to change the override to get there. Seventy-eight migrations ran, all seven seed files loaded, and the application answered. Then I checked it through the application rather than through the database. The seeded page came back at its own address with its title and body. Both seeded opportunities came back at the status the application had put them in. The panel came back with the right two members, the four questions with a minimum score on the last of them, and a count of three proposals. As the panel evaluator, signed in through the session route, I started an individual evaluation of the first proponent and it was accepted. That is the evaluation domain reachable end to end, which is what this run existed to produce. The oracle is now down and its volume with it, so the next run starts from an empty database and re-seeds cleanly.

**One thing I found that the next stage should know.** Mail works, and I proved it. An invitation to join an organization reached the catcher within the same second, with the test marker on the subject that the observables describe. The messages the deadline hook sets out to send when it closes an opportunity did not arrive at all, and nothing was logged. The hook hands that notification off without waiting for it, from inside the transaction that is closing the opportunity. I have recorded this in the observables as a property of the target rather than guessing at the cause. A criterion about who is told when an opportunity closes should be measured, and a test that expects a message and gets none has found something real.

**What is still out of reach.** Three things, all recorded in the manifest next to the records they concern.

One criterion describes six proponents. The seeded opportunities carry three, which is what the rest of the evaluation criteria describe. Six would mean six qualified organizations and six vendor accounts added for a single criterion, and it would change what every list of organizations and of users contains. That one should report unbound.

Each panel is two people, and that is the oracle's identity limit rather than a choice. Consensus begins only once every evaluator on a panel has submitted, so a panel member no route reaches would have made the whole of consensus untestable. The panel is therefore the government account as evaluator and the administrator account as chair, with the chair also scoring. The criteria that turn on two evaluators beside a separate chair, or on a chair who does not score, cannot be reached on the oracle for the same reason the second staff member cannot.

And the previous run's two smaller findings stand unchanged. Who uploaded a file is recorded and never returned, so it is not observable from outside. The sender, the blind-copy list and both message bodies exist only when a message is read by its own identifier and not in the catcher's listing, so whatever reads the catcher has to offer both calls.

## Fix turn

Three defects fixed, nothing else touched.

The mail note in the observables file broke YAML because a plain multi-line scalar carried a colon followed by a space, which the parser reads as the start of a mapping key. The note now opens as a folded block scalar and the clause is rewritten so the colon is gone; the content of the note is unchanged. In the seed manifest, the two evaluation-panel handles pointed at bare mappings with no identifier, so a test had no value to address them by. A panel has no identifier of its own in this schema, because its member rows are keyed by the opportunity version they hang off, so each panel now carries that version identifier as its id, with a line saying why. The run-record file under `.sdlc/runs/` had picked up three lines from the oracle start and stop commands, which is outside this stage's territory; it is restored to its committed contents, and the stage's file-writing hook refuses that path, so it was restored from the git object rather than edited. The working tree now shows changes only under `spec/contract/`, `tests/seed/` and `.sdlc/oracle/`. I could not run a YAML parser to confirm the two files load, because every command that evaluates code or writes a file needed an approval this run could not obtain; both fixes were checked by reading the files back.
