---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I made both requested changes to the new target's binding and left everything else as it was."
opened: 2026-10-04T06:44:44.765Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I made both requested changes to the new target's binding and left everything else as it was.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made both requested changes to the new target's binding and left everything else as it was. I couldn't run the TypeScript type check: both ways of invoking it needed approval this session didn't have. Instead I re-read the changed code by eye and tried its page reads by hand in the browser. The adapter itself has not been run end to end.

**1. R-2.19: Sprint With Us phase refusals now name the phase.** I sent the two refusals to the running service as a vendor. It answers with plain lines that start with the request field, such as `{"errors":["inceptionPhase: This opportunity does not require this phase.", ...]}`. The old reader passed these through unchanged, which is why the raw `inceptionPhase:` lines showed up. The reader now spots a leading `inceptionPhase`, `prototypePhase` or `implementationPhase` and reports the message against Inception, Prototype or Implementation. The message keeps only its wording, so the refusal-messages reader no longer carries the prefix. When the service sends the phase as a structured field instead, the phase is now spelled the same way: "Inception" rather than "inception phase", matching the old target's binding. Other prefixed lines, such as `teamQuestionResponses.0.response: …` and `team: …`, are left as they were, because the condition named only the phases.

**2. R-2.25: the Sprint With Us and Team With Us proposal screens are now bound.** The screen is served at `/opportunities/{sprint,team}-with-us/:opportunityId/proposals/:proposalId`, reached from each proponent's link in the opportunity's Proposals section. I opened it as the administrator on the seeded proposals (Sprint With Us …a016…101; Team With Us …a032…101 and …102). I also opened the Sprint With Us one as the public sector employee, and the history read returned the same rows. The screen shows:
- the proponent's name as the heading;
- Opportunity, Status, Submitted and Proposal ID;
- a "Printable copy" link;
- two sections, Proposal and History (Date | Entry | By | Note, newest first).

There are no buttons, no stage tabs, no scores and no rank, although the seeded proposals hold scores. On both pages I bound four members, with formats matched to the old target's binding:
- **Proposal identifier:** the Proposal ID shown on the screen.
- **Proposal tab:** the text of the Proposal section.
- **History tab:** one line per row, cells joined by " | ".
- **History entries:** `<kind> | <note> | <who> | <when>` per row.

All the scoring, screening, award and disqualify actions, the stage tabs, the stage scores, price, total, rank, the wrong-stage message and the offered score actions stay unbound. That is 17 members on Sprint With Us and 15 on Team With Us. They are decided when each method runs, and the reason says where I looked and what the screen offers. If one of those controls appears on the screen later, the reason says so, so the next binding run picks it up. None of them is reported absent, because the page is served. `bindings.yaml` now matches all of this.

The ruling also lists proponent name, status and export link as things on this screen. The contract does not give `proposal-swu-view` or `proposal-twu-view` any member for those, so there was nothing to bind them to.

**Reference "company" field (R-2.7, 2.9, 2.11, 2.16, 2.18, 2.22).** I looked again as a vendor on the seeded open Sprint With Us opportunity's create form (…a025…). After "Add a reference", each reference still has only Name, Email address and Phone number (optional). There is still no company field, so the existing unbound reason stands unchanged.

No route in the surface failed to resolve in what I walked this time. Nothing asked me to change paths outside this stage's own folder, and I touched none.
