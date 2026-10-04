| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-10-04T14:34:54.953Z |
| holder | agent:product-owner |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Is this the contract the tests will act through?

**Recommendation.** I rewrote the mail note in `spec/contract/observables.yaml` (now lines 152–167) so it agrees with R-6.15.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the mail note in `spec/contract/observables.yaml` (now lines 152–167) so it agrees with R-6.15. Nothing else in the contract changed. The edit has not been through a YAML parser, and I could not bring the oracle up or take it down: this session refused every command that would have done so.

**What the note now says.** A notice sent to more than one person shows only the service's own address (`configured_sender_address`) as its visible recipient, and every reader is a blind copy. Searching the mail catcher by a reader's address, or reading the visible recipient in the message listing, finds nothing for such a notice. To learn who it reached, a test finds the notice by its subject, opens it by its identifier (`read_one_message`) and reads its blind-copy list. When a large group was split into several messages, the test does this for every message carrying the subject. A notice meant for one person still shows that person as its visible recipient and can be found by their address.

**Why the note was wrong.** It said a message "is addressed to one person and every other recipient is a blind copy". The tests for R-5.31 and R-5.33 took that as their reason to search by a reader's visible address. Against a build that meets R-6.15, that search finds nothing, so those tests fail. This is what the slice 18 verify run showed.

**A caveat I added, from reading the old code.** The old application does not meet R-6.15 everywhere. In `sources/old/src/back-end/lib/mailer/notifications/opportunity/sprint-with-us.tsx` and `team-with-us.tsx`, it sends several Sprint With Us and Team With Us notices to an evaluation panel, an opportunity's author or the administrators with everyone as visible recipients. Those are the notices that a deadline was reached, that question consensus is ready, and that it was submitted or finalized. Its other group mailings, such as the new-opportunity announcement, already go to the service's address with readers as blind copies. So a test written to R-6.15 will fail against the old application on those notices. The criteria index already records that the old target fails R-6.15 and that the rebuild must pass it; the note now says which notices are involved, so a test writer does not mistake that failure for a fault in the test.

**What I could not do.**
- **Check the edit with a parser:** the Python and Node commands I tried were refused before running. I re-read the region instead. It is an ordinary folded text block in the same list as the notes around it, and I expect it to parse.
- **Run `node $SDLC_BIN oracle up` and `down`:** the command was refused because the `$SDLC_BIN` variable could not be checked before running, and so was `echo "$SDLC_BIN"`. No containers were started, so none are left running. The Compose override is unchanged from the version already approved, so this run shows nothing new about whether the oracle starts.

There is one ruling request and I answered it, so there is no deferred-request line. The change to the note is all that needs to be on main before the R-5.31 and R-5.33 tests are rewritten to read blind-copy lists.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether the rewritten mail note in spec/contract/observables.yaml is the contract the R-5.31 and R-5.33 tests should act through. I approve. The previous note told test writers to search for a notice by a reader's visible address, which contradicts R-6.15 (several recipients means only the service's address is visible and every reader is a blind copy), and that is why those tests fail against a build that meets R-6.15. The new note states R-6.15 correctly. It tells a test to find a multi-recipient notice by subject, open it with read_one_message and read the blind-copy list, repeating this for every message when a batch was split. It keeps single-recipient notices findable by address. Both names it uses, configured_sender_address and read_one_message, are defined in the same contract. I checked the old-application caveat against the source. In sprint-with-us.tsx, the deadline-reached, question-consensus-ready, consensus-submitted and consensus-finalized notices use `to: batch.map(...)`, while the announcement and panel notices use `to: MAILER_REPLY, bcc: batch`. team-with-us.tsx matches, except that its deadline notice goes to the government author, which the note's 'panel, author or administrators' wording already covers. So the caveat correctly tells test writers that failures on those notices are the old system's fault, not the test's, which agrees with what the criteria index already records against R-6.15. The new text is a well-indented folded block in the existing notes list. No criterion's wording or confidence changes. Two things would change this ruling: a YAML parse failure in the edited region, or old code showing any of the notices the caveat names using the blind-copy form after all.

**Conditions:**
none
